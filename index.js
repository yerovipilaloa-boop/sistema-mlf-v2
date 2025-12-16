// MLF Test Server - Debug Version
// Ultra simple server to test Hostinger Node.js support

console.log('='.repeat(50));
console.log('[DEBUG] Starting test-server.js');
console.log('[DEBUG] Node version:', process.version);
console.log('[DEBUG] Platform:', process.platform);
console.log('[DEBUG] CWD:', process.cwd());
console.log('[DEBUG] ENV PORT:', process.env.PORT);
console.log('='.repeat(50));

const http = require('http');

// Try multiple ports - Hostinger might require a specific one
const PORT = process.env.PORT || 3000;

console.log(`[DEBUG] Will listen on port: ${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`[DEBUG] Request received: ${req.method} ${req.url}`);

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MLF - Test Server</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container { 
          text-align: center; 
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 10px; }
        p { font-size: 1.2em; opacity: 0.9; }
        .status { 
          background: #4CAF50; 
          padding: 10px 20px; 
          border-radius: 50px;
          display: inline-block;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 MLF Sistema</h1>
        <p>Node.js está funcionando correctamente en Hostinger</p>
        <div class="status">✅ Servidor Activo en Puerto ${PORT}</div>
        <p style="margin-top: 30px; font-size: 0.9em;">
          Node: ${process.version}<br>
          Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    </body>
    </html>
  `);
});

server.on('error', (err) => {
  console.error('[ERROR] Server error:', err.message);
  console.error('[ERROR] Full error:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`[SUCCESS] Server is running!`);
  console.log(`[SUCCESS] Listening on 0.0.0.0:${PORT}`);
  console.log('='.repeat(50));
});

console.log('[DEBUG] Script execution completed, waiting for server to start...');
