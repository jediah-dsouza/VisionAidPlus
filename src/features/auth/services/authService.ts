import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';
import { logger } from '@core/debug';

class AuthService {
  private baseUrl = 'https://api.visionaid.example.com';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.info('Auth: Login attempt', { email: credentials.email });

    // Mock implementation - replace with real API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: 'user-001',
      email: credentials.email,
      name: credentials.email.split('@')[0],
      createdAt: new Date().toISOString(),
      emergencyContacts: [],
    };

    return {
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    logger.info('Auth: Register attempt', { email: data.email });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: 'user-' + Date.now(),
      email: data.email,
      name: data.name,
      createdAt: new Date().toISOString(),
      emergencyContacts: [],
    };

    return {
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    logger.info('Auth: Token refresh');

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      user: {} as User,
      token: 'mock-jwt-token-refreshed-' + Date.now(),
      refreshToken,
    };
  }

  async logout(): Promise<void> {
    logger.info('Auth: Logout');
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async validateToken(token: string): Promise<boolean> {
    logger.debug('Auth: Validating token');
    return token.startsWith('mock-jwt-token');
  }
}

export const authService = new AuthService();
