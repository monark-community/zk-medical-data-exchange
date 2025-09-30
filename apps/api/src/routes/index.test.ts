process.env.NODE_ENV = 'test';

import { test, expect, mock } from 'bun:test';
import request from 'supertest';

mock.module('../config/config', () => ({
  Config: {
    APP_API_KEY: 'test-key',
    SUPABASE_URL: 'http://localhost:8000',
    SUPABASE_KEY: 'test-supabase-key',
    IS_LOCAL_MODE: false,
  }
}));

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