import { Component } from 'react';

/**
 * Sem isto, um erro de render desmonta a árvore toda e o utilizador fica com um
 * ecrã preto — sem header, sem navegação e sem forma de saber o que aconteceu.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="ranking-page">
        <header className="challenges-head">
          <div>
            <span className="kicker">
              <b>erro</b>
            </span>
            <h1 className="page-title">Algo correu mal</h1>
            <p className="page-sub">A página não conseguiu ser desenhada.</p>
          </div>
        </header>

        <p className="alert is-error">{String(error.message || error)}</p>

        <pre
          style={{
            marginTop: 16,
            padding: 12,
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 10,
            opacity: 0.8,
          }}
        >
          {String(error.stack || '').split('\n').slice(0, 6).join('\n')}
        </pre>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
          <a className="btn btn-outline" href="/app/praticar">
            Ir para Praticar
          </a>
        </div>
      </div>
    );
  }
}
