import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  User, 
  LogOut, 
  CheckSquare,
  Settings,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import UserSettings from '../components/ui/UserSettings';
import Notifications from '../components/ui/Notifications';

const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Generate navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'insurance':
        return [
          { name: 'Dashboard', path: '/insurance/dashboard', icon: <Home className="w-5 h-5" /> },
          { name: 'Doctor Management', path: '/insurance/doctors', icon: <Users className="w-5 h-5" /> },
          { name: 'Doctor Approvals', path: '/insurance/approvals', icon: <CheckSquare className="w-5 h-5" /> },
        ];
      case 'doctor':
        return [
          { name: 'Dashboard', path: '/doctor/dashboard', icon: <Home className="w-5 h-5" /> },
          { name: 'My Patients', path: '/doctor/patients', icon: <Users className="w-5 h-5" /> },
          { name: 'Appointments', path: '/doctor/appointments', icon: <Calendar className="w-5 h-5" /> },
          { name: 'Schedule', path: '/doctor/schedule', icon: <Clock className="w-5 h-5" /> },
        ];
      case 'patient':
        return [
          { name: 'Dashboard', path: '/patient/dashboard', icon: <Home className="w-5 h-5" /> },
          { name: 'Medical Records', path: '/patient/records', icon: <FileText className="w-5 h-5" /> },
          { name: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-5 h-5" /> },
          { name: 'Find Doctors', path: '/patient/doctors', icon: <User className="w-5 h-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar for desktop */}
      <aside className={`fixed inset-y-0 z-50 flex-shrink-0 w-64 bg-white shadow-md transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-semibold text-primary-700">MediConnect</span>
            </Link>
            <button 
              className="lg:hidden text-neutral-500 hover:text-neutral-700"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* User info */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.first_name?.[0] || ''}{user?.last_name?.[0] || ''}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="pt-6 mt-6 border-t border-neutral-200">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center px-6 shadow-sm">
          <button
            className="lg:hidden text-neutral-500 hover:text-neutral-700 mr-4"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-neutral-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.role === 'patient' && <Notifications />}
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Settings Modal */}
      <UserSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;