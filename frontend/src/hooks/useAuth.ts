import { useState, useEffect, useCallback } from 'react';
import request from '@/axios';
import toast from 'react-hot-toast';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
      
      if (token && isAuthStored) {
        try {
          // Verify token is still valid
          const response = await request({
            url: '/auth/verify',
            method: 'GET'
          });

          if (response.data.success) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: response.data.data.user
            });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isAuthenticated');
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('isAuthenticated');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await request({
        url: '/auth/login',
        method: 'POST',
        data: credentials
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('isAuthenticated', 'true');
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user
        });

        toast.success('Login successful!');
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error(response.data.message || 'Login failed');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });

    toast.success('Logged out successfully');
  }, []);

  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      logout();
      return false;
    }

    try {
      const response = await request({
        url: '/auth/refresh',
        method: 'POST',
        data: { refreshToken: refreshTokenValue }
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  return {
    ...authState,
    login,
    logout,
    refreshToken
  };
};
