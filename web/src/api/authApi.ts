import api from './axiosInstance';
import type { LoginRequest, RegisterRequest, ApiResponse, AuthResponse, User } from '../types/auth.types';

export const login = (credentials: LoginRequest) =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);

export const register = (userData: RegisterRequest) =>
  api.post<ApiResponse<AuthResponse>>('/auth/register', userData);

export const refreshToken = () =>
  api.post<ApiResponse<AuthResponse>>('/auth/refresh', {});

export const logout = () =>
  api.post<ApiResponse<null>>('/auth/logout', {});

export const getProfile = () =>
  api.get<ApiResponse<User>>('/auth/me');
