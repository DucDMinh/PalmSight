import { useQuery } from "@tanstack/react-query";
import accountService from "../services";
import type { MeResponseDto } from "@palmsight/shared";
import { useAuth, parseJwt, AuthUser } from "@/providers/AuthenticationProvider";
import { useEffect, useMemo } from "react";

export const ME_QUERY_KEY = ["me"];

export const buildSynthesizedMe = (
  user: AuthUser | null,
  accessToken: string | null
): MeResponseDto | undefined => {
  if (!user) return undefined;
  const decoded = accessToken ? parseJwt<{ email?: string }>(accessToken) : null;
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://palmsight.app";
  const referralCode = user.referralCode || "";

  return {
    id: user.id || "",
    displayName: user.displayName || "",
    username: user.username ?? null,
    email: user.email || decoded?.email || null,
    avatarUrl: user.avatarUrl ?? null,
    creditBalance: user.creditBalance ?? 0,
    referralCode,
    referralLink: user.referralLink || `${origin}/r/${referralCode}`,
    hasPassword: user.hasPassword !== undefined ? user.hasPassword : true,
    providers: user.providers || [],
    referral: user.referral || {
      canEnterCode: true,
      enteredCode: null,
    },
  };
};

export const useMeQuery = () => {
  const { user, accessToken, updateUser } = useAuth();

  const synthesizedInitial = useMemo(
    () => buildSynthesizedMe(user, accessToken),
    [user, accessToken]
  );

  const query = useQuery<MeResponseDto>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await accountService.getMe(synthesizedInitial);
      } catch {
        if (synthesizedInitial) {
          return synthesizedInitial;
        }
        throw new Error("Unable to fetch user account details");
      }
    },
    initialData: synthesizedInitial,
  });

  useEffect(() => {
    if (query.data) {
      updateUser(query.data);
    }
  }, [query.data, updateUser]);

  return query;
};

export default useMeQuery;

