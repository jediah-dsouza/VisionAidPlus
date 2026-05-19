import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { login, logout, register, clearError } from '../store/authSlice';
import type { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user, error } = useAppSelector(state => state.auth);

  const loginUser = useCallback(
    async (credentials: LoginCredentials) => {
      await dispatch(login(credentials));
    },
    [dispatch],
  );

  const registerUser = useCallback(
    async (data: RegisterData) => {
      await dispatch(register(data));
    },
    [dispatch],
  );

  const logoutUser = useCallback(async () => {
    await dispatch(logout());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    login: loginUser,
    logout: logoutUser,
    register: registerUser,
    clearError: clearAuthError,
  };
};
