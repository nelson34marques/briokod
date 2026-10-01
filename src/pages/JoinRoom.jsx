import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const room = await api.joinRoom(code);
      navigate(`/app/sala/${room.id}`);
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
          <h1 className="page-title">Entrar em Sala</h1>
          <p className="page-sub">
            Digite o código secreto compartilhado pelo professor para entrar no torneio.
          </p>
        </div>
      </header>

      {error ? <p className="alert is-error">{error}</p> : null}

      <form onSubmit={handleSubmit} className="dialog-form" style={{ maxWidth: 400, margin: '0 auto' }}>
        <label>
          Código da Sala
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '1.2rem', textAlign: 'center' }}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading || code.length < 6}>
          {loading ? <span className="spinner" /> : null}
          Entrar na Sala
        </button>
      </form>
    </div>
  );
}
