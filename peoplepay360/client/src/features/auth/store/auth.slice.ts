import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '@/shared/types/api.types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      sessionStorage.setItem('accessToken', action.payload.accessToken);
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem('accessToken');
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
