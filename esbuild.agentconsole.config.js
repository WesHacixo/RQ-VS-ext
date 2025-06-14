const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/ui/agentConsoleWebview.tsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: 'out/ui/agentConsoleWebview.js',
  format: 'iife',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  jsx: 'automatic',
  platform: 'browser',
  external: [],
}).catch(() => process.exit(1));
