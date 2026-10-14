import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] dark:bg-[#0f1218] text-slate-900 dark:text-slate-100 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0d8a72] dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};
