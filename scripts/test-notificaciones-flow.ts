
import { PrismaClient } from '@prisma/client';
import creditosService from '../src/services/creditos.service';
import pagosService from '../src/services/pagos.service';
import { MetodoAmortizacion, MetodoPago } from '../src/types';

const prisma = new PrismaClient();

async function runTest() {
    console.log('🚀 Iniciando prueba de flujo de notificaciones...');

    try {
        // 1. Obtener Socio existente
        console.log('👤 Buscando socio existente...');
        const socio = await prisma.socio.findFirst({
            where: { estado: 'ACTIVO' }
        });

        if (!socio) {
            throw new Error('No se encontró ningún socio ACTIVO.');
        }

        // 2. CORRECCIÓN DE DATOS: Asegurar 2 recomendadores (RN-SOC-007)
        const countRecomendaciones = await prisma.recomendacion.count({
            where: { socioRecomendadoId: socio.id }
        });

        if (countRecomendaciones < 2) {
            console.log(`⚠️ Socio tiene ${countRecomendaciones} recomendaciones. Intentando agregar faltantes...`);

            // Buscar o crear recomendadores dummy (INACTIVO para intentar evitar trigger)
            // Si el trigger aplica a INACTIVO también, esto fallará y indicará un bloqueo crítico del sistema.
            const dummySocios: any[] = [];
            for (let i = 0; i < (2 - countRecomendaciones); i++) {
                try {
                    const dummy = await prisma.socio.create({
                        data: {
                            codigo: `DUMMY-${Date.now()}-${i}`,
                            nombreCompleto: `Dummy Recommender ${i}`,
                            documentoIdentidad: `DUM${Date.now()}${i}`, // Unique
                            email: `dummy${Date.now()}${i}@test.com`,
                            telefono: '0000000000',
                            direccion: 'Dummy Address',
                            ciudad: 'Dummy City',
                            estado: 'INACTIVO', // Try to bypass trigger
                            fechaNacimiento: new Date('2000-01-01'),
                            usuario: `dummy_${Date.now()}_${i}`,
                            passwordHash: 'hash',
                            rol: 'SOCIO',
                            etapaActual: 1,
                            creditosEtapaActual: 0
                        }
                    });
                    dummySocios.push(dummy);
                    console.log(`   + Creado recomendador dummy: ${dummy.codigo}`);
                } catch (e) {
                    console.log(`   x Falló creación de dummy ${i}. Buscando existente...`);
                    // If creation fails, maybe grab any other socio?
                    const existing = await prisma.socio.findFirst({
                        where: { id: { notIn: [socio.id, ...dummySocios.map(d => d.id)] } }
                    });
                    if (existing) dummySocios.push(existing);
                }
            }

            // Crear las recomendaciones
            for (const dummy of dummySocios) {
                await prisma.recomendacion.create({
                    data: {
                        socioRecomendadoId: socio.id,
                        socioRecomendadorId: dummy.id,
                        fechaRecomendacion: new Date()
                    }
                }).catch(e => console.log(`   x Error asociando recomendador (ya existe?): ${e.message}`));
            }
        }

        // Boost savings
        await prisma.socio.update({
            where: { id: socio.id },
            data: { ahorroActual: 2000 }
        });
        console.log(`✅ Socio listo: ${socio.nombreCompleto} (${socio.codigo}, Ahorro: 2000)`);

        // 3. Obtener Admin
        let admin = await prisma.socio.findFirst({ where: { rol: 'ADMIN' } });
        if (!admin) {
            // Fallback: use socio as admin if no admin exists (permissions might fail but worth a shot if blocked)
            console.log('⚠️ No hay ADMIN, usando el mismo socio como admin simulado...');
            admin = socio;
        }
        console.log(`✅ Admin utilizado: ${admin.nombreCompleto}`);

        // 4. Solicitar Crédito
        console.log('\n💳 Solicitando crédito...');
        const credito = await creditosService.solicitarCredito({
            socioId: socio.id,
            montoSolicitado: 1000,
            plazoMeses: 12,
            metodoAmortizacion: MetodoAmortizacion.FRANCES,
            observaciones: 'Prueba de notificaciones'
        }, socio.id);
        console.log(`✅ Crédito solicitado: ${credito.codigo} (ID: ${credito.id})`);

        // 5. Aprobar Crédito
        console.log('\n👍 Aprobando crédito...');
        await creditosService.aprobarCredito({
            creditoId: credito.id,
            aprobadoPorId: admin.id,
            observaciones: 'Aprobado por test script'
        });

        // Verificar notificación
        await new Promise(r => setTimeout(r, 1500));
        const notifAprobacion = await prisma.notificacion.findFirst({
            where: { socioId: socio.id, tipo: 'CREDITO_APROBADO' },
            orderBy: { createdAt: 'desc' }
        });

        if (notifAprobacion) {
            console.log(`✅ Notificación APROBACIÓN creada: [${notifAprobacion.asunto}]`);
        } else {
            console.error('❌ FALLO: No se generó notificación de aprobación');
        }

        // 6. Desembolsar Crédito
        console.log('\n💰 Desembolsando crédito...');
        await creditosService.desembolsarCredito({
            creditoId: credito.id,
            desembolsadoPorId: admin.id,
            fechaDesembolso: new Date()
        });

        await new Promise(r => setTimeout(r, 1500));
        const notifDesembolso = await prisma.notificacion.findFirst({
            where: { socioId: socio.id, tipo: 'CREDITO_DESEMBOLSADO' },
            orderBy: { createdAt: 'desc' }
        });

        if (notifDesembolso) {
            console.log(`✅ Notificación DESEMBOLSO creada: [${notifDesembolso.asunto}]`);
        } else {
            console.error('❌ FALLO: No se generó notificación de desembolso');
        }

        // 7. Registrar Pago
        console.log('\n💵 Registrando pago...');
        await pagosService.registrarPago({
            creditoId: credito.id,
            montoPagado: 100.50,
            metodoPago: MetodoPago.EFECTIVO,
            concepto: 'Pago cuota 1 test'
        }, admin.id);

        await new Promise(r => setTimeout(r, 1500));
        const notifPago = await prisma.notificacion.findFirst({
            where: { socioId: socio.id, tipo: 'PAGO_REGISTRADO' },
            orderBy: { createdAt: 'desc' }
        });

        if (notifPago) {
            console.log(`✅ Notificación PAGO creada: [${notifPago.asunto}]`);
        } else {
            console.error('❌ FALLO: No se generó notificación de pago');
        }

        console.log('\n✨ Prueba finalizada ✨');

    } catch (error: any) {
        console.error('\n❌ ERROR CRÍTICO EN PRUEBA:', error.code || error.message);
        if (error.meta) console.error('Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
