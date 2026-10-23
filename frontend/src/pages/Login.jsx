import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../store/api/authApi';
import { setCredentials } from '../store/slices/authSlice';
import { Clock, Shield, Users, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [loginApi, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const res = await loginApi({ email, password }).unwrap();
      dispatch(setCredentials(res));
      if (res.user?.role === 'Admin') {
        navigate('/admin');
      } else if (res.user?.role === 'Manager') {
        navigate('/team');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Invalid email or password.');
    }
  };

  // Quick 1-Click Demo Login Helper
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign In to Attend<span className="text-indigo-400">Sphere</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Attendance Management System with Live Selfie & Geolocation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@attendance.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Fast Evaluation (Disabled in Production) */}
          {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Fast Evaluation Logins
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  Dev/Local Only
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@attendance.com', 'AdminPassword123!')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 text-purple-300 transition cursor-pointer"
                >
                  <Shield className="w-4 h-4 mb-1 text-purple-400" />
                  <span className="text-[11px] font-semibold">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager@attendance.com', 'ManagerPassword123!')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-800/40 text-indigo-300 transition cursor-pointer"
                >
                  <Users className="w-4 h-4 mb-1 text-indigo-400" />
                  <span className="text-[11px] font-semibold">Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('employee@attendance.com', 'EmployeePassword123!')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 text-blue-300 transition cursor-pointer"
                >
                  <User className="w-4 h-4 mb-1 text-blue-400" />
                  <span className="text-[11px] font-semibold">Employee</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create an Employee account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
