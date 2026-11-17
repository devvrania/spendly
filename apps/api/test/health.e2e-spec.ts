import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { validateEnv } from '../src/config/env.validation';
import { API, createTestApp } from './helpers';

describe('Health + deployment config (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => ({ app } = await createTestApp()));
  afterAll(() => app.close());

  it('GET /health is public and checks the database', async () => {
    const res = await request(app.getHttpServer()).get(`${API}/health`).expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  describe('TRUST_PROXY parsing', () => {
    const base = { DATABASE_URL: 'x', JWT_ACCESS_SECRET: 'x', FRONTEND_URL: 'http://localhost:3000' };
    const parse = (TRUST_PROXY?: string) => validateEnv({ ...base, TRUST_PROXY }).TRUST_PROXY;

    it('is off when unset, empty or "false"', () => {
      expect(parse(undefined)).toBe(false);
      expect(parse('')).toBe(false);
      expect(parse('false')).toBe(false);
    });

    it('accepts a hop count or "true"', () => {
      expect(parse('2')).toBe(2);
      expect(parse('true')).toBe(true);
    });

    it('rejects anything else at startup', () => {
      expect(() => parse('yes')).toThrow(/TRUST_PROXY/);
      expect(() => parse('-1')).toThrow(/TRUST_PROXY/);
    });
  });
});
