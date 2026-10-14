// Whitespace only: keep names, syntax, CSS selectors and animation values intact.
const fs = require('node:fs');
const esbuild = require('esbuild');
if (esbuild.version !== '0.28.1') throw new Error('Use the pinned esbuild version from package-lock.json.');
const result = esbuild.transformSync(fs.readFileSync(0, 'utf8'), {
  loader: process.argv[2], minifyWhitespace: true,
  minifyIdentifiers: false, minifySyntax: false,
  legalComments: 'inline', charset: 'utf8', logLevel: 'error'
});
process.stdout.write(result.code);
