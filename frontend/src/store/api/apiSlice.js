import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    credentials: 'include', // Automatically send and receive httpOnly cookies
    prepareHeaders: (headers) => {
      // In case a bearer token is present in sessionStorage for headless/fallback
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Auth', 'Attendance', 'Overtime', 'Users', 'Reports'],
  endpoints: () => ({})
});
