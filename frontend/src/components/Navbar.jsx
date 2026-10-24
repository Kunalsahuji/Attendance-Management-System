import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { useLogoutMutation } from '../store/api/authApi';
import {
  Clock,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutApi] = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      dispatch(logoutUser());
      navigate('/login');
    }
  };

  const roleTheme = {
    Admin: {
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400'
    },
    Manager: {
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      dot: 'bg-indigo-400'
    },
    Employee: {
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      dot: 'bg-sky-400'
    }
  }[user?.role] || {
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    dot: 'bg-slate-400'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 transition w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 font-bold text-base sm:text-lg text-white group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight tracking-tight text-white flex items-center gap-1.5 font-bold">
                  Attend<span className="text-indigo-400">Sphere</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  D-Table Analytics
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-800">
                {user.role === 'Employee' && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive('/dashboard')
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> My Attendance
                  </Link>
                )}

                {(user.role === 'Manager' || user.role === 'Admin') && (
                  <Link
                    to="/team"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive('/team')
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Team Review
                  </Link>
                )}

                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive('/admin')
                        ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
                  </Link>
                )}

                <Link
                  to="/reports"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/reports')
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Daily Reports
                </Link>
              </div>
            )}
          </div>

          {/* Right Section: User Pill & Actions */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* User Identity Pill */}
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-100 leading-none">{user.name}</span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{user.department || 'Operations'}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${roleTheme.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleTheme.dot}`} />
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            {user.role === 'Employee' && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                My Attendance
              </Link>
            )}
            {(user.role === 'Manager' || user.role === 'Admin') && (
              <Link
                to="/team"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Team Review
              </Link>
            )}
            {user.role === 'Admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Admin Panel
              </Link>
            )}
            <Link
              to="/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Daily Reports
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
