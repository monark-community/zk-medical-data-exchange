import { test, expect, mock } from 'bun:test';
import request from 'supertest';

console.log('=== Environment Variables Debug (BEFORE MOCK) ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('IS_CI:', process.env.IS_CI);
console.log('IS_LOCAL_MODE:', process.env.IS_LOCAL_MODE);
console.log('APP_API_KEY:', process.env.APP_API_KEY ? '***SET***' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '***SET***' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_SECRET_API_KEY:', process.env.PINATA_SECRET_API_KEY ? '***SET***' : 'MISSING');
console.log('=== End Environment Variables ===');

mock.module('../config/config', () => ({
  Config: {
    APP_API_KEY: 'test-key',
    SUPABASE_URL: 'http://localhost:8000',
    SUPABASE_KEY: 'test-supabase-key',
    PINATA_API_KEY: 'test-pinata-api-key',
    PINATA_SECRET_API_KEY: 'test-pinata-secret-key',
    IS_LOCAL_MODE: false,
    IS_CI: process.env.IS_CI === 'true',
    NODE_ENV: 'test',
    LOG_LEVEL: 'info'
  }
}));
console.log('---------------------------------------------------------');
console.log('=== Environment Variables Debug (AFTER MOCK) ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('IS_CI:', process.env.IS_CI);
console.log('IS_LOCAL_MODE:', process.env.IS_LOCAL_MODE);
console.log('APP_API_KEY:', process.env.APP_API_KEY ? '***SET***' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '***SET***' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_SECRET_API_KEY:', process.env.PINATA_SECRET_API_KEY ? '***SET***' : 'MISSING');
console.log('=== End Environment Variables ===');

import app from '../index';

const testApiKey = 'test-key';

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