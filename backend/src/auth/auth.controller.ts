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
} from '@nestjs/common';
import type { Response, Request } from 'express';
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
} from '@palmsight/shared';
import { AuthService } from './auth.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
    @Req() req: Request & { skipEmailDispatch?: boolean },
    @Res({ passthrough: true }) res: Response,
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

    res.status(HttpStatus.ACCEPTED);
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

    const isProd = this.configService.get('NODE_ENV') === 'production';
    const refreshTtlDays = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS', 30));

    res.cookie('rt', rawRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: refreshTtlDays * 24 * 60 * 60 * 1000,
    });

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

    const isProd = this.configService.get('NODE_ENV') === 'production';
    const refreshTtlDays = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS', 30));

    res.cookie('rt', rawRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: refreshTtlDays * 24 * 60 * 60 * 1000,
    });

    return authResponse;
  }
}
