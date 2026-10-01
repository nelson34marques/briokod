/**
 * Confirma que os esboços (starterCode) NÃO passam nos casos de teste.
 *
 * Um esboço que passa é um exercício entregue já resolvido: o aluno recebe
 * os pontos sem escrever uma linha. Este script corre cada esboço contra o
 * primeiro caso de exemplo e falha se algum for aceite.
 *
 * Uso: node server/scripts/check-starters.mjs
 */
import { spawnSync } from 'node:child_process';
import { problems } from '../db/seed.js';

const RUNNERS = {
  python: (code, stdin) =>
    spawnSync('python', ['-c', code], { input: stdin, encoding: 'utf8', timeout: 10_000 }),
  javascript: (code, stdin) =>
    spawnSync('node', ['-e', code], { input: stdin, encoding: 'utf8', timeout: 10_000 }),
};

let checked = 0;
const solved = [];

for (const problem of problems) {
  const sample = problem.testCases?.find((t) => t.isSample) ?? problem.testCases?.[0];
  if (!sample) continue;

  for (const [language, run] of Object.entries(RUNNERS)) {
    const code = problem.starterCode?.[language];
    if (!code) continue;

    const result = run(code, sample.stdin);
    checked += 1;

    const out = (result.stdout ?? '').replace(/\r\n/g, '\n').trim();
    const expected = sample.expected.replace(/\r\n/g, '\n').trim();

    if (result.status === 0 && out === expected) {
      solved.push(`${problem.slug} (${language})`);
    }
  }
}

console.log(`esboços verificados: ${checked}`);

if (solved.length > 0) {
  console.error('\nFALHA — estes esboços já passam o teste de exemplo:');
  for (const item of solved) console.error(`  ${item}`);
  process.exit(1);
}

console.log('OK — nenhum esboço passa. Nenhum exercício é entregue resolvido.');
