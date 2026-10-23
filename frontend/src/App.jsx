import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMeQuery } from './store/api/authApi';
import { setCredentials, setInitialized } from './store/slices/authSlice';

// Components & Pages
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DailyReport from './pages/DailyReport';

function DashboardRedirect() {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'Manager') {
    return <Navigate to="/team" replace />;
  }
  return <EmployeeDashboard />;
}

function RootRedirect() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'Manager') return <Navigate to="/team" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const { data: meData, isError, isSuccess } = useGetMeQuery();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isSuccess && meData?.user) {
      dispatch(setCredentials({ user: meData.user }));
    } else if (isError) {
      dispatch(setInitialized());
    }
  }, [isSuccess, isError, meData, dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={isAuthenticated ? <RootRedirect /> : <Login />}
            />
            <Route
              path="/signup"
              element={isAuthenticated ? <RootRedirect /> : <Signup />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/team"
              element={
                <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <DailyReport />
                </ProtectedRoute>
              }
            />

            {/* Root & Fallback */}
            <Route
              path="/"
              element={<RootRedirect />}
            />
            <Route
              path="*"
              element={<RootRedirect />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
