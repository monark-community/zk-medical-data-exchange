import { test, expect } from 'bun:test';
import request from 'supertest';
import app from '@/index';

test('GET / should return Hello World', async () => {
  const res = await request(app).get('/');
  expect(res.statusCode).toBe(200);
  expect(res.text).toBe('Hello World!');
});
