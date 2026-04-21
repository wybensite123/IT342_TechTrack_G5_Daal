export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  studentId?: string;
  department?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details: string | null } | null;
  timestamp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId?: string;
  department?: string;
}
