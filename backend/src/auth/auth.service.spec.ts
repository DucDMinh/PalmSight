import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { CreditLedgerService } from '../credits/credit-ledger.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService Unit Logic (TC-004, TC-005, TC-006)', () => {
  let authService: AuthService;
  let pendingModel: any;
  let userModel: any;
  let sessionModel: any;
  let referralModel: any;
  let deletedIdentityModel: any;
  let connection: any;
  let mailService: any;
  let creditLedgerService: any;

  beforeEach(() => {
    const configService = {
      get: vi.fn((key: string, def?: unknown) => {
        const map: Record<string, unknown> = {
          JWT_ACCESS_SECRET: 'test-jwt-access-secret-minimum-32-chars-long',
          JWT_ACCESS_TTL_SECONDS: 900,
          REFRESH_TOKEN_TTL_DAYS: 30,
          EMAIL_VERIFY_TTL_HOURS: 24,
          IDENTITY_HASH_SECRET: 'test-identity-secret-minimum-32-chars',
          SIGNUP_BONUS_CREDITS: 3,
          REFERRAL_REWARD_CREDITS: 2,
          REFEREE_REWARD_CREDITS: 1,
          REFERRAL_DAILY_CAP: 10,
        };
        return map[key] ?? def;
      }),
      getOrThrow: vi.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'test-jwt-access-secret-minimum-32-chars-long',
          IDENTITY_HASH_SECRET: 'test-identity-secret-minimum-32-chars',
        };
        return map[key] ?? 'default';
      }),
    } as unknown as ConfigService;

    mailService = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as MailService;
    creditLedgerService = {
      recordWithSession: vi.fn().mockResolvedValue(undefined),
    } as unknown as CreditLedgerService;
    const jwtService = new JwtService({ secret: 'test-jwt-access-secret-minimum-32-chars-long' });

    // Mock models
    pendingModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      deleteOne: vi.fn(),
    };
    const mockExistsQuery = () => {
      const q: any = Promise.resolve(false);
      q.session = vi.fn().mockReturnValue(q);
      return q;
    };

    userModel = {
      exists: vi.fn().mockImplementation(mockExistsQuery),
      findOne: vi.fn(),
      create: vi.fn(),
    };
    sessionModel = {
      create: vi.fn(),
    };
    referralModel = {
      countDocuments: vi.fn(),
      create: vi.fn(),
    };
    deletedIdentityModel = {
      exists: vi.fn(),
    };

    connection = {
      startSession: vi.fn(),
    };

    authService = new AuthService(
      pendingModel,
      userModel,
      sessionModel,
      referralModel,
      deletedIdentityModel,
      mailService,
      creditLedgerService,
      jwtService,
      configService,
      connection,
    );
  });

  describe('TC-004: hashPassword & verifyPassword using Argon2id', () => {
    it('should hash password with argon2id prefix and verify correctly', async () => {
      const rawPassword = 'matkhau_123456';
      const hash = await authService.hashPassword(rawPassword);

      // Must start with $argon2id$
      expect(hash).toMatch(/^\$argon2id\$/);
      // Parameters: m=65536, t=3, p=4
      expect(hash).toContain('m=65536');
      expect(hash).toContain('t=3');
      expect(hash).toContain('p=4');

      // Verify correct password returns true
      const isValid = await authService.verifyPassword(rawPassword, hash);
      expect(isValid).toBe(true);

      // Verify incorrect password returns false
      const isInvalid = await authService.verifyPassword('sai_mat_khau', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('TC-005: generateVerificationToken', () => {
    it('should generate 43-character Base64URL raw token and 64-character SHA-256 hex tokenHash', () => {
      const { rawToken, tokenHash } = authService.generateVerificationToken();

      // rawToken must be exactly 43 URL-safe characters (32 bytes base64url)
      expect(rawToken).toHaveLength(43);
      expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

      // tokenHash must be 64-character hex string (SHA-256)
      expect(tokenHash).toHaveLength(64);
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);

      // tokenHash must match SHA-256 of rawToken
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(tokenHash).toBe(expectedHash);
    });
  });

  describe('TC-006: generateReferralCode', () => {
    it('should generate 8 uppercase characters excluding ambiguous chars (0, O, 1, I, L)', async () => {
      for (let i = 0; i < 50; i++) {
        const code = await authService.generateReferralCode();

        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);

        // Disallowed characters
        expect(code).not.toContain('0');
        expect(code).not.toContain('O');
        expect(code).not.toContain('1');
        expect(code).not.toContain('I');
        expect(code).not.toContain('L');
      }
    });
  });

  describe('E11000 duplicate key error handling', () => {
    it('should catch E11000 on username in register and throw ConflictException with USERNAME_TAKEN', async () => {
      userModel.findOne.mockResolvedValue(null);
      pendingModel.findOne.mockResolvedValue(null);
      pendingModel.findOneAndUpdate.mockRejectedValue({
        code: 11000,
        keyPattern: { username: 1 },
        message: 'E11000 duplicate key error collection: pending_registrations index: username_1 dup key: { username: "taken_user" }',
      });

      await expect(
        authService.register({
          displayName: 'Test User',
          username: 'taken_user',
          email: 'test@example.com',
          password: 'Password_123',
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'USERNAME_TAKEN',
          message: 'Tên người dùng đã được sử dụng.',
        },
      });
    });

    it('should catch E11000 on email in register and throw ConflictException with EMAIL_TAKEN', async () => {
      userModel.findOne.mockResolvedValue(null);
      pendingModel.findOne.mockResolvedValue(null);
      pendingModel.findOneAndUpdate.mockRejectedValue({
        code: 11000,
        keyPattern: { email: 1 },
        message: 'E11000 duplicate key error collection: pending_registrations index: email_1',
      });

      await expect(
        authService.register({
          displayName: 'Test User',
          username: 'valid_user',
          email: 'taken@example.com',
          password: 'Password_123',
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'EMAIL_TAKEN',
          message: 'Email này đã được sử dụng.',
        },
      });
    });

    it('should catch E11000 on username in verifyEmail and throw ConflictException with USERNAME_TAKEN', async () => {
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      connection.startSession.mockResolvedValue(mockSession);

      const mockPending = {
        _id: 'pending123',
        email: 'test@example.com',
        username: 'taken_user',
        displayName: 'Test',
        passwordHash: 'hash',
        referralCode: null,
      };

      const pendingQuery = {
        session: vi.fn().mockResolvedValue(mockPending),
      };
      pendingModel.findOne.mockReturnValue(pendingQuery);

      const deletedIdentityQuery = {
        session: vi.fn().mockResolvedValue(false),
      };
      deletedIdentityModel.exists.mockReturnValue(deletedIdentityQuery);

      const userQuery = {
        session: vi.fn().mockResolvedValue(null),
      };
      userModel.findOne.mockReturnValue(userQuery);

      userModel.create.mockRejectedValue({
        code: 11000,
        keyPattern: { username: 1 },
        message: 'E11000 duplicate key error collection: users index: username_1',
      });

      await expect(
        authService.verifyEmail('raw-test-token-12345'),
      ).rejects.toMatchObject({
        response: {
          code: 'USERNAME_TAKEN',
          message: 'Tên người dùng đã được sử dụng.',
        },
      });

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
