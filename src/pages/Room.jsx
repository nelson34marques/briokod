import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { getRoom, subscribeToRoom, subscribeToLeaderboard } from '../lib/rooms.js';
import { CodeSurface } from '../components/CodeSurface.jsx';
import { getTrack } from '../lib/tracks.js';
import { api } from '../lib/api.js';

function formatTimeRemaining(expiresAt) {
  if (!expiresAt) return '—';
  const remaining = new Date(expiresAt) - new Date();
  if (remaining <= 0) return 'Encerrada';

  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/** O select devolve string e o Firestore devolve number: comparação por texto. */
function sameProblem(problem, exercise) {
  if (!problem) return false;
  if (exercise.problemSlug && problem.slug) return problem.slug === exercise.problemSlug;
  return String(problem.id) === String(exercise.problemId);
}

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [problems, setProblems] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secretCode] = useState(location.state?.secretCode);
  const [isOwner, setIsOwner] = useState(false);

  // Estado por exercício: código em edição e feedback. As tentativas e os
  // pontos vivem no servidor, por isso o cliente não os guarda.
  const [drafts, setDrafts] = useState({});
  const [feedback, setFeedback] = useState({});
  const [runs, setRuns] = useState({});
  const [busy, setBusy] = useState({});
  const [open, setOpen] = useState(null);
  const [solvedCount, setSolvedCount] = useState(null);

  useEffect(() => {
    if (!roomId || !user?.uid) return undefined;
    let active = true;
    let unsubscribeRoom;
    let unsubscribeLeaderboard;

    async function load() {
      try {
        const roomData = await getRoom(roomId);
        if (!active) return;
        if (!roomData) {
          setError('Sala não encontrada ou já foi eliminada.');
          setLoading(false);
          return;
        }
        setRoom(roomData);
        setIsOwner(roomData.ownerId === user.uid);
        setLoading(false);

        const problemsData = await api.problems({ limit: 100 });
        if (active) setProblems(problemsData.items || []);
      } catch (caught) {
        if (!active) return;
        setError(
          caught.code === 'permission-denied'
            ? 'Sem permissão para ler esta sala. As regras do Firestore precisam ser publicadas.'
            : caught.message,
        );
        setLoading(false);
      }
    }

    load();

    subscribeToRoom(roomId, (data) => active && setRoom(data))
      .then((unsub) => {
        unsubscribeRoom = unsub;
      })
      .catch(() => {});
    subscribeToLeaderboard(roomId, (data) => active && setLeaderboard(data))
      .then((unsub) => {
        unsubscribeLeaderboard = unsub;
      })
      .catch(() => {});

    return () => {
      active = false;
      unsubscribeRoom?.();
      unsubscribeLeaderboard?.();
    };
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (!room?.expiresAt) return undefined;
    const tick = () => setTimeRemaining(formatTimeRemaining(room.expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [room?.expiresAt]);

  const exercises = Array.isArray(room?.exercises) ? room.exercises : [];

  // O mesmo editor da tela de prática, montado a partir da linguagem da sala.
  const track = getTrack(room?.language);

  // Posição de quem está a ver, calculada a partir do ranking em tempo real.
  const myIndex = leaderboard.findIndex((participant) => participant.id === user?.uid);
  const myPosition = myIndex >= 0 ? myIndex + 1 : null;

  // Os exercícios que este aluno já entregou com sucesso. O servidor recusa
  // dar mais pontos por repetição, mas a interface mostra o estado para não
  // haver tentação nem dúvida.
  const mySolvedSlugs = new Set(leaderboard[myIndex]?.solvedSlugs ?? []);

  function isSolvedByMe(exercise) {
    const slug = resolveProblem(exercise)?.slug || exercise.problemSlug;
    return Boolean(slug) && mySolvedSlugs.has(slug);
  }

  const expired = room?.expiresAt ? new Date(room.expiresAt) < new Date() : false;

  function resolveProblem(exercise) {
    return problems.find((p) => sameProblem(p, exercise)) || null;
  }

  function toggleExercise(exercise) {
    // Um exercício já entregue fica fechado: repetir não dá mais pontos e
    // o servidor rejeitaria na mesma.
    if (isOwner || isSolvedByMe(exercise)) return;
    const key = String(exercise.problemId);
    setOpen((current) => (current === key ? null : key));
    setDrafts((current) => {
      if (current[key] !== undefined) return current;
      const problem = resolveProblem(exercise);
      const starter = problem?.starterCode?.[room.language] || '';
      return { ...current, [key]: starter };
    });
  }

  async function handleSubmitExercise(exercise) {
    const key = String(exercise.problemId);
    const problem = resolveProblem(exercise);
    if (!problem) {
      setFeedback((f) => ({ ...f, [key]: { tone: 'error', text: 'Exercício não encontrado na API.' } }));
      return;
    }

    const sourceCode = drafts[key];
    if (!sourceCode?.trim()) {
      setFeedback((f) => ({ ...f, [key]: { tone: 'error', text: 'Escreva o código antes de enviar.' } }));
      return;
    }

    setBusy((b) => ({ ...b, [key]: true }));
    setFeedback((f) => ({ ...f, [key]: null }));
    setRuns((r) => ({ ...r, [key]: null }));

    try {
      // Só o código vai. O servidor julga, aplica a penalidade e devolve os
      // pontos — o cliente nunca os calcula.
      const result = await api.roomSubmit(roomId, { problem: problem.slug, sourceCode });
      const score = result.score;

      // O console precisa da saída do juiz para o aluno ver onde falhou.
      setRuns((r) => ({
        ...r,
        [key]: {
          verdict: result.verdict,
          verdictLabel: result.verdictLabel,
          casesPassed: result.casesPassed,
          casesTotal: result.casesTotal,
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          timeMs: result.timeMs,
          memoryKb: result.memoryKb,
        },
      }));

      if (score.alreadySolved) {
        setFeedback((f) => ({ ...f, [key]: { tone: 'ok', text: 'Já tinha resolvido este exercício.' } }));
      } else if (score.accepted) {
        const penalty = score.penaltyApplied ? ` (-${score.penaltyApplied} de penalidade)` : '';
        setFeedback((f) => ({
          ...f,
          [key]: { tone: 'ok', text: `Aceito! +${score.pointsAwarded} pts${penalty}.` },
        }));
      } else {
        setFeedback((f) => ({
          ...f,
          [key]: {
            tone: 'error',
            text: `${result.verdictLabel || result.verdict} — ${result.casesPassed ?? 0}/${result.casesTotal ?? '?'} casos.`,
          },
        }));
      }

      setSolvedCount(score.solvedCount);
    } catch (caught) {
      setFeedback((f) => ({ ...f, [key]: { tone: 'error', text: caught.message } }));
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  async function handleDeleteRoom() {
    if (!confirm('Eliminar esta sala?')) return;
    try {
      await api.deleteRoom(roomId);
      navigate('/app/minhas-salas');
    } catch (caught) {
      setError(caught.message);
    }
  }

  if (loading) return <div className="boot" />;

  if (error && !room) {
    return (
      <div className="ranking-page">
        <p className="alert is-error">{error}</p>
        <button className="btn btn-outline" onClick={() => navigate('/app/minhas-salas')}>
          Voltar
        </button>
      </div>
    );
  }

  if (!room) return <div className="boot" />;

  return (
    <div className="ranking-page">
      <header className="challenges-head room-head">
        <div>
          <span className="kicker">
            <b>04</b> Torneio
          </span>
          <h1 className="page-title">Sala {room.secretCode || roomId.slice(0, 6)}</h1>
          <p className="page-sub">
            {room.language} · {exercises.length} exercícios
          </p>
        </div>
        <div className="my-standing">
          <span className="hud-label">tempo restante</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--accent-ink)' }}>{timeRemaining}</strong>
        </div>
        {/* Só aparece no telemóvel (escondido no desktop por CSS). Reaproveita
            a medal e as cores de pódio do ranking para ficar igual. */}
        <div className={`room-place${myPosition && myPosition <= 3 ? ` podium podium-${myPosition}` : ''}`}>
          <span className={myPosition && myPosition <= 3 ? 'medal' : 'position-number'}>
            {myPosition ?? '—'}
          </span>
        </div>
      </header>

      {secretCode && (
        <div className="alert is-ok" style={{ marginBottom: 16 }}>
          <strong>Código da sala:</strong> {secretCode}
          <br />
          <small>Compartilhe este código com seus alunos</small>
        </div>
      )}

      {error ? <p className="alert is-error">{error}</p> : null}
      {expired ? <p className="alert is-error">Esta sala expirou. Não é possível submeter soluções.</p> : null}

      {isOwner && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => navigate('/app/minhas-salas')}>
            Minhas Salas
          </button>
          <button
            className="btn btn-outline"
            style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}
            onClick={handleDeleteRoom}
          >
            Eliminar Sala
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          <h2 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Exercícios</h2>

          {exercises.length === 0 ? (
            <p className="muted">Esta sala ainda não tem exercícios.</p>
          ) : null}

          {exercises.map((exercise, index) => {
            const key = String(exercise.problemId);
            const problem = resolveProblem(exercise);
            // Quem criou a sala é quem organiza o torneio: vê os enunciados
            // para os preparar, mas não submete nada nem pontua.
            const solved = !isOwner && isSolvedByMe(exercise);
            const isOpen = !solved && open === key;
            const note = feedback[key];

            return (
              <div key={key} className="ranking-card room-exercise" style={{ marginBottom: 12, display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="rank-info">
                    <span className="rank-name">
                      {index + 1}. {problem?.title || `Problema #${exercise.problemId}`}
                    </span>
                    <span className="rank-meta">
                      {exercise.points} pts · -{exercise.penalty} por erro
                      {solvedCount !== null ? ` · ${solvedCount} resolvidos` : ''}
                      {solved ? ' · resolvido' : ''}
                    </span>
                  </div>
                  {!isOwner ? (
                    <button
                      className={`btn room-resolve${solved ? ' is-done' : ' btn-primary'}`}
                      style={{ marginLeft: 'auto' }}
                      onClick={() => toggleExercise(exercise)}
                      disabled={expired || solved}
                    >
                      {solved ? 'Resolvido' : isOpen ? 'Fechar' : 'Resolver'}
                    </button>
                  ) : null}
                </div>

                {isOwner ? (
                  <div style={{ marginTop: 12 }}>
                    {problem ? (
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.85 }}>
                        {problem.statement}
                      </p>
                    ) : null}
                    <p className="muted" style={{ marginTop: 8 }}>
                      Modo organizador: podes ver o enunciado, mas a submissão é dos participantes.
                    </p>
                  </div>
                ) : null}

                {isOpen ? (
                  <div style={{ marginTop: 12 }}>
                    {problem ? (
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.85 }}>
                        {problem.statement}
                      </p>
                    ) : null}

                    {track ? (
                      <CodeSurface
                        track={track}
                        source={drafts[key] ?? ''}
                        onSourceChange={(value) => setDrafts((d) => ({ ...d, [key]: value }))}
                        showStdin={false}
                        result={runs[key]}
                        error={note?.tone === 'error' ? note.text : null}
                        busy={Boolean(busy[key])}
                      />
                    ) : (
                      <textarea
                        className="input room-code"
                        rows={12}
                        spellCheck={false}
                        value={drafts[key] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSubmitExercise(exercise)}
                        disabled={busy[key] || expired}
                      >
                        {busy[key] ? <span className="spinner" /> : 'Submeter'}
                      </button>
                      {note && note.tone === 'ok' ? (
                        <span className="alert is-ok">{note.text}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Ranking</h2>
          {leaderboard.length === 0 ? (
            <p className="muted">Ainda ninguém entrou na sala.</p>
          ) : (
            <div className="ranking-list">
              {leaderboard.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`ranking-card${index < 3 ? ` podium podium-${index + 1}` : ''}`}
                >
                  <div className="rank-position">
                    {index < 3 ? (
                      <span className="medal">{index + 1}</span>
                    ) : (
                      <span className="position-number">{index + 1}</span>
                    )}
                  </div>
                  <div className="rank-info">
                    <span className="rank-name">
                      {participant.displayName || 'Participante'}
                      {participant.id === user?.uid ? ' (tu)' : ''}
                    </span>
                    <span className="rank-meta">{participant.solvedCount} resolvidos</span>
                  </div>
                  <div className="rank-points">
                    <span className="points-value">{participant.totalPoints}</span>
                    <span className="points-label">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
