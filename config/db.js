import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'chat_secure',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
    process.exit(1);
  });

export default pool;
