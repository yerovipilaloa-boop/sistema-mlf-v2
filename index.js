/**
 * MLF Sistema - Entry Point for Hostinger
 * Serves static files and loads compiled backend API
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

console.log('='.repeat(60));
console.log('MLF Sistema - Starting Server');
console.log('='.repeat(60));

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log paths for debugging
const publicPath = path.join(__dirname, 'src', 'public');
const distPublicPath = path.join(__dirname, 'dist', 'public');

console.log('📁 Checking public paths:');
console.log('  src/public exists:', fs.existsSync(publicPath));
console.log('  dist/public exists:', fs.existsSync(distPublicPath));

// Determine which path to use for static files
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

// Serve static files FIRST (before API routes)
if (staticPath) {
  app.use(express.static(staticPath));
  console.log('📂 Static path contents:', fs.readdirSync(staticPath));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Try to load the compiled Express app
try {
  const distAppPath = path.join(__dirname, 'dist', 'app.js');

  if (fs.existsSync(distAppPath)) {
    console.log('📦 Loading compiled backend from:', distAppPath);

    // The compiled app.js exports the Express app
    const compiledApp = require(distAppPath);
    const backendApp = compiledApp.default || compiledApp;

    // Mount the backend app directly (it already has /api routes)
    app.use(backendApp);
    console.log('✅ Backend API routes loaded successfully');

  } else {
    console.log('⚠️ Compiled backend not found');
    console.log('  Looking for:', distAppPath);

    // List what IS in dist folder
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      console.log('  dist/ contents:', fs.readdirSync(distPath));
    }
  }
} catch (error) {
  console.error('❌ Error loading compiled backend:', error.message);
  console.error('  Stack:', error.stack);
}

// Root route - serve login.html
app.get('/', (req, res) => {
  if (staticPath) {
    const loginPath = path.join(staticPath, 'login.html');
    if (fs.existsSync(loginPath)) {
      return res.sendFile(loginPath);
    }
  }
  res.json({
    message: 'MLF API - Frontend not found',
    staticPath: staticPath
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Static files from: ${staticPath || 'NOT FOUND'}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
});
