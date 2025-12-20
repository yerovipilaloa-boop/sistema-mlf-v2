/**
 * MLF Sistema - Hostinger Entry Point (Debug Version)
 */

// Load environment variables first
require('dotenv').config();

const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('MLF Sistema - Debug Entry Point');
console.log('='.repeat(60));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('='.repeat(60));

// Check all paths
const distPath = path.join(__dirname, 'dist');
const distServerPath = path.join(__dirname, 'dist', 'server.js');
const distAppPath = path.join(__dirname, 'dist', 'app.js');
const srcPublicPath = path.join(__dirname, 'src', 'public');
const distPublicPath = path.join(__dirname, 'dist', 'public');

console.log('📁 Path checks:');
console.log('  dist/ exists:', fs.existsSync(distPath));
console.log('  dist/server.js exists:', fs.existsSync(distServerPath));
console.log('  dist/app.js exists:', fs.existsSync(distAppPath));
console.log('  src/public/ exists:', fs.existsSync(srcPublicPath));
console.log('  dist/public/ exists:', fs.existsSync(distPublicPath));

if (fs.existsSync(distPath)) {
  console.log('  dist/ contents:', fs.readdirSync(distPath));
}

console.log('='.repeat(60));

// Try to load the compiled server
if (fs.existsSync(distServerPath)) {
  console.log('✅ Found dist/server.js, attempting to load...');

  try {
    // This should start the Express server
    require(distServerPath);
    console.log('✅ dist/server.js loaded successfully');
  } catch (error) {
    console.error('❌ ERROR loading dist/server.js:');
    console.error('  Name:', error.name);
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);

    // Start fallback
    startFallbackServer();
  }
} else {
  console.log('❌ dist/server.js NOT FOUND');
  startFallbackServer();
}

function startFallbackServer() {
  console.log('⚠️ Starting fallback server...');

  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Static files
  let staticPath = null;
  if (fs.existsSync(distPublicPath)) {
    staticPath = distPublicPath;
  } else if (fs.existsSync(srcPublicPath)) {
    staticPath = srcPublicPath;
  }

  if (staticPath) {
    app.use(express.static(staticPath));
    console.log('📂 Static files from:', staticPath);
  }

  app.get('/', (req, res) => {
    if (staticPath) {
      const loginPath = path.join(staticPath, 'login.html');
      if (fs.existsSync(loginPath)) {
        return res.sendFile(loginPath);
      }
    }
    res.json({
      message: 'MLF Fallback Server',
      error: 'Main server failed to load',
      staticPath
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'fallback',
      timestamp: new Date().toISOString(),
      reason: 'Main server failed to load'
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'API not available - backend failed to load',
      path: req.path,
      method: req.method,
      hint: 'Check runtime logs for the actual error'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚠️ FALLBACK server running on port ${PORT}`);
    console.log('⚠️ The main server failed to load. Check logs above for error.');
  });
}
