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

  const renderComponent = (initialEntries = ["/"]) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthenticationProvider skipInitialRefresh>
          <GoogleLoginButton />
        </AuthenticationProvider>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
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

  it("sends claimToken from sessionStorage and redirects to claimed reading on success", async () => {
    sessionStorage.setItem("ps_claim_token", "claim-token-xyz");
    vi.spyOn(authService, "postGoogleLogin").mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      isNewUser: true,
      user: {
        id: "u1",
        displayName: "Google User",
        username: null,
        avatarUrl: null,
        creditBalance: 2,
        referralCode: "ABCDEFGH",
      },
      claimedReadingId: "claimed-reading-123",
    });

    renderComponent();
    await waitFor(() => expect(gsiCallback).toBeDefined());

    await act(async () => {
      gsiCallback?.({ credential: "google-id-token" });
    });

    await waitFor(() => {
      expect(authService.postGoogleLogin).toHaveBeenCalledWith({
        idToken: "google-id-token",
        claimToken: "claim-token-xyz",
      });
      expect(mockedNavigate).toHaveBeenCalledWith("/readings/claimed-reading-123");
      expect(sessionStorage.getItem("ps_claim_token")).toBeNull();
    });
  });

  it("sends claimToken from URL query when present", async () => {
    vi.spyOn(authService, "postGoogleLogin").mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      isNewUser: false,
      user: {
        id: "u1",
        displayName: "Google User",
        username: "googleuser",
        avatarUrl: null,
        creditBalance: 3,
        referralCode: "ABCDEFGH",
      },
    });

    renderComponent(["/login?claimToken=query-claim-token"]);
    await waitFor(() => expect(gsiCallback).toBeDefined());

    await act(async () => {
      gsiCallback?.({ credential: "google-id-token" });
    });

    await waitFor(() => {
      expect(authService.postGoogleLogin).toHaveBeenCalledWith({
        idToken: "google-id-token",
        claimToken: "query-claim-token",
      });
      expect(mockedNavigate).toHaveBeenCalledWith(BaseUrl.Scan);
    });
  });

  it("shows a disabled fallback when no client ID is configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    renderComponent();

    expect(screen.getByRole("button", { name: /Đăng nhập bằng Google/ })).toBeDisabled();
    expect(initialize).not.toHaveBeenCalled();
  });
});
