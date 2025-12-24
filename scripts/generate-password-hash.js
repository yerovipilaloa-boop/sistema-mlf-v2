// Script para generar hash de contraseña
// Uso: node generate-password-hash.js "TuContraseñaAqui"

const crypto = require('crypto');

const password = process.argv[2] || 'MiNuevaContraseña2024!';

// Generar salt y hash usando crypto (compatible sin dependencias)
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

console.log('\n========================================');
console.log('GENERADOR DE HASH DE CONTRASEÑA');
console.log('========================================\n');
console.log('Contraseña:', password);
console.log('\n⚠️  NOTA: Este sistema usa bcrypt, necesitas el hash bcrypt.');
console.log('Usa esta herramienta online: https://bcrypt-generator.com/');
console.log('\n1. Ve a: https://bcrypt-generator.com/');
console.log('2. Ingresa tu contraseña:', password);
console.log('3. Rounds: 10');
console.log('4. Copia el hash generado');
console.log('5. Pégalo en phpMyAdmin en el campo passwordHash');
console.log('\n========================================\n');
