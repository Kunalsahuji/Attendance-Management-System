import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
      if (action.payload.token) {
        sessionStorage.setItem('token', action.payload.token);
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      sessionStorage.removeItem('token');
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    }
  }
});

export const { setCredentials, logoutUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
