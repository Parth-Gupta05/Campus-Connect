import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function NavigationDebug() {
  return (
    <div style={{ position: 'fixed', bottom: 10, left: 10, background: 'black', color: 'white', padding: 10, zIndex: 9999 }}>
      <h4>Debug Nav</h4>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link style={{color: 'lightblue'}} to="/">Landing</Link>
        <Link style={{color: 'lightblue'}} to="/signin">SignIn</Link>
        <Link style={{color: 'lightblue'}} to="/dashboard">Dashboard</Link>
        <Link style={{color: 'lightblue'}} to="/profile">Profile</Link>
        <Link style={{color: 'lightblue'}} to="/admin">Admin</Link>
      </div>
    </div>
  );
}

function AdminPlaceholder() {
  return (
    <div className="p-8 text-center text-on-surface">
      <h1 className="text-headline-lg mb-4">Admin Dashboard</h1>
      <p>Welcome, Admin! This is a placeholder for the global sidebar test.</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavigationDebug />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="flex bg-background min-h-screen text-on-surface">
                {/* Admin sidebar will be injected globally by the page wrappers, but for now we just show placeholder */}
                <AdminPlaceholder />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
