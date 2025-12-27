import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { SocketProvider } from './context/SocketContext'
import { useRTL } from './lib/rtl-utils'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import LandingPage from './pages/LandingPage'
import QuizPage from './pages/QuizPage'
import StudentsPage from './pages/StudentsPage'
import AcademicsPage from './pages/AcademicsPage'
import LibraryPage from './pages/LibraryPage'
import AdminPage from './pages/AdminPage'
import MessagesPage from './pages/MessagesPage'
import TeachersPage from './pages/TeachersPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import I18nDemoPage from './pages/I18nDemoPage'
import { Analytics } from '@vercel/analytics/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/query-client'

function App() {
  // Initialize RTL support
  useRTL()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="teachers" element={<TeachersPage />} />
                  <Route path="academics" element={<AcademicsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="quiz" element={<QuizPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="i18n-demo" element={<I18nDemoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Analytics />
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}


export default App

