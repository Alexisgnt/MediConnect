import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Building } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { UserRole, SPECIALIZATIONS } from '../../types';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { register, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validatePassword = (password: string, confirmPassword: string, dateOfBirth?: string): string | null => {
    if (password.length < 12) {
      return 'Password must be at least 12 characters long';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (dateOfBirth) {
      const dateFormats = [
        dateOfBirth,
        dateOfBirth.replace(/-/g, ''),
        new Date(dateOfBirth).toLocaleDateString(),
      ];

      if (dateFormats.some(date => password.includes(date))) {
        return 'Password cannot contain your date of birth';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const error = validatePassword(password, confirmPassword, role === 'patient' ? dateOfBirth : undefined);
      if (error) {
        setPasswordError(error);
        return;
      }

      const userData = {
        firstName,
        lastName,
        role,
        phoneNumber,
      };

      if (role === 'doctor') {
        Object.assign(userData, {
          specialization,
          address,
        });
      } else if (role === 'patient') {
        Object.assign(userData, {
          dateOfBirth,
          address,
        });
      }

      await register(email, password, userData);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-neutral-800 mb-6">Create Account</h2>
      
      {(error || passwordError) && (
        <div className="mb-4 p-3 bg-red-100 text-error rounded-md text-sm">
          {error || passwordError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['patient', 'doctor'] as UserRole[]).map((type) => (
              <button
                key={type}
                type="button"
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  role === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                onClick={() => setRole(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            leftIcon={<User className="h-5 w-5 text-neutral-400" />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
          />
          
          <Input
            label="Last Name"
            leftIcon={<User className="h-5 w-5 text-neutral-400" />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
          />
        </div>
        
        <Input
          label="Email"
          type="email"
          leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        
        <Input
          label="Phone Number"
          type="tel"
          leftIcon={<Phone className="h-5 w-5 text-neutral-400" />}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
        />
        
        {role === 'doctor' ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Specialization
              </label>
              <select
                className="input-field"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value as typeof SPECIALIZATIONS[number])}
                required
              >
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Practice address"
              required
            />
          </>
        ) : (
          <>
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your address"
              required
            />
          </>
        )}
        
        <Input
          label="Password"
          type="password"
          leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          placeholder="••••••••"
          required
          helperText="Must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPasswordError(null);
          }}
          placeholder="••••••••"
          required
        />
        
        <Button 
          type="submit" 
          fullWidth 
          className="mt-4"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;