import { apiSlice } from './apiSlice';

export const reportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDailyReport: builder.query({
      query: (params) => ({
        url: '/reports/daily',
        params
      }),
      providesTags: ['Reports']
    }),
    getDashboardStats: builder.query({
      query: () => '/reports/dashboard-stats',
      providesTags: ['Reports', 'Attendance', 'Overtime']
    })
  })
});

export const {
  useGetDailyReportQuery,
  useGetDashboardStatsQuery
} = reportApi;
