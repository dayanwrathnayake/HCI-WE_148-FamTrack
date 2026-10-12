const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
// Expand file names explicitly: Node 20 on Windows does not expand shell globs.
const tests = fs.readdirSync('rules-tests').filter(name => name.endsWith('.test.mjs')).sort().map(name => `rules-tests/${name}`);
const cli = path.join(path.dirname(require.resolve('firebase-tools/package.json')), 'lib/bin/firebase.js');
const command = `node --loader ./scripts/typescript-test-loader.mjs --test --test-concurrency=1 ${tests.join(' ')}`;
const result = spawnSync(process.execPath, [cli, 'emulators:exec', '--only', 'firestore', '--project', 'demo-famtrack', command], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
