import { test, expect, mock } from 'bun:test';
import request from 'supertest';

// Debug: Log all relevant environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('IS_CI:', process.env.IS_CI);
console.log('IS_LOCAL_MODE:', process.env.IS_LOCAL_MODE);
console.log('APP_API_KEY:', process.env.APP_API_KEY ? '***SET***' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '***SET***' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '***SET***' : 'MISSING');
console.log('PINATA_SECRET_API_KEY:', process.env.PINATA_SECRET_API_KEY ? '***SET***' : 'MISSING');
console.log('=== End Environment Variables ===');

// Mock in local testing, use real config in CI
if (process.env.IS_CI !== 'true') {
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

const testApiKey = process.env.IS_CI === 'true' 
  ? process.env.APP_API_KEY || 'test-key'
  : 'test-key';

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