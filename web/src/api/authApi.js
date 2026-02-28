import axiosInstance from './axiosInstance';

export const login = (credentials) =>
  axiosInstance.post('/auth/login', credentials);

export const register = (userData) =>
  axiosInstance.post('/auth/register', userData);

export const getProfile = () =>
  axiosInstance.get('/auth/me');
