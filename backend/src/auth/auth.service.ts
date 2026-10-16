import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

import {
  RegisterRequestDto,
  RegisterResponseDto,
  ResendVerificationRequestDto,
  LoginRequestDto,
  AuthResponseDto,
  CreditTransactionType,
  ReferralStatus,
  CREDIT_AMOUNTS,
} from '@palmsight/shared';

import { PendingRegistration, PendingRegistrationDocument } from '../schemas/pending-registration.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { Referral, ReferralDocument } from '../schemas/referral.schema';
import { DeletedIdentity, DeletedIdentityDocument } from '../schemas/deleted-identity.schema';
import { MailService } from '../mail/mail.service';
import { CreditLedgerService } from '../credits/credit-ledger.service';

const REFERRAL_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(PendingRegistration.name)
    private readonly pendingModel: Model<PendingRegistrationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,
    @InjectModel(DeletedIdentity.name)
    private readonly deletedIdentityModel: Model<DeletedIdentityDocument>,
    private readonly mailService: MailService,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ponytail: in-memory failed login tracking per process, upgrade to Redis when scaling to multiple instances
  private readonly failedLogins = new Map<string, { timestamps: number[] }>();

  private checkLoginRateLimit(key: string): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const record = this.failedLogins.get(key);
    if (!record) return;

    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      this.failedLogins.delete(key);
      return;
    }

    if (record.timestamps.length >= 5) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Bạn đã gửi quá số lần cho phép. Vui lòng thử lại sau ít phút.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailedLogin(key: string): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const record = this.failedLogins.get(key) || { timestamps: [] };
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    record.timestamps.push(now);
    this.failedLogins.set(key, record);
  }

  private resetFailedLogins(key: string): void {
    this.failedLogins.delete(key);
  }

  private async checkPendingRegistration(
    login: string,
    password: string,
  ): Promise<PendingRegistrationDocument | null> {
    const pending = await this.pendingModel.findOne({
      $or: [{ email: login }, { username: login }],
      expiresAt: { $gt: new Date() },
    });

    if (pending && (await this.verifyPassword(password, pending.passwordHash))) {
      return pending;
    }

    return null;
  }

  async login(
    dto: LoginRequestDto,
    currentRefreshToken?: string,
    clientIp?: string,
  ): Promise<{ authResponse: AuthResponseDto; rawRefreshToken: string }> {
    const normalizedLogin = dto.login.trim().toLowerCase();
    const rateLimitKey = `${clientIp || '127.0.0.1'}:${normalizedLogin}`;
    this.checkLoginRateLimit(rateLimitKey);

    const isEmail = normalizedLogin.includes('@');
    const user = await this.userModel.findOne(
      isEmail ? { email: normalizedLogin } : { username: normalizedLogin },
    );

    if (user) {
      if (user.deletedAt != null) {
        this.recordFailedLogin(rateLimitKey);
        throw new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message: 'Thông tin đăng nhập không chính xác.',
        });
      }

      if (user.passwordHash && (await this.verifyPassword(dto.password, user.passwordHash))) {
        this.resetFailedLogins(rateLimitKey);

        if (currentRefreshToken) {
          const oldHash = crypto.createHash('sha256').update(currentRefreshToken).digest('hex');
          await this.sessionModel.deleteOne({ refreshTokenHash: oldHash });
        }

        return this.createAuthSession(user, false);
      }
    }

    const pending = await this.checkPendingRegistration(normalizedLogin, dto.password);
    if (pending) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Tài khoản chưa được xác minh email.',
        details: { email: pending.email },
      });
    }

    this.recordFailedLogin(rateLimitKey);
    throw new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Thông tin đăng nhập không chính xác.',
    });
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  generateVerificationToken(): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  async generateReferralCode(session?: ClientSession): Promise<string> {
    let attempts = 0;
    while (attempts < 20) {
      attempts++;
      let code = '';
      const randomBytes = crypto.randomBytes(8);
      for (let i = 0; i < 8; i++) {
        code += REFERRAL_CHARSET[randomBytes[i] % REFERRAL_CHARSET.length];
      }

      const query = this.userModel.exists({ referralCode: code });
      if (session) {
        query.session(session);
      }
      const exists = await query;
      if (!exists) {
        return code;
      }
    }
    throw new Error('Could not generate unique referral code');
  }

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim().toLowerCase();
    const displayName = dto.displayName.trim();
    const referralCode = dto.referralCode ? dto.referralCode.trim().toUpperCase() : null;

    // Check user collision
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.passwordHash) {
        throw new ConflictException({
          code: 'EMAIL_TAKEN',
          message: 'Email này đã được sử dụng.',
        });
      }
      if (existingUser.username === username) {
        throw new ConflictException({
          code: 'USERNAME_TAKEN',
          message: 'Tên người dùng đã được sử dụng.',
        });
      }
    }

    // Check pending username collision from other emails
    const pendingWithUsername = await this.pendingModel.findOne({
      username,
      email: { $ne: email },
      expiresAt: { $gt: new Date() },
    });
    if (pendingWithUsername) {
      throw new ConflictException({
        code: 'USERNAME_TAKEN',
        message: 'Tên người dùng đã được sử dụng.',
      });
    }

    const passwordHash = await this.hashPassword(dto.password);
    const { rawToken, tokenHash } = this.generateVerificationToken();
    const ttlHours = Number(this.configService.get('EMAIL_VERIFY_TTL_HOURS', 24));
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    // Upsert pending registration (catch concurrent duplicate key E11000)
    try {
      await this.pendingModel.findOneAndUpdate(
        { email },
        {
          email,
          username,
          displayName,
          passwordHash,
          tokenHash,
          expiresAt,
          referralCode,
          lastSentAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        if (error.keyPattern?.username || error.message?.includes('username')) {
          throw new ConflictException({
            code: 'USERNAME_TAKEN',
            message: 'Tên người dùng đã được sử dụng.',
          });
        }
        if (error.keyPattern?.email || error.message?.includes('email')) {
          throw new ConflictException({
            code: 'EMAIL_TAKEN',
            message: 'Email này đã được sử dụng.',
          });
        }
      }
      throw error;
    }

    // Send verification email
    await this.mailService.sendVerificationEmail(email, displayName, rawToken);

    return {
      email,
      verificationExpiresAt: expiresAt.toISOString(),
    };
  }

  async resendVerification(dto: ResendVerificationRequestDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const pending = await this.pendingModel.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (!pending) {
      // Anti-enumeration: Silent return
      return;
    }

    const { rawToken, tokenHash } = this.generateVerificationToken();
    const ttlHours = Number(this.configService.get('EMAIL_VERIFY_TTL_HOURS', 24));
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    pending.tokenHash = tokenHash;
    pending.expiresAt = expiresAt;
    pending.lastSentAt = new Date();
    await pending.save();

    await this.mailService.sendVerificationEmail(email, pending.displayName, rawToken);
  }

  async verifyEmail(token: string): Promise<{ authResponse: AuthResponseDto; rawRefreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await this.connection.startSession();
    session.startTransaction();

    let verifiedUser: UserDocument;
    let isNewUser = false;

    try {
      const pending = await this.findPendingRegistration(tokenHash, session);
      const isDeleted = await this.isDeletedIdentity(pending.email, session);

      const existingUser = await this.userModel.findOne({ email: pending.email }).session(session);

      if (existingUser) {
        verifiedUser = await this.linkOAuthAccount(existingUser, pending, session);
        isNewUser = false;
      } else {
        verifiedUser = await this.createVerifiedUser(pending, isDeleted, session);
        isNewUser = true;

        if (!isDeleted && pending.referralCode) {
          await this.processReferralReward(verifiedUser, pending.referralCode, session);
        }
      }

      await this.pendingModel.deleteOne({ _id: pending._id }).session(session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.handleVerificationTransactionError(error);
    } finally {
      await session.endSession();
    }

    return this.createAuthSession(verifiedUser!, isNewUser);
  }

  private async findPendingRegistration(
    tokenHash: string,
    session: ClientSession,
  ): Promise<PendingRegistrationDocument> {
    const pending = await this.pendingModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      })
      .session(session);

    if (!pending) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.',
      });
    }

    return pending;
  }

  private async isDeletedIdentity(email: string, session: ClientSession): Promise<boolean> {
    const identitySecret = this.configService.get<string>(
      'IDENTITY_HASH_SECRET',
      'palmsight-identity-secret',
    );
    const identityHmac = crypto
      .createHmac('sha256', identitySecret)
      .update(email.toLowerCase())
      .digest('hex');

    const exists = await this.deletedIdentityModel
      .exists({
        $or: [{ valueHmac: identityHmac }, { identityHash: identityHmac }],
      })
      .session(session);

    return !!exists;
  }

  private async linkOAuthAccount(
    existingUser: UserDocument,
    pending: PendingRegistrationDocument,
    session: ClientSession,
  ): Promise<UserDocument> {
    if (existingUser.passwordHash) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'Email này đã được sử dụng.',
      });
    }

    existingUser.username = pending.username;
    existingUser.passwordHash = pending.passwordHash;
    existingUser.passwordUpdatedAt = new Date();
    await existingUser.save({ session });
    return existingUser;
  }

  private async createVerifiedUser(
    pending: PendingRegistrationDocument,
    isDeletedIdentity: boolean,
    session: ClientSession,
  ): Promise<UserDocument> {
    const uniqueReferralCode = await this.generateReferralCode(session);
    const initialBonus = isDeletedIdentity ? 0 : CREDIT_AMOUNTS.SIGNUP_BONUS;

    const [newUser] = await this.userModel.create(
      [
        {
          displayName: pending.displayName,
          username: pending.username,
          email: pending.email,
          passwordHash: pending.passwordHash,
          passwordUpdatedAt: new Date(),
          referralCode: uniqueReferralCode,
          creditBalance: initialBonus,
          referralBlocked: isDeletedIdentity,
        },
      ],
      { session },
    );

    if (!isDeletedIdentity) {
      await this.creditLedgerService.recordWithSession(
        {
          userId: newUser._id,
          amount: CREDIT_AMOUNTS.SIGNUP_BONUS,
          type: CreditTransactionType.SIGNUP_BONUS,
          balanceAfter: CREDIT_AMOUNTS.SIGNUP_BONUS,
        },
        session,
      );
    }

    return newUser;
  }

  private async processReferralReward(
    referee: UserDocument,
    referralCode: string,
    session: ClientSession,
  ): Promise<void> {
    const referrer = await this.userModel
      .findOne({ referralCode })
      .session(session);

    if (!referrer || referrer._id.toString() === referee._id.toString()) {
      return;
    }

    await this.awardRefereeBonus(referee, session);
    await this.awardReferrerBonus(referrer, referee._id, referralCode, session);
  }

  private async awardRefereeBonus(referee: UserDocument, session: ClientSession): Promise<void> {
    referee.creditBalance += CREDIT_AMOUNTS.REFEREE_REWARD;
    await referee.save({ session });

    await this.creditLedgerService.recordWithSession(
      {
        userId: referee._id,
        amount: CREDIT_AMOUNTS.REFEREE_REWARD,
        type: CreditTransactionType.REFEREE_BONUS,
        balanceAfter: referee.creditBalance,
      },
      session,
    );
  }

  private async awardReferrerBonus(
    referrer: UserDocument,
    refereeId: Types.ObjectId,
    referralCode: string,
    session: ClientSession,
  ): Promise<void> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayRewardedCount = await this.referralModel
      .countDocuments({
        referrerId: referrer._id,
        status: ReferralStatus.REWARDED,
        createdAt: { $gte: todayStart },
      })
      .session(session);

    const dailyCap = Number(
      this.configService.get('REFERRAL_DAILY_CAP', CREDIT_AMOUNTS.REFERRAL_DAILY_CAP),
    );

    if (todayRewardedCount < dailyCap) {
      await this.recordRewardedReferral(referrer, refereeId, referralCode, session);
    } else {
      await this.referralModel.create(
        [
          {
            referrerId: referrer._id,
            refereeId,
            codeUsed: referralCode,
            status: ReferralStatus.CAPPED,
          },
        ],
        { session },
      );
    }
  }

  private async recordRewardedReferral(
    referrer: UserDocument,
    refereeId: Types.ObjectId,
    referralCode: string,
    session: ClientSession,
  ): Promise<void> {
    referrer.creditBalance += CREDIT_AMOUNTS.REFERRAL_REWARD;
    await referrer.save({ session });

    const [referralDoc] = await this.referralModel.create(
      [
        {
          referrerId: referrer._id,
          refereeId,
          codeUsed: referralCode,
          status: ReferralStatus.REWARDED,
        },
      ],
      { session },
    );

    await this.creditLedgerService.recordWithSession(
      {
        userId: referrer._id,
        amount: CREDIT_AMOUNTS.REFERRAL_REWARD,
        type: CreditTransactionType.REFERRAL_BONUS,
        balanceAfter: referrer.creditBalance,
        referralId: referralDoc._id,
      },
      session,
    );
  }

  private async createAuthSession(
    verifiedUser: UserDocument,
    isNewUser: boolean,
  ): Promise<{ authResponse: AuthResponseDto; rawRefreshToken: string }> {
    const rawRefreshToken = crypto.randomBytes(32).toString('base64url');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshTtlDays = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS', 30));
    const sessionExpiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.sessionModel.create({
      userId: verifiedUser._id,
      refreshTokenHash,
      expiresAt: sessionExpiresAt,
    });

    const jwtTtl = Number(this.configService.get('JWT_ACCESS_TTL_SECONDS', 900));
    const accessToken = this.jwtService.sign(
      {
        sub: verifiedUser._id.toString(),
        email: verifiedUser.email,
        username: verifiedUser.username,
      },
      {
        expiresIn: jwtTtl,
      },
    );

    const authResponse: AuthResponseDto = {
      accessToken,
      expiresIn: jwtTtl,
      isNewUser,
      user: {
        id: verifiedUser._id.toString(),
        displayName: verifiedUser.displayName,
        username: verifiedUser.username ?? null,
        avatarUrl: verifiedUser.avatarUrl ?? null,
        creditBalance: verifiedUser.creditBalance,
        referralCode: verifiedUser.referralCode,
      },
    };

    return { authResponse, rawRefreshToken };
  }

  private handleVerificationTransactionError(error: unknown): never {
    const err = error as {
      code?: number;
      hasErrorLabel?: (label: string) => boolean;
      message?: string;
      keyPattern?: Record<string, number>;
    };

    if (err.code === 11000) {
      if (err.keyPattern?.username || err.message?.includes('username')) {
        throw new ConflictException({
          code: 'USERNAME_TAKEN',
          message: 'Tên người dùng đã được sử dụng.',
        });
      }
      if (err.keyPattern?.email || err.message?.includes('email')) {
        throw new ConflictException({
          code: 'EMAIL_TAKEN',
          message: 'Email này đã được sử dụng.',
        });
      }
    }

    if (
      err.code === 112 ||
      err.code === 24 ||
      (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError'))
    ) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.',
      });
    }

    throw error;
  }
}
