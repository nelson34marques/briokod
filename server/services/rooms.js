import { randomInt } from 'node:crypto';
import { adminDb, isFirestoreAdminReady } from '../lib/firestore-admin.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors.js';
import { getProblemBySlug } from './problems.js';
import { logger } from '../lib/logger.js';

const ROOMS = 'rooms';
const PARTICIPANTS = 'participants';
const SUBMISSIONS = 'submissions';

// Sem I, O, 0 e 1: o código é lido em voz alta e copiado à mão.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function requireAdmin() {
  if (!isFirestoreAdminReady()) {
    throw new ValidationError(
      'Salas indisponíveis: configure FIREBASE_ADMIN_CREDENTIALS no servidor.',
    );
  }
  return adminDb();
}

function roomRef(db, roomId) {
  return db.collection(ROOMS).doc(roomId);
}

function participantRef(db, roomId, uid) {
  return db.collection(ROOMS).doc(roomId).collection(PARTICIPANTS).doc(uid);
}

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length));
  }
  return code;
}

export async function getRoomForScoring(roomId) {
  const db = requireAdmin();
  const snap = await roomRef(db, roomId).get();
  if (!snap.exists) throw new NotFoundError('Sala não encontrada');
  return { id: snap.id, ...snap.data() };
}

function roomIsOpen(room) {
  if (room.status && room.status !== 'active') return false;
  if (!room.expiresAt) return true;
  return new Date(room.expiresAt).getTime() > Date.now();
}

/**
 * O exercício é procurado pelo slug guardado na sala. O cliente manda o slug
 * porque é o identificador que a API conhece — o id numérico nunca chega aqui.
 */
function findExercise(room, slug) {
  const exercises = Array.isArray(room.exercises) ? room.exercises : [];
  return exercises.find((exercise) => exercise.problemSlug === slug) ?? null;
}

/**
 * Cria a sala. O código é gerado aqui e não no browser: um cliente não escolhe
 * o código da própria sala, e o slug de cada exercício é conferido contra a
 * base de problemas para que ninguém invente um exercício inexistente.
 */
export async function createRoom({ ownerId, displayName, language, durationHours, exercises }) {
  const db = requireAdmin();

  const normalised = exercises.map((exercise) => {
    const problem = getProblemBySlug(exercise.problemSlug);
    return {
      problemId: problem.id,
      problemSlug: problem.slug,
      points: exercise.points,
      penalty: exercise.penalty,
    };
  });

  const seen = new Set();
  for (const exercise of normalised) {
    if (seen.has(exercise.problemSlug)) {
      throw new ValidationError(`O exercício "${exercise.problemSlug}" está repetido na sala`);
    }
    seen.add(exercise.problemSlug);
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1000);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const secretCode = randomCode();
    const ref = db.collection(ROOMS).doc();
    await ref.set({
      ownerId,
      ownerName: displayName ?? null,
      language,
      exercises: normalised,
      durationHours,
      secretCode,
      createdAt,
      expiresAt: expiresAt.toISOString(),
      status: 'active',
    });

    logger.info('room created', {
      roomId: ref.id,
      ownerId,
      exercises: normalised.length,
      expiresAt: expiresAt.toISOString(),
    });

    return { id: ref.id, secretCode, expiresAt: expiresAt.toISOString() };
  }

  throw new ValidationError('Não foi possível gerar um código livre. Tente outra vez.');
}

/** Salas criadas por este utilizador, mais recentes primeiro. */
export async function listRoomsByOwner(ownerId) {
  const db = requireAdmin();
  const snapshot = await db
    .collection(ROOMS)
    .where('ownerId', '==', ownerId)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
}

/**
 * Entra numa sala pelo código. Criar a participação é uma escrita idempotente:
 * voltar a entrar não volta a zerar a pontuação.
 */
export async function joinRoomByCode({ code, uid, displayName }) {
  const db = requireAdmin();
  // O código é copiado à mão e colado em minúsculas mais vezes do que em
  // maiúsculas; normalizar aqui evita depender de quem chamou.
  const normalized = String(code ?? '').trim().toUpperCase();

  const snapshot = await db
    .collection(ROOMS)
    .where('secretCode', '==', normalized)
    .limit(1)
    .get();

  if (snapshot.empty) throw new NotFoundError('Código inválido');

  const roomDoc = snapshot.docs[0];
  const room = roomDoc.data();

  if (!roomIsOpen(room)) {
    throw new ForbiddenError(
      room.status && room.status !== 'active' ? 'Esta sala já foi encerrada' : 'Esta sala expirou',
    );
  }

  const ref = participantRef(db, roomDoc.id, uid);
  const existing = await ref.get();
  if (!existing.exists) {
    await ref.set({
      userId: uid,
      displayName: displayName ?? null,
      totalPoints: 0,
      solvedCount: 0,
      joinedAt: new Date(),
    });
  }

  logger.info('room joined', { roomId: roomDoc.id, uid });

  return { id: roomDoc.id, secretCode: room.secretCode };
}

/**
 * Elimina a sala e as suas subcoleções. Apagar o documento pai não apaga os
 * filhos no Firestore, por isso os participantes e submissões são removidos
 * explicitamente — senão ficavam órfãos e a eliminar custa dinheiro.
 */
export async function deleteRoom({ roomId, ownerId }) {
  const db = requireAdmin();

  const snap = await roomRef(db, roomId).get();
  if (!snap.exists) throw new NotFoundError('Sala não encontrada');
  if (snap.data().ownerId !== ownerId) throw new ForbiddenError('Só o dono pode eliminar a sala');

  const room = roomRef(db, roomId);
  const batch = db.batch();
  batch.delete(room);

  for (const name of [PARTICIPANTS, SUBMISSIONS]) {
    const children = await room.collection(name).get();
    for (const doc of children.docs) batch.delete(doc.ref);
  }

  await batch.commit();

  logger.info('room deleted', { roomId, ownerId });
}

/**
 * Calcula e grava o resultado de uma submissão de sala.
 *
 * Tudo o que decide pontos acontece dentro de uma transação: tentativas
 * anteriores, se já estava resolvido e o total. O cliente nunca diz quanto
 * valeu — só manda o código, e o servidor julga e paga.
 */
export async function recordRoomSubmission({ roomId, uid, slug, outcome }) {
  const db = requireAdmin();

  const roomSnap = await roomRef(db, roomId).get();
  if (!roomSnap.exists) throw new NotFoundError('Sala não encontrada');
  const room = { id: roomSnap.id, ...roomSnap.data() };

  if (!roomIsOpen(room)) {
    throw new ForbiddenError('Esta sala já terminou');
  }

  const exercise = findExercise(room, slug);
  if (!exercise) {
    throw new ValidationError('Este exercício não faz parte da sala');
  }

  const accepted = outcome.verdict === 'accepted';
  const base = Number(exercise.points) || 0;
  const penaltyPerError = Number(exercise.penalty) || 0;

  const pRef = participantRef(db, roomId, uid);
  const submissionRef = db.collection(ROOMS).doc(roomId).collection(SUBMISSIONS).doc();

  const result = await db.runTransaction(async (tx) => {
    const pSnap = await tx.get(pRef);
    if (!pSnap.exists) {
      throw new ForbiddenError('Entre na sala antes de submeter');
    }

    const participant = pSnap.data() ?? {};
    const attempts = Number.isInteger(participant.attempts) ? participant.attempts : 0;
    const solvedSlugs = new Set(Array.isArray(participant.solvedSlugs) ? participant.solvedSlugs : []);
    const alreadySolved = solvedSlugs.has(slug);

    // Repetir um exercício já aceito não paga duas vezes.
    if (alreadySolved) {
      tx.set(submissionRef, {
        userId: uid,
        exerciseId: slug,
        points: 0,
        penalty: 0,
        createdAt: new Date(),
      });
      return {
        accepted: true,
        alreadySolved: true,
        pointsAwarded: 0,
        penaltyApplied: 0,
        wrongAttempts: attempts,
        totalPoints: Number(participant.totalPoints) || 0,
        solvedCount: Array.isArray(participant.solvedSlugs) ? participant.solvedSlugs.length : 0,
      };
    }

    if (!accepted) {
      const nextAttempts = attempts + 1;
      tx.update(pRef, { attempts: nextAttempts });
      tx.set(submissionRef, {
        userId: uid,
        exerciseId: slug,
        points: 0,
        penalty: penaltyPerError,
        createdAt: new Date(),
      });
      return {
        accepted: false,
        alreadySolved: false,
        pointsAwarded: 0,
        penaltyApplied: penaltyPerError,
        wrongAttempts: nextAttempts,
        totalPoints: Number(participant.totalPoints) || 0,
        solvedCount: Array.isArray(participant.solvedSlugs) ? participant.solvedSlugs.length : 0,
      };
    }

    const penaltyApplied = attempts * penaltyPerError;
    const pointsAwarded = Math.max(0, base - penaltyApplied);
    const totalPoints = (Number(participant.totalPoints) || 0) + pointsAwarded;
    const nextSolved = [...solvedSlugs, slug];

    tx.update(pRef, {
      totalPoints,
      solvedCount: nextSolved.length,
      solvedSlugs: nextSolved,
      attempts,
    });
    tx.set(submissionRef, {
      userId: uid,
      exerciseId: slug,
      points: pointsAwarded,
      penalty: penaltyApplied,
      createdAt: new Date(),
    });

    return {
      accepted: true,
      alreadySolved: false,
      pointsAwarded,
      penaltyApplied,
      wrongAttempts: attempts,
      totalPoints,
      solvedCount: nextSolved.length,
    };
  });

  logger.info('room submission scored', {
    roomId,
    uid,
    slug,
    accepted: result.accepted,
    pointsAwarded: result.pointsAwarded,
  });

  return result;
}
