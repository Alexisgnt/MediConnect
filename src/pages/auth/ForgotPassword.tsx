import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword, error, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(email);
    setIsSubmitted(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-neutral-800 mb-2">
        Reset Password
      </h2>
      <p className="text-center text-neutral-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-error rounded-md text-sm">
          {error}
        </div>
      )}

      {isSubmitted ? (
        <div className="text-center">
          <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-md">
            If your email address is associated with an account, you will receive a password recovery link soon.
          </div>
          <Link
            to="/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Button type="submit" fullWidth isLoading={isLoading} className="mt-4">
            Send Reset Link
          </Button>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;