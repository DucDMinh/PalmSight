import { describe, it, expect } from 'vitest';
import {
  ReadingSchool,
  LifeAspect,
  ReadingStatus,
  CreditTransactionType,
  ImageQuality,
  HandOrientation,
  READING_SCHOOLS,
  READING_SCHOOL_LIST,
  LIFE_ASPECTS,
  CREDIT_AMOUNTS,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enterReferralSchema,
  palmResultSchema,
} from './index';

describe('@palmsight/shared', () => {
  describe('Enums', () => {
    it('should have correct ReadingSchool values', () => {
      expect(ReadingSchool.WESTERN).toBe('WESTERN');
      expect(ReadingSchool.EASTERN).toBe('EASTERN');
      expect(ReadingSchool.VEDIC).toBe('VEDIC');
    });

    it('should have correct LifeAspect values', () => {
      expect(LifeAspect.PERSONALITY).toBe('personality');
      expect(LifeAspect.LOVE).toBe('love');
      expect(LifeAspect.CAREER).toBe('career');
      expect(LifeAspect.FINANCE).toBe('finance');
      expect(LifeAspect.HEALTH).toBe('health');
      expect(LifeAspect.FAMILY).toBe('family');
    });

    it('should have correct ReadingStatus values', () => {
      expect(ReadingStatus.PROCESSING).toBe('PROCESSING');
      expect(ReadingStatus.DONE).toBe('DONE');
      expect(ReadingStatus.FAILED).toBe('FAILED');
      expect(ReadingStatus.REJECTED).toBe('REJECTED');
    });

    it('should have correct CreditTransactionType values', () => {
      expect(CreditTransactionType.SIGNUP_BONUS).toBe('SIGNUP_BONUS');
      expect(CreditTransactionType.REFERRAL_BONUS).toBe('REFERRAL_BONUS');
      expect(CreditTransactionType.REFEREE_BONUS).toBe('REFEREE_BONUS');
      expect(CreditTransactionType.READING_SPEND).toBe('READING_SPEND');
      expect(CreditTransactionType.READING_REFUND).toBe('READING_REFUND');
      expect(CreditTransactionType.ADMIN_ADJUST).toBe('ADMIN_ADJUST');
    });

    it('should have correct ImageQuality values', () => {
      expect(ImageQuality.GOOD).toBe('GOOD');
      expect(ImageQuality.FAIR).toBe('FAIR');
      expect(ImageQuality.POOR).toBe('POOR');
    });

    it('should have correct HandOrientation values', () => {
      expect(HandOrientation.LEFT).toBe('LEFT');
      expect(HandOrientation.RIGHT).toBe('RIGHT');
    });
  });

  describe('Constants', () => {
    it('should have correct CREDIT_AMOUNTS', () => {
      expect(CREDIT_AMOUNTS.SIGNUP_BONUS).toBe(3);
      expect(CREDIT_AMOUNTS.REFERRAL_REWARD).toBe(2);
      expect(CREDIT_AMOUNTS.REFEREE_REWARD).toBe(1);
      expect(CREDIT_AMOUNTS.READING_COST).toBe(1);
      expect(CREDIT_AMOUNTS.REFERRAL_DAILY_CAP).toBe(10);
    });

    it('should have 3 reading schools with non-empty sections', () => {
      expect(READING_SCHOOL_LIST).toHaveLength(3);
      expect(READING_SCHOOLS[ReadingSchool.WESTERN].sections.length).toBeGreaterThan(0);
      expect(READING_SCHOOLS[ReadingSchool.EASTERN].sections.length).toBeGreaterThan(0);
      expect(READING_SCHOOLS[ReadingSchool.VEDIC].sections.length).toBeGreaterThan(0);
    });

    it('should have 6 life aspects', () => {
      expect(LIFE_ASPECTS).toHaveLength(6);
    });
  });

  describe('Yup Schemas', () => {
    describe('registerSchema', () => {
      it('should validate valid registration input', async () => {
        const valid = {
          displayName: 'Nguyễn Văn A',
          username: 'nguyenvana',
          email: 'a@example.com',
          password: 'mat-khau-du-dai',
          referralCode: 'K7QX4MZP',
        };
        await expect(registerSchema.validate(valid)).resolves.toMatchObject({
          displayName: 'Nguyễn Văn A',
          username: 'nguyenvana',
          email: 'a@example.com',
          password: 'mat-khau-du-dai',
          referralCode: 'K7QX4MZP',
        });
      });

      it('should fail when password equals username or email', async () => {
        const invalidUsername = {
          displayName: 'Test',
          username: 'myusername',
          email: 'test@example.com',
          password: 'myusername',
        };
        await expect(registerSchema.validate(invalidUsername)).rejects.toThrow();

        const invalidEmail = {
          displayName: 'Test',
          username: 'myusername2',
          email: 'test@example.com',
          password: 'test@example.com',
        };
        await expect(registerSchema.validate(invalidEmail)).rejects.toThrow();
      });

      it('should reject invalid username format', async () => {
        const invalid = {
          displayName: 'Test',
          username: 'User@Name!',
          email: 'test@example.com',
          password: 'validPassword123',
        };
        await expect(registerSchema.validate(invalid)).rejects.toThrow();
      });
    });

    describe('loginSchema', () => {
      it('should validate valid login input', async () => {
        await expect(
          loginSchema.validate({ login: 'nguyenvana', password: 'secretpassword' }),
        ).resolves.toBeTruthy();
      });

      it('should reject empty login or password', async () => {
        await expect(loginSchema.validate({ login: '', password: '' })).rejects.toThrow();
      });
    });

    describe('forgotPasswordSchema', () => {
      it('should validate valid email', async () => {
        await expect(
          forgotPasswordSchema.validate({ email: 'user@example.com' }),
        ).resolves.toBeTruthy();
      });

      it('should reject invalid email', async () => {
        await expect(
          forgotPasswordSchema.validate({ email: 'invalid-email' }),
        ).rejects.toThrow();
      });
    });

    describe('resetPasswordSchema', () => {
      it('should validate valid reset token and password', async () => {
        await expect(
          resetPasswordSchema.validate({
            token: 'valid-base64-token-string-value-here-12345',
            newPassword: 'new-strong-password',
          }),
        ).resolves.toBeTruthy();
      });

      it('should reject too short password', async () => {
        await expect(
          resetPasswordSchema.validate({
            token: 'valid-token',
            newPassword: 'short',
          }),
        ).rejects.toThrow();
      });
    });

    describe('enterReferralSchema', () => {
      it('should validate valid 8-char uppercase code (excluding 0, O, 1, I, L)', async () => {
        await expect(
          enterReferralSchema.validate({ code: 'k7qx4mzp' }),
        ).resolves.toMatchObject({ code: 'K7QX4MZP' });
      });

      it('should reject code with ambiguous characters (e.g. 0, O, 1, I, L)', async () => {
        await expect(enterReferralSchema.validate({ code: 'A0B1C2D3' })).rejects.toThrow();
      });
    });

    describe('palmResultSchema', () => {
      it('should validate successful PalmResult', async () => {
        const result = {
          isPalm: true,
          rejectReason: null,
          school: ReadingSchool.EASTERN,
          hand: HandOrientation.LEFT,
          imageQuality: ImageQuality.GOOD,
          topics: ['nguHanh', 'thienVan', 'love'],
          sections: [
            {
              key: 'nguHanh',
              title: 'Dáng tay ngũ hành',
              observation: 'Lòng bàn tay vuông',
              meaning: 'Tay Thổ: thực tế',
            },
            {
              key: 'thienVan',
              title: 'Thiên văn',
              observation: 'Đường dài và rõ nét',
              meaning: 'Tình cảm sâu sắc',
            },
          ],
          aspects: {
            love: 'Tình cảm hoà thuận',
          },
          summary: 'Dáng tay Thổ biểu thị tính cách điềm đạm.',
          advice: 'Hãy kiên nhẫn phát huy thế mạnh.',
          disclaimer: 'Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn.',
        };
        await expect(palmResultSchema.validate(result)).resolves.toBeTruthy();
      });

      it('should validate rejected palm result when isPalm is false', async () => {
        const rejected = {
          isPalm: false,
          rejectReason: 'Không nhìn rõ lòng bàn tay.',
          school: null,
          hand: null,
          imageQuality: null,
          topics: null,
          sections: null,
          aspects: null,
          summary: null,
          advice: null,
          disclaimer: null,
        };
        await expect(palmResultSchema.validate(rejected)).resolves.toBeTruthy();
      });
    });
  });
});
