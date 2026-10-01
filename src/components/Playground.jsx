import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const LANGUAGES = [
  { slug: 'python', label: 'Python 3' },
  { slug: 'javascript', label: 'JavaScript' },
  { slug: 'c', label: 'C' },
  { slug: 'cpp', label: 'C++' },
  { slug: 'java', label: 'Java' },
  { slug: 'go', label: 'Go' },
  { slug: 'ruby', label: 'Ruby' },
];

const FALLBACK_TEMPLATE = {
  python: 'n = int(input())\nprint(n * 2)\n',
  javascript: "const n = Number(require('node:fs').readFileSync(0, 'utf8').trim());\nconsole.log(n * 2);\n",
  c: '#include <stdio.h>\n\nint main(void) {\n  int n;\n  scanf("%d", &n);\n  printf("%d\\n", n * 2);\n  return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n  int n;\n  std::cin >> n;\n  std::cout << n * 2 << std::endl;\n}\n',
  java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] a) {\n    Scanner in = new Scanner(System.in);\n    System.out.println(in.nextInt() * 2);\n  }\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n  var n int\n  fmt.Scan(&n)\n  fmt.Println(n * 2)\n}\n',
  ruby: 'n = STDIN.read.strip.to_i\nputs n * 2\n',
};

function starterFor(problem, language) {
  const fromProblem = problem?.starterCode?.[language];
  if (fromProblem) return fromProblem;
  return FALLBACK_TEMPLATE[language] ?? '';
}

function Verdict({ verdict, label }) {
  return (
    <span className="verdict" data-verdict={verdict}>
      {label ?? verdict}
    </span>
  );
}

function Playground({ problem, signedIn = false, onRequireAuth }) {
  const [language, setLanguage] = useState('python');
  const [source, setSource] = useState(() => starterFor(problem, 'python'));
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  // Problem changes remount the component (see `key` in App), so only the
  // language switch needs to reset state here.
  function changeLanguage(next) {
    setLanguage(next);
    setSource(starterFor(problem, next));
    setResult(null);
    setError(null);
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const payload = await api.execute(
        {
          mode: canJudge ? 'judge' : 'run',
          language,
          sourceCode: source,
          stdin,
          ...(canJudge ? { problem: problem.slug } : {}),
        },
        controller.signal,
      );
      setResult(payload);
    } catch (caught) {
      if (caught.name !== 'AbortError') setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  const canJudge = Boolean(problem) && signedIn;

  return (
    <div className="playground">
      <div className="playground-bar">
        <label>
          Linguagem
          <select
            className="select"
            value={language}
            onChange={(event) => changeLanguage(event.target.value)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Problema
          <select
            className="select"
            value={problem?.slug ?? ''}
            onChange={(event) => {
              const slug = event.target.value;
              window.dispatchEvent(
                new CustomEvent('briokod:problema', { detail: slug || null }),
              );
            }}
          >
            <option value="">livre (modo run)</option>
            {problem ? <option value={problem.slug}>{problem.title}</option> : null}
          </select>
        </label>

        <span className="spacer" />

        <button type="button" className="btn btn-primary btn-sm" onClick={run} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          {busy ? 'executando' : canJudge ? 'Submeter' : 'Executar'}
        </button>
      </div>

      <div className="playground-body">
        <div className="pane">
          <header>editor</header>
          <textarea
            className="editor"
            value={source}
            spellCheck={false}
            onChange={(event) => setSource(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Tab') {
                event.preventDefault();
                const { selectionStart, selectionEnd } = event.target;
                const next = `${source.slice(0, selectionStart)}    ${source.slice(selectionEnd)}`;
                setSource(next);
                requestAnimationFrame(() => {
                  event.target.selectionStart = selectionStart + 4;
                  event.target.selectionEnd = selectionStart + 4;
                });
              }
            }}
          />
          <textarea
            className="stdin-input"
            value={stdin}
            spellCheck={false}
            placeholder={'entrada padrão (stdin)\n5'}
            onChange={(event) => setStdin(event.target.value)}
          />
        </div>

        <div className="pane">
          <header>console</header>
          <div className="console">
            {error ? <p className="alert is-error">{error}</p> : null}

            {!error && !result && !busy ? (
              <p className="console-empty">
                {problem && !signedIn ? (
                  <button type="button" className="link-button" onClick={onRequireAuth}>
                    Entre com Google ou e-mail para submeter {problem.title} e guardar seu progresso.
                  </button>
                ) : canJudge ? (
                  `Submeta sua solução para ${problem.title}. Os casos de exemplo aparecem após a primeira execução.`
                ) : (
                  'Escreva o código e clique em Executar. A saída aparece aqui.'
                )}
              </p>
            ) : null}

            {result ? (
              <>
                <div className="console-block">
                  <Verdict verdict={result.verdict} label={result.verdictLabel} />
                </div>

                {result.compileOutput ? (
                  <div className="console-block is-error">
                    <span className="label">compilação</span>
                    <pre>{result.compileOutput}</pre>
                  </div>
                ) : null}

                {result.stdout ? (
                  <div className="console-block">
                    <span className="label">saída</span>
                    <pre>{result.stdout}</pre>
                  </div>
                ) : null}

                {result.stderr ? (
                  <div className="console-block is-error">
                    <span className="label">erro</span>
                    <pre>{result.stderr}</pre>
                  </div>
                ) : null}

                {result.message ? (
                  <div className="console-block is-error">
                    <span className="label">observação</span>
                    <pre>{result.message}</pre>
                  </div>
                ) : null}

                {result.testCases?.length ? (
                  <div className="console-block">
                    <span className="label">
                      casos · {result.casesPassed}/{result.casesTotal}
                    </span>
                    <div className="testcase-list">
                      {result.testCases.map((testCase) => (
                        <div className="testcase" data-pass={testCase.passed} key={testCase.case}>
                          <span className="dot" />
                          <span className="label">
                            caso {testCase.case}
                            {testCase.isSample ? ' (exemplo)' : ''}
                          </span>
                          <span className="time">
                            {testCase.timeMs === null ? '—' : `${testCase.timeMs.toFixed(3)} s`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="console-meta">
                  <span className="chip">
                    {result.timeMs === null ? 'tempo —' : `${result.timeMs.toFixed(3)} s`}
                  </span>
                  <span className="chip">
                    {result.memoryKb === null ? 'memória —' : `${(result.memoryKb / 1024).toFixed(1)} MB`}
                  </span>
                  <span className="chip">{result.executor ?? '—'}</span>
                  <span className="chip">{result.totalMs} ms de ida e volta</span>
                </div>
              </>
            ) : null}

            {busy ? <p className="console-empty">aguardando o executor…</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Playground;
