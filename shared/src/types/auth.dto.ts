import { UserSummaryDto } from './user.dto';

export interface RegisterRequestDto {
  displayName: string;
  username: string;
  email: string;
  password: string;
  referralCode?: string;
}

export interface RegisterResponseDto {
  email: string;
  verificationExpiresAt: string;
}

export interface VerifyEmailRequestDto {
  token: string;
}

export interface ResendVerificationRequestDto {
  email: string;
}

export interface LoginRequestDto {
  login: string;
  password: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface GoogleAuthRequestDto {
  idToken: string;
}

export interface FacebookAuthRequestDto {
  accessToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponseDto {
  accessToken: string;
  expiresIn: number;
  isNewUser: boolean;
  user: UserSummaryDto;
}
