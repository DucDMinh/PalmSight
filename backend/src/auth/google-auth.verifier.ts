import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

@Injectable()
export class GoogleAuthVerifier {
  private readonly client = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    const audience = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new Error('Missing sub claim');

      return {
        sub: payload.sub,
        email: payload.email ? payload.email.toLowerCase() : null,
        emailVerified: payload.email_verified === true,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      };
    } catch {
      throw new UnauthorizedException({
        code: 'OAUTH_INVALID_TOKEN',
        message: 'Không xác minh được tài khoản Google. Vui lòng thử lại.',
      });
    }
  }
}
