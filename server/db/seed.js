import { pathToFileURL } from 'node:url';
import { db, get, run, transaction, nowIso } from './index.js';
import { logger } from '../lib/logger.js';

const PY = (body) => `import sys\n\ndef solve():\n${body}\n\nif __name__ == "__main__":\n    solve()\n`;
const JS = (body) => `const fs = require('node:fs');\n\nfunction solve() {\n${body}\n}\n\nsolve();\n`;

const problems = [
  // =========================================================================
  // MÓDULO 1: Primeiros Passos & Matemática Básica
  // =========================================================================
  {
    slug: 'ola-mundo',
    title: 'Olá, Mundo!',
    difficulty: 'easy',
    tags: ['basico', 'saida', 'primeiro-programa'],
    points: 50,
    statement: 'Escreva um programa que imprima exatamente a mensagem "Olá, Mundo!" na tela.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    # Imprima exatamente a mensagem pedida no enunciado.`),
      javascript: JS(`  // Imprima exatamente a mensagem pedida no enunciado.`),
      php: `<?php\n\n// Imprima exatamente a mensagem pedida no enunciado.\n`,
      c: `#include <stdio.h>\n\nint main(void) {\n  /* Imprima exatamente a mensagem pedida no enunciado. */\n  return 0;\n}\n`,
      csharp: `using System;\n\nclass Program\n{\n    static void Main()\n    {\n        // Imprima exatamente a mensagem pedida no enunciado.\n    }\n}\n`,
      portugol: `programa\n{\n  funcao inicio()\n  {\n    // Imprima exatamente a mensagem pedida no enunciado.\n  }\n}\n`,
    },
    testCases: [
      { stdin: '', expected: 'Olá, Mundo!\n', isSample: 1 },
    ],
  },
  {
    slug: 'soma-simples',
    title: 'Soma de Dois Números',
    difficulty: 'easy',
    tags: ['basico', 'entrada', 'matematica'],
    points: 50,
    statement: 'Receba dois números inteiros A e B (da entrada padrão) e imprima a soma deles.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = int(dados[0]), int(dados[1])\n\n    # Imprima a soma de a + b.`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n  // Imprima a soma de a + b.`),
      php: `<?php\n\n$dados = explode(' ', trim(preg_replace('/\\s+/', ' ', file_get_contents('php://stdin'))));\n$a = (int) $dados[0];\n$b = (int) $dados[1];\n\n// Imprima a soma de $a + $b.\n`,
      c: `#include <stdio.h>\n\nint main(void) {\n  int a, b;\n  scanf("%d %d", &a, &b);\n\n  /* Imprima a soma de a + b. */\n  return 0;\n}\n`,
      csharp: `using System;\n\nclass Program\n{\n    static void Main()\n    {\n        var tokens = Console.In.ReadToEnd().Split(new[] { ' ', '\\n', '\\r' }, StringSplitOptions.RemoveEmptyEntries);\n        int a = int.Parse(tokens[0]);\n        int b = int.Parse(tokens[1]);\n\n        // Imprima a soma de a + b.\n    }\n}\n`,
      portugol: `programa\n{\n  funcao inicio()\n  {\n    inteiro a, b\n    leia(a)\n    leia(b)\n    // Imprima a soma de a + b.\n  }\n}\n`,
    },
    testCases: [
      { stdin: '2\n3\n', expected: '5\n', isSample: 1 },
      { stdin: '10\n20\n', expected: '30\n', isSample: 0 },
      { stdin: '-5\n15\n', expected: '10\n', isSample: 0 },
      { stdin: '0\n0\n', expected: '0\n', isSample: 0 },
    ],
  },
  {
    slug: 'subtracao-simples',
    title: 'Diferença entre Números',
    difficulty: 'easy',
    tags: ['basico', 'matematica'],
    points: 50,
    statement: 'Receba dois números inteiros A e B e imprima o resultado de A - B.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = int(dados[0]), int(dados[1])\n\n    # Imprima a diferença a - b.`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n  // Imprima a diferença a - b.`),
    },
    testCases: [
      { stdin: '10\n4\n', expected: '6\n', isSample: 1 },
      { stdin: '5\n8\n', expected: '-3\n', isSample: 0 },
      { stdin: '20\n20\n', expected: '0\n', isSample: 0 },
    ],
  },
  {
    slug: 'multiplicacao-simples',
    title: 'Produto Simples',
    difficulty: 'easy',
    tags: ['basico', 'matematica'],
    points: 60,
    statement: 'Receba dois números inteiros A e B e imprima o produto A * B.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = int(dados[0]), int(dados[1])\n\n    # Imprima o produto a * b.`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n  // Imprima o produto a * b.`),
    },
    testCases: [
      { stdin: '6\n7\n', expected: '42\n', isSample: 1 },
      { stdin: '0\n99\n', expected: '0\n', isSample: 0 },
      { stdin: '-3\n4\n', expected: '-12\n', isSample: 0 },
    ],
  },
  {
    slug: 'divisao-e-resto',
    title: 'Divisão Inteira e Resto',
    difficulty: 'easy',
    tags: ['basico', 'matematica', 'divisao'],
    points: 60,
    statement: 'Receba dois inteiros A e B (B > 0). Na primeira linha imprima o quociente da divisão inteira (A // B) e na segunda linha imprima o resto da divisão (A % B).',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = int(dados[0]), int(dados[1])\n\n    # Primeira linha: o quociente da divisão inteira.\n    # Segunda linha: o resto da divisão.`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n  // Primeira linha: o quociente da divisão inteira.\n  // Segunda linha: o resto da divisão.`),
    },
    testCases: [
      { stdin: '17\n5\n', expected: '3\n2\n', isSample: 1 },
      { stdin: '20\n4\n', expected: '5\n0\n', isSample: 0 },
      { stdin: '7\n2\n', expected: '3\n1\n', isSample: 0 },
    ],
  },

  // =========================================================================
  // MÓDULO 2: Decisões & Condicionais (If / Else)
  // =========================================================================
  {
    slug: 'positivo-negativo-zero',
    title: 'Positivo, Negativo ou Zero',
    difficulty: 'easy',
    tags: ['condicionais', 'if-else'],
    points: 70,
    statement: 'Receba um número inteiro N. Imprima "POSITIVO" se for maior que zero, "NEGATIVO" se for menor que zero, ou "ZERO" se for igual a zero.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Se n > 0 imprima "POSITIVO", se n < 0 imprima "NEGATIVO",\n    # caso contrário imprima "ZERO".`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Se n > 0 imprima "POSITIVO", se n < 0 imprima "NEGATIVO",\n  // caso contrário imprima "ZERO".`),
    },
    testCases: [
      { stdin: '5\n', expected: 'POSITIVO\n', isSample: 1 },
      { stdin: '-12\n', expected: 'NEGATIVO\n', isSample: 0 },
      { stdin: '0\n', expected: 'ZERO\n', isSample: 0 },
    ],
  },
  {
    slug: 'par-ou-impar',
    title: 'Par ou Ímpar',
    difficulty: 'easy',
    tags: ['condicionais', 'modulo'],
    points: 70,
    statement: 'Receba um número inteiro N. Imprima "PAR" se o número for par, ou "IMPAR" se for ímpar.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Imprima "PAR" se n for par, ou "IMPAR" se for ímpar.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Imprima "PAR" se n for par, ou "IMPAR" se for ímpar.`),
    },
    testCases: [
      { stdin: '8\n', expected: 'PAR\n', isSample: 1 },
      { stdin: '7\n', expected: 'IMPAR\n', isSample: 0 },
      { stdin: '0\n', expected: 'PAR\n', isSample: 0 },
    ],
  },
  {
    slug: 'maior-de-dois',
    title: 'Maior de Dois Números',
    difficulty: 'easy',
    tags: ['condicionais', 'comparacao'],
    points: 80,
    statement: 'Receba dois números inteiros A e B e imprima o maior entre eles. Se forem iguais, imprima qualquer um deles.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = int(dados[0]), int(dados[1])\n\n    # Imprima o maior entre a e b.`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\n  // Imprima o maior entre a e b.`),
    },
    testCases: [
      { stdin: '15\n28\n', expected: '28\n', isSample: 1 },
      { stdin: '50\n10\n', expected: '50\n', isSample: 0 },
      { stdin: '7\n7\n', expected: '7\n', isSample: 0 },
    ],
  },
  {
    slug: 'aprovado-ou-reprovado',
    title: 'Média de Notas: Aprovado ou Reprovado',
    difficulty: 'easy',
    tags: ['condicionais', 'media'],
    points: 80,
    statement: 'Receba duas notas inteiras de 0 a 20. Calcule a média (A + B) / 2. Se a média for maior ou igual a 10, imprima "APROVADO", caso contrário imprima "REPROVADO".',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = sys.stdin.read().split()\n    a, b = float(dados[0]), float(dados[1])\n    media = (a + b) / 2\n\n    # Se media >= 10 imprima "APROVADO", caso contrário "REPROVADO".`),
      javascript: JS(`  const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const media = (a + b) / 2;\n\n  // Se media >= 10 imprima "APROVADO", caso contrário "REPROVADO".`),
    },
    testCases: [
      { stdin: '12\n14\n', expected: 'APROVADO\n', isSample: 1 },
      { stdin: '8\n9\n', expected: 'REPROVADO\n', isSample: 0 },
      { stdin: '10\n10\n', expected: 'APROVADO\n', isSample: 0 },
    ],
  },
  {
    slug: 'fizzbuzz-pro',
    title: 'FizzBuzz Pro',
    difficulty: 'easy',
    tags: ['lacos', 'condicionais', 'strings'],
    points: 100,
    statement:
      'Para cada número de 1 até N, em ordem: se o número for múltiplo de 3 imprima "Fizz", se for múltiplo de 5 imprima "Buzz", se for múltiplo de ambos imprima "FizzBuzz" e caso contrário imprima o próprio número. Um número por linha.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Para cada i de 1 a n, imprima uma linha:\n    #   "FizzBuzz" se for múltiplo de 3 e de 5\n    #   "Fizz"     se for múltiplo de 3\n    #   "Buzz"     se for múltiplo de 5\n    #   o próprio i caso contrário`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Para cada i de 1 a n, imprima uma linha:\n  //   "FizzBuzz" se for múltiplo de 3 e de 5\n  //   "Fizz"     se for múltiplo de 3\n  //   "Buzz"     se for múltiplo de 5\n  //   o próprio i caso contrário`),
    },
    testCases: [
      { stdin: '5\n', expected: '1\n2\nFizz\n4\nBuzz\n', isSample: 1 },
      { stdin: '3\n', expected: '1\n2\nFizz\n', isSample: 0 },
      { stdin: '15\n', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n', isSample: 0 },
    ],
  },

  // =========================================================================
  // MÓDULO 3: Laços de Repetição (While / For)
  // =========================================================================
  {
    slug: 'contagem-progressiva',
    title: 'Contagem de 1 a N',
    difficulty: 'easy',
    tags: ['lacos', 'for'],
    points: 80,
    statement: 'Receba um número inteiro N (N >= 1) e imprima todos os números de 1 até N em ordem crescente, um número por linha.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Imprima os números de 1 a n, um por linha.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Imprima os números de 1 a n, um por linha.`),
    },
    testCases: [
      { stdin: '4\n', expected: '1\n2\n3\n4\n', isSample: 1 },
      { stdin: '1\n', expected: '1\n', isSample: 0 },
      { stdin: '3\n', expected: '1\n2\n3\n', isSample: 0 },
    ],
  },
  {
    slug: 'tabuada-simples',
    title: 'Tabuada de Multiplicação',
    difficulty: 'easy',
    tags: ['lacos', 'multiplicacao'],
    points: 90,
    statement: 'Receba um número inteiro N e imprima a sua tabuada de 1 a 10. Imprima apenas o resultado de N * 1 até N * 10, um por linha.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Imprima n * 1, n * 2, ... n * 10, um por linha.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Imprima n * 1, n * 2, ... n * 10, um por linha.`),
    },
    testCases: [
      { stdin: '5\n', expected: '5\n10\n15\n20\n25\n30\n35\n40\n45\n50\n', isSample: 1 },
      { stdin: '2\n', expected: '2\n4\n6\n8\n10\n12\n14\n16\n18\n20\n', isSample: 0 },
    ],
  },
  {
    slug: 'soma-de-1-a-n',
    title: 'Soma Acumulada de 1 a N',
    difficulty: 'easy',
    tags: ['lacos', 'acumulador'],
    points: 90,
    statement: 'Receba um inteiro N e imprima o somatório de todos os inteiros de 1 até N (1 + 2 + 3 + ... + N).',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n    total = 0\n\n    # Some os números de 1 a n em total e imprima o resultado.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n  let total = 0;\n\n  // Some os números de 1 a n em total e imprima o resultado.`),
    },
    testCases: [
      { stdin: '5\n', expected: '15\n', isSample: 1 },
      { stdin: '10\n', expected: '55\n', isSample: 0 },
      { stdin: '1\n', expected: '1\n', isSample: 0 },
    ],
  },
  {
    slug: 'contar-pares',
    title: 'Números Pares até N',
    difficulty: 'easy',
    tags: ['lacos', 'pares'],
    points: 90,
    statement: 'Receba um número inteiro N (N >= 2) e imprima todos os números pares de 1 até N, um por linha.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Imprima todos os números pares de 1 a n, um por linha.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Imprima todos os números pares de 1 a n, um por linha.`),
    },
    testCases: [
      { stdin: '6\n', expected: '2\n4\n6\n', isSample: 1 },
      { stdin: '5\n', expected: '2\n4\n', isSample: 0 },
      { stdin: '2\n', expected: '2\n', isSample: 0 },
    ],
  },
  {
    slug: 'soma-de-digitos',
    title: 'Soma de Dígitos',
    difficulty: 'easy',
    tags: ['lacos', 'matematica'],
    points: 100,
    statement: 'Receba um número inteiro e imprima a soma de todos os seus algarismos.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    s = sys.stdin.readline().strip()\n\n    # Some os algarismos de s e imprima o resultado.`),
      javascript: JS(`  const s = fs.readFileSync(0, 'utf8').trim();\n\n  // Some os algarismos de s e imprima o resultado.`),
    },
    testCases: [
      { stdin: '12345\n', expected: '15\n', isSample: 1 },
      { stdin: '0\n', expected: '0\n', isSample: 0 },
      { stdin: '999\n', expected: '27\n', isSample: 0 },
    ],
  },

  // =========================================================================
  // MÓDULO 4: Listas & Vetores
  // =========================================================================
  {
    slug: 'maior-da-lista',
    title: 'Maior Elemento do Vetor',
    difficulty: 'medium',
    tags: ['vetores', 'busca'],
    points: 110,
    statement: 'Receba um número N seguido por N números inteiros. Imprima o maior valor entre eles.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = list(map(int, sys.stdin.read().split()))\n    n, nums = dados[0], dados[1:1 + dados[0]]\n\n    # Imprima o maior valor de nums.`),
      javascript: JS(`  const dados = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const n = dados[0];\n  const nums = dados.slice(1, 1 + n);\n\n  // Imprima o maior valor de nums.`),
    },
    testCases: [
      { stdin: '4\n3 9 1 7\n', expected: '9\n', isSample: 1 },
      { stdin: '3\n-5 -2 -8\n', expected: '-2\n', isSample: 0 },
      { stdin: '1\n42\n', expected: '42\n', isSample: 0 },
    ],
  },
  {
    slug: 'soma-da-lista',
    title: 'Soma dos Elementos do Vetor',
    difficulty: 'medium',
    tags: ['vetores', 'acumulador'],
    points: 110,
    statement: 'Receba um número N seguido por N números inteiros. Imprima a soma de todos os números do vetor.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = list(map(int, sys.stdin.read().split()))\n    n, nums = dados[0], dados[1:1 + dados[0]]\n\n    # Imprima a soma de todos os valores de nums.`),
      javascript: JS(`  const dados = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const n = dados[0];\n  const nums = dados.slice(1, 1 + n);\n\n  // Imprima a soma de todos os valores de nums.`),
    },
    testCases: [
      { stdin: '4\n10 20 30 40\n', expected: '100\n', isSample: 1 },
      { stdin: '3\n5 -2 7\n', expected: '10\n', isSample: 0 },
    ],
  },
  {
    slug: 'contar-ocorrencias',
    title: 'Contar Ocorrências no Vetor',
    difficulty: 'medium',
    tags: ['vetores', 'contagem'],
    points: 120,
    statement: 'Receba N, depois N números inteiros e, na última linha, um número X. Imprima quantas vezes o número X aparece no vetor.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = list(map(int, sys.stdin.read().split()))\n    n = dados[0]\n    nums = dados[1:1 + n]\n    x = dados[1 + n]\n\n    # Imprima quantas vezes x aparece em nums.`),
      javascript: JS(`  const dados = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const n = dados[0];\n  const nums = dados.slice(1, 1 + n);\n  const x = dados[1 + n];\n\n  // Imprima quantas vezes x aparece em nums.`),
    },
    testCases: [
      { stdin: '5\n2 5 2 8 2\n2\n', expected: '3\n', isSample: 1 },
      { stdin: '4\n1 2 3 4\n9\n', expected: '0\n', isSample: 0 },
    ],
  },
  {
    slug: 'palindromo-eficiente',
    title: 'Palíndromo Eficiente',
    difficulty: 'medium',
    tags: ['strings', 'dois-ponteiros', 'complexidade'],
    points: 150,
    statement:
      'Descreva se a palavra recebida é um palíndromo, ignorando maiúsculas e minúsculas. Imprima "SIM" para palíndromos e "NAO" caso contrário. Resolva em tempo linear.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    palavra = sys.stdin.readline().strip().lower()\n\n    # Imprima "SIM" se for palíndromo e "NAO" caso contrário.\n    # Use dois ponteiros: um no início e outro no fim, andando para o\n    # centro. Não vale inverter a palavra — o enunciado pede O(1) de memória.`),
      javascript: JS(`  const palavra = fs.readFileSync(0, 'utf8').trim().toLowerCase();\n\n  // Imprima "SIM" se for palíndromo e "NAO" caso contrário.\n  // Use dois ponteiros: um no início e outro no fim, andando para o\n  // centro. Não pode inverter a palavra nem compará-la com a versão\n  // invertida — isso é O(n) de memória e o enunciado pede O(1).`),
    },
    testCases: [
      { stdin: 'arara\n', expected: 'SIM\n', isSample: 1 },
      { stdin: 'BrioKod\n', expected: 'NAO\n', isSample: 0 },
      { stdin: 'A\n', expected: 'SIM\n', isSample: 0 },
    ],
  },

  // =========================================================================
  // MÓDULO 5: Funções & Algoritmos
  // =========================================================================
  {
    slug: 'fatorial-simples',
    title: 'Fatorial de N',
    difficulty: 'medium',
    tags: ['funcoes', 'recursao', 'matematica'],
    points: 120,
    statement: 'Receba um inteiro N (0 <= N <= 12) e imprima o seu fatorial N! (onde 0! = 1 e N! = N * (N-1)!).',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    n = int(sys.stdin.readline())\n\n    # Calcule n! e imprima. Lembre-se que 0! = 1.`),
      javascript: JS(`  const n = Number(fs.readFileSync(0, 'utf8').trim());\n\n  // Calcule n! e imprima. Lembre-se que 0! = 1.`),
    },
    testCases: [
      { stdin: '5\n', expected: '120\n', isSample: 1 },
      { stdin: '0\n', expected: '1\n', isSample: 0 },
      { stdin: '4\n', expected: '24\n', isSample: 0 },
    ],
  },
  {
    slug: 'busca-no-vetor',
    title: 'Busca de Elemento',
    difficulty: 'medium',
    tags: ['funcoes', 'busca', 'indices'],
    points: 130,
    statement: 'Receba N, depois N números inteiros, e em seguida um valor X. Imprima o índice da primeira ocorrência de X no vetor (índice iniciando em 0) ou -1 se não existir.',
    timeLimitMs: 2000,
    starterCode: {
      python: PY(`    dados = list(map(int, sys.stdin.read().split()))\n    n = dados[0]\n    nums = dados[1:1 + n]\n    x = dados[1 + n]\n\n    # Imprima o índice da primeira ocorrência de x em nums, ou -1.`),
      javascript: JS(`  const dados = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const n = dados[0];\n  const nums = dados.slice(1, 1 + n);\n  const x = dados[1 + n];\n\n  // Imprima o índice da primeira ocorrência de x em nums, ou -1.`),
    },
    testCases: [
      { stdin: '4\n10 20 30 40\n30\n', expected: '2\n', isSample: 1 },
      { stdin: '3\n1 2 3\n5\n', expected: '-1\n', isSample: 0 },
    ],
  },
  {
    slug: 'merge-sort',
    title: 'Merge Sort',
    difficulty: 'hard',
    tags: ['ordenacao', 'divisao-e-conquista', 'recursao'],
    points: 250,
    statement:
      'Receba N e depois N inteiros. Imprima os inteiros em ordem crescente, separados por um único espaço.',
    timeLimitMs: 5000,
    starterCode: {
      python: PY(`    dados = list(map(int, sys.stdin.read().split()))\n    n, numeros = dados[0], dados[1:1 + dados[0]]\n\n    # Ordene numeros em ordem crescente usando merge sort (dividir para\n    # vencer) e imprima-os separados por um único espaço.\n    # Não pode chamar sorted() nem o .sort() do Python.`),
      javascript: JS(`  const dados = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n  const n = dados[0];\n  const numeros = dados.slice(1, 1 + n);\n\n  // Ordene numeros em ordem crescente usando merge sort (dividir para\n  // vencer) e imprima-os separados por um único espaço.\n  // Não pode chamar .sort() do JavaScript.`),
    },
    testCases: [
      { stdin: '6\n5 3 8 1 9 2\n', expected: '1 2 3 5 8 9\n', isSample: 1 },
      { stdin: '1\n7\n', expected: '7\n', isSample: 0 },
      { stdin: '5\n-4 0 12 -4 33\n', expected: '-4 -4 0 12 33\n', isSample: 0 },
    ],
  },
];

// Exportado para testes: permite confirmar que nenhum esboço já passa nos
// casos de teste antes de semear a base de dados.
export { problems };

export function seed({ force = false } = {}) {
  const existing = get('SELECT COUNT(*) AS n FROM problems').n;
  if (existing > 0 && !force) {
    return { problems: existing, users: get('SELECT COUNT(*) AS n FROM users').n, skipped: true };
  }

  const now = nowIso();

  const counts = transaction(() => {
    if (force) {
      run('DELETE FROM test_cases');
      run('DELETE FROM problems');
      run("DELETE FROM users WHERE provider = 'seed'");
    }
    let problemCount = 0;
    for (const problem of problems) {
      run(
        `INSERT INTO problems
           (slug, title, statement, difficulty, tags, time_limit_ms, memory_limit_kb,
            max_file_size_kb, starter_code, function_name, points, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 128000, 1024, ?, NULL, ?, ?, ?)`,
        [
          problem.slug,
          problem.title,
          problem.statement,
          problem.difficulty,
          JSON.stringify(problem.tags),
          problem.timeLimitMs,
          JSON.stringify(problem.starterCode),
          problem.points,
          now,
          now,
        ],
      );
      const problemId = db.prepare('SELECT id FROM problems WHERE slug = ?').get(problem.slug).id;

      problem.testCases.forEach((testCase, index) => {
        run(
          'INSERT INTO test_cases (problem_id, position, stdin, expected, is_sample) VALUES (?, ?, ?, ?, ?)',
          [problemId, index, testCase.stdin, testCase.expected, testCase.isSample],
        );
      });
      problemCount += 1;
    }

    return { problems: problemCount, users: 0 };
  });

  logger.info('database seeded', counts);
  return { ...counts, skipped: false };
}

// Executado via `npm run db:seed`. Sem este bloco o script só importava o
// módulo e saía — o seed nunca rodava, em silêncio.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const counts = seed({ force: process.argv.includes('--force') });
    logger.info('seed finished', counts);
  } catch (error) {
    logger.error('seed failed', { error: error.message });
    process.exitCode = 1;
  }
}