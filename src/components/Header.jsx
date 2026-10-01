import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';

const links = [
  { href: '#trilha', label: 'Trilha' },
  { href: '#linguagens', label: 'Linguagens' },
  { href: '#desafios', label: 'Desafios' },
  { href: '#ranking', label: 'Ranking' },
];

function Header({ onOpenAuth }) {
  const { isAuthenticated, displayName, photoURL } = useAuth();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header${stuck ? ' is-stuck' : ''}`}>
      <div className="container header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          BrioKod
        </Link>

        <nav className={`site-nav${open ? ' is-open' : ''}`} id="nav-principal">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <Link className="btn btn-quiet btn-sm" to="/app/praticar">
              {photoURL ? (
                <img className="avatar" src={photoURL} alt="" width="22" height="22" />
              ) : (
                <span className="avatar avatar-fallback" aria-hidden="true">
                  {(displayName ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
              {displayName}
            </Link>
          ) : (
            <button type="button" className="btn btn-quiet btn-sm" onClick={onOpenAuth}>
              Entrar
            </button>
          )}
          {!isAuthenticated && (
            <Link className="btn btn-primary btn-sm" to="/entrar">
              Começar
            </Link>
          )}
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="nav-principal"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
