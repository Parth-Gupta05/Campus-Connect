import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import PublicProfile from './pages/PublicProfile';
import Appearance from './pages/Appearance';
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
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminOpportunities from './pages/admin/AdminOpportunities';
import AdminOpportunityDetail from './pages/admin/AdminOpportunityDetail';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentDetail from './pages/admin/AdminStudentDetail';
import AdminClubs from './pages/admin/AdminClubs';

function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background-100 text-gray-1000 selection:bg-gray-1000 selection:text-background-100 font-sans transition-colors duration-200">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col bg-background-100">
        <Topbar showSearch={false} />
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

function MainLayout({ children }) {
  const location = useLocation();
  const hideSearchRoutes = ['/admin', '/club']; 
  const showSearch = !hideSearchRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Topbar showSearch={showSearch} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/student/:uid" element={<PublicProfile />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <StudentDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <StudentProfile />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/appearance" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <Appearance />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/opportunities" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <Opportunities />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/placements" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <PlacementFeed />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/placements/create" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <CreatePlacementPost />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/placements/edit/:id" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <CreatePlacementPost />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/placements/:id" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <PlacementPostDetail />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/certificates" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MainLayout>
                    <Certificates />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/clubs" element={
                <ProtectedRoute allowedRoles={['student', 'club', 'admin']}>
                  <MainLayout>
                    <Clubs />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/events" element={
                <ProtectedRoute allowedRoles={['student', 'club', 'admin']}>
                  <MainLayout>
                    <Events />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/clubs/:id" element={
                <ProtectedRoute allowedRoles={['student', 'club', 'admin']}>
                  <MainLayout>
                    <ClubProfile />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/club" element={
                <ProtectedRoute allowedRoles={['club']}>
                  <MainLayout>
                    <ClubDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/club/profile" element={
                <ProtectedRoute allowedRoles={['club']}>
                  <MainLayout>
                    <ClubProfile />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={<Navigate to="/admin/opportunities" replace />} />

              <Route path="/admin/opportunities" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminOpportunities />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/opportunities/:id" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminOpportunityDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/students" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminStudents />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/students/:id" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminStudentDetail />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/clubs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminClubs />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
