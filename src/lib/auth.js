import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

const MESSAGES = {
  'auth/popup-closed-by-user': 'Você fechou a janela do Google antes de concluir.',
  'auth/popup-blocked': 'O navegador bloqueou o pop-up. Permita pop-ups e tente de novo.',
  'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail em outro método.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-password': 'Informe a senha.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
};

/** Turns Firebase error codes into something a Brazilian student can act on. */
export function authErrorMessage(error) {
  if (!error) return 'Não foi possível concluir.';
  return MESSAGES[error.code] ?? error.message ?? 'Não foi possível concluir.';
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail({ displayName, email, password }) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  return result.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  await signOut(auth);
}
