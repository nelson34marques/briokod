import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { loadLearningState, saveOnboarding } from '../lib/learning.js';
import { TRACK_LIST, EXECUTION_LABEL } from '../lib/tracks.js';

const EXPERIENCE = [
  {
    id: 'zero',
    title: 'Nunca programei',
    text: 'Começamos pelo que é entrada, saída e variável. Sem pressa.',
  },
  {
    id: 'student',
    title: 'Estudo, mas nunca terminei',
    text: 'Você já viu a sintaxe. Vamos preencher os buracos com exercícios.',
  },
  {
    id: 'projects',
    title: 'Já fiz projetos',
    text: 'Você quer Algorithms e boas práticas, não tutorial de novo.',
  },
  {
    id: 'professional',
    title: 'Programo profissionalmente',
    text: 'Foco em complexidade, código limpo e revisão.',
  },
];

const GOALS = [
  { id: 'first-job', title: 'Conseguir o primeiro emprego', text: 'Foco em Interview e portfólio.' },
  { id: 'interview', title: 'Passar em uma entrevista', text: 'Foco em algoritmos e velocidade.' },
  { id: 'school', title: 'Passar na faculdade/prova', text: 'Foco na base e em exercícios.' },
  { id: 'build', title: 'Criar coisas minhas', text: 'Foco em prática guiada.' },
];

const WEEKLY_TIME = [
  { id: '5', title: 'Até 5 horas', text: 'Um nível por semana.' },
  { id: '10', title: '5 a 10 horas', text: 'Um nível a cada 3 dias.' },
  { id: '20', title: 'Mais de 10 horas', text: 'Ritmo acelerado.' },
];

const KNOWN = [
  { id: 'variables', label: 'Variáveis e tipos' },
  { id: 'conditionals', label: 'If/else' },
  { id: 'loops', label: 'Laços de repetição' },
  { id: 'functions', label: 'Funções' },
  { id: 'lists', label: 'Listas e vetores' },
  { id: 'objects', label: 'Objetos e classes' },
  { id: 'git', label: 'Git' },
  { id: 'nothing', label: 'Nada ainda' },
];

const STEPS = ['experiencia', 'objetivo', 'base', 'tempo', 'linguagem'];

export default function Onboarding() {
  const { user, loading, displayName } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    experience: null,
    goal: null,
    known: [],
    weeklyHours: null,
    trackId: null,
  });
  const [state, setState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!user) return undefined;

    loadLearningState(user.uid)
      .then((loaded) => {
        if (active) setState(loaded);
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const track = useMemo(
    () => TRACK_LIST.find((item) => item.id === answers.trackId) ?? null,
    [answers.trackId],
  );

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  // Já respondeu: vai direto para a prática, sem repetir as perguntas.
  if (state?.trackId && state?.answers) return <Navigate to="/app/praticar" replace />;

  function answer(patch) {
    setAnswers((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function toggleKnown(id) {
    setAnswers((current) => {
      const known = current.known.includes(id)
        ? current.known.filter((item) => item !== id)
        : [...current.known.filter((item) => item !== 'nothing'), id];
      return { ...current, known: known.length ? known : ['nothing'] };
    });
  }

  function canContinue() {
    const key = STEPS[step];
    if (key === 'experiencia') return Boolean(answers.experience);
    if (key === 'objetivo') return Boolean(answers.goal);
    if (key === 'base') return answers.known.length > 0;
    if (key === 'tempo') return Boolean(answers.weeklyHours);
    if (key === 'linguagem') return Boolean(answers.trackId);
    return true;
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await saveOnboarding(user.uid, { answers, trackId: answers.trackId });
      setState({ answers, trackId: answers.trackId, levelId: null, completedLevelIds: [] });
    } catch (caught) {
      setError(
        caught.code === 'permission-denied'
          ? 'As regras do Firestore bloquearam a escrita. Publique as rules antes de testar.'
          : caught.message,
      );
      setSaving(false);
    }
  }

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="onboarding">
      <div className="onboarding-head">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          BrioKod
        </span>
        <span className="onboarding-progress">
          <span className="label">
            passo {step + 1} de {STEPS.length}
          </span>
          <span className="bar">
            <span style={{ width: `${progress}%` }} />
          </span>
        </span>
      </div>

      <div className="onboarding-body">
        <p className="onboarding-hello">
          Boas-vindas, <strong>{displayName}</strong>. Três perguntas rápidas para montarmos
          sua trilha do seu jeito.
        </p>

        {current === 'experiencia' ? (
          <Step title="Você já programa?" hint="Sem resposta certa — isso define o ponto de partida.">
            <div className="choice-grid">
              {EXPERIENCE.map((item) => (
                <Choice
                  key={item.id}
                  active={answers.experience === item.id}
                  onClick={() => answer({ experience: item.id })}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </Step>
        ) : null}

        {current === 'objetivo' ? (
          <Step title="O que você quer alcançar?" hint="Muda o que aparece primeiro em Praticar.">
            <div className="choice-grid">
              {GOALS.map((item) => (
                <Choice
                  key={item.id}
                  active={answers.goal === item.id}
                  onClick={() => answer({ goal: item.id })}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </Step>
        ) : null}

        {current === 'base' ? (
          <Step title="O que você já domina?" hint="Pode marcar várias. Vamos pular o que você já sabe.">
            <div className="pill-grid">
              {KNOWN.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`pill${answers.known.includes(item.id) ? ' is-on' : ''}`}
                  onClick={() => toggleKnown(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </Step>
        ) : null}

        {current === 'tempo' ? (
          <Step title="Quanto tempo você dedica por semana?" hint="Serve para estimar quando você chega ao próximo nível.">
            <div className="choice-grid is-row">
              {WEEKLY_TIME.map((item) => (
                <Choice
                  key={item.id}
                  active={answers.weeklyHours === item.id}
                  onClick={() => answer({ weeklyHours: item.id })}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          </Step>
        ) : null}

        {current === 'linguagem' ? (
          <Step title="Qual linguagem você quer aprender?" hint="Você pode trocar depois, sem perder seus pontos.">
            <div className="track-grid">
              {TRACK_LIST.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`track-card${answers.trackId === item.id ? ' is-on' : ''}`}
                  onClick={() => answer({ trackId: item.id })}
                >
                  <span className="short">{item.short}</span>
                  <span className="body">
                    <span className="name">{item.label}</span>
                    <span className="tagline">{item.tagline}</span>
                    <span className={`run-tag is-${item.execution}`}>
                      {EXECUTION_LABEL[item.execution]}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {track?.note ? <p className="alert">{track.note}</p> : null}
          </Step>
        ) : null}

        {error ? <p className="alert is-error">{error}</p> : null}

        <div className="onboarding-actions">
          <button
            type="button"
            className="btn btn-quiet"
            disabled={step === 0}
            onClick={() => setStep((value) => value - 1)}
          >
            Voltar
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue()}
              onClick={() => setStep((value) => value + 1)}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue() || saving}
              onClick={finish}
            >
              {saving ? <span className="spinner" /> : null}
              {saving ? 'montando sua trilha' : 'Abrir a plataforma'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, hint, children }) {
  return (
    <section className="onboarding-step">
      <h1>{title}</h1>
      <p className="hint">{hint}</p>
      {children}
    </section>
  );
}

function Choice({ active, onClick, title, text }) {
  return (
    <button type="button" className={`choice${active ? ' is-on' : ''}`} onClick={onClick}>
      <span className="name">{title}</span>
      <span className="text">{text}</span>
    </button>
  );
}
