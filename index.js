const express = require('express');
const { Pool } = require('pg');
const { logs, SeverityNumber } = require('@opentelemetry/api-logs');

const logger = logs.getLogger('aport-api-logger');

function emitLog(severityNumber, severityText, body, attributes = {}) {
  console.log(`[${severityText}] ${body}`, Object.keys(attributes).length ? attributes : '');
  logger.emit({
    severityNumber,
    severityText,
    body,
    attributes,
  });
}

const app = express();
app.disable('x-powered-by');
app.use(express.json());

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
      user: process.env.DB_USER || process.env.PGUSER || 'aport',
      password: String(process.env.DB_PASSWORD || process.env.PGPASSWORD || ''),
      database: process.env.DB_NAME || process.env.PGDATABASE || 'aportdb',
    };

const pool = new Pool(poolConfig);

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    emitLog(SeverityNumber.INFO, 'INFO', 'Database initialized successfully');
  } catch (err) {
    emitLog(SeverityNumber.ERROR, 'ERROR', 'Database initialization failed', { error: err.message });
    throw err;
  }
}

app.get('/', (req, res) => {
  emitLog(SeverityNumber.INFO, 'INFO', 'Root endpoint requested');
  res.status(200).json({ message: 'Aport API is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, created_at FROM items ORDER BY id ASC');
    emitLog(SeverityNumber.INFO, 'INFO', 'Fetched items list', { count: result.rows.length });
    res.status(200).json(result.rows);
  } catch (err) {
    emitLog(SeverityNumber.ERROR, 'ERROR', 'GET /api/items error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/items', async (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    emitLog(SeverityNumber.WARN, 'WARN', 'Invalid POST /api/items payload');
    return res.status(400).json({ error: 'Field "name" is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    emitLog(SeverityNumber.INFO, 'INFO', 'Created new item', { itemId: result.rows[0].id, name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    emitLog(SeverityNumber.ERROR, 'ERROR', 'POST /api/items error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        emitLog(SeverityNumber.INFO, 'INFO', `Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      emitLog(SeverityNumber.ERROR, 'ERROR', 'Startup failed', { error: err.message });
      process.exit(1);
    });
}

app.initDb = initDb;
app.pool = pool;

module.exports = app;