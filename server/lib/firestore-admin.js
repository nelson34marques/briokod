import { readFileSync, existsSync } from 'node:fs';
import { cert, applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config.js';
import { logger } from './logger.js';

let app;
let db;

/**
 * Credenciais privileged. Três formas, por ordem de precedência:
 *   1. FIREBASE_ADMIN_CREDENTIALS — JSON inline ou caminho para o ficheiro
 *   2. FIREBASE_ADMIN_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY (a chave com \n literal)
 *   3. Application Default Credentials (gcloud auth application-default login)
 */
function credentials() {
  const raw = config.firebase.adminCredentials;
  if (raw) {
    if (raw.trim().startsWith('{')) return cert(JSON.parse(raw));
    if (existsSync(raw)) return cert(JSON.parse(readFileSync(raw, 'utf8')));
    logger.warn('FIREBASE_ADMIN_CREDENTIALS não é JSON válido nem um ficheiro existente');
  }

  if (config.firebase.adminEmail && config.firebase.adminPrivateKey) {
    return cert({
      projectId: config.firebase.adminProjectId || config.firebase.projectId,
      clientEmail: config.firebase.adminEmail,
      privateKey: config.firebase.adminPrivateKey,
    });
  }

  return applicationDefault();
}

export function isFirestoreAdminReady() {
  return Boolean(
    config.firebase.adminCredentials ||
      (config.firebase.adminEmail && config.firebase.adminPrivateKey) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

/**
 * O Firestore do Admin ignora as security rules: é o que permite ao servidor
 * escrever a pontuação com a confiança que o cliente não pode ter.
 */
export function adminDb() {
  if (db) return db;

  if (!app) {
    const projectId = config.firebase.adminProjectId || config.firebase.projectId;
    const options = { projectId };
    if (config.firebase.adminDatabaseId) options.databaseId = config.firebase.adminDatabaseId;
    app = initializeApp({ credential: credentials(), ...options });
  }

  db = getFirestore(app);
  return db;
}
