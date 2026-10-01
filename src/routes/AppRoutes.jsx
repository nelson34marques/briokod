import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import Landing from '../pages/Landing.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';

// A home só precisa de firebase/auth. As telas do app puxam Firestore, então
// ficam em chunks separados: quem não entra na plataforma não baixa o SDK.
const Onboarding = lazy(() => import('../pages/Onboarding.jsx'));
const AppShell = lazy(() => import('../pages/AppShell.jsx'));
const Practice = lazy(() => import('../pages/Practice.jsx'));
const Challenges = lazy(() => import('../pages/Challenges.jsx'));
const Ranking = lazy(() => import('../pages/Ranking.jsx'));
const CreateRoom = lazy(() => import('../pages/CreateRoom.jsx'));
const JoinRoom = lazy(() => import('../pages/JoinRoom.jsx'));
const Room = lazy(() => import('../pages/Room.jsx'));
const MyRooms = lazy(() => import('../pages/MyRooms.jsx'));
const Torneios = lazy(() => import('../pages/Torneios.jsx'));

/** Exige sessão: sem usuário, volta para a home com o dialog de login aberto. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="boot" />;
  if (!user) return <Navigate to="/" replace state={{ openAuth: true, from: location.pathname }} />;
  return children;
}

function Boot() {
  return (
    <div className="boot">
      <span className="spinner" />
    </div>
  );
}


function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Boot />;
  if (user) return <Navigate to="/app/praticar" replace />;
  return <Landing />;
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Boot />}>
        <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/entrar" element={<Navigate to="/" replace state={{ openAuth: true }} />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/praticar" replace />} />
          <Route path="praticar" element={<Practice />} />
          <Route path="desafios" element={<Challenges />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="criar-sala" element={<CreateRoom />} />
          <Route path="entrar-sala" element={<JoinRoom />} />
          <Route path="sala/:roomId" element={<Room />} />
          <Route path="minhas-salas" element={<MyRooms />} />
          <Route path="torneios" element={<Torneios />} />
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
