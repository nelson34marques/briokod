import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { executeLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errors.js';
import { getProblemBySlug } from '../../services/problems.js';
import { handleSubmission } from '../../services/runner.js';
import {
  getRoomForScoring,
  recordRoomSubmission,
  createRoom,
  listRoomsByOwner,
  joinRoomByCode,
  deleteRoom,
} from '../../services/rooms.js';
import { logger } from '../../lib/logger.js';

const router = Router();

/** GET /api/rooms — salas criadas por quem está com sessão. */
router.get(
  '/rooms',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rooms = await listRoomsByOwner(req.user.uid);
    res.json({
      items: rooms.map((room) => ({
        id: room.id,
        secretCode: room.secretCode,
        language: room.language,
        status: room.status ?? 'active',
        expiresAt: room.expiresAt ?? null,
        createdAt: room.createdAt ?? null,
        exerciseCount: Array.isArray(room.exercises) ? room.exercises.length : 0,
      })),
    });
  }),
);

/**
 * POST /api/rooms — cria a sala. O código é gerado pelo servidor; o cliente
 * recebe-o e passa a partilhá-lo com os alunos.
 */
router.post(
  '/rooms',
  requireAuth,
  validate(schemas.createRoom, 'body'),
  asyncHandler(async (req, res) => {
    const { language, durationHours, exercises } = req.valid.body;

    const room = await createRoom({
      ownerId: req.user.uid,
      displayName: req.user.displayName,
      language,
      durationHours,
      exercises,
    });

    res.status(201).json(room);
  }),
);

/** POST /api/rooms/join — entra pela código devolvido por POST /api/rooms. */
router.post(
  '/rooms/join',
  requireAuth,
  validate(schemas.joinRoom, 'body'),
  asyncHandler(async (req, res) => {
    const { code } = req.valid.body;
    const room = await joinRoomByCode({
      code,
      uid: req.user.uid,
      displayName: req.user.displayName,
    });
    res.json(room);
  }),
);

/** DELETE /api/rooms/:roomId — só o dono. */
router.delete(
  '/rooms/:roomId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteRoom({ roomId: req.params.roomId, ownerId: req.user.uid });
    res.status(204).end();
  }),
);

/**
 * GET /api/rooms/:roomId — configuração da sala, sem o código secreto.
 */
router.get(
  '/rooms/:roomId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const room = await getRoomForScoring(req.params.roomId);
    res.json({
      id: room.id,
      language: room.language,
      status: room.status ?? 'active',
      expiresAt: room.expiresAt ?? null,
      exercises: Array.isArray(room.exercises) ? room.exercises : [],
    });
  }),
);

/**
 * POST /api/rooms/:roomId/submissions
 *
 * O cliente manda só o código. A linguagem vem da sala, o exercício é validado
 * contra a lista da sala e os pontos são calculados aqui — nunca o cliente
 * decide quanto valeu uma resolução.
 */
router.post(
  '/rooms/:roomId/submissions',
  requireAuth,
  executeLimiter,
  validate(schemas.roomSubmission, 'body'),
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { problem: problemSlug, sourceCode } = req.valid.body;

    const room = await getRoomForScoring(roomId);
    const problem = getProblemBySlug(problemSlug);

    const outcome = await handleSubmission({
      mode: 'judge',
      language: room.language,
      sourceCode,
      problem,
      user: req.user,
      clientIp: req.ip ?? null,
    });

    const score = await recordRoomSubmission({
      roomId,
      uid: req.user.uid,
      slug: problemSlug,
      outcome,
    });

    logger.info('room submission', {
      roomId,
      uid: req.user.uid,
      slug: problemSlug,
      verdict: outcome.verdict,
      pointsAwarded: score.pointsAwarded,
    });

    res.json({
      verdict: outcome.verdict,
      verdictLabel: outcome.verdictLabel,
      casesPassed: outcome.casesPassed ?? null,
      casesTotal: outcome.casesTotal ?? null,
      // O console da sala mostra o mesmo que o da prática: erros de
      // compilação, saída, stderr, tempo e memória, para o aluno perceber
      // o que falhou. O `?? null` importa: o Console distingue "sem valor"
      // por null, e undefined rebentava-o.
      stdout: outcome.stdout ?? null,
      stderr: outcome.stderr ?? null,
      compileOutput: outcome.compileOutput ?? null,
      timeMs: outcome.timeMs ?? null,
      memoryKb: outcome.memoryKb ?? null,
      room: { id: room.id, language: room.language },
      score: {
        accepted: score.accepted,
        alreadySolved: score.alreadySolved,
        pointsAwarded: score.pointsAwarded,
        penaltyApplied: score.penaltyApplied,
        wrongAttempts: score.wrongAttempts,
        totalPoints: score.totalPoints,
        solvedCount: score.solvedCount,
      },
    });
  }),
);

export default router;
