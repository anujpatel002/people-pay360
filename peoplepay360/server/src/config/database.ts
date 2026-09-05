import { env } from './env';

export const dbConfig = {
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
};
