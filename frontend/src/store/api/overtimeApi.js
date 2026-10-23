import { apiSlice } from './apiSlice';

export const overtimeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitOvertimeRequest: builder.mutation({
      query: (data) => ({
        url: '/overtime/request',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Overtime', 'Reports']
    }),
    getMyOvertimeRequests: builder.query({
      query: () => '/overtime/my-requests',
      providesTags: ['Overtime']
    }),
    getTeamOvertimeRequests: builder.query({
      query: (params) => ({
        url: '/overtime/team-requests',
        params
      }),
      providesTags: ['Overtime']
    }),
    reviewOvertimeRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/overtime/${id}/review`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Overtime', 'Reports']
    })
  })
});

export const {
  useSubmitOvertimeRequestMutation,
  useGetMyOvertimeRequestsQuery,
  useGetTeamOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation
} = overtimeApi;
