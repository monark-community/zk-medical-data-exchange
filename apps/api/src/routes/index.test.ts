process.env.NODE_ENV = 'test';
process.env.IS_LOCAL_MODE = 'false';
process.env.IS_CI = 'false';
process.env.APP_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'http://localhost:8000';
process.env.SUPABASE_ANON_KEY = 'test-supabase-key';
process.env.PINATA_API_KEY = 'test-pinata-api-key';
process.env.PINATA_SECRET_API_KEY = 'test-pinata-secret-key';

import { test, expect } from 'bun:test';
import request from 'supertest';
import app from '../index';

test('GET / should return Hello World', async () => {
  const res = await request(app).get('/').set('x-api-key', 'test-key');
  expect(res.status).toBe(200);
  expect(res.text).toBe('Hello World!');
});

test('GET / without API key should return 401', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('error', 'Unauthorized');
});

test('GET / with invalid API key should return 401', async () => {
  const res = await request(app).get('/').set('x-api-key', 'invalid-key');
  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('error', 'Unauthorized');
});