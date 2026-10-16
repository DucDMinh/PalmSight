import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GoogleLoginButton from "./GoogleLoginButton";
import authService from "@/services/authService";
import { AuthenticationProvider } from "@/providers/AuthenticationProvider";
import BaseUrl from "@/consts/baseUrl";

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("GoogleLoginButton", () => {
  let gsiCallback: ((response: GoogleCredentialResponse) => void) | undefined;
  const initialize = vi.fn((config: GoogleIdConfiguration) => {
    gsiCallback = config.callback;
  });
  const renderButton = vi.fn();

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AuthenticationProvider skipInitialRefresh>
          <GoogleLoginButton />
        </AuthenticationProvider>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.restoreAllMocks();
    mockedNavigate.mockReset();
    initialize.mockClear();
    renderButton.mockClear();
    gsiCallback = undefined;
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
    window.google = {
      accounts: { id: { initialize, renderButton, disableAutoSelect: vi.fn() } },
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.google;
  });

  it("renders the official Google button with the configured client ID", async () => {
    renderComponent();

    await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(1));
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "test-client-id.apps.googleusercontent.com" })
    );
    expect(renderButton.mock.calls[0][1]).toMatchObject({ text: "signin_with", locale: "vi" });
  });

  it("sends the Google credential to the API and routes a new user to referral entry", async () => {
    vi.spyOn(authService, "postGoogleLogin").mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      isNewUser: true,
      user: {
        id: "u1",
        displayName: "Google User",
        username: null,
        avatarUrl: null,
        creditBalance: 3,
        referralCode: "ABCDEFGH",
      },
    });

    renderComponent();
    await waitFor(() => expect(gsiCallback).toBeDefined());

    await act(async () => {
      gsiCallback?.({ credential: "google-id-token" });
    });

    await waitFor(() => {
      expect(authService.postGoogleLogin).toHaveBeenCalledWith({ idToken: "google-id-token" });
      expect(mockedNavigate).toHaveBeenCalledWith(BaseUrl.ReferralEnter);
    });
  });

  it("shows a disabled fallback when no client ID is configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    renderComponent();

    expect(screen.getByRole("button", { name: /Đăng nhập bằng Google/ })).toBeDisabled();
    expect(initialize).not.toHaveBeenCalled();
  });
});
