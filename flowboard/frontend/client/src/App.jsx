import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider }         from './context/ThemeContext';
import { TaskProvider }          from './context/TaskContext';
import { ProjectProvider }       from './context/ProjectContext';

import Navbar        from './components/layout/Navbar';
import Spinner       from './components/ui/Spinner';

import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';
import BoardPage    from './pages/BoardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import JoinTeamPage  from './pages/JoinTeamPage';

// ── Protected layout wrapper ──────────────────────────────────────────────
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400 font-medium">Loading FlowBoard…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ProjectProvider>
      <TaskProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0E14] transition-colors duration-300">
          <Navbar />
          <Outlet />
        </div>
      </TaskProvider>
    </ProjectProvider>
  );
}

// ── Guest guard (redirect if already logged in) ───────────────────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"  element={<GuestRoute><LoginPage  /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/"          element={<BoardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/join"      element={<JoinTeamPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            },
            success: {
              style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
