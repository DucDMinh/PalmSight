import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HealthController } from '../src/health/health.controller';
import { HealthModule } from '../src/health/health.module';

describe('SETUP-007: HealthController & Health Endpoint', () => {
  describe('HealthController (Unit)', () => {
    let controller: HealthController;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      controller = moduleRef.get<HealthController>(HealthController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should return { status: "ok", timestamp } with valid ISO timestamp', () => {
      const before = Date.now();
      const result = controller.getHealth();
      const after = Date.now();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');

      const timestampMillis = Date.parse(result.timestamp);
      expect(Number.isNaN(timestampMillis)).toBe(false);
      expect(timestampMillis).toBeGreaterThanOrEqual(before - 1000);
      expect(timestampMillis).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('GET /api/v1/health (HTTP Integration)', () => {
    let app: INestApplication;
    let baseUrl: string;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [HealthModule],
      }).compile();

      app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.listen(0);
      baseUrl = await app.getUrl();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('should return HTTP 200 with { status: "ok", timestamp } at /api/v1/health', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');

      const data = (await res.json()) as { status: string; timestamp: string };
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(data.timestamp))).toBe(false);
    });

    it('should return HTTP 404 for un-prefixed /health route when global prefix is active', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(404);
    });
  });
});
