/**
 * Executor-independent language catalogue. The API layer speaks only these
 * slugs; each adapter translates a slug into whatever its backend expects.
 * Adding a new runtime therefore never touches the routes or the database.
 */
export const LANGUAGES = {
  python: {
    label: 'Python 3',
    extension: 'py',
    judge0: { pattern: /^Python \(3\./, fallbackId: 71 },
    piston: { language: 'python', file: 'main.py' },
    template: 'import sys\n\ndef solve():\n    dados = sys.stdin.read().split()\n    pass\n\nsolve()\n',
  },
  javascript: {
    label: 'JavaScript (Node.js)',
    extension: 'js',
    judge0: { pattern: /^JavaScript \(Node\.js/, fallbackId: 63 },
    piston: { language: 'javascript', file: 'main.js' },
    template:
      "const fs = require('node:fs');\n\nconst entrada = fs.readFileSync(0, 'utf8');\n\nconsole.log(entrada.trim());\n",
  },
  c: {
    label: 'C (GCC)',
    extension: 'c',
    judge0: { pattern: /^C \(GCC/, fallbackId: 50 },
    piston: { language: 'c', file: 'main.c' },
    template:
      '#include <stdio.h>\n\nint main(void) {\n  int valor;\n  if (scanf("%d", &valor) != 1) return 1;\n  printf("%d\\n", valor);\n  return 0;\n}\n',
  },
  cpp: {
    label: 'C++ (GCC)',
    extension: 'cpp',
    judge0: { pattern: /^C\+\+ \(GCC/, fallbackId: 54 },
    piston: { language: 'cpp', file: 'main.cpp' },
    template:
      '#include <iostream>\n\nint main() {\n  int valor;\n  std::cin >> valor;\n  std::cout << valor << std::endl;\n  return 0;\n}\n',
  },
  java: {
    label: 'Java (OpenJDK)',
    extension: 'java',
    judge0: { pattern: /^Java \(OpenJDK/, fallbackId: 62 },
    piston: { language: 'java', file: 'Main.java' },
    template:
      'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner in = new Scanner(System.in);\n    System.out.println(in.nextInt());\n  }\n}\n',
  },
  go: {
    label: 'Go',
    extension: 'go',
    judge0: { pattern: /^Go \(/, fallbackId: 60 },
    piston: { language: 'go', file: 'main.go' },
    template:
      'package main\n\nimport (\n\t"bufio"\n\t"fmt"\n\t"os"\n\t"strconv"\n)\n\nfunc main() {\n\ts := bufio.NewScanner(os.Stdin)\n\ts.Scan()\n\tn, _ := strconv.Atoi(s.Text())\n\tfmt.Println(n)\n}\n',
  },
  ruby: {
    label: 'Ruby',
    extension: 'rb',
    judge0: { pattern: /^Ruby \(/, fallbackId: 72 },
    piston: { language: 'ruby', file: 'main.rb' },
    template: 'entrada = STDIN.read.strip\nputs entrada\n',
  },
  php: {
    label: 'PHP',
    extension: 'php',
    judge0: { pattern: /^PHP \(/, fallbackId: 68 },
    piston: { language: 'php', file: 'main.php' },
    template: "<?php\n\n$entrada = trim(fgets(STDIN));\necho $entrada . PHP_EOL;\n",
  },
  csharp: {
    label: 'C# (Mono)',
    extension: 'cs',
    // 51 é o C# (Mono) no Judge0 CE público; 86 é Clojure e o fallback errado
    // fazia o C# compilar como se fosse outra linguagem.
    judge0: { pattern: /^C# \(Mono/, fallbackId: 51 },
    piston: { language: 'csharp', file: 'main.cs' },
    template:
      'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        var valor = int.Parse(Console.ReadLine());\n        Console.WriteLine(valor);\n    }\n}\n',
  },
};

export const LANGUAGE_SLUGS = Object.keys(LANGUAGES);

export function getLanguage(slug) {
  return Object.hasOwn(LANGUAGES, slug) ? LANGUAGES[slug] : null;
}

export function listLanguages() {
  return LANGUAGE_SLUGS.map((slug) => ({
    slug,
    label: LANGUAGES[slug].label,
    extension: LANGUAGES[slug].extension,
  }));
}
