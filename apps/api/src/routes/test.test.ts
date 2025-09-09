import { test, expect } from 'bun:test';
import request from 'supertest';
import app from '../index';

test('GET /test should return correct content', async () => {
  const res = await request(app).get('/test');
  expect(res.statusCode).toBe(200);
  expect(res.text).toBe(JSON.stringify({ message: 'Test!' }));
});
