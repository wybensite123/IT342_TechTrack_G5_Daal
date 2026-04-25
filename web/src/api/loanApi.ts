import api from './axiosInstance';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse } from './assetApi';

export interface LoanBorrower {
  id: number; firstName: string; lastName: string;
  email: string; studentId: string | null; department: string | null;
}
export interface LoanAsset {
  id: number; name: string; category: string; assetTag: string; status: string;
}
export interface Loan {
  id: number; borrower: LoanBorrower; asset: LoanAsset;
  purpose: string; status: string; requestedReturnDate: string;
  approvedBy: number | null; approvedAt: string | null;
  actualReturnDate: string | null; conditionOnReturn: string | null;
  rejectionReason: string | null; requestedAt: string;
}
export interface LoanRequest {
  assetId: number; purpose: string; requestedReturnDate: string;
}
export interface LoanHistory {
  id: number; loanId: number; action: string;
  actorId: number | null; actorName: string | null; notes: string | null;
  createdAt: string;
  borrowerName: string; borrowerEmail: string;
  assetName: string; assetTag: string; loanStatus: string;
}

export const submitLoan = (data: LoanRequest) =>
  api.post<ApiResponse<Loan>>('/loans', data).then(r => r.data.data!);

export const getMyLoans = (page = 0, size = 20) =>
  api.get<ApiResponse<PageResponse<Loan>>>('/loans/my', { params: { page, size } })
     .then(r => r.data.data!);

export const getAllLoans = (page = 0, size = 50) =>
  api.get<ApiResponse<PageResponse<Loan>>>('/loans', { params: { page, size } })
     .then(r => r.data.data!);

export const approveLoan = (id: number) =>
  api.put<ApiResponse<Loan>>(`/loans/${id}/approve`).then(r => r.data.data!);

export const rejectLoan = (id: number, rejectionReason: string) =>
  api.put<ApiResponse<Loan>>(`/loans/${id}/reject`, { rejectionReason }).then(r => r.data.data!);

export const returnLoan = (id: number, conditionOnReturn: 'GOOD' | 'DAMAGED') =>
  api.put<ApiResponse<Loan>>(`/loans/${id}/return`, { conditionOnReturn }).then(r => r.data.data!);

export const getAllLoanHistory = (page = 0, size = 50) =>
  api.get<ApiResponse<PageResponse<LoanHistory>>>('/loans/history', { params: { page, size } })
     .then(r => r.data.data!);
