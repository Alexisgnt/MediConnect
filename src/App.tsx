import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layout components
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientManagement from './pages/doctor/PatientManagement';
import ScheduleManagement from './pages/doctor/ScheduleManagement';
import PatientProfile from './pages/doctor/PatientProfile';
import DoctorAppointments from './pages/doctor/Appointments';

// Patient pages
import PatientDashboard from './pages/patient/Dashboard';
import MedicalRecords from './pages/patient/MedicalRecords';
import Appointments from './pages/patient/Appointments';
import DoctorSearch from './pages/patient/DoctorSearch';

// Shared pages
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const { user, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes */}
      <Route element={<DashboardLayout />}>
        {/* Doctor routes */}
        <Route
          path="/doctor/dashboard"
          element={
            user?.role === 'doctor' ? (
              <DoctorDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/patients"
          element={
            user?.role === 'doctor' ? (
              <PatientManagement />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/patients/:patientId"
          element={
            user?.role === 'doctor' ? (
              <PatientProfile />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            user?.role === 'doctor' ? (
              <ScheduleManagement />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            user?.role === 'doctor' ? (
              <DoctorAppointments />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Patient routes */}
        <Route
          path="/patient/dashboard"
          element={
            user?.role === 'patient' ? (
              <PatientDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient/records"
          element={
            user?.role === 'patient' ? (
              <MedicalRecords />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient/appointments"
          element={
            user?.role === 'patient' ? (
              <Appointments />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patient/doctors"
          element={
            user?.role === 'patient' ? (
              <DoctorSearch />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Route>

      {/* Default routes */}
      <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;