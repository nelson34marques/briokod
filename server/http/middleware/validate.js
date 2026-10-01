import { z } from 'zod';
import { config } from '../../config.js';
import { ValidationError } from '../../lib/errors.js';
import { LANGUAGE_SLUGS } from '../../executors/languages.js';

/** Parses `req[source]` with a zod schema, converting failures into 400s. */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
        code: issue.code,
      }));
      next(new ValidationError('Requisição inválida', details));
      return;
    }
    req.valid = { ...(req.valid ?? {}), [source]: result.data };
    next();
  };
}

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'use apenas letras minúsculas, números e hífens');

/**
 * A lista de linguagens vem do próprio registro de executores: manter uma enum
 * duplicada aqui fazia o PHP e o C# existirem no executor e serem rejeitados
 * na validação com 400.
 */
const language = z.enum(LANGUAGE_SLUGS);

export const schemas = {
  execute: z.object({
    mode: z.enum(['run', 'judge']).default('run'),
    language: language.default('python'),
    sourceCode: z.string().min(1, 'informe o código').max(config.limits.maxSourceBytes),
    stdin: z.string().max(config.limits.maxStdinBytes).default(''),
    problem: slug.optional(),
    wait: z.boolean().default(false),
  }),

  createRoom: z.object({
    language: language,
    durationHours: z.coerce.number().int().min(1).max(24 * 30),
    exercises: z
      .array(
        z.object({
          problemId: z.coerce.number().int().positive().optional(),
          problemSlug: slug,
          points: z.coerce.number().int().min(1).max(1000),
          penalty: z.coerce.number().int().min(0).max(1000),
        }),
      )
      .min(1, 'Adicione pelo menos um exercício')
      .max(50, 'No máximo 50 exercícios por sala'),
  }),

  joinRoom: z.object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .length(6, 'O código tem 6 caracteres')
      .regex(/^[A-Z0-9]+$/, 'código inválido'),
  }),

  roomSubmission: z.object({
    problem: slug,
    sourceCode: z.string().min(1, 'informe o código').max(config.limits.maxSourceBytes),
  }),

  problemList: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tag: z.string().max(32).optional(),
    search: z.string().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  }),

  updateProfile: z.object({
    displayName: z.string().min(1).max(60).optional(),
    photoURL: z.url('URL inválida').max(500).optional(),
  }),

  createProblem: z.object({
    slug,
    title: z.string().min(3).max(120),
    statement: z.string().min(10).max(20000),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    tags: z.array(z.string().max(32)).max(8).default([]),
    timeLimitMs: z.number().int().min(1000).max(15000).default(5000),
    memoryLimitKb: z.number().int().min(16384).max(512000).default(128000),
    maxFileSizeKb: z.number().int().min(64).max(4096).default(1024),
    starterCode: z.record(z.string(), z.string().max(config.limits.maxSourceBytes)).default({}),
    points: z.number().int().min(0).max(10000).default(100),
    testCases: z
      .array(
        z.object({
          stdin: z.string().max(config.limits.maxStdinBytes).default(''),
          expected: z.string().max(config.limits.maxOutputChars).default(''),
          isSample: z.boolean().default(false),
        }),
      )
      .min(1, 'informe ao menos um caso de teste')
      .max(config.limits.maxTestCases),
  }),

  updateProblem: z.object({
    title: z.string().min(3).max(120).optional(),
    statement: z.string().min(10).max(20000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string().max(32)).max(8).optional(),
    timeLimitMs: z.number().int().min(1000).max(15000).optional(),
    memoryLimitKb: z.number().int().min(16384).max(512000).optional(),
    starterCode: z.record(z.string(), z.string().max(config.limits.maxSourceBytes)).optional(),
    points: z.number().int().min(0).max(10000).optional(),
  }),

  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  }),
};
