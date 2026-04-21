import api from './axiosInstance';
import type { ApiResponse, User } from '../types/auth.types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const uploadProfilePicture = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<ApiResponse<User>>('/profile/picture', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data!);
};

export const getProfilePictureUrl = (filename: string) =>
  `${BASE}/files/profiles/${filename}`;
