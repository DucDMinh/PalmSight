import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthenticationProvider, useAuth } from './AuthenticationProvider';
import httpService from '@/services/httpService';
import authService from '@/services/authService';

const TestConsumer = () => {
  const { isLogged, accessToken, user, setAuthSession, logout } = useAuth();
  return (
    <div>
      <div data-testid="is-logged">{String(isLogged)}</div>
      <div data-testid="access-token">{accessToken || 'null'}</div>
      <div data-testid="user-name">{user?.displayName || 'null'}</div>
      <div data-testid="user-credits">{user?.creditBalance ?? 'null'}</div>
      <button
        onClick={() =>
          setAuthSession({
            accessToken: 'test-jwt-token',
            user: {
              id: '6710a1b2c3d4e5f6a7b8c9d0',
              displayName: 'Nguyễn Văn A',
              username: 'nguyenvana',
              avatarUrl: null,
              creditBalance: 3,
              referralCode: 'K7QX4MZP',
            },
          })
        }
      >
        Set Session
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthenticationProvider (In-Memory Token)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    httpService.setInMemoryToken(null);
    vi.restoreAllMocks();
  });

  it('should initialize with unauthenticated in-memory state', () => {
    render(
      <AuthenticationProvider skipInitialRefresh>
        <TestConsumer />
      </AuthenticationProvider>
    );

    expect(screen.getByTestId('is-logged').textContent).toBe('false');
    expect(screen.getByTestId('access-token').textContent).toBe('null');
    expect(screen.getByTestId('user-name').textContent).toBe('null');
  });

  it('should store accessToken in memory ONLY (never in localStorage)', async () => {
    render(
      <AuthenticationProvider skipInitialRefresh>
        <TestConsumer />
      </AuthenticationProvider>
    );

    // Set authenticated session
    await act(async () => {
      screen.getByText('Set Session').click();
    });

    // In-memory state updated
    expect(screen.getByTestId('is-logged').textContent).toBe('true');
    expect(screen.getByTestId('access-token').textContent).toBe('test-jwt-token');
    expect(screen.getByTestId('user-name').textContent).toBe('Nguyễn Văn A');
    expect(screen.getByTestId('user-credits').textContent).toBe('3');

    // Security check: localStorage must NOT contain the access token
    expect(localStorage.getItem('token')).toBeNull();
    // httpService in-memory getter should return the token
    expect(httpService.getInMemoryToken()).toBe('test-jwt-token');
  });

  it('should clear in-memory state and httpService on logout', async () => {
    vi.spyOn(authService, 'postLogout').mockResolvedValue(undefined);

    render(
      <AuthenticationProvider skipInitialRefresh>
        <TestConsumer />
      </AuthenticationProvider>
    );

    // Log in
    await act(async () => {
      screen.getByText('Set Session').click();
    });
    expect(screen.getByTestId('is-logged').textContent).toBe('true');

    // Logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('is-logged').textContent).toBe('false');
    expect(screen.getByTestId('access-token').textContent).toBe('null');
    expect(screen.getByTestId('user-name').textContent).toBe('null');
    expect(httpService.getInMemoryToken()).toBeNull();
  });
});
