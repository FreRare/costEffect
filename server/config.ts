import {config as configDotenv} from 'dotenv';
import {resolve} from 'path';

export const DotenvConfig = () => {
  configDotenv({
    path: resolve(__dirname, "../../../.env")
  });

  const throwIfNot: any = function <T, K extends keyof T>(obj: Partial<T>, prop: K, msg?: string): T[K] {
    if (obj[prop] === undefined || obj[prop] === null) {
      throw new Error(msg || `Environment is missing variable ${prop.toString()}`)
    } else {
      return obj[prop] as T[K]
    }
  };

  ['DB_CONN_URL', 'PORT'].forEach(v => {
    throwIfNot(process.env, v)
  });
}

export interface IProcessEnv {
  DB_CONN_URL: string;
  PORT: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends IProcessEnv {
    }
  }
}

