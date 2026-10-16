import httpService from "@/services/httpService";
import { ME_URL, ME_REFERRAL_URL } from "@/consts/apiUrl";
import type { MeResponseDto, EnterReferralResponseDto } from "@palmsight/shared";
import useAuthStore from "@/stores/useAuthStore";
import { parseJwt } from "@/providers/AuthenticationProvider";

export class AccountService {
  async getMe(fallbackData?: Partial<MeResponseDto> | null): Promise<MeResponseDto> {
    try {
      const response = await httpService.get(ME_URL);
      return response.data as MeResponseDto;
    } catch {
      // Backend GET /api/v1/me may return 404 or fail; synthesize MeResponseDto from user + JWT token
      const state = useAuthStore.getState();
      const user = state.user;
      const token = state.accessToken || httpService.getInMemoryToken();
      const decoded = token ? parseJwt<{ email?: string }>(token) : null;
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://palmsight.app";
      const referralCode =
        fallbackData?.referralCode || user?.referralCode || "";

      return {
        id: fallbackData?.id || user?.id || "",
        displayName: fallbackData?.displayName || user?.displayName || "",
        username:
          fallbackData?.username !== undefined
            ? fallbackData.username
            : (user?.username ?? null),
        email: fallbackData?.email ?? user?.email ?? decoded?.email ?? null,
        avatarUrl:
          fallbackData?.avatarUrl !== undefined
            ? fallbackData.avatarUrl
            : (user?.avatarUrl ?? null),
        creditBalance: fallbackData?.creditBalance ?? user?.creditBalance ?? 0,
        referralCode,
        referralLink:
          fallbackData?.referralLink ||
          user?.referralLink ||
          `${origin}/r/${referralCode}`,
        hasPassword: fallbackData?.hasPassword ?? user?.hasPassword ?? true,
        providers: fallbackData?.providers || user?.providers || [],
        referral: fallbackData?.referral ||
          user?.referral || {
            canEnterCode: true,
            enteredCode: null,
          },
      };
    }
  }

  async enterReferral(code: string): Promise<EnterReferralResponseDto> {
    const response = await httpService.post(ME_REFERRAL_URL, {
      code: code.trim().toUpperCase(),
    });
    return response.data as EnterReferralResponseDto;
  }
}

export const accountService = new AccountService();
export default accountService;

