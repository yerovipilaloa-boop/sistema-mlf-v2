
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@mlf.com';
    const adminUser = 'admin';

    console.log('Checking for admin user...');

    const existingAdmin = await prisma.socio.findFirst({
        where: {
            OR: [
                { usuario: adminUser },
                { email: adminEmail }
            ]
        }
    });

    if (existingAdmin) {
        console.log(`Admin user found: ${existingAdmin.usuario} (ID: ${existingAdmin.id})`);
        // Optional: Reset password if needed, but for now just knowing it exists is good.
        // If you want to force reset:
        // const hashedPassword = await bcrypt.hash('admin123', 10);
        // await prisma.socio.update({ where: { id: existingAdmin.id }, data: { passwordHash: hashedPassword } });
        // console.log('Admin password reset to admin123');
    } else {
        console.log('Admin user not found. Creating...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        try {
            const newAdmin = await prisma.socio.create({
                data: {
                    codigo: 'ADMIN-001',
                    nombreCompleto: 'Administrador Sistema',
                    documentoIdentidad: '0000000000',
                    fechaNacimiento: new Date('1980-01-01'),
                    direccion: 'Oficina Central',
                    ciudad: 'Quito',
                    telefono: '0999999999',
                    email: adminEmail,
                    usuario: adminUser,
                    passwordHash: hashedPassword,
                    rol: 'ADMIN',
                    ahorroActual: 0,
                    ahorroCongelado: 0,
                    etapaActual: 3, // Admin usually has high privileges
                    creditosEtapaActual: 0,
                    estado: 'ACTIVO'
                }
            });
            console.log(`Admin user created successfully: ${newAdmin.usuario}`);
        } catch (e) {
            console.error('Error creating admin:', e);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
