import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '@/shared/types/api.types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    },
    markInitialized(state) {
      state.isInitialized = true;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem('accessToken');
    },
  },
});

export const { setCredentials, markInitialized, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
