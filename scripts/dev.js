const esbuild = require('esbuild');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Make the script async
(async () => {

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process CSS with PostCSS (Tailwind)
const cssSource = path.join(__dirname, '../src/styles/index.css');
const cssDest = path.join(distDir, 'bundle.css');

// Initial CSS build - use require to load postcss directly
const processCSS = async () => {
  try {
    const postcss = require('postcss');
    const tailwindcss = require('tailwindcss');
    const autoprefixer = require('autoprefixer');
    
    const cssContent = fs.readFileSync(cssSource, 'utf8');
    const result = await postcss([tailwindcss, autoprefixer]).process(cssContent, {
      from: cssSource,
      to: cssDest
    });
    fs.writeFileSync(cssDest, result.css);
    console.log('CSS processed successfully');
    return true;
  } catch (error) {
    console.warn('CSS processing failed, copying CSS as-is:', error.message);
    // Fallback: copy CSS as-is
    if (fs.existsSync(cssSource)) {
      fs.copyFileSync(cssSource, cssDest);
      console.log('CSS copied as fallback');
    }
    return false;
  }
};

// Process CSS before starting server
await processCSS();

// Watch CSS files for changes
const chokidar = require('chokidar');
const watcher = chokidar.watch([cssSource, path.join(__dirname, '../tailwind.config.js'), path.join(__dirname, '../postcss.config.js')], {
  ignored: /node_modules/,
  persistent: true
});

watcher.on('change', async () => {
  await processCSS();
});

// Cleanup on exit
process.on('exit', () => {
  watcher.close();
});

process.on('SIGINT', () => {
  watcher.close();
  process.exit();
});

process.on('SIGTERM', () => {
  watcher.close();
  process.exit();
});

// Serve the built bundle files from root (for bundle.css and bundle.js)
app.use(express.static('dist'));

// Also serve from /dist path for compatibility
app.use('/dist', express.static('dist'));

// Serve static files from public directory (if it exists)
if (fs.existsSync(path.join(__dirname, '../public'))) {
  app.use(express.static('public'));
}

// Serve index.html for all other routes (SPA routing) - MUST be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Build with esbuild in watch mode
const ctx = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.css': 'empty', // Ignore CSS imports since we process CSS separately
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'https://skillstream-platform-api.onrender.com/api'),
    'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || 'wss://skillstream-platform-api.onrender.com/ws'),
    'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_ID || ''),
    'process.env.REACT_APP_GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_SECRET || ''),
  },
  sourcemap: true,
});

// Watch for changes
await ctx.watch();
console.log('Initial build complete, watching for changes...');

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   To fix this, run: kill -9 $(lsof -ti:${PORT})`);
    console.error(`   Or use a different port by setting PORT environment variable.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

})().catch((error) => {
  console.error('Error starting dev server:', error);
  process.exit(1);
});

