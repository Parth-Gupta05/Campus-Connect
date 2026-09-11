import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import Certificates from './pages/Certificates';
import Opportunities from './pages/Opportunities';
import ClubDashboard from './pages/ClubDashboard';
import Clubs from './pages/Clubs';
import ClubProfile from './pages/ClubProfile';
import Events from './pages/Events';
import PlacementFeed from './pages/PlacementFeed';
import PlacementPostDetail from './pages/PlacementPostDetail';
import CreatePlacementPost from './pages/CreatePlacementPost';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

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
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
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

          <Route path="/opportunities" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Opportunities />
            </ProtectedRoute>
          } />

          <Route path="/placements" element={
            <ProtectedRoute allowedRoles={['student']}>
              <PlacementFeed />
            </ProtectedRoute>
          } />

          <Route path="/placements/create" element={
            <ProtectedRoute allowedRoles={['student']}>
              <CreatePlacementPost />
            </ProtectedRoute>
          } />

          <Route path="/placements/edit/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <CreatePlacementPost />
            </ProtectedRoute>
          } />

          <Route path="/placements/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <PlacementPostDetail />
            </ProtectedRoute>
          } />

          <Route path="/certificates" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Certificates />
            </ProtectedRoute>
          } />

          <Route path="/clubs" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Clubs />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Events />
            </ProtectedRoute>
          } />

          <Route path="/clubs/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ClubProfile />
            </ProtectedRoute>
          } />

          <Route path="/club" element={
            <ProtectedRoute allowedRoles={['club']}>
              <ClubDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="flex bg-background min-h-screen text-on-surface">
                <AdminPlaceholder />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
