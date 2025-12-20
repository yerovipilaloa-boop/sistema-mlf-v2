/**
 * MLF Sistema - Entry Point for Hostinger
 * This file serves static files AND proxies API requests
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('MLF Sistema - Starting Server');
console.log('='.repeat(60));

const app = express();
const PORT = process.env.PORT || 3000;

// Log paths for debugging
const publicPath = path.join(__dirname, 'src', 'public');
const distPublicPath = path.join(__dirname, 'dist', 'public');

console.log('📁 Checking public paths:');
console.log('  src/public exists:', fs.existsSync(publicPath));
console.log('  dist/public exists:', fs.existsSync(distPublicPath));

// Determine which path to use
let staticPath = null;
if (fs.existsSync(distPublicPath)) {
  staticPath = distPublicPath;
  console.log('✅ Using dist/public for static files');
} else if (fs.existsSync(publicPath)) {
  staticPath = publicPath;
  console.log('✅ Using src/public for static files');
} else {
  console.log('❌ No public folder found!');
}

if (staticPath) {
  console.log('📂 Static path contents:', fs.readdirSync(staticPath));
}

// Middleware
app.use(express.json());

// Serve static files
if (staticPath) {
  app.use(express.static(staticPath));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root - serve login.html or fallback
app.get('/', (req, res) => {
  if (staticPath) {
    const loginPath = path.join(staticPath, 'login.html');
    if (fs.existsSync(loginPath)) {
      console.log('📄 Serving login.html');
      return res.sendFile(loginPath);
    }
  }
  res.json({
    message: 'MLF API - Frontend not found',
    staticPath: staticPath,
    hint: 'Check if public folder exists'
  });
});

// Try to load the compiled backend for API routes
try {
  const distServerPath = path.join(__dirname, 'dist', 'app.js');
  if (fs.existsSync(distServerPath)) {
    console.log('📦 Loading compiled backend...');
    const compiledApp = require(distServerPath).default;
    // Mount API routes
    app.use('/api', compiledApp);
    console.log('✅ API routes loaded');
  } else {
    console.log('⚠️ Compiled backend not found at:', distServerPath);
    // Fallback API endpoint
    app.get('/api', (req, res) => {
      res.json({
        message: 'API Sistema MLF - My Libertad Financiera',
        version: 'v1',
        documentation: '/api/v1/docs'
      });
    });
  }
} catch (error) {
  console.error('❌ Error loading compiled backend:', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Static files from: ${staticPath || 'NOT FOUND'}`);
  console.log('='.repeat(60));
});
