import axios, { AxiosRequestConfig } from 'axios';

// ── In-memory token store ─────────────────────────────────────────────────────
// Access token is NEVER stored in localStorage — memory only.
let inMemoryToken: string | null = null;

export const setToken = (token: string | null) => { inMemoryToken = token; };
export const getToken = () => inMemoryToken;

// ── Axios instance ────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends HttpOnly refresh token cookie on every request
});

// ── Refresh queue (handles concurrent 401s) ───────────────────────────────────
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

const flushQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(entry => error ? entry.reject(error) : entry.resolve(token!));
  failedQueue = [];
};

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use(config => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// ── Response interceptor — refresh on 401 ────────────────────────────────────
interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original: RetryConfig = err.config ?? {};
    const status = err.response?.status;

    // Skip refresh loop if this request is itself the refresh endpoint
    if (status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const newToken: string = data?.data?.accessToken;
      setToken(newToken);
      flushQueue(null, newToken);
      original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
      return api(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      setToken(null);
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
