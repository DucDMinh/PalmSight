import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import {
  PendingRegistration,
  PendingRegistrationSchema,
} from '../schemas/pending-registration.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Session, SessionSchema } from '../schemas/session.schema';
import { Referral, ReferralSchema } from '../schemas/referral.schema';
import {
  DeletedIdentity,
  DeletedIdentitySchema,
} from '../schemas/deleted-identity.schema';

import { MailModule } from '../mail/mail.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PendingRegistration.name, schema: PendingRegistrationSchema },
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: DeletedIdentity.name, schema: DeletedIdentitySchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'default-jwt-secret-palm-sight-dev'),
        signOptions: {
          expiresIn: Number(config.get('JWT_ACCESS_TTL_SECONDS', 900)),
        },
      }),
    }),
    MailModule,
    CreditsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
