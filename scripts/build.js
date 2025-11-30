const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process CSS with PostCSS (Tailwind)
const cssSource = path.join(__dirname, '../src/index.css');
const cssDest = path.join(distDir, 'bundle.css');

(async () => {
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
    console.log('CSS processed');
  } catch (error) {
    console.error('CSS processing failed:', error);
    // Fallback: copy CSS as-is
    if (fs.existsSync(cssSource)) {
      fs.copyFileSync(cssSource, cssDest);
    }
  }
})();

// Copy index.html to dist and fix paths for production
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
// Update paths for production (remove /dist prefix since files are in root of dist folder)
const updatedHtml = indexHtml
  .replace(/href="\/dist\//g, 'href="/')
  .replace(/src="\/dist\//g, 'src="/');
fs.writeFileSync(path.join(distDir, 'index.html'), updatedHtml);

// Copy _redirects file if it exists (for Cloudflare Pages SPA routing)
const redirectsSource = path.join(__dirname, '../public/_redirects');
const redirectsDest = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsSource)) {
  fs.copyFileSync(redirectsSource, redirectsDest);
} else {
  // Create default _redirects for SPA routing
  fs.writeFileSync(redirectsDest, '/* /index.html 200\n');
}

// Build with esbuild
esbuild.build({
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
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'https://skillstream-platform-api.onrender.com/api'),
    'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || 'wss://skillstream-platform-api.onrender.com/ws'),
    'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_ID || ''),
    'process.env.REACT_APP_GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_SECRET || ''),
  },
  minify: true,
  sourcemap: false,
}).then(() => {
  console.log('Build complete! Output in dist/');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

