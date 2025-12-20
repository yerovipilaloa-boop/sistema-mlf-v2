/**
 * MLF Sistema - Hostinger Entry Point
 * Loads the compiled server directly
 */

// Load environment variables first
require('dotenv').config();

const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('MLF Sistema - Hostinger Entry Point');
console.log('='.repeat(60));

// Check paths
const distServerPath = path.join(__dirname, 'dist', 'server.js');
const distAppPath = path.join(__dirname, 'dist', 'app.js');

console.log('📁 Checking compiled files:');
console.log('  dist/server.js exists:', fs.existsSync(distServerPath));
console.log('  dist/app.js exists:', fs.existsSync(distAppPath));

if (fs.existsSync(distServerPath)) {
  console.log('✅ Loading dist/server.js...');

  try {
    // The compiled server.js should start the full Express app
    require(distServerPath);
    console.log('✅ dist/server.js loaded - server should be running');
  } catch (error) {
    console.error('❌ Error loading dist/server.js:', error.message);
    console.error(error.stack);

    // Fallback: start a simple server
    startFallbackServer();
  }
} else {
  console.log('⚠️ dist/server.js not found, starting fallback server');
  startFallbackServer();
}

function startFallbackServer() {
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Static files
  const publicPath = path.join(__dirname, 'src', 'public');
  const distPublicPath = path.join(__dirname, 'dist', 'public');

  let staticPath = fs.existsSync(distPublicPath) ? distPublicPath :
    fs.existsSync(publicPath) ? publicPath : null;

  if (staticPath) {
    app.use(express.static(staticPath));
    console.log('📂 Serving static files from:', staticPath);
  }

  app.get('/', (req, res) => {
    if (staticPath) {
      const loginPath = path.join(staticPath, 'login.html');
      if (fs.existsSync(loginPath)) {
        return res.sendFile(loginPath);
      }
    }
    res.json({ error: 'Frontend not found' });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'fallback', timestamp: new Date().toISOString() });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'API not available - backend failed to load',
      path: req.path
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚠️ Fallback server running on port ${PORT}`);
  });
}
