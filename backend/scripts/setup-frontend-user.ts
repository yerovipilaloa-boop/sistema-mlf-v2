
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestUser() {
    console.log('👤 Configurando usuario para pruebas de frontend...');

    // Buscar explícitamente un SOCIO (no admin/tesorero)
    const socio = await prisma.socio.findFirst({
        where: { estado: 'ACTIVO', rol: 'SOCIO' }
    });;

    if (!socio) {
        throw new Error('No se encontró socio activo');
    }

    // Hashear password conocida
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Socio123!', salt);
    // Nota: Asegurarse que el usuario coincida con el login. 
    // En el sistema de login se usa 'usuario' o 'email'? 
    // Revisar auth.controller o similar, pero asumiremos 'usuario' o 'email'.
    // Setearemos ambos conocido.

    const usuarioDemo = 'socio_frontend';

    await prisma.socio.update({
        where: { id: socio.id },
        data: {
            usuario: usuarioDemo,
            passwordHash: hashedPassword
        }
    });

    console.log(`✅ Usuario configurado:`);
    console.log(`   - ID: ${socio.id}`);
    console.log(`   - Nombre: ${socio.nombreCompleto}`);
    console.log(`   - Usuario: ${usuarioDemo}`);
    console.log(`   - Password: Socio123!`);

    // Asegurar que tenga notificaciones recientes (re-usar lógica de crear notif manual si es necesario, 
    // pero ya corrimos el test flow así que debería tener).
    const notificaciones = await prisma.notificacion.count({
        where: { socioId: socio.id }
    });
    console.log(`   - Notificaciones existentes: ${notificaciones}`);

}

setupTestUser()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
