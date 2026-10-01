import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { api } from '../lib/api.js';
import { loadLearningState } from '../lib/learning.js';
import { getTrack } from '../lib/tracks.js';
import { IconMap, IconTarget, IconTrophy } from '../components/Icons.jsx';
import TechCanvas from '../components/TechCanvas.jsx';

const NAV = [
  { to: '/app/praticar', label: 'Praticar', icon: <IconMap size={18} /> },
  { to: '/app/desafios', label: 'Desafios', icon: <IconTarget size={18} /> },
  { to: '/app/ranking', label: 'Ranking', icon: <IconTrophy size={18} /> },
  { to: '/app/torneios', label: 'Torneios', icon: <IconTrophy size={18} /> },
];

export default function AppShell() {
  const { user, displayName, photoURL, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // No telemóvel o header é curto e cada botão rouba espaço aos indicadores de
  // nível e pontos. Por isso "Minhas Salas" só aparece ali quando se está na
  // tela de Torneios — que é onde ele faz sentido. No PC fica sempre.
  const onTorneios = location.pathname === '/app/torneios';
  const [profile, setProfile] = useState(null);
  // O onboarding é o que decide se o aluno pode entrar: quem tem sessão mas não
  // respondeu as perguntas volta para ele, em vez de cair numa trilha qualquer.
  const [enrollment, setEnrollment] = useState({ status: 'loading', state: null });
  const [apiError, setApiError] = useState(null);

  // Pontos vêm da API, que é quem julga as submissões. A trilha vem do
  // Firestore, que é quem guarda a escolha de linguagem.
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { user: me } = await api.me();
      setProfile(me);
      setApiError(null);
    } catch (caught) {
      setApiError(caught.message);
    }
  }, [user]);

  useEffect(() => {
    // setProfile acontece depois do await de api.me(), não de forma síncrona.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadLearningState(user.uid)
      .then((loaded) => {
        if (active) setEnrollment({ status: 'ready', state: loaded });
      })
      .catch((caught) => {
        if (active) setEnrollment({ status: 'error', state: null, message: caught.message });
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function logout() {
    await signOut();
    navigate('/', { replace: true });
  }

  if (enrollment.status === 'loading') return <div className="boot" />;

  // Sessão sem onboarding: vai para as perguntas antes de qualquer trilha.
  if (enrollment.status === 'ready' && !enrollment.state?.trackId) {
    return <Navigate to="/onboarding" replace />;
  }

  const track = getTrack(enrollment.state?.trackId) ?? getTrack('python');
  const solved = profile?.solvedCount ?? 0;
  // O nível da esquerda vem da trilha escolhida; os pontos são o contador ao
  // lado. Misturar os dois daria um header que mente sobre onde o aluno está.
  const levelNumber = Math.max(
    1,
    track.levels.findIndex((level) => level.id === enrollment.state?.levelId) + 1,
  );
  const currentLevel = track.levels[levelNumber - 1];

  return (
    <div className="app-shell" style={{ '--track-color': track.color, '--track-color-soft': track.colorSoft }}>
      <TechCanvas />
      <header className="app-header">
        <div className="app-header-left">
          <NavLink className="brand" to="/app/praticar">
            <span className="brand-mark" aria-hidden="true">
              <img src="/brio-128.png" alt="" width="28" height="28" />
            </span>
            <span className="brand-name">BrioKod</span>
          </NavLink>
          <span className="app-header-track">
            <span className="short">{track.short}</span>
            <span className="track-name">{track.label}</span>
          </span>
        </div>

        <nav className="app-nav desktop-only">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'is-on' : '')}>
              <span className="icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-header-right">
          <NavLink
            to="/app/minhas-salas"
            className={({ isActive }) => `hud-btn${isActive ? ' is-on' : ''}${onTorneios ? '' : ' mobile-hide'}`}
          >
            Minhas Salas
          </NavLink>

          {apiError || enrollment.status === 'error' ? (
            <span className="hud-error">
              {apiError ??
                'Firestore indisponível — o progresso não está sendo salvo nesta sessão.'}
            </span>
          ) : null}

          <span className="hud" title={`Nível ${levelNumber} de ${track.levels.length}: ${currentLevel.title}`}>
            <span className="hud-label">nível</span>
            <strong>
              {String(levelNumber).padStart(2, '0')}
              <span className="of">/{String(track.levels.length).padStart(2, '0')}</span>
            </strong>
            <span className="hud-note">{currentLevel.title}</span>
          </span>

          <span className="hud" title="Pontos por problema resolvido">
            <span className="hud-label">pontos</span>
            <strong>{Number(profile?.points ?? 0).toLocaleString('pt-BR')}</strong>
            <span className="hud-note">{solved} resolvidos</span>
          </span>

          <button type="button" className="hud-user desktop-only" onClick={logout} title="Sair">
            {photoURL ? (
              <img className="avatar" src={photoURL} alt="" width="30" height="30" />
            ) : (
              <span className="avatar avatar-fallback" aria-hidden="true">
                {(displayName ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="name">{displayName}</span>
          </button>
        </div>
      </header>

      <div className="app-frame">
        <main className="app-main">
          <Outlet context={{ track, profile, enrollment, refresh }} />
        </main>
      </div>

      <nav className="mobile-tab-bar">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'is-on' : '')}>
            <span className="icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="mobile-tab-profile" onClick={logout} title="Sair">
          {photoURL ? (
            <img className="avatar" src={photoURL} alt="" width="22" height="22" />
          ) : (
            <span className="avatar avatar-fallback" aria-hidden="true">
              {(displayName ?? '?').charAt(0).toUpperCase()}
            </span>
          )}
          <span className="label">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
