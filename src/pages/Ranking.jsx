import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Ranking() {
  const { profile } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .leaderboard(25)
      .then((payload) => {
        if (active) setRows(payload.items);
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
  }, []);

  const myPosition = rows.findIndex((row) => row.id === profile?.id);

  return (
    <div className="ranking-page">
      <header className="challenges-head">
        <div>
          <span className="kicker">
            <b>03</b> Ranking
          </span>
          <h1 className="page-title">Ranking</h1>
          <p className="page-sub">
            Submissões aceitas pela API, ordenadas por pontos. Sem número digitado à mão.
          </p>
        </div>

        {profile ? (
          <div className="my-standing">
            <span className="hud-label">você</span>
            <strong>{Number(profile.points).toLocaleString('pt-BR')}</strong>
            <span className="hud-note">
              {myPosition >= 0 ? `${myPosition + 1}º lugar` : 'fora do top 25'} · {profile.solvedCount}{' '}
              resolvidos
            </span>
          </div>
        ) : null}
      </header>

      {error ? <p className="alert is-error">{error}</p> : null}

      {loading ? (
        <div className="ranking-list">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="ranking-card skeleton-card">
              <span className="skeleton" style={{ width: 40, height: 40 }} />
              <span className="skeleton" style={{ width: '60%', height: 16 }} />
              <span className="skeleton" style={{ width: 80, height: 24 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="ranking-list">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`ranking-card${index < 3 ? ` podium podium-${index + 1}` : ''}${row.id === profile?.id ? ' is-me' : ''}`}
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
                  {row.displayName}
                  {row.id === profile?.id ? <span className="you-badge">você</span> : null}
                </span>
                <span className="rank-meta">
                  {row.provider ?? '—'} · {row.solvedCount} resolvidos
                </span>
              </div>
              <div className="rank-points">
                <span className="points-value">{Number(row.points).toLocaleString('pt-BR')}</span>
                <span className="points-label">pts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
