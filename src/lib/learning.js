import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { getDb } from './firebase.js';

const PROFILE = 'profile';
const ENROLLMENT = 'enrollment';
const PROGRESS = 'progress';

/** Estado padrão antes de responder o onboarding. */
const EMPTY = {
  answers: null,
  trackId: null,
  levelId: null,
  startedAt: null,
  completedLevelIds: [],
};

export async function loadLearningState(uid) {
  if (!uid) return null;
  const db = await getDb();
  const base = doc(db, 'users', uid);
  const [profile, enrollment, progress] = await Promise.all([
    getDoc(doc(base, 'onboarding', PROFILE)),
    getDoc(doc(base, 'onboarding', ENROLLMENT)),
    getDoc(doc(base, PROGRESS, 'current')),
  ]);

  return {
    answers: profile.exists() ? profile.data() : null,
    trackId: enrollment.exists() ? enrollment.data().trackId : null,
    levelId: progress.exists() ? progress.data().levelId : null,
    completedLevelIds: progress.exists() ? (progress.data().completedLevelIds ?? []) : [],
  };
}

export async function saveOnboarding(uid, { answers, trackId }) {
  const db = await getDb();
  const base = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const batch = [];
  batch.push(setDoc(doc(base, 'onboarding', PROFILE), { ...answers, updatedAt: now }));
  batch.push(
    setDoc(doc(base, 'onboarding', ENROLLMENT), {
      trackId,
      startedAt: now,
      // Versionado junto com a trilha: se o catálogo mudar, o aluno não fica
      // preso num id de nível que não existe mais.
      catalog: 'v1',
    }),
  );
  batch.push(
    setDoc(doc(base, PROGRESS, 'current'), {
      ...EMPTY,
      trackId,
      levelId: null,
      startedAt: now,
    }),
  );

  await Promise.all(batch);
}

export async function saveLevelState(uid, { trackId, levelId, completedLevelIds }) {
  if (!uid) return;
  const db = await getDb();
  await setDoc(
    doc(db, 'users', uid, PROGRESS, 'current'),
    { trackId, levelId, completedLevelIds, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

/** Submissões gravadas pela API, para o histórico do aluno. */
export async function listSubmissions(uid, limit = 20) {
  if (!uid) return [];
  const db = await getDb();
  const snapshot = await getDocs(collection(db, 'users', uid, 'submissions'));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}
