import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getManagers: builder.query({
      query: () => '/users/managers',
      providesTags: ['Users']
    }),
    getTeamMembers: builder.query({
      query: (params) => ({
        url: '/users/team-members',
        params
      }),
      providesTags: ['Users']
    }),
    getAllUsers: builder.query({
      query: () => '/users/all',
      providesTags: ['Users']
    }),
    assignManager: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/assign-manager`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Users', 'Attendance']
    })
  })
});

export const {
  useGetManagersQuery,
  useGetTeamMembersQuery,
  useGetAllUsersQuery,
  useAssignManagerMutation
} = userApi;
