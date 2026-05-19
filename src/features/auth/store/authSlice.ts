import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { storage, STORAGE_KEYS } from '../../../core';
import type { AuthState, LoginCredentials, RegisterData, User } from '../types';
import { authService } from '../services/authService';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
  await storage.remove(STORAGE_KEYS.USER_DATA);
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) throw new Error('No stored token');

  const userData = await storage.get<User>(STORAGE_KEYS.USER_DATA);
  return { token, user: userData };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user ?? null;
      })
      .addCase(loadStoredAuth.rejected, () => {
        // Silent reject - user not authenticated
      });
  },
});

export const { setUser, setToken, clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
