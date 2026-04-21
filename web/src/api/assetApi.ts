import api from './axiosInstance';
import type { ApiResponse } from '../types/auth.types';

export interface AssetImage { id: number; filePath: string; primary: boolean; }
export interface Asset {
  id: number; name: string; category: string; description: string | null;
  serialNumber: string | null; assetTag: string; status: string;
  images: AssetImage[]; createdAt: string; updatedAt: string;
}
export interface PageResponse<T> {
  content: T[]; page: number; size: number;
  totalElements: number; totalPages: number; last: boolean;
}
export interface AssetRequest {
  name: string; category: string; description?: string;
  serialNumber?: string; assetTag: string;
}

export const getAssets = (page = 0, size = 20, status?: string) =>
  api.get<ApiResponse<PageResponse<Asset>>>('/assets', { params: { page, size, status: status || undefined } })
     .then(r => r.data.data!);

export const searchAssets = (q: string, page = 0, size = 20) =>
  api.get<ApiResponse<PageResponse<Asset>>>('/assets/search', { params: { q, page, size } })
     .then(r => r.data.data!);

export const getAsset = (id: number) =>
  api.get<ApiResponse<Asset>>(`/assets/${id}`).then(r => r.data.data!);

export const createAsset = (data: AssetRequest) =>
  api.post<ApiResponse<Asset>>('/assets', data).then(r => r.data.data!);

export const updateAsset = (id: number, data: AssetRequest) =>
  api.put<ApiResponse<Asset>>(`/assets/${id}`, data).then(r => r.data.data!);

export const retireAsset = (id: number) =>
  api.delete<ApiResponse<null>>(`/assets/${id}`).then(r => r.data);

export const addAssetImage = (id: number, file: File, primary = false) => {
  const form = new FormData();
  form.append('file', file);
  form.append('primary', String(primary));
  return api.post<ApiResponse<Asset>>(`/assets/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data!);
};
