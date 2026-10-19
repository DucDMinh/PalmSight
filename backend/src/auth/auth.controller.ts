import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request, CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  LoginRequestDto,
  AuthResponseDto,
  registerSchema,
  loginSchema,
  GoogleAuthRequestDto,
  googleAuthSchema,
  FacebookAuthRequestDto,
  facebookAuthSchema,
  RefreshTokenResponseDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@palmsight/shared';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { OriginGuard } from './guards/origin.guard';
import { GoogleAuthVerifier } from './google-auth.verifier';
import { FacebookAuthVerifier } from './facebook-auth.verifier';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly googleAuthVerifier: GoogleAuthVerifier,
    private readonly facebookAuthVerifier: FacebookAuthVerifier,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() body: RegisterRequestDto): Promise<RegisterResponseDto> {
    const validated = await registerSchema.validate(body, { abortEarly: false });
    return this.authService.register(validated);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthRateLimitGuard)
  async resendVerification(
    @Body() body: ResendVerificationRequestDto,
    @Req() req: Request & { skipEmailDispatch?: boolean }
  ): Promise<void> {
    if (!body?.email || typeof body.email !== 'string') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu gửi lên không hợp lệ.',
        details: {
          fields: [{ field: 'email', message: 'Email không được để trống' }],
        },
      });
    }

    if (!req.skipEmailDispatch) {
      await this.authService.resendVerification(body);
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() body: VerifyEmailRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    if (!body?.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu gửi lên không hợp lệ.',
        details: {
          fields: [{ field: 'token', message: 'Mã xác thực không được để trống' }],
        },
      });
    }

    const { authResponse, rawRefreshToken } = await this.authService.verifyEmail(
      body.token.trim(),
    );

    this.setRefreshCookie(res, rawRefreshToken);
    return authResponse;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const validated = await loginSchema.validate(body, { abortEarly: false });
    const rawIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const clientIp = rawIp.split(',')[0].trim();
    const currentRefreshToken = req.cookies?.rt;

    const { authResponse, rawRefreshToken } = await this.authService.login(
      validated,
      currentRefreshToken,
      clientIp,
    );

    this.setRefreshCookie(res, rawRefreshToken);
    return authResponse;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthRateLimitGuard)
  async forgotPassword(
    @Body() body: ForgotPasswordRequestDto,
    @Req() req: Request & { skipEmailDispatch?: boolean },
  ): Promise<void> {
    const validated = await forgotPasswordSchema.validate(body, { abortEarly: false });
    if (!req.skipEmailDispatch) {
      await this.passwordService.forgotPassword(validated);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthRateLimitGuard)
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<void> {
    const validated = await resetPasswordSchema.validate(body, { abortEarly: false });
    await this.passwordService.resetPassword(validated);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async google(
    @Body() body: GoogleAuthRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { idToken, code } = await googleAuthSchema.validate(body, { abortEarly: false });
    const profile = code
      ? await this.googleAuthVerifier.verifyCode(code)
      : await this.googleAuthVerifier.verify(idToken as string);

    const { authResponse, rawRefreshToken } = await this.authService.googleLogin(
      profile,
      req.cookies?.rt,
    );

    this.setRefreshCookie(res, rawRefreshToken);
    return authResponse;
  }

  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async facebook(
    @Body() body: FacebookAuthRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken } = await facebookAuthSchema.validate(body, { abortEarly: false });
    const profile = await this.facebookAuthVerifier.verify(accessToken);

    const { authResponse, rawRefreshToken } = await this.authService.facebookLogin(
      profile,
      req.cookies?.rt,
    );

    this.setRefreshCookie(res, rawRefreshToken);
    return authResponse;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OriginGuard, AuthRateLimitGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResponseDto> {
    try {
      const { tokens, rawRefreshToken } = await this.authService.refresh(req.cookies?.rt);
      this.setRefreshCookie(res, rawRefreshToken);
      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OriginGuard, AuthRateLimitGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.logout(req.cookies?.rt);
    this.clearRefreshCookie(res);
  }

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    const refreshTtlDays = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS', 30));
    res.cookie('rt', rawRefreshToken, {
      ...this.refreshCookieOptions(),
      maxAge: refreshTtlDays * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.cookie('rt', '', { ...this.refreshCookieOptions(), maxAge: 0 });
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    };
  }
}
