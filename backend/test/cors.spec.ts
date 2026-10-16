import { describe, it, expect } from 'vitest';
import { createCorsOriginValidator } from '../src/main';

describe('US-DEPLOY-01: CORS Origin Validator', () => {
  describe('Production Mode', () => {
    const validator = createCorsOriginValidator('production', 'https://palmsight.app');

    it('allows matching PUBLIC_BASE_URL', () => {
      let allowed: boolean | undefined;
      validator('https://palmsight.app', (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      expect(allowed).toBe(true);
    });

    it('allows matching PUBLIC_BASE_URL with trailing slash', () => {
      let allowed: boolean | undefined;
      validator('https://palmsight.app/', (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      expect(allowed).toBe(true);
    });

    it('allows server-to-server requests without origin header', () => {
      let allowed: boolean | undefined;
      validator(undefined, (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      expect(allowed).toBe(true);
    });

    it('rejects unauthorized origin in production', () => {
      let receivedErr: Error | null = null;
      validator('https://evil-site.com', (err) => {
        receivedErr = err;
      });
      expect(receivedErr).toBeInstanceOf(Error);
      expect((receivedErr as unknown as Error).message).toContain('not allowed by CORS');
    });

    it('rejects wildcard origin when PUBLIC_BASE_URL is set to *', () => {
      const wildcardValidator = createCorsOriginValidator('production', '*');
      let receivedErr: Error | null = null;
      wildcardValidator('https://any-domain.com', (err) => {
        receivedErr = err;
      });
      expect(receivedErr).toBeInstanceOf(Error);
      expect((receivedErr as unknown as Error).message).toContain('CORS wildcard * is strictly forbidden in production');
    });
  });

  describe('Development Mode', () => {
    const validator = createCorsOriginValidator('development', 'http://localhost:5173');

    it('allows localhost:5173', () => {
      let allowed: boolean | undefined;
      validator('http://localhost:5173', (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      expect(allowed).toBe(true);
    });

    it('allows ngrok-free.app tunnel domains', () => {
      let allowed: boolean | undefined;
      validator('https://palmsight-dev.ngrok-free.app', (err, allow) => {
        expect(err).toBeNull();
        allowed = allow;
      });
      expect(allowed).toBe(true);
    });

    it('rejects unknown untrusted origins in development', () => {
      let receivedErr: Error | null = null;
      validator('http://hacker.com', (err) => {
        receivedErr = err;
      });
      expect(receivedErr).toBeInstanceOf(Error);
    });
  });
});
