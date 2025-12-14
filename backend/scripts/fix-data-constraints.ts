
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDataConstraints() {
    console.log('🔧 Iniciando corrección de datos para regla RN-SOC-007 (2 Recomendadores)...');

    try {
        // 1. Obtener todos los socios (incluyendo admins)
        const socios = await prisma.socio.findMany({
            include: {
                recomendacionesRecibidas: true
            }
        });

        console.log(`📋 Analizando ${socios.length} usuarios...`);

        // 2. Crear pool de recomendadores dummy si es necesario
        // Intentaremos usar usuarios existentes primero, si no hay suficientes, creamos dummies.
        let potentialRecommenders = await prisma.socio.findMany({
            where: { estado: 'ACTIVO' },
            take: 10
        });

        if (potentialRecommenders.length < 5) {
            console.log('   + Creando recomendadores dummy adicionales...');
            for (let i = 0; i < 5; i++) {
                try {
                    const dummy = await prisma.socio.create({
                        data: {
                            codigo: `REC-DUMMY-${Date.now()}-${i}`,
                            nombreCompleto: `Recomendador Automático ${i}`,
                            documentoIdentidad: `RD${Date.now()}${i}`,
                            email: `rec_auto_${Date.now()}_${i}@test.com`,
                            telefono: '0000000000',
                            direccion: 'System',
                            ciudad: 'System',
                            estado: 'ACTIVO',
                            fechaNacimiento: new Date('1990-01-01'),
                            usuario: `rec_auto_${Date.now()}_${i}`,
                            passwordHash: 'dummy_hash',
                            rol: 'SOCIO',
                            etapaActual: 1,
                            creditosEtapaActual: 0
                        }
                    });
                    potentialRecommenders.push(dummy);
                    console.log(`     > Creado: ${dummy.nombreCompleto}`);
                } catch (e) {
                    // Ignore dupe errors
                }
            }
        }

        // 3. Iterar y arreglar
        let fixedCount = 0;
        for (const socio of socios) {
            const currentCount = socio.recomendacionesRecibidas.length;

            if (currentCount < 2) {
                console.log(`   🔸 Usuario ${socio.codigo} (${socio.nombreCompleto}) tiene ${currentCount} recomendaciones.`);
                const needed = 2 - currentCount;

                // Filtrar recomendadores que NO sean el socio mismo ni ya lo hayan recomendado
                const usedIds = socio.recomendacionesRecibidas.map(r => r.socioRecomendadorId);
                const candidates = potentialRecommenders.filter(p => p.id !== socio.id && !usedIds.includes(p.id));

                if (candidates.length < needed) {
                    console.warn(`     ⚠️ No hay suficientes candidatos para arreglar a este usuario.`);
                    continue;
                }

                for (let i = 0; i < needed; i++) {
                    const recommender = candidates[i];
                    try {
                        await prisma.recomendacion.create({
                            data: {
                                socioRecomendadoId: socio.id,
                                socioRecomendadorId: recommender.id,
                                fechaRecomendacion: new Date()
                            }
                        });
                        console.log(`     ✅ Añadida recomendación de: ${recommender.nombreCompleto}`);
                        fixedCount++;
                    } catch (e) {
                        console.error(`     ❌ Error añadiendo recomendación:`, e);
                    }
                }
            }
        }

        console.log(`\n✨ Proceso finalizado. Total correcciones: ${fixedCount}`);

    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDataConstraints();
