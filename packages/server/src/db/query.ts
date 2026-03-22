import mysql2 from 'mysql2/promise';
import { MYSQL_CONFIG } from './mysql_config';

const pool2 = mysql2.createPool({
  user: MYSQL_CONFIG.user,
  password: MYSQL_CONFIG.password,
  database: MYSQL_CONFIG.database,
  host: MYSQL_CONFIG.host,
  port: MYSQL_CONFIG.port,
  waitForConnections: true,
  connectionLimit: 10,
  // maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  // idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  // enableKeepAlive: true,
  // keepAliveInitialDelay: 0,
});

const query = async <T, U>(sql: string, values?: U): Promise<T> => {
  try {
    // For pool initialization, see above
    const [rows, fields] = await pool2.execute(
      sql,
      Object.values(values || {}),
    );
    // Connection is automatically released when query resolves
    return rows as unknown as T;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export default query;
