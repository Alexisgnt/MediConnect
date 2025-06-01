import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-20 w-20 text-neutral-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-neutral-800 mb-4">Page Not Found</h1>
        
        <p className="text-neutral-600 mb-8">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        
        <Link to="/">
          <Button leftIcon={<Home className="h-5 w-5" />}>
            Go to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;