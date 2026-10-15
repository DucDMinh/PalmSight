import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { AuthModule } from '../src/auth/auth.module';
import { CreditsModule } from '../src/credits/credits.module';
import { HealthModule } from '../src/health/health.module';
import { MailService } from '../src/mail/mail.service';

export interface TestAppInstance {
  app: INestApplication;
  baseUrl: string;
  replSet: MongoMemoryReplSet;
  connection: mongoose.Connection;
  sentEmails: Array<{ to: string; displayName: string; rawToken: string }>;
  mailServiceMock: {
    sendVerificationEmail: (to: string, displayName: string, rawToken: string) => Promise<void>;
  };
}

export async function createTestApp(): Promise<TestAppInstance> {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const mongoUri = replSet.getUri();

  const sentEmails: Array<{ to: string; displayName: string; rawToken: string }> = [];
  const mailServiceMock = {
    sendVerificationEmail: async (to: string, displayName: string, rawToken: string) => {
      sentEmails.push({ to, displayName, rawToken });
    },
    renderVerificationEmailTemplate: (_params: any) => 'mock-html',
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [
          () => ({
            MONGODB_URI: mongoUri,
            JWT_ACCESS_SECRET: 'test-jwt-secret-palm-sight-at-least-32-chars-long',
            JWT_ACCESS_TTL_SECONDS: 900,
            REFRESH_TOKEN_TTL_DAYS: 30,
            EMAIL_VERIFY_TTL_HOURS: 24,
            IDENTITY_HASH_SECRET: 'test-identity-secret-at-least-32-chars-long',
            SIGNUP_BONUS_CREDITS: 3,
            REFERRAL_REWARD_CREDITS: 2,
            REFEREE_REWARD_CREDITS: 1,
            REFERRAL_DAILY_CAP: 10,
            PUBLIC_BASE_URL: 'http://localhost:5173',
            NODE_ENV: 'test',
          }),
        ],
      }),
      MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          uri: config.getOrThrow<string>('MONGODB_URI'),
          autoIndex: false,
        }),
      }),
      HealthModule,
      CreditsModule,
      AuthModule,
    ],
  })
    .overrideProvider(MailService)
    .useValue(mailServiceMock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api/v1');
  await app.listen(0);

  const baseUrl = await app.getUrl();

  const connection = moduleRef.get<mongoose.Connection>(getConnectionToken());

  // Pre-create collections for MongoDB transactions
  const collectionNames = [
    'pending_registrations',
    'users',
    'sessions',
    'referrals',
    'credit_transactions',
    'deleted_identities',
  ];
  for (const col of collectionNames) {
    try {
      await connection.createCollection(col);
    } catch {
      // Ignore if already exists
    }
  }

  return {
    app,
    baseUrl,
    replSet,
    connection,
    sentEmails,
    mailServiceMock,
  };
}

export async function closeTestApp(instance: TestAppInstance): Promise<void> {
  if (instance.app) {
    await instance.app.close();
  }
  await mongoose.disconnect();
  if (instance.replSet) {
    await instance.replSet.stop();
  }
}
