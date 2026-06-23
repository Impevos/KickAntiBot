import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChannelProvider } from './context/ChannelContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { ChannelGate } from './components/ChannelGate';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BotActivityPage } from './pages/BotActivityPage';
import { ProtectionSettingsPage } from './pages/ProtectionSettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <ChannelProvider>
                  <DashboardLayout />
                </ChannelProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<ChannelGate><DashboardPage /></ChannelGate>} />
            <Route path="/bot-activity" element={<ChannelGate><BotActivityPage /></ChannelGate>} />
            <Route path="/protection" element={<ChannelGate><ProtectionSettingsPage /></ChannelGate>} />
            <Route path="/logs" element={<ChannelGate><ActivityLogsPage /></ChannelGate>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
