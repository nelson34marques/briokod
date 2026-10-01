import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'php', label: 'PHP' },
  { id: 'csharp', label: 'C#' },
  { id: 'c', label: 'C' },
];

const DURATIONS = [
  { value: 2, label: '2 horas' },
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
  { value: 72, label: '72 horas' },
];

export default function CreateRoom() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('python');
  const [duration, setDuration] = useState(24);
  const [exercises, setExercises] = useState([{ problemId: '', points: 20, penalty: 5 }]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .problems({ limit: 100 })
      .then((data) => setProblems(data.items || []))
      .catch((err) => setError(err.message));
  }, []);

  function addExercise() {
    setExercises([...exercises, { problemId: '', points: 20, penalty: 5 }]);
  }

  function removeExercise(index) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExercise(index, field, value) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  // O select devolve texto: guardamos o slug (que a API usa) e o id numérico.
  function selectProblem(index, value) {
    const problem = problems.find((p) => String(p.id) === value);
    const updated = [...exercises];
    updated[index] = {
      ...updated[index],
      problemId: problem ? Number(problem.id) : '',
      problemSlug: problem ? problem.slug : '',
    };
    setExercises(updated);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validExercises = exercises.filter((e) => e.problemId && e.problemId !== 'undefined');
      if (validExercises.length === 0) {
        throw new Error('Adicione pelo menos um exercício');
      }

      const room = await api.createRoom({
        language,
        durationHours: duration,
        exercises: validExercises.map((e) => ({
          problemId: e.problemId,
          problemSlug: e.problemSlug,
          points: e.points,
          penalty: e.penalty,
        })),
      });

      navigate(`/app/sala/${room.id}`, { state: { secretCode: room.secretCode } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ranking-page">
      <header className="challenges-head">
        <div>
          <span className="kicker">
            <b>04</b> Torneios
          </span>
          <h1 className="page-title">Criar Sala</h1>
          <p className="page-sub">
            Monte um torneio com exercícios, defina o tempo e compartilhe o código com seus alunos.
          </p>
        </div>
      </header>

      {error ? <p className="alert is-error">{error}</p> : null}

      <form onSubmit={handleSubmit} className="dialog-form" style={{ maxWidth: 600, margin: '0 auto' }}>
        <label>
          Linguagem
          <select
            className="input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Duração
          <select
            className="input"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Exercícios</h3>
          {exercises.map((exercise, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 40px',
                gap: 8,
                marginBottom: 8,
                alignItems: 'end',
              }}
            >
              <label>
                Problema
                <select
                  className="input"
                  value={exercise.problemId}
                  onChange={(e) => selectProblem(index, e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {problems.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pontos
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={exercise.points}
                  onChange={(e) => updateExercise(index, 'points', Number(e.target.value))}
                />
              </label>
              <label>
                Penalidade
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={exercise.penalty}
                  onChange={(e) => updateExercise(index, 'penalty', Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => removeExercise(index)}
                style={{ padding: '8px' }}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={addExercise} style={{ marginTop: 8 }}>
            + Adicionar exercício
          </button>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 24 }}>
          {loading ? <span className="spinner" /> : null}
          Criar Sala
        </button>
      </form>
    </div>
  );
}
