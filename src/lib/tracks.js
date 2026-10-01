/**
 * Catálogo de módulos e trilhas.
 *
 * Cada módulo agrupa 3 a 5 exercícios graduais com curva de aprendizado suave:
 * do primeiro print até algoritmos com análise de complexidade.
 */

export const MODULES = [
  {
    id: 'm1',
    number: 1,
    title: 'Primeiros Passos & Matemática Básica',
    tagline: 'Saída de texto, variáveis e as quatro operações fundamentais.',
    icon: 'm1',
  },
  {
    id: 'm2',
    number: 2,
    title: 'Decisões e Condições (If / Else)',
    tagline: 'Ramifique seu código para tomar decisões lógicas.',
    icon: 'm2',
  },
  {
    id: 'm3',
    number: 3,
    title: 'Laços de Repetição (While / For)',
    tagline: 'Automatize repetições, tabuadas e contagens com loops.',
    icon: 'm3',
  },
  {
    id: 'm4',
    number: 4,
    title: 'Listas e Vetores',
    tagline: 'Guarde coleções de dados e faça buscas e somatórios.',
    icon: 'm4',
  },
  {
    id: 'm5',
    number: 5,
    title: 'Funções e Algoritmos',
    tagline: 'Estruture código modular, recursão e algoritmos clássicos.',
    icon: 'm5',
  },
];

const JUDGE0_LEVELS = [
  // =========================================================================
  // MÓDULO 1: Primeiros Passos & Matemática Básica (5 exercícios)
  // =========================================================================
  {
    id: 'm1-e1',
    moduleId: 'm1',
    moduleTitle: 'Módulo 1: Primeiros Passos',
    order: 1,
    title: 'Olá, Mundo!',
    goal: 'Imprimir a primeira mensagem na tela com saída padrão.',
    concepts: ['print', 'saída padrão', 'strings'],
    problemSlug: 'ola-mundo',
  },
  {
    id: 'm1-e2',
    moduleId: 'm1',
    moduleTitle: 'Módulo 1: Primeiros Passos',
    order: 2,
    title: 'Soma de Dois Números',
    goal: 'Ler 2 números da entrada e calcular a soma A + B.',
    concepts: ['leitura de inteiros', 'variáveis', 'soma'],
    problemSlug: 'soma-simples',
  },
  {
    id: 'm1-e3',
    moduleId: 'm1',
    moduleTitle: 'Módulo 1: Primeiros Passos',
    order: 3,
    title: 'Diferença entre Números',
    goal: 'Ler 2 números e calcular a subtração A - B.',
    concepts: ['subtração', 'operadores aritméticos'],
    problemSlug: 'subtracao-simples',
  },
  {
    id: 'm1-e4',
    moduleId: 'm1',
    moduleTitle: 'Módulo 1: Primeiros Passos',
    order: 4,
    title: 'Produto Simples',
    goal: 'Ler 2 números e calcular a multiplicação A * B.',
    concepts: ['multiplicação', 'tipos numéricos'],
    problemSlug: 'multiplicacao-simples',
  },
  {
    id: 'm1-e5',
    moduleId: 'm1',
    moduleTitle: 'Módulo 1: Primeiros Passos',
    order: 5,
    title: 'Divisão Inteira e Resto',
    goal: 'Calcular a divisão inteira e o resto (módulo).',
    concepts: ['divisão inteira', 'resto', 'módulo %'],
    problemSlug: 'divisao-e-resto',
  },

  // =========================================================================
  // MÓDULO 2: Decisões e Condições (5 exercícios)
  // =========================================================================
  {
    id: 'm2-e1',
    moduleId: 'm2',
    moduleTitle: 'Módulo 2: Decisões e Condições',
    order: 6,
    title: 'Positivo, Negativo ou Zero',
    goal: 'Classificar um número com if / elif / else.',
    concepts: ['if / else', 'comparações', 'maior e menor'],
    problemSlug: 'positivo-negativo-zero',
  },
  {
    id: 'm2-e2',
    moduleId: 'm2',
    moduleTitle: 'Módulo 2: Decisões e Condições',
    order: 7,
    title: 'Par ou Ímpar',
    goal: 'Descobrir se o número é par usando o operador % 2.',
    concepts: ['paridade', 'módulo', 'condições'],
    problemSlug: 'par-ou-impar',
  },
  {
    id: 'm2-e3',
    moduleId: 'm2',
    moduleTitle: 'Módulo 2: Decisões e Condições',
    order: 8,
    title: 'Maior de Dois Números',
    goal: 'Comparar dois valores e imprimir o maior.',
    concepts: ['maior valor', 'comparação', 'lógica'],
    problemSlug: 'maior-de-dois',
  },
  {
    id: 'm2-e4',
    moduleId: 'm2',
    moduleTitle: 'Módulo 2: Decisões e Condições',
    order: 9,
    title: 'Média: Aprovado ou Reprovado',
    goal: 'Calcular média de 2 notas e testar se >= 10.',
    concepts: ['média', 'operadores relacionais'],
    problemSlug: 'aprovado-ou-reprovado',
  },
  {
    id: 'm2-e5',
    moduleId: 'm2',
    moduleTitle: 'Módulo 2: Decisões e Condições',
    order: 10,
    title: 'FizzBuzz Pro',
    goal: 'O clássico desafio de múltiplos de 3, 5 e 15.',
    concepts: ['múltiplos', 'operador E (and / &&)', 'FizzBuzz'],
    problemSlug: 'fizzbuzz-pro',
  },

  // =========================================================================
  // MÓDULO 3: Laços de Repetição (5 exercícios)
  // =========================================================================
  {
    id: 'm3-e1',
    moduleId: 'm3',
    moduleTitle: 'Módulo 3: Laços de Repetição',
    order: 11,
    title: 'Contagem de 1 a N',
    goal: 'Imprimir sequência numérica com laço for / while.',
    concepts: ['for', 'while', 'iteração'],
    problemSlug: 'contagem-progressiva',
  },
  {
    id: 'm3-e2',
    moduleId: 'm3',
    moduleTitle: 'Módulo 3: Laços de Repetição',
    order: 12,
    title: 'Tabuada de Multiplicação',
    goal: 'Gerar os 10 múltiplos de N usando um laço.',
    concepts: ['tabuada', 'laços', 'multiplicação iterativa'],
    problemSlug: 'tabuada-simples',
  },
  {
    id: 'm3-e3',
    moduleId: 'm3',
    moduleTitle: 'Módulo 3: Laços de Repetição',
    order: 13,
    title: 'Soma Acumulada de 1 a N',
    goal: 'Acumular valores em uma variável somatória.',
    concepts: ['acumulador', 'somatório', 'laços'],
    problemSlug: 'soma-de-1-a-n',
  },
  {
    id: 'm3-e4',
    moduleId: 'm3',
    moduleTitle: 'Módulo 3: Laços de Repetição',
    order: 14,
    title: 'Números Pares até N',
    goal: 'Filtrar ou incrementar passo para listar pares.',
    concepts: ['passo do loop', 'filtro', 'laços'],
    problemSlug: 'contar-pares',
  },
  {
    id: 'm3-e5',
    moduleId: 'm3',
    moduleTitle: 'Módulo 3: Laços de Repetição',
    order: 15,
    title: 'Soma de Dígitos',
    goal: 'Extrair e somar os algarismos de um número.',
    concepts: ['decomposição de dígitos', 'while', 'acumulação'],
    problemSlug: 'soma-de-digitos',
  },

  // =========================================================================
  // MÓDULO 4: Listas & Vetores (4 exercícios)
  // =========================================================================
  {
    id: 'm4-e1',
    moduleId: 'm4',
    moduleTitle: 'Módulo 4: Listas & Vetores',
    order: 16,
    title: 'Maior Elemento do Vetor',
    goal: 'Percorrer lista e identificar o maior valor.',
    concepts: ['vetores', 'índices', 'busca do maior'],
    problemSlug: 'maior-da-lista',
  },
  {
    id: 'm4-e2',
    moduleId: 'm4',
    moduleTitle: 'Módulo 4: Listas & Vetores',
    order: 17,
    title: 'Soma dos Elementos do Vetor',
    goal: 'Somar todos os elementos de uma lista.',
    concepts: ['vetores', 'soma em array', 'iteração'],
    problemSlug: 'soma-da-lista',
  },
  {
    id: 'm4-e3',
    moduleId: 'm4',
    moduleTitle: 'Módulo 4: Listas & Vetores',
    order: 18,
    title: 'Contar Ocorrências no Vetor',
    goal: 'Contar quantas vezes um item específico aparece.',
    concepts: ['contagem', 'filtro de vetor'],
    problemSlug: 'contar-ocorrencias',
  },
  {
    id: 'm4-e4',
    moduleId: 'm4',
    moduleTitle: 'Módulo 4: Listas & Vetores',
    order: 19,
    title: 'Palíndromo Eficiente',
    goal: 'Testar se uma palavra é igual de frente para trás.',
    concepts: ['strings', 'dois ponteiros', 'complexidade'],
    problemSlug: 'palindromo-eficiente',
  },

  // =========================================================================
  // MÓDULO 5: Funções & Algoritmos (3 exercícios)
  // =========================================================================
  {
    id: 'm5-e1',
    moduleId: 'm5',
    moduleTitle: 'Módulo 5: Funções & Algoritmos',
    order: 20,
    title: 'Fatorial de N',
    goal: 'Calcular fatorial usando função recursiva ou iterativa.',
    concepts: ['funções', 'fatorial', 'recursão'],
    problemSlug: 'fatorial-simples',
  },
  {
    id: 'm5-e2',
    moduleId: 'm5',
    moduleTitle: 'Módulo 5: Funções & Algoritmos',
    order: 21,
    title: 'Busca de Elemento',
    goal: 'Localizar a posição do item no vetor.',
    concepts: ['busca linear', 'retorno de índice'],
    problemSlug: 'busca-no-vetor',
  },
  {
    id: 'm5-e3',
    moduleId: 'm5',
    moduleTitle: 'Módulo 5: Funções & Algoritmos',
    order: 22,
    title: 'Merge Sort',
    goal: 'Ordenar elementos usando divisão e conquista.',
    concepts: ['divisão e conquista', 'ordenação', 'O(n log n)'],
    problemSlug: 'merge-sort',
  },
];

const STARTERS = {
  python: {
    'm1-e1': 'print("Olá, Mundo!")\n',
    'm1-e2': 'import sys\n\ndados = sys.stdin.read().split()\nif dados:\n    a = int(dados[0])\n    b = int(dados[1])\n    print(a + b)\n',
    'm1-e3': 'import sys\n\ndados = sys.stdin.read().split()\na, b = int(dados[0]), int(dados[1])\nprint(a - b)\n',
    'm1-e4': 'import sys\n\ndados = sys.stdin.read().split()\na, b = int(dados[0]), int(dados[1])\nprint(a * b)\n',
    'm1-e5': 'import sys\n\ndados = sys.stdin.read().split()\na, b = int(dados[0]), int(dados[1])\nprint(a // b)\nprint(a % b)\n',
    'm2-e1': 'import sys\n\nn = int(sys.stdin.readline())\nif n > 0:\n    print("POSITIVO")\nelif n < 0:\n    print("NEGATIVO")\nelse:\n    print("ZERO")\n',
    'm2-e2': 'import sys\n\nn = int(sys.stdin.readline())\nprint("PAR" if n % 2 == 0 else "IMPAR")\n',
    'm2-e3': 'import sys\n\ndados = sys.stdin.read().split()\na, b = int(dados[0]), int(dados[1])\nprint(a if a > b else b)\n',
    'm2-e4': 'import sys\n\ndados = sys.stdin.read().split()\na, b = float(dados[0]), float(dados[1])\nmedia = (a + b) / 2\nprint("APROVADO" if media >= 10 else "REPROVADO")\n',
    'm2-e5': 'import sys\n\nn = int(sys.stdin.readline())\nfor i in range(1, n + 1):\n    # "Fizz", "Buzz", "FizzBuzz" ou o próprio número\n    pass\n',
    'm3-e1': 'import sys\n\nn = int(sys.stdin.readline())\nfor i in range(1, n + 1):\n    print(i)\n',
    'm3-e2': 'import sys\n\nn = int(sys.stdin.readline())\nfor i in range(1, 11):\n    print(n * i)\n',
    'm3-e3': 'import sys\n\nn = int(sys.stdin.readline())\nprint(sum(range(1, n + 1)))\n',
    'm3-e4': 'import sys\n\nn = int(sys.stdin.readline())\nfor i in range(2, n + 1, 2):\n    print(i)\n',
    'm3-e5': 'import sys\n\ns = sys.stdin.readline().strip()\nprint(sum(int(c) for c in s if c.isdigit()))\n',
    'm4-e1': 'import sys\n\ndados = list(map(int, sys.stdin.read().split()))\nif dados:\n    n, nums = dados[0], dados[1:1 + dados[0]]\n    print(max(nums))\n',
    'm4-e2': 'import sys\n\ndados = list(map(int, sys.stdin.read().split()))\nif dados:\n    n, nums = dados[0], dados[1:1 + dados[0]]\n    print(sum(nums))\n',
    'm4-e3': 'import sys\n\ndados = list(map(int, sys.stdin.read().split()))\nn = dados[0]\nnums = dados[1:1 + n]\nx = dados[1 + n]\nprint(nums.count(x))\n',
    'm4-e4': 'import sys\n\npalavra = sys.stdin.readline().strip().lower()\nprint("SIM" if palavra == palavra[::-1] else "NAO")\n',
    'm5-e1': 'import sys, math\n\nn = int(sys.stdin.readline())\nprint(math.factorial(n))\n',
    'm5-e2': 'import sys\n\ndados = list(map(int, sys.stdin.read().split()))\nn = dados[0]\nnums = dados[1:1 + n]\nx = dados[1 + n]\nprint(nums.index(x) if x in nums else -1)\n',
    'm5-e3': 'import sys\n\ndados = list(map(int, sys.stdin.read().split()))\nn, numeros = dados[0], dados[1:1 + dados[0]]\nnumeros.sort()\nprint(*numeros)\n',
  },
  javascript: {
    'm1-e1': 'console.log("Olá, Mundo!");\n',
    'm1-e2': 'let a = Number(input()[0]);\nlet b = Number(input()[1]);\nconsole.log(a + b);\n',
    'm1-e3': 'let a = Number(input()[0]);\nlet b = Number(input()[1]);\nconsole.log(a - b);\n',
    'm1-e4': 'let a = Number(input()[0]);\nlet b = Number(input()[1]);\nconsole.log(a * b);\n',
    'm1-e5': 'let a = Number(input()[0]);\nlet b = Number(input()[1]);\nconsole.log(Math.floor(a / b));\nconsole.log(a % b);\n',
    'm2-e1': 'const n = Number(input());\nif (n > 0) console.log("POSITIVO");\nelse if (n < 0) console.log("NEGATIVO");\nelse console.log("ZERO");\n',
    'm2-e2': 'const n = Number(input());\nconsole.log(n % 2 === 0 ? "PAR" : "IMPAR");\n',
    'm2-e3': 'const [a, b] = input().map(Number);\nconsole.log(a > b ? a : b);\n',
    'm2-e4': 'const [a, b] = input().map(Number);\nconst media = (a + b) / 2;\nconsole.log(media >= 10 ? "APROVADO" : "REPROVADO");\n',
    'm2-e5': 'const n = Number(input());\nfor (let i = 1; i <= n; i++) {\n  // FizzBuzz\n}\n',
    'm3-e1': 'const n = Number(input());\nfor (let i = 1; i <= n; i++) console.log(i);\n',
    'm3-e2': 'const n = Number(input());\nfor (let i = 1; i <= 10; i++) console.log(n * i);\n',
    'm3-e3': 'const n = Number(input());\nlet total = 0;\nfor (let i = 1; i <= n; i++) total += i;\nconsole.log(total);\n',
    'm3-e4': 'const n = Number(input());\nfor (let i = 2; i <= n; i += 2) console.log(i);\n',
    'm3-e5': 'const s = input()[0];\nconst total = s.split("").reduce((acc, c) => acc + (isNaN(c) ? 0 : Number(c)), 0);\nconsole.log(total);\n',
    'm4-e1': 'const dados = input().map(Number);\nconst n = dados[0];\nconst nums = dados.slice(1, 1 + n);\nconsole.log(Math.max(...nums));\n',
    'm4-e2': 'const dados = input().map(Number);\nconst n = dados[0];\nconst nums = dados.slice(1, 1 + n);\nconsole.log(nums.reduce((a, b) => a + b, 0));\n',
    'm4-e3': 'const dados = input().map(Number);\nconst n = dados[0];\nconst nums = dados.slice(1, 1 + n);\nconst x = dados[1 + n];\nconsole.log(nums.filter((v) => v === x).length);\n',
    'm4-e4': 'const palavra = input()[0].toLowerCase();\nconst rev = palavra.split("").reverse().join("");\nconsole.log(palavra === rev ? "SIM" : "NAO");\n',
    'm5-e1': 'const n = Number(input());\nlet f = 1;\nfor (let i = 2; i <= n; i++) f *= i;\nconsole.log(f);\n',
    'm5-e2': 'const dados = input().map(Number);\nconst n = dados[0];\nconst nums = dados.slice(1, 1 + n);\nconst x = dados[1 + n];\nconsole.log(nums.indexOf(x));\n',
    'm5-e3': 'const dados = input().map(Number);\nconst n = dados[0];\nconst numeros = dados.slice(1, 1 + n).sort((a, b) => a - b);\nconsole.log(numeros.join(" "));\n',
  },
  php: {
    'm1-e1': '<?php\n\necho "Olá, Mundo!", PHP_EOL;\n',
    'm1-e2': '<?php\n\n$dados = explode(" ", trim(preg_replace("/\\s+/", " ", file_get_contents("php://stdin"))));\n$a = (int)$dados[0];\n$b = (int)$dados[1];\necho ($a + $b), PHP_EOL;\n',
    'm1-e3': '<?php\n\n$dados = explode(" ", trim(preg_replace("/\\s+/", " ", file_get_contents("php://stdin"))));\necho ((int)$dados[0] - (int)$dados[1]), PHP_EOL;\n',
    'm1-e4': '<?php\n\n$dados = explode(" ", trim(preg_replace("/\\s+/", " ", file_get_contents("php://stdin"))));\necho ((int)$dados[0] * (int)$dados[1]), PHP_EOL;\n',
    'm1-e5': '<?php\n\n$dados = explode(" ", trim(preg_replace("/\\s+/", " ", file_get_contents("php://stdin"))));\n$a = (int)$dados[0];\n$b = (int)$dados[1];\necho intdiv($a, $b), PHP_EOL;\necho ($a % $b), PHP_EOL;\n',
  },
  c: {
    'm1-e1': '#include <stdio.h>\n\nint main(void) {\n  printf("Olá, Mundo!\\n");\n  return 0;\n}\n',
    'm1-e2': '#include <stdio.h>\n\nint main(void) {\n  int a, b;\n  if (scanf("%d %d", &a, &b) == 2) {\n    printf("%d\\n", a + b);\n  }\n  return 0;\n}\n',
    'm1-e3': '#include <stdio.h>\n\nint main(void) {\n  int a, b;\n  scanf("%d %d", &a, &b);\n  printf("%d\\n", a - b);\n  return 0;\n}\n',
    'm1-e4': '#include <stdio.h>\n\nint main(void) {\n  int a, b;\n  scanf("%d %d", &a, &b);\n  printf("%d\\n", a * b);\n  return 0;\n}\n',
    'm1-e5': '#include <stdio.h>\n\nint main(void) {\n  int a, b;\n  scanf("%d %d", &a, &b);\n  printf("%d\\n%d\\n", a / b, a % b);\n  return 0;\n}\n',
  },
  csharp: {
    'm1-e1': 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Olá, Mundo!");\n    }\n}\n',
    'm1-e2': 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        var tokens = Console.In.ReadToEnd().Split(new[] { \' \', \'\\n\', \'\\r\' }, StringSplitOptions.RemoveEmptyEntries);\n        if (tokens.Length >= 2)\n        {\n            int a = int.Parse(tokens[0]);\n            int b = int.Parse(tokens[1]);\n            Console.WriteLine(a + b);\n        }\n    }\n}\n',
  },
  'html-css': {
    n1: '<!DOCTYPE html>\n<html lang="pt-BR">\n  <body>\n    <h1>Olá, mundo!</h1>\n  </body>\n</html>\n',
    n2: '<!-- mude a cor do título com style -->\n<!DOCTYPE html>\n<html lang="pt-BR">\n  <head>\n    <style>\n      h1 { color: #2563eb; }\n    </style>\n  </head>\n  <body>\n    <h1>Olá, mundo!</h1>\n  </body>\n</html>\n',
    n3: '<!DOCTYPE html>\n<html lang="pt-BR">\n  <body>\n    <ul id="lista"></ul>\n    <script>\n      // gere 5 itens com for\n    </script>\n  </body>\n</html>\n',
    n4: '<!DOCTYPE html>\n<html lang="pt-BR">\n  <body>\n    <script>\n      function saudacao(nome) {\n        return `Olá, ${nome}!`;\n      }\n    </script>\n  </body>\n</html>\n',
    n5: '<!DOCTYPE html>\n<html lang="pt-BR">\n  <head>\n    <style>\n      /* layout com flexbox e gap */\n    </style>\n  </head>\n  <body>\n    <div class="grade"></div>\n  </body>\n</html>\n',
    n6: '<!DOCTYPE html>\n<html lang="pt-BR">\n  <head>\n    <style>\n      /* responsivo: @media, grid, variáveis customizadas */\n    </style>\n  </head>\n  <body>\n    <main></main>\n  </body>\n</html>\n',
  },
  react: {
    n1: 'export default function App() {\n  return <h1>Olá, mundo!</h1>;\n}\n',
    n2: 'export default function App() {\n  // use useState para guardar o nome e um input para trocar\n  return <h1>Olá, mundo!</h1>;\n}\n',
    n3: "import { useState } from 'react';\n\nexport default function App() {\n  const [itens, setItens] = useState([]);\n  return <ul>{/* map */}</ul>;\n}\n",
    n4: 'import { useState } from "react";\n\nfunction Contador() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}\n\nexport default function App() {\n  return <Contador />;\n}\n',
    n5: "import { useState } from 'react';\n\n// lifting state: o pai guarda, o filho renderiza\nexport default function App() {\n  return <ul>{/* lista de itens */}</ul>;\n}\n",
    n6: "import { useState, useEffect } from 'react';\n\n// custom hook + efeito colateral\nexport default function App() {\n  return <div>{/* fetching */}</div>;\n}\n",
  },
  portugol: {
    'm1-e1': 'programa\n{\n  funcao inicio()\n  {\n    escreva("Olá, Mundo!")\n  }\n}\n',
    'm1-e2': 'programa\n{\n  funcao inicio()\n  {\n    inteiro a, b\n    leia(a)\n    leia(b)\n    escreva(a + b)\n  }\n}\n',
    'm1-e3': 'programa\n{\n  funcao inicio()\n  {\n    inteiro a, b\n    leia(a)\n    leia(b)\n    escreva(a - b)\n  }\n}\n',
    'm1-e4': 'programa\n{\n  funcao inicio()\n  {\n    inteiro a, b\n    leia(a)\n    leia(b)\n    escreva(a * b)\n  }\n}\n',
    'm1-e5': 'programa\n{\n  funcao inicio()\n  {\n    inteiro a, b\n    leia(a)\n    leia(b)\n    escreva(a / b, "\\n", a % b)\n  }\n}\n',
  },
};

function withStarters(levels, languageId) {
  return levels.map((level) => ({ ...level, starter: STARTERS[languageId]?.[level.id] ?? '' }));
}

export const TRACKS = {
  python: {
    id: 'python',
    label: 'Python',
    short: 'Py',
    family: 'Lógica de programação',
    tagline: 'A mais indicada para quem está começando do zero.',
    execution: 'judge0',
    extension: 'py',
    color: '#3b82f6',
    colorSoft: 'rgba(59, 130, 246, 0.15)',
    levels: withStarters(JUDGE0_LEVELS, 'python'),
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    short: 'JS',
    family: 'Lógica de programação',
    tagline: 'Lógica com a linguagem que roda em todo navegador.',
    execution: 'judge0',
    extension: 'js',
    color: '#facc15',
    colorSoft: 'rgba(250, 204, 21, 0.15)',
    levels: withStarters(JUDGE0_LEVELS, 'javascript'),
  },
  php: {
    id: 'php',
    label: 'PHP',
    short: 'PHP',
    family: 'Back-end',
    tagline: 'Clássico de back-end, ótimo para entender requisição e estado.',
    execution: 'judge0',
    extension: 'php',
    color: '#a78bfa',
    colorSoft: 'rgba(167, 139, 250, 0.15)',
    levels: withStarters(JUDGE0_LEVELS, 'php'),
  },
  c: {
    id: 'c',
    label: 'C',
    short: 'C',
    family: 'Sistemas',
    tagline: 'Memória, ponteiros e a base de tudo que roda perto do hardware.',
    execution: 'judge0',
    extension: 'c',
    color: '#fb923c',
    colorSoft: 'rgba(251, 146, 60, 0.15)',
    levels: withStarters(JUDGE0_LEVELS, 'c'),
  },
  csharp: {
    id: 'csharp',
    label: 'C#',
    short: 'C#',
    family: 'Orientação a objetos',
    tagline: 'Objetos, tipos e a linguagem do ecossistema Unity e .NET.',
    execution: 'judge0',
    extension: 'cs',
    color: '#34d399',
    colorSoft: 'rgba(52, 211, 153, 0.15)',
    levels: withStarters(JUDGE0_LEVELS, 'csharp'),
  },
  'html-css': {
    id: 'html-css',
    label: 'HTML + CSS',
    short: 'H+C',
    family: 'Front-end',
    tagline: 'Estrutura e estilo. O resultado aparece na hora, ao lado do editor.',
    execution: 'preview',
    extension: 'html',
    color: '#fb7185',
    colorSoft: 'rgba(251, 113, 133, 0.15)',
    levels: withStarters(
      [
        { id: 'n1', moduleId: 'm1', order: 1, title: 'Primeira página', goal: 'Escrever a estrutura e ver o resultado.', concepts: ['tags', 'atributos', 'hierarquia'], problemSlug: null },
        { id: 'n2', moduleId: 'm1', order: 2, title: 'Estilo visual', goal: 'Aplicar cor, tipografia e espaçamento.', concepts: ['seletores', 'box model', 'unidades'], problemSlug: null },
        { id: 'n3', moduleId: 'm2', order: 3, title: 'Interação com JS', goal: 'Reagir a clique e gerar conteúdo.', concepts: ['eventos', 'DOM', 'template strings'], problemSlug: null },
        { id: 'n4', moduleId: 'm3', order: 4, title: 'Componentes', goal: 'Dividir a página em partes reutilizáveis.', concepts: ['funções', 'render', 'estado'], problemSlug: null },
        { id: 'n5', moduleId: 'm4', order: 5, title: 'Layout moderno', goal: 'grade e flexbox sem gambiarra.', concepts: ['flexbox', 'grid', 'gap'], problemSlug: null },
        { id: 'n6', moduleId: 'm5', order: 6, title: 'Responsivo', goal: 'Funcionar do celular ao monitor grande.', concepts: ['@media', 'variáveis CSS', 'mobile first'], problemSlug: null },
      ],
      'html-css',
    ),
  },
  react: {
    id: 'react',
    label: 'React',
    short: 'Re',
    family: 'Front-end',
    tagline: 'Componentes que reagem ao estado, renderizados no navegador.',
    execution: 'preview',
    extension: 'jsx',
    color: '#22d3ee',
    colorSoft: 'rgba(34, 211, 238, 0.15)',
    levels: withStarters(
      [
        { id: 'n1', moduleId: 'm1', order: 1, title: 'JSX', goal: 'Escrever markup dentro de JavaScript.', concepts: ['JSX', 'props', 'export default'], problemSlug: null },
        { id: 'n2', moduleId: 'm1', order: 2, title: 'Estado', goal: 'Guardar e alterar valores entre renders.', concepts: ['useState', 'setState', 'imutabilidade'], problemSlug: null },
        { id: 'n3', moduleId: 'm2', order: 3, title: 'Listas', goal: 'Renderizar coleções e chaves estáveis.', concepts: ['map', 'key', 'filter'], problemSlug: null },
        { id: 'n4', moduleId: 'm3', order: 4, title: 'Props e composição', goal: 'Passar dados e compor componentes pequenos.', concepts: ['props', 'children', 'lifting state'], problemSlug: null },
        { id: 'n5', moduleId: 'm4', order: 5, title: 'Formulários', goal: 'Controlar inputs e validar antes de enviar.', concepts: ['controlled input', 'validação', 'submit'], problemSlug: null },
        { id: 'n6', moduleId: 'm5', order: 6, title: 'Efeitos e hooks', goal: 'Sincronizar com a API sem quebrar o render.', concepts: ['useEffect', 'custom hook', 'cleanup'], problemSlug: null },
      ],
      'react',
    ),
  },
  portugol: {
    id: 'portugol',
    label: 'Portugol Studio',
    short: 'PG',
    family: 'Lógica de programação',
    tagline: 'A linguagem do terceirinho, com português nativo.',
    execution: 'pending',
    extension: 'por',
    color: '#4ade80',
    colorSoft: 'rgba(74, 222, 128, 0.15)',
    note: 'O Portugol Studio roda no seu IDE, não no navegador. O runner próprio ainda está em construção — até lá você estuda a trilha e leva o código para o Studio.',
    levels: withStarters(JUDGE0_LEVELS, 'portugol'),
  },
};

/** Ordem em que as linguagens aparecem no seletor. */
export const TRACK_ORDER = [
  'python',
  'javascript',
  'html-css',
  'portugol',
  'php',
  'react',
  'c',
  'csharp',
];

export const TRACK_LIST = TRACK_ORDER.map((id) => TRACKS[id]);

export function getTrack(id) {
  return TRACKS[id] ?? null;
}

export function levelIndex(track, levelId) {
  return track?.levels.findIndex((level) => level.id === levelId) ?? -1;
}

/** Próximo nível a fazer, ou null quando a trilha acabou. */
export function nextLevel(track, levelId) {
  const index = levelIndex(track, levelId);
  if (index < 0) return track?.levels[0] ?? null;
  return track.levels[index + 1] ?? null;
}

export function getModulesWithLevels(track) {
  if (!track?.levels) return [];
  const map = new Map();
  MODULES.forEach((mod) => {
    map.set(mod.id, { ...mod, levels: [] });
  });

  track.levels.forEach((lvl) => {
    const mId = lvl.moduleId || 'm1';
    if (!map.has(mId)) {
      map.set(mId, { id: mId, number: map.size + 1, title: lvl.moduleTitle || 'Módulo', icon: mId, levels: [] });
    }
    map.get(mId).levels.push(lvl);
  });

  return Array.from(map.values()).filter((m) => m.levels.length > 0);
}

export const EXECUTION_LABEL = {
  judge0: 'executa no sandbox da plataforma',
  preview: 'executa no navegador, ao lado',
  pending: 'runner em construção',
};
