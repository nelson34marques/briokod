import { collection, doc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getDb } from './firebase.js';

const ROOMS = 'rooms';
const PARTICIPANTS = 'participants';

/**
 * Leitura das salas em tempo real.
 *
 * Criar, entrar, listar e eliminar passam pelo backend (`src/lib/api.js`): o
 * Firestore do browser é só leitura, e quem escreve é o servidor.
 */

export async function getRoom(roomId) {
  const db = await getDb();
  const snap = await getDoc(doc(db, ROOMS, roomId));
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function subscribeToRoom(roomId, callback) {
  const db = await getDb();
  return onSnapshot(doc(db, ROOMS, roomId), (snap) => {
    if (snap.exists) callback({ id: snap.id, ...snap.data() });
  });
}

export async function subscribeToLeaderboard(roomId, callback) {
  const db = await getDb();
  const q = query(collection(db, ROOMS, roomId, PARTICIPANTS), orderBy('totalPoints', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}
