import { useState } from 'react';
import { useAuth } from '../context/auth-context.js';
import {
  authErrorMessage,
  registerWithEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/auth.js';
import { IconCheck } from './Icons.jsx';

const TABS = [
  { id: 'signin', label: 'Entrar' },
  { id: 'signup', label: 'Criar conta' },
];

export default function AuthDialog({ open, onClose, onSuccess }) {
  const { displayName, email, signOut } = useAuth();
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function resetMessages() {
    setError(null);
    setNotice(null);
  }

  async function withBusy(action) {
    setBusy(true);
    resetMessages();
    try {
      await action();
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    withBusy(async () => {
      if (tab === 'signin') {
        await signInWithEmail(form.email, form.password);
      } else {
        await registerWithEmail({
          displayName: form.name,
          email: form.email,
          password: form.password,
        });
      }
      onClose();
      // Login e cadastro levam para o onboarding, nunca para a home.
      onSuccess?.();
    });
  }

  function google() {
    withBusy(async () => {
      await signInWithGoogle();
      onClose();
      onSuccess?.();
    });
  }

  function forgot() {
    if (!form.email) {
      setError('Informe seu e-mail para receber o link de redefinição.');
      return;
    }
    withBusy(async () => {
      await resetPassword(form.email);
      setNotice('Enviamos o link de redefinição para o seu e-mail.');
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dialog-close"
          aria-label="Fechar"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>

        {email ? (
          <div className="dialog-signed">
            <div className="dialog-brand">
              <span className="brand-icon">B</span>
              <div className="brand-text">
                <span className="brand-name">BrioKod</span>
                <span className="brand-tagline">Aprenda. Code. Evolua.</span>
              </div>
            </div>
            <span className="kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <IconCheck size={14} /> Conectado
            </span>
            <h2 id="dialog-title">Olá, {displayName}</h2>
            <p className="muted">{email}</p>
            <div className="dialog-actions">
              <a className="btn btn-primary" href="#praticar" onClick={onClose}>
                Continuar estudando
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => withBusy(signOut)}
                disabled={busy}
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="dialog-brand">
              <span className="brand-icon">B</span>
              <div className="brand-text">
                <span className="brand-name">BrioKod</span>
                <span className="brand-tagline">Aprenda. Code. Evolua.</span>
              </div>
            </div>
            <h2 id="dialog-title">
              {tab === 'signin' ? 'Entre na BrioKod' : 'Crie sua conta'}
            </h2>
            <p className="muted">
              {tab === 'signin'
                ? 'Seu progresso, submissões e pontos ficam salvos na sua conta.'
                : 'Leva menos de um minuto e o primeiro módulo é grátis.'}
            </p>

            <div className="tabs" role="tablist">
              {TABS.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={tab === item.id ? 'is-active' : ''}
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    resetMessages();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button type="button" className="btn btn-google" onClick={google} disabled={busy}>
              <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a6 6 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
                />
                <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.1L6.4 14Z" />
                <path
                  fill="#EA4335"
                  d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10A6 6 0 0 1 12 5.9Z"
                />
              </svg>
              Continuar com Google
            </button>

            <div className="divider">
              <span>ou com e-mail</span>
            </div>

            <form className="dialog-form" onSubmit={submit}>
              {tab === 'signup' ? (
                <label>
                  Nome
                  <input
                    className="input"
                    value={form.name}
                    onChange={update('name')}
                    autoComplete="name"
                    placeholder="Como quer ser chamado"
                    required
                  />
                </label>
              ) : null}

              <label>
                E-mail
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  required
                />
              </label>

              <label>
                Senha
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  placeholder={tab === 'signin' ? 'Sua senha' : 'Mínimo de 6 caracteres'}
                  minLength={tab === 'signup' ? 6 : undefined}
                  required
                />
              </label>

              {error ? <p className="alert is-error">{error}</p> : null}
              {notice ? <p className="alert is-ok">{notice}</p> : null}

              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {tab === 'signin' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            {tab === 'signin' ? (
              <button type="button" className="link-button" onClick={forgot} disabled={busy}>
                Esqueci minha senha
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
