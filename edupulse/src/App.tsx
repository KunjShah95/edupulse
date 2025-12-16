import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="students" element={<div className="p-6 text-white">Students Management Module (Coming Soon)</div>} />
        <Route path="academics" element={<div className="p-6 text-white">Academics Module (Coming Soon)</div>} />
        <Route path="library" element={<div className="p-6 text-white">Library Module (Coming Soon)</div>} />
        <Route path="admin" element={<div className="p-6 text-white">Administration Module (Coming Soon)</div>} />
        <Route path="messages" element={<div className="p-6 text-white">Messages/Communication Module (Coming Soon)</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


export default App
