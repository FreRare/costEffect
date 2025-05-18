import {MONGO_CLIENT} from './server';
import DAO from './db/DAO';

export async function start() {
  let dao: DAO | null = null;
  try {
    dao = new DAO(MONGO_CLIENT);
  } catch (e) {
    console.error(e);
  } finally {
    dao?.close();
  }
}
