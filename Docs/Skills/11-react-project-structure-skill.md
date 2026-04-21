# Skill: React Web Frontend Project Structure
**Project:** TechTrack Inventory System  
**Stack:** Vite + React 18 + TypeScript + Axios

---

## Overview
This skill defines the canonical project setup, folder structure, naming conventions, Axios configuration with JWT interceptors, and state management approach for the TechTrack React web frontend.

---

## Project Bootstrap

```bash
npm create vite@latest techtrack-web -- --template react-ts
cd techtrack-web
npm install axios react-router-dom@6 react-query@5 react-hook-form zod @hookform/resolvers
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

---

## Folder Structure

```
techtrack-web/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                    ← App entry point
│   ├── App.tsx                     ← Router definition
│   │
│   ├── api/
│   │   ├── axiosInstance.ts        ← Configured Axios instance + interceptors
│   │   ├── authApi.ts              ← register, login, logout, refresh calls
│   │   ├── assetApi.ts             ← CRUD + search for assets
│   │   └── loanApi.ts              ← Loan workflow API calls
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx           ← Status badges (color-coded)
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── Pagination.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx         ← Admin sidebar
│   │   │   └── PageWrapper.tsx
│   │   ├── assets/
│   │   │   ├── AssetCard.tsx       ← Grid card for inventory
│   │   │   ├── AssetGrid.tsx
│   │   │   ├── AssetFilters.tsx    ← Search + category + status filters
│   │   │   └── LoanRequestModal.tsx
│   │   └── loans/
│   │       ├── LoanRow.tsx
│   │       ├── LoanStatusBadge.tsx
│   │       └── RejectModal.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx         ← Auth state, login/logout functions, role
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAssets.ts            ← React Query hooks for assets
│   │   └── useLoans.ts             ← React Query hooks for loans
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── borrower/
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── AssetDetailPage.tsx
│   │   │   └── MyLoansPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboardPage.tsx
│   │       ├── AdminAssetManagementPage.tsx
│   │       └── AdminLoanQueuePage.tsx
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   └── AdminRoute.tsx
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── asset.types.ts
│   │   ├── loan.types.ts
│   │   └── api.types.ts            ← ApiResponse<T> wrapper type
│   │
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── statusColors.ts         ← Map status → Tailwind color class
│   │   └── validators.ts
│   │
│   └── constants/
│       ├── assetCategories.ts
│       └── routes.ts               ← Route path constants
```

---

## Axios Instance with JWT Interceptors

```typescript
// src/api/axiosInstance.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // Required for HttpOnly refresh token cookie
});

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFromMemory(); // from AuthContext or memory store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post('/auth/refresh');
        const newAccessToken = response.data.data.accessToken;
        setAccessTokenInMemory(newAccessToken); // update memory store
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Auth Context

```typescript
// src/context/AuthContext.tsx
interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'ROLE_ADMIN' | 'ROLE_BORROWER';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isBorrower: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokenAndUser: (token: string, user: User) => void;
}

// Access token stored in-memory (module-level variable, NOT localStorage)
let inMemoryToken: string | null = null;

export const getAccessTokenFromMemory = () => inMemoryToken;
export const setAccessTokenInMemory = (token: string) => { inMemoryToken = token; };
export const clearAccessToken = () => { inMemoryToken = null; };
```

---

## React Query Setup

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,   // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});
```

### Example Hook
```typescript
// src/hooks/useAssets.ts
export const useAssets = (params: AssetFilterParams) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetApi.getAssets(params),
    select: (data) => data.data,  // unwrap ApiResponse
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetApi.getAssetById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};
```

---

## TypeScript Types

```typescript
// src/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: string | Record<string, string> | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// src/types/asset.types.ts
export type AssetStatus =
  | 'AVAILABLE'
  | 'PENDING_APPROVAL'
  | 'ON_LOAN'
  | 'UNDER_MAINTENANCE'
  | 'RETIRED';

export interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  serialNumber: string;
  assetTag: string;
  status: AssetStatus;
  images: AssetImage[];
  createdAt: string;
  updatedAt: string;
}

// src/types/loan.types.ts
export type LoanStatus = 'PENDING_APPROVAL' | 'ON_LOAN' | 'RETURNED' | 'REJECTED';

export interface Loan {
  id: string;
  asset: { id: string; name: string; assetTag: string };
  borrower: { id: string; firstname: string; lastname: string };
  purpose: string;
  status: LoanStatus;
  requestedReturnDate: string;
  approvedBy: { id: string; firstname: string } | null;
  approvedAt: string | null;
  actualReturnDate: string | null;
  conditionOnReturn: 'GOOD' | 'DAMAGED' | null;
  rejectionReason: string | null;
  requestedAt: string;
}
```

---

## Environment Variables

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1

# .env.production
VITE_API_BASE_URL=https://api.techtrack.railway.app/api/v1
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AssetCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAssets.ts` |
| Types/Interfaces | PascalCase | `AssetResponse` |
| API functions | camelCase | `getAssets()`, `approveLoan()` |
| Context | PascalCase + `Context` suffix | `AuthContext` |
| Pages | PascalCase + `Page` suffix | `InventoryPage.tsx` |
| CSS classes | Tailwind utilities only | `bg-blue-600 text-white` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE = 20` |

---

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
})
```
