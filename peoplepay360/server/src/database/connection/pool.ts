import mysql from 'mysql2/promise';
import { dbConfig } from '../../config/database';

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  connectionLimit: dbConfig.connectionLimit,
  waitForConnections: dbConfig.waitForConnections,
  queueLimit: dbConfig.queueLimit,
});

export default pool;
