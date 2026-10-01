import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

function statusInfo(room) {
  const expired = room.expiresAt && new Date(room.expiresAt) < new Date();
  if (expired) return { label: 'Expirada', color: 'var(--bad)' };
  if (room.status !== 'active') return { label: 'Encerrada', color: 'var(--muted)' };
  return { label: 'Ativa', color: 'var(--ok, #3ddc97)' };
}

export default function MyRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.myRooms();
      setRooms(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(room) {
    if (!confirm('Eliminar esta sala? Todos os participantes serão removidos.')) return;
    try {
      await api.deleteRoom(room.id);
      setRooms((current) => current.filter((r) => r.id !== room.id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="boot" />;

  return (
    <div className="ranking-page">
      <header className="challenges-head">
        <div>
          <span className="kicker">
            <b>04</b> Torneios
          </span>
          <h1 className="page-title">Minhas Salas</h1>
          <p className="page-sub">Gerencie as salas que você criou.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/app/criar-sala')}>
          Criar Nova Sala
        </button>
      </header>

      {error ? <p className="alert is-error">{error}</p> : null}

      {rooms.length === 0 ? (
        <p className="muted">Você ainda não criou nenhuma sala.</p>
      ) : (
        <div className="ranking-list" style={{ maxWidth: 720, margin: '0 auto' }}>
          {rooms.map((room) => {
            const info = statusInfo(room);
            return (
              <div key={room.id} className="ranking-card">
                <div className="rank-info">
                  <span className="rank-name">
                    Sala {room.secretCode} · {room.language}
                  </span>
                  <span className="rank-meta">
                    <b>Código: {room.secretCode}</b> · {room.exerciseCount} exercícios ·{' '}
                    <span style={{ color: info.color }}>{info.label}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate(`/app/sala/${room.id}`, { state: { secretCode: room.secretCode } })}
                  >
                    Abrir
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}
                    onClick={() => handleDelete(room)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
