import httpService from './httpService';
import {
  AUTH_REGISTER_URL,
  AUTH_RESEND_VERIFICATION_URL,
  AUTH_VERIFY_EMAIL_URL,
  AUTH_REFRESH_URL,
  AUTH_LOGOUT_URL,
} from '@/consts/apiUrl';
import type {
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
} from '@palmsight/shared';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: {
    fields?: ApiFieldError[];
    [key: string]: unknown;
  };
}

class AuthService {
  async postRegister(data: RegisterRequestDto): Promise<RegisterResponseDto> {
    const response = await httpService.post(AUTH_REGISTER_URL, data);
    return response.data;
  }

  async postResendVerification(data: ResendVerificationRequestDto): Promise<void> {
    await httpService.post(AUTH_RESEND_VERIFICATION_URL, data);
  }

  async postVerifyEmail(data: VerifyEmailRequestDto): Promise<AuthResponseDto> {
    const response = await httpService.post(AUTH_VERIFY_EMAIL_URL, data);
    return response.data;
  }

  async postRefresh(): Promise<AuthResponseDto | RefreshTokenResponseDto> {
    const response = await httpService.post(AUTH_REFRESH_URL, {});
    return response.data;
  }

  async postLogout(): Promise<void> {
    await httpService.post(AUTH_LOGOUT_URL, {});
  }
}

export const authService = new AuthService();
export default authService;
