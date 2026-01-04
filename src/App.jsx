import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { JourneyProvider } from "./contexts/JourneyContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, PublicRoute, AuthRedirect } from "./components/auth/ProtectedRoute";
import LandingPage from "./LandingPage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import VideosPage from "./pages/VideosPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

import { DashboardProvider } from "./hooks/useDashboardState";

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <JourneyProvider>
            <DashboardProvider>
              <ErrorBoundary>
                <BrowserRouter>
                  <Routes>
                    {/* Página inicial - redireciona para dashboard se logado */}
                    <Route path="/" element={
                      <AuthRedirect>
                        <LandingPage />
                      </AuthRedirect>
                    } />

                    {/* Rotas públicas - redireciona para dashboard se já logado */}
                    <Route path="/login" element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    } />
                    <Route path="/register" element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    } />
                    <Route path="/forgot-password" element={
                      <PublicRoute>
                        <ForgotPasswordPage />
                      </PublicRoute>
                    } />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    {/* Rotas protegidas - requer autenticação */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<DashboardHome />} />
                      <Route path="videos" element={<VideosPage />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </DashboardProvider>
          </JourneyProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
