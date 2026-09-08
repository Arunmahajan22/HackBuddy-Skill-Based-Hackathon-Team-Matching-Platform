import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import CreateTeamPage from './pages/CreateTeamPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import MatchesPage from './pages/MatchesPage';

/**
 * Route protection wrapper.
 * Waits for session rehydration before determining authentication redirect.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading HackBuddy…
          </span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-ink-950">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <RegisterPage />}
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/new"
        element={
          <ProtectedRoute>
            <CreateTeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
      />
      <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />}
      />
    </Routes>
  );
}
