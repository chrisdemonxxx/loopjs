import { api } from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'viewer';
  displayName?: string;
  profilePicture?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  };
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface AuthResponse {
  user: User;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', credentials);

    // Store token and user data
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ message: string; username: string }> {
    return api.post('/register', data);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.get('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AuthResponse> {
    return api.get<AuthResponse>('/me');
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/refresh-token');
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }
    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return api.post('/user/password/change', { currentPassword, newPassword });
  }

  /**
   * Update user profile
   */
  async updateProfile(data: { displayName?: string; preferences?: any }): Promise<{ user: User }> {
    const response = await api.put<{ user: User }>('/user/profile', data);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<{ user: User }> {
    return api.get('/user/profile');
  }
}

export const authService = new AuthService();
export default authService;
