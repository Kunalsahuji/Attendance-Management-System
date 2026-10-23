import { apiSlice } from './apiSlice';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceStatus: builder.query({
      query: () => '/attendance/status',
      providesTags: ['Attendance']
    }),
    punchIn: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-in',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Attendance', 'Reports']
    }),
    punchOut: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-out',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Attendance', 'Reports']
    }),
    getMyHistory: builder.query({
      query: (params) => ({
        url: '/attendance/my-history',
        params
      }),
      providesTags: ['Attendance']
    }),
    getTeamAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/team',
        params
      }),
      providesTags: ['Attendance']
    }),
    getAllAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/all',
        params
      }),
      providesTags: ['Attendance']
    }),
    verifyAttendance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}/verify`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Attendance', 'Reports']
    })
  })
});

export const {
  useGetAttendanceStatusQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyHistoryQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useVerifyAttendanceMutation
} = attendanceApi;
