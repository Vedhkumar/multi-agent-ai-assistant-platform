/**
 * Auth hook wrapping auth store with route protection logic.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, token, isLoading, error, login, register, logout, clearError, checkAuth } =
    useAuthStore();

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };
}
