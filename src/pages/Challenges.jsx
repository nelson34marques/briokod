import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';
import { TRACK_LIST, EXECUTION_LABEL } from '../lib/tracks.js';
import { CodeSurface } from '../components/CodeSurface.jsx';
import { IconEdit } from '../components/Icons.jsx';

const DIFFICULTY_LABEL = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };

const STARTER = {
  'html-css': '<!DOCTYPE html>\n<html lang="pt-BR">\n  <body>\n    <h1>Seu desafio</h1>\n  </body>\n</html>\n',
  react: "export default function App() {\n  return <h1>Seu desafio</h1>;\n}\n",
  portugol: 'programa\n{\n  funcao inicio()\n  {\n    escreva("seu desafio")\n  }\n}\n',
};

export default function Challenges() {
  const { track: activeTrack } = useOutletContext();
  const [trackId, setTrackId] = useState(activeTrack?.id ?? 'python');
  const [difficulty, setDifficulty] = useState('all');
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState('');
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  // No telemóvel a lista de problemas vem antes do enunciado e do editor, e
  // a rolagem é longa. Guardamos o ponto para voltar ao editor assim que o
  // aluno escolhe um desafio, em vez de o deixar a procurar no fundo da página.
  const workRef = useRef(null);

  const track = useMemo(
    () => TRACK_LIST.find((item) => item.id === trackId) ?? TRACK_LIST[0],
    [trackId],
  );

  useEffect(() => {
    let active = true;
    api
      .problems({ limit: '50', ...(difficulty === 'all' ? {} : { difficulty }) })
      .then((payload) => {
        if (active) setProblems(payload.items);
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [difficulty]);

  function changeDifficulty(value) {
    // O spinner é disparado aqui, não no efeito: buscar dados é efeito, mas
    // marcar que está carregando é estado derivado do clique.
    setDifficulty(value);
    setLoading(true);
  }

  const [reward, setReward] = useState(null);

  function pick(problem) {
    setSelected(problem);
    setResult(null);
    setError(null);
    setStdin('');
    setReward({
      current: problem.points ?? 100,
      base: problem.points ?? 100,
      penalty: 0,
      attempts: 0,
    });
    setSource(
      problem.starterCode?.[track.id] ?? STARTER[track.id] ?? '',
    );

    // Só no telemóvel: no PC enunciado e lista estão lado a lado e não há
    // rolagem para desfazer.
    if (window.matchMedia('(max-width: 900px)').matches) {
      requestAnimationFrame(() => {
        workRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function changeTrack(next) {
    setTrackId(next);
    setSelected(null);
    setResult(null);
    setReward(null);
  }

  async function submit() {
    if (!selected) return;
    // Preview e pending não passam pela API: o primeiro roda no iframe e o
    // segundo ainda não tem runner. Chamar o executor aqui só geraria erro.
    if (track.execution !== 'judge0') return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const payload = await api.execute({
        mode: 'judge',
        language: track.id,
        sourceCode: source,
        stdin: '',
        problem: selected.slug,
      });
      setResult(payload);
      if (payload.scoring && payload.scoring.wrongAttempts > 0) {
        setReward({
          current: payload.scoring.rewardIfAccepted,
          base: payload.scoring.basePoints,
          penalty: payload.scoring.penaltyPending,
          attempts: payload.scoring.wrongAttempts,
        });
      } else if (payload.verdict && payload.verdict !== 'accepted') {
        setReward((prev) => {
          const attempts = (prev?.attempts ?? 0) + 1;
          const base = payload.scoring?.basePoints || selected.points || 100;
          const cap = Math.round(base * 0.6);
          const penalty = Math.min(cap, Math.round(base * 0.15 * attempts));
          return {
            current: base - penalty,
            base,
            penalty,
            attempts,
          };
        });
      } else if (payload.scoring) {
        setReward({
          current: payload.scoring.rewardIfAccepted,
          base: payload.scoring.basePoints,
          penalty: payload.scoring.penaltyPending,
          attempts: payload.scoring.wrongAttempts,
        });
      }
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="challenges">
      <header className="challenges-head">
        <div>
          <span className="kicker">
            <b>02</b> Desafios
          </span>
          <h1 className="page-title">Desafios</h1>
          <p className="page-sub">
            Escolha a linguagem, pegue um problema e resolva. Sem trilha, sem índice — só o
            que você quer resolver agora.
          </p>
        </div>
      </header>

      {/* Linguagem primeiro: o seletor vem antes da lista de problemas. */}
      <section className="lang-picker">
        <span className="kicker">
          <b>1</b> Linguagem
        </span>
        <div className="lang-row">
          {TRACK_LIST.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`lang-chip${item.id === trackId ? ' is-on' : ''}`}
              onClick={() => changeTrack(item.id)}
              title={EXECUTION_LABEL[item.execution]}
            >
              <span className="short">{item.short}</span>
              <span className="name">{item.label}</span>
            </button>
          ))}
        </div>
        <p className="lang-note">
          <strong>{track.label}</strong> — {EXECUTION_LABEL[track.execution]}.{' '}
          {track.note ?? track.tagline}
        </p>
      </section>

      <div className="challenge-layout">
        <section className="challenge-list">
          <div className="challenge-list-head">
            <span className="kicker">
              <b>2</b> Problema
            </span>
            <div className="difficulty-row">
              {['all', 'easy', 'medium', 'hard'].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`pill is-small${difficulty === value ? ' is-on' : ''}`}
                  onClick={() => changeDifficulty(value)}
                >
                  {value === 'all' ? 'Todos' : DIFFICULTY_LABEL[value]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="problem-list">
              {[1, 2, 3, 4].map((index) => (
                <div className="problem-row" key={index}>
                  <span className="skeleton" style={{ width: 30 }} />
                  <span className="main">
                    <span className="skeleton" style={{ width: `${40 + index * 6}%` }} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="problem-list">
              {problems.map((problem, index) => (
                <button
                  type="button"
                  key={problem.slug}
                  className={`problem-row${selected?.slug === problem.slug ? ' is-on' : ''}`}
                  onClick={() => pick(problem)}
                >
                  <span className="id">{String(index + 1).padStart(2, '0')}</span>
                  <span className="main">
                    <span className="name">{problem.title}</span>
                    <span className="tags">
                      <span className={`chip difficulty ${problem.difficulty}`}>
                        {DIFFICULTY_LABEL[problem.difficulty]}
                      </span>
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span className="chip" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="num">{problem.stats.solvers} resolveram</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="challenge-work" ref={workRef}>
          {selected ? (
            <>
              <div className="statement">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <span className="kicker" style={{ marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconEdit size={13} /> Enunciado
                  </span>
                  <RewardChip
                    reward={reward}
                    base={selected.points ?? 100}
                    solved={result?.verdict === 'accepted'}
                  />
                </div>
                <h3>{selected.title}</h3>
                <p>{selected.statement}</p>
              </div>

              <CodeSurface
                track={track}
                source={source}
                onSourceChange={setSource}
                stdin={stdin}
                onStdinChange={setStdin}
                showStdin={track.execution === 'judge'}
                result={result}
                error={error}
                busy={busy}
              />

              <div className="challenge-submit">
                {track.execution === 'pending' ? (
                  <p className="muted">
                    Este desafio roda no {track.label} fora da plataforma por enquanto.
                  </p>
                ) : track.execution === 'preview' ? (
                  <p className="muted">
                    O preview acima atualiza sozinho enquanto você digita — não há submissão para
                    esta linguagem.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submit}
                    disabled={busy}
                  >
                    {busy ? <span className="spinner" /> : null}
                    {busy ? 'executando' : 'Submeter solução'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="challenge-empty">
              <p>Escolha um problema na lista para começar.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RewardChip({ reward, base, solved }) {
  if (solved) {
    return (
      <span className="reward-chip" data-state="done">
        <span className="hud-label">desafio</span>
        <strong>resolvido</strong>
      </span>
    );
  }

  const current = reward?.current ?? base;
  const cut = Boolean(reward) && reward.penalty > 0;

  return (
    <span
      className="reward-chip"
      data-state={cut ? 'cut' : 'full'}
      title="Cada tentativa errada desconta deste valor"
    >
      <span className="hud-label">vale</span>
      <strong>{current}</strong>
      <span className="unit">pts</span>
      {cut ? <em>−{reward.penalty}</em> : null}
    </span>
  );
}
