import api from './axiosInstance';
import type { ApiResponse } from '../types/auth.types';
import type { Asset, PageResponse } from './assetApi';

export const getMyWatchlist = (page = 0, size = 20) =>
  api.get<ApiResponse<PageResponse<Asset>>>('/watchlist', { params: { page, size } })
     .then(r => r.data.data!);

export const addToWatchlist = (assetId: number) =>
  api.post<ApiResponse<Asset>>(`/watchlist/${assetId}`).then(r => r.data.data!);

export const removeFromWatchlist = (assetId: number) =>
  api.delete<ApiResponse<null>>(`/watchlist/${assetId}`).then(r => r.data);

export const isWatched = (assetId: number) =>
  api.get<ApiResponse<{ watched: boolean }>>(`/watchlist/${assetId}/status`)
     .then(r => r.data.data?.watched ?? false);
