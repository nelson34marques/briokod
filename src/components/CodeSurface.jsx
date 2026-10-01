import { useMemo, useRef, useEffect } from 'react';
import { Verdict } from './Verdict.jsx';

/**
 * Editor + console compartilhados pelas telas de prática e de desafios.
 *
 * `preview` (HTML+CSS e React) não vai para a API: o código roda no navegador,
 * dentro de um iframe isolado, que é o sandbox correto para essas duas.
 */
export function CodeSurface({
  track,
  source,
  onSourceChange,
  stdin,
  onStdinChange,
  showStdin = true,
  result,
  error,
  busy,
}) {
  const preview = track.execution === 'preview';
  const previewDoc = useMemo(() => (preview ? buildPreview(track, source) : null), [preview, track, source]);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const language = track.id;

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = highlightCode(source, language);
    }
  }, [source, language]);

  function syncScroll() {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  function onKeyDown(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.target;
    const { selectionStart, selectionEnd } = target;
    const next = `${source.slice(0, selectionStart)}    ${source.slice(selectionEnd)}`;
    onSourceChange(next);
    requestAnimationFrame(() => {
      target.selectionStart = selectionStart + 4;
      target.selectionEnd = selectionStart + 4;
    });
  }

  return (
    <div className="surface" style={{ '--lang-color': track.color }}>
      <div className="surface-bar">
        <span className="file">
          {track.id === 'react' ? 'App.jsx' : `main.${track.extension}`}
        </span>
        <span className="runtime">
          {preview ? 'preview no navegador' : track.execution === 'judge0' ? 'sandbox da plataforma' : 'runner pendente'}
        </span>
        <span className="spacer" />
        <span className="hint">Tab insere espaços</span>
      </div>

      <div className={`surface-body${preview ? ' has-preview' : ''}`}>
        <div className="pane pane-editor">
          <header>{preview ? 'código' : 'editor'}</header>
          {!preview && (
            <div className="editor-wrap">
              <pre ref={highlightRef} className="editor-highlight" aria-hidden="true" />
              <textarea
                ref={textareaRef}
                className="editor editor-with-highlight"
                value={source}
                spellCheck={false}
                onChange={(event) => onSourceChange(event.target.value)}
                onKeyDown={onKeyDown}
                onScroll={syncScroll}
              />
            </div>
          )}
          {preview && (
            <textarea
              className="editor"
              value={source}
              spellCheck={false}
              onChange={(event) => onSourceChange(event.target.value)}
              onKeyDown={onKeyDown}
            />
          )}
          {showStdin && !preview ? (
            <textarea
              className="stdin-input"
              value={stdin}
              spellCheck={false}
              placeholder={'entrada padrão (stdin)\n5'}
              onChange={(event) => onStdinChange(event.target.value)}
            />
          ) : null}
        </div>

        <div className="pane">
          <header>{preview ? 'resultado' : 'console'}</header>

          {preview ? (
            <iframe
              className="preview-frame"
              title="Preview"
              sandbox="allow-scripts"
              srcDoc={previewDoc}
            />
          ) : (
            <Console result={result} error={error} busy={busy} track={track} />
          )}
        </div>
      </div>
    </div>
  );
}

const KEYWORDS = {
  python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'try', 'except', 'with', 'as', 'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False'],
  javascript: ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'try', 'catch', 'finally', 'async', 'await', 'throw', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false'],
  php: ['function', 'if', 'else', 'elseif', 'for', 'foreach', 'while', 'return', 'class', 'extends', 'public', 'private', 'protected', 'static', 'echo', 'print', 'new', 'try', 'catch', 'finally', 'throw', 'use', 'namespace', 'require', 'include'],
  c: ['int', 'char', 'float', 'double', 'void', 'if', 'else', 'for', 'while', 'return', 'struct', 'union', 'enum', 'typedef', 'static', 'const', 'sizeof', 'break', 'continue', 'switch', 'case', 'default', 'goto'],
  csharp: ['int', 'string', 'bool', 'float', 'double', 'decimal', 'char', 'void', 'var', 'if', 'else', 'for', 'foreach', 'while', 'return', 'class', 'struct', 'interface', 'enum', 'namespace', 'using', 'public', 'private', 'protected', 'static', 'readonly', 'const', 'new', 'this', 'base', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'null', 'true', 'false'],
  'html-css': [],
  react: ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'try', 'catch', 'finally', 'async', 'await', 'throw', 'typeof', 'null', 'undefined', 'true', 'false'],
  portugol: ['algoritmo', 'variavel', 'se', 'entao', 'senao', 'fimse', 'para', 'enquanto', 'faca', 'fimenquanto', 'funcao', 'procedimento', 'retorne', 'escreva', 'leia', 'inteiro', 'real', 'caractere', 'logico', 'vetor', 'registro'],
};

function highlightCode(code, language) {
  const keywords = KEYWORDS[language] || KEYWORDS.javascript;
  const kwPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped
    .replace(/(\/\/[^\n]*|#[^\n]*)/g, '<<C>>$1<</C>>')
    .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<<S>>$1<</S>>')
    .replace(kwPattern, '<<K>>$1<</K>>')
    .replace(/\b(\d+\.?\d*)\b/g, '<<N>>$1<</N>>');

  return escaped
    .replace(/<<C>>/g, `<span class="tok-com">`)
    .replace(/<<\/C>>/g, `</span>`)
    .replace(/<<S>>/g, `<span class="tok-str">`)
    .replace(/<<\/S>>/g, `</span>`)
    .replace(/<<K>>/g, `<span class="tok-kw">`)
    .replace(/<<\/K>>/g, `</span>`)
    .replace(/<<N>>/g, `<span class="tok-num">`)
    .replace(/<<\/N>>/g, `</span>`);
}

function Console({ result, error, busy, track }) {
  return (
    <div className="console">
      {track.execution === 'pending' ? (
        <p className="console-empty">
          O interpretador do {track.label} ainda não está conectado à plataforma. Escreva o código
          acima e rode no Portugol Studio.
        </p>
      ) : null}

      {error ? <p className="alert is-error">{error}</p> : null}

      {!error && !result && !busy ? (
        <p className="console-empty">Execute para ver o resultado aqui.</p>
      ) : null}

      {result ? (
        <>
          <div className="console-block">
            <Verdict
              verdict={result.verdict}
              label={result.verdictLabel}
              scoring={result.scoring}
            />
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
                      {testCase.timeMs == null ? '—' : `${testCase.timeMs.toFixed(3)} s`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="console-meta">
            {/* `== null` e não `=== null`: um campo ausente chega como
                undefined, e o toFixed rebentava a página inteira. */}
            <span className="chip">
              {result.timeMs == null ? 'tempo —' : `${result.timeMs.toFixed(3)} s`}
            </span>
            <span className="chip">
              {result.memoryKb == null ? 'memória —' : `${(result.memoryKb / 1024).toFixed(1)} MB`}
            </span>
            <span className="chip">{result.executor ?? '—'}</span>
            <span className="chip">{result.totalMs == null ? '—' : `${result.totalMs} ms`} de ida e volta</span>
          </div>
        </>
      ) : null}

      {busy ? <p className="console-empty">aguardando o executor…</p> : null}
    </div>
  );
}

function buildPreview(track, source) {
  if (track.id === 'html-css') return source;
  const code = rewriteReactImports(source);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        padding: 20px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        background: #0e1116;
        color: #e7ebf3;
      }
      button {
        font: inherit;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid #2a3040;
        background: #171b24;
        color: #e7ebf3;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
      const React = window.React;
      const { createRoot } = window.ReactDOM;
      try {
        const transformed = Babel.transform(${JSON.stringify(code)}, { presets: ['react'] }).code;
        const mod = await import(URL.createObjectURL(new Blob([transformed], { type: 'text/javascript' })));
        createRoot(document.getElementById('root')).render(React.createElement(mod.default));
      } catch (error) {
        document.getElementById('root').textContent = String(error);
      }
    </script>
  </body>
</html>`;
}

function rewriteReactImports(code) {
  return code
    .replace(/import\s+React\s*,?\s*\{([^}]*)\}\s*from\s*['"]react['"];?/g, 'const {$1} = React;')
    .replace(/import\s*\{([^}]*)\}\s*from\s*['"]react['"];?/g, 'const {$1} = React;')
    .replace(/import\s+React\s+from\s*['"]react['"];?/g, 'const React = window.React;');
}

export default CodeSurface;
