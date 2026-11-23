import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('PostgreSQL Integration Tests (/api/items)', () => {
  beforeAll(async () => {
    await app.initDb();
    await app.pool.query('TRUNCATE TABLE items RESTART IDENTITY');
  });

  afterAll(async () => {
    await app.pool.end();
  });

  it('GET / повертає привітання API', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Aport API is running');
  });

  it('POST /api/items без поля name повертає 400 Bad Request', async () => {
    const res = await request(app).post('/api/items').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/items створює новий запис у базі даних PostgreSQL (201)', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Integration Test Item' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name', 'Integration Test Item');
  });

  it('GET /api/items повертає збережені записи з PostgreSQL (200)', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Integration Test Item');
  });
});