import { test, expect, mock } from 'bun:test';
import request from 'supertest';

if (!process.env.APP_API_KEY || process.env.APP_API_KEY === '') {
  mock.module('../config/config', () => ({
    Config: {
      APP_API_KEY: 'test-key',
      SUPABASE_URL: 'http://localhost:8000',
      SUPABASE_KEY: 'test-supabase-key',
      PINATA_API_KEY: 'test-pinata-api-key',
      PINATA_SECRET_API_KEY: 'test-pinata-secret-key',
      IS_LOCAL_MODE: false,
      IS_CI: false,
      NODE_ENV: 'test',
      LOG_LEVEL: 'info'
    }
  }));
}

import app from '../index';
import { Config } from '../config/config';

const testApiKey = process.env.APP_API_KEY || 'test-key';

test('Config Debug Info', () => {
  console.log('=== Test Configuration Debug ===');
  console.log('IS_LOCAL_MODE:', Config.IS_LOCAL_MODE);
  console.log('IS_CI:', Config.IS_CI);
  console.log('APP_API_KEY:', Config.APP_API_KEY ? '***SET***' : 'EMPTY');
  console.log('NODE_ENV:', Config.NODE_ENV);
  console.log('Test API Key:', testApiKey ? '***SET***' : 'EMPTY');
  console.log('Environment IS_CI:', process.env.IS_CI);
  console.log('Environment IS_LOCAL_MODE:', process.env.IS_LOCAL_MODE);
  console.log('=== End Debug Info ===');
});

test('GET / should return Hello World', async () => {
  const res = await request(app).get('/').set('x-api-key', testApiKey);
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