import { auth } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL ?? '';

class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Firebase Auth owns identity, so every call carries its ID token. The API
 * verifies the signature against Google's JWKS and maps `uid` to a local row.
 */
function idToken() {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

async function request(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';

  if (auth) {
    const token = await idToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError('Não foi possível falar com a API. Ela está rodando em http://localhost:3000 ?', {
      code: 'network_error',
    });
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? `Erro ${response.status}`, {
      status: response.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
    });
  }
  return payload;
}

export const api = {
  health: () => request('/api/health', { auth: false }),
  executors: () => request('/api/executors', { auth: false }),
  problems: (params = {}) => {
    const query = new URLSearchParams({ limit: '20', ...params });
    return request(`/api/problems?${query}`, { auth: false });
  },
  problem: (slug) => request(`/api/problems/${slug}`, { auth: false }),
  leaderboard: (limit = 10) => request(`/api/users/leaderboard?limit=${limit}`, { auth: false }),
  me: () => request('/api/users/me'),
  execute: (payload, signal) =>
    request('/api/execute', { method: 'POST', body: payload, signal }),

  /**
   * Submissão de sala. O corpo é só o código: a linguagem vem da sala e os
   * pontos são calculados pelo servidor, que é quem julga a execução.
   */
  roomSubmit: (roomId, payload, signal) =>
    request(`/api/rooms/${roomId}/submissions`, { method: 'POST', body: payload, signal }),

  // Salas: criar, entrar, listar e eliminar são do servidor. O browser nunca
  // escreve no Firestore, por isso não depende das regras para funcionar.
  myRooms: () => request('/api/rooms'),
  createRoom: (payload) => request('/api/rooms', { method: 'POST', body: payload }),
  joinRoom: (code) => request('/api/rooms/join', { method: 'POST', body: { code } }),
  deleteRoom: (roomId) => request(`/api/rooms/${roomId}`, { method: 'DELETE' }),
};

export { ApiError };
