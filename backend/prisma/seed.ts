import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed...');

    // 1. Limpiar base de datos (opcional si usamos migrate reset, pero bueno tenerlo)
    // await prisma.transaccion.deleteMany();
    // await prisma.credito.deleteMany();
    // await prisma.socio.deleteMany();

    // 2. Crear Usuario Admin (Socio con rol ADMIN)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const admin = await prisma.socio.upsert({
        where: { codigo: 'ADMIN-001' },
        update: {},
        create: {
            codigo: 'ADMIN-001',
            nombreCompleto: 'Administrador del Sistema',
            documentoIdentidad: '1700000000',
            fechaNacimiento: new Date('1980-01-01'),
            email: 'admin@mlf.com',
            telefono: '0999999999',
            direccion: 'Oficina Central',
            ciudad: 'Quito',
            usuario: 'admin',
            passwordHash: passwordHash,
            rol: 'ADMIN',
            estado: 'ACTIVO',
            fechaRegistro: new Date(),
        },
    });

    console.log({ admin });
    console.log('✅ Seed completado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
