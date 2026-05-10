const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const loadEnvFile = (filePath, override = false) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) return;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(path.join(__dirname, '../.env'));
loadEnvFile(path.join(__dirname, '../.env.local'), true);

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Process CSS with PostCSS (Tailwind)
const cssSource = path.join(__dirname, '../src/styles/index.css');
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

// Copy public/ assets to dist/ (favicon, _redirects, etc.)
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  for (const file of fs.readdirSync(publicDir)) {
    fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
  }
} else {
  // Fallback: write a default _redirects for SPA routing
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n');
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
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || ''),
    'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || ''),
    'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_ID || ''),
    'process.env.REACT_APP_GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.REACT_APP_GOOGLE_CLIENT_SECRET || ''),
    'process.env.REACT_APP_ENABLE_DEMO_ACCOUNTS': JSON.stringify(process.env.REACT_APP_ENABLE_DEMO_ACCOUNTS || 'true'),
    'process.env.REACT_APP_DAILY_DEFAULT_DOMAIN': JSON.stringify(process.env.REACT_APP_DAILY_DEFAULT_DOMAIN || ''),
    'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL || ''),
    'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY || ''),
  },
  minify: true,
  sourcemap: false,
}).then(() => {
  console.log('Build complete! Output in dist/');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
