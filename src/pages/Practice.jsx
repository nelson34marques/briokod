import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';
import { loadLearningState, saveLevelState } from '../lib/learning.js';
import { useAuth } from '../context/auth-context.js';
import { LevelTrack } from '../components/LevelTrack.jsx';
import { LevelRoadmap } from '../components/LevelRoadmap.jsx';
import { CodeSurface } from '../components/CodeSurface.jsx';
import { IconMap, IconCode, IconArrowRight, IconArrowLeft, IconEdit } from '../components/Icons.jsx';

export default function Practice() {
  const { track, refresh } = useOutletContext();
  const { user } = useAuth();

  const [levelId, setLevelId] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'workspace'
  // O enunciado é guardado junto com o nível de origem, para não aparecer o
  // problema antigo quando o aluno troca de nível.
  const [loaded, setLoaded] = useState({ levelId: null, problem: null });
  // `edited` é sobrescrito só quando o aluno troca de nível; enquanto isso o
  // editor sempre nasce do enunciado, sem estado duplicado.
  const [edited, setEdited] = useState(null);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  // O prêmio cai a cada erro; mostrar isso antes de enviar é o que torna a
  // regra justa em vez de surpresa.
  const [reward, setReward] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadLearningState(user?.uid)
      .then((state) => {
        if (!active || !state) return;
        setCompleted(state.completedLevelIds ?? []);
        if (state.levelId) setLevelId(state.levelId);
      })
      .catch(() => {
        // Segue com o progresso local se o Firestore não responder.
      });
    return () => {
      active = false;
    };
  }, [user, track]);

  // Sem nível gravado, cai no primeiro ainda não concluído.
  const resolvedLevelId =
    levelId ?? track.levels.find((level) => !completed.includes(level.id))?.id ?? track.levels[0].id;

  const level = useMemo(
    () => track.levels.find((item) => item.id === resolvedLevelId) ?? track.levels[0],
    [track, resolvedLevelId],
  );

  const problem = loaded.levelId === level.id ? loaded.problem : null;

  useEffect(() => {
    if (!level.problemSlug) return;
    let active = true;
    api
      .problem(level.problemSlug)
      .then((payload) => {
        if (active) setLoaded({ levelId: level.id, problem: payload });
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      });
    return () => {
      active = false;
    };
  }, [level, track]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const source = edited ?? problem?.starterCode?.[track.id] ?? level.starter;

  function selectLevel(next) {
    setLevelId(next.id);
    setEdited(null);
    setStdin('');
    setResult(null);
    setReward(null);
    setError(null);
    setViewMode('workspace');
  }

  async function run() {
    // Portugol ainda não tem runner: escrever e executar localmente é o fluxo.
    if (track.execution === 'pending') return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const payload = await api.execute(
        {
          mode: problem ? 'judge' : 'run',
          language: track.id,
          sourceCode: source,
          stdin: problem ? '' : stdin,
          ...(problem ? { problem: problem.slug } : {}),
        },
        controller.signal,
      );
      setResult(payload);
      if (payload.scoring && payload.scoring.wrongAttempts > 0) {
        setReward({
          current: payload.scoring.rewardIfAccepted,
          base: payload.scoring.basePoints,
          penalty: payload.scoring.penaltyPending,
          attempts: payload.scoring.wrongAttempts,
        });
      } else if (problem && payload.verdict && payload.verdict !== 'accepted') {
        setReward((prev) => {
          const attempts = (prev?.attempts ?? 0) + 1;
          const base = payload.scoring?.basePoints || problem.points || 100;
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

      if (payload.verdict === 'accepted' && !completed.includes(level.id)) {
        const next = [...completed, level.id];
        setCompleted(next);
        await saveLevelState(user?.uid, {
          trackId: track.id,
          levelId: level.id,
          completedLevelIds: next,
        });
        refresh();
      }
    } catch (caught) {
      if (caught.name !== 'AbortError') setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="practice"
      style={{
        '--track-color': track.color,
        '--track-color-soft': track.colorSoft,
      }}
    >
      <aside className="practice-aside">
        <span className="kicker">
          <b>01</b> Praticar
        </span>
        <h1 className="page-title">{track.label}</h1>
        <p className="page-sub">{track.tagline}</p>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={`pill is-small${viewMode === 'roadmap' ? ' is-on' : ''}`}
            onClick={() => setViewMode('roadmap')}
            title="Estrada / Mapa"
            aria-label="Estrada / Mapa"
          >
            <IconMap size={16} />
          </button>
          <button
            type="button"
            className={`pill is-small${viewMode === 'workspace' ? ' is-on' : ''}`}
            onClick={() => setViewMode('workspace')}
            title="Editor & Código"
            aria-label="Editor & Código"
          >
            <IconCode size={16} />
          </button>
        </div>

        <LevelTrack
          track={track}
          currentLevelId={level.id}
          completedLevelIds={completed}
          onSelect={selectLevel}
        />
      </aside>

      <section className="practice-main">
        {viewMode === 'roadmap' ? (
          <div className="roadmap-view-container">
            <div className="roadmap-view-header">
              <div>
                <span className="kicker">
                  <b>Trilha</b> Caminho de Aprendizado
                </span>
                <h2>Sua Jornada em {track.label}</h2>
                <p>
                  Resolva cada exercício para desbloquear o próximo nó da estrada.
                  Complete os módulos para subir de nível!
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewMode('workspace')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Continuar Exercício Atual <IconArrowRight size={14} />
              </button>
            </div>

            <LevelRoadmap
              track={track}
              currentLevelId={level.id}
              completedLevelIds={completed}
              onSelectLevel={selectLevel}
            />
          </div>
        ) : (
          <>
            <div className="practice-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm back-to-map-btn"
                    onClick={() => setViewMode('roadmap')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <IconArrowLeft size={14} /> Voltar à Estrada
                  </button>
                  <span className="kicker" style={{ margin: 0 }}>
                    <b>{String(track.levels.indexOf(level) + 1).padStart(2, '0')}</b> {level.moduleTitle || 'Nível'}
                  </span>
                </div>
                <h2 style={{ marginTop: 8 }}>{level.title}</h2>
                <div className="concept-row">
                  {level.concepts.map((concept) => (
                    <span className="chip" key={concept}>
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

                <div className="practice-head-actions">
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    onClick={() => setEdited(null)}
                    disabled={busy}
                  >
                    Restaurar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={run}
                    disabled={busy || track.execution === 'pending'}
                  >
                    {busy ? <span className="spinner" /> : null}
                    {busy ? 'executando' : track.execution === 'pending' ? 'runner pendente' : problem ? 'Submeter' : 'Executar'}
                  </button>
                </div>
              </div>

            {problem ? (
              <div className="statement">
                <span className="kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconEdit size={13} /> Enunciado
                </span>
                <p>{problem.statement}</p>
                <div className="concept-row">
                  {problem.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <CodeSurface
              track={track}
              source={source}
              onSourceChange={setEdited}
              stdin={stdin}
              onStdinChange={setStdin}
              showStdin={!problem}
              result={result}
              error={error}
              busy={busy}
            />
          </>
        )}
      </section>
    </div>
  );
}

/**
 * Prêmio do nível. Antes da primeira tentativa mostra o valor cheio; depois,
 * o valor já com o desconto das erradas, marcado como perda.
 */
function RewardChip({ reward, base, solved }) {
  if (solved) {
    return (
      <span className="reward-chip" data-state="done">
        <span className="hud-label">nível</span>
        <strong>concluído</strong>
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
