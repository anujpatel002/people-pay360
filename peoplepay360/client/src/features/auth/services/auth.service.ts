import httpClient from '@/shared/services/httpClient';
import { AuthUser } from '@/shared/types/api.types';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}

export async function refreshToken(): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/refresh');
  return data;
}
