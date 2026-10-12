import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Allow the branch's plain TypeScript helper tests to run on Node 20 as well.
export async function load(url, context, nextLoad) {
  if (!url.startsWith('file:') || !url.endsWith('.ts')) {
    return nextLoad(url, context);
  }
  const source = await readFile(new URL(url), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: new URL(url).pathname,
  });
  return { format: 'module', source: result.outputText, shortCircuit: true };
}
