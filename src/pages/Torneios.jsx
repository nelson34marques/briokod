import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const ACTIONS = [
  { to: '/app/minhas-salas', title: 'Minhas Salas', text: 'Ver e gerenciar as salas que você criou.' },
  { to: '/app/criar-sala', title: 'Criar Sala', text: 'Montar um torneio com exercícios e duração.' },
  { to: '/app/entrar-sala', title: 'Entrar em Sala', text: 'Usar o código que o seu professor partilhou.' },
];

export default function Torneios() {
  const navigate = useNavigate();
  const [count, setCount] = useState(null);

  useEffect(() => {
    api
      .myRooms()
      .then((data) => setCount((data.items || []).length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="ranking-page">
      <header className="challenges-head">
        <div>
          <span className="kicker">
            <b>04</b> Torneios
          </span>
          <h1 className="page-title">Torneios</h1>
          <p className="page-sub">Crie salas, partilhe o código e veja o ranking ao vivo.</p>
        </div>
      </header>

      {count !== null ? (
        <p className="muted" style={{ marginBottom: 16 }}>
          Você tem {count} sala{count === 1 ? '' : 's'} criada{count === 1 ? '' : 's'}.
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: 12, maxWidth: 720, margin: '0 auto' }}>
        {ACTIONS.map((action) => (
          <button
            key={action.to}
            className="ranking-card"
            onClick={() => navigate(action.to)}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <div className="rank-info">
              <span className="rank-name">{action.title}</span>
              <span className="rank-meta">{action.text}</span>
            </div>
            <span className="rank-points" style={{ marginLeft: 'auto' }}>
              <span className="points-value">→</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
