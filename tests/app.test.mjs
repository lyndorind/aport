import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('API Endpoints', () => {
  it('GET /health має повертати статус 200 та OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  it('GET /non-existent має повертати 404', async () => {
    const res = await request(app).get('/non-existent');
    expect(res.statusCode).toBe(404);
  });
});