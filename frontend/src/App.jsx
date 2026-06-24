import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import SubjectAllocation from './pages/SubjectAllocation';
import GenerateTimetable from './pages/GenerateTimetable';
import MasterTimetable from './pages/MasterTimetable';
import TeacherTimetable from './pages/TeacherTimetable';
import ClassTimetable from './pages/ClassTimetable';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Create a custom Material-UI theme focusing on the Blue and White design system
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Deep Indigo Blue
      light: '#534bae',
      dark: '#000051',
      contrastText: '#fff'
    },
    secondary: {
      main: '#0d47a1', // Bright Navy Blue
      light: '#5472d3',
      dark: '#002171',
      contrastText: '#fff'
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff'
    },
    text: {
      primary: '#263238',
      secondary: '#546e7a'
    }
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
        }
      }
    }
  }
});

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { school, loading } = useAuth();

  if (loading) {
    return null; // Don't redirect before status check finishes
  }

  if (!school) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App Router configuration
function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Unprotected Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Onboarding Wizard Route (Protected, standalone) */}
            <Route
              path="/setup-wizard"
              element={
                <ProtectedRoute>
                  <SetupWizard />
                </ProtectedRoute>
              }
            />

            {/* Standard Dashboard Routes (Protected, wrapped with Navbar/Sidebar layout) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="classes" element={<Classes />} />
              <Route path="allocation" element={<SubjectAllocation />} />
              <Route path="generate-timetable" element={<GenerateTimetable />} />
              <Route path="master-timetable" element={<MasterTimetable />} />
              <Route path="teacher-timetable" element={<TeacherTimetable />} />
              <Route path="class-timetable" element={<ClassTimetable />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={4000} />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
