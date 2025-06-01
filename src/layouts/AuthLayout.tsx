import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-secondary-500/10 flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-xl shadow-lg animate-fade-in">
        <div className="flex items-center justify-center mb-6">
          <Activity className="h-8 w-8 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-primary-700">MediConnect</h1>
        </div>
        
        <Outlet />
        
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} MediConnect. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;