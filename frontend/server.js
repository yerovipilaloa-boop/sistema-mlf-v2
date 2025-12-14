/**
 * Servidor HTTP simple para el frontend MLF
 * Ejecutar con: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Eliminar query string de la URL
  let urlPath = req.url.split('?')[0];

  console.log(`${req.method} ${urlPath}`);

  // Determinar ruta del archivo
  let filePath = '.' + urlPath;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Obtener extensión
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Leer y servir archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Error del servidor: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('Servidor Frontend MLF');
  console.log('='.repeat(70));
  console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`✓ Abre tu navegador en: http://localhost:${PORT}`);
  console.log('✓ Presiona Ctrl+C para detener');
  console.log('='.repeat(70));
});
