import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];
type UserRow = Tables['users']['Row'];
type DoctorRow = Tables['doctors']['Row'];
type PatientRow = Tables['patients']['Row'];

interface LoginAttempt {
  timestamp: number;
  email: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60000; // 1 minute in milliseconds
const loginAttempts: LoginAttempt[] = [];

interface AuthState {
  user: (UserRow & { doctor?: DoctorRow; patient?: PatientRow }) | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string, userData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initAuth: () => () => void;
}

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 12) {
    return { isValid: false, error: 'Password must be at least 12 characters long' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }

  return { isValid: true };
};

const isUserLockedOut = (email: string): { isLocked: boolean; remainingTime?: number } => {
  const now = Date.now();
  const recentAttempts = loginAttempts
    .filter(attempt => attempt.email === email && now - attempt.timestamp < LOCKOUT_DURATION)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestAttempt = recentAttempts[MAX_LOGIN_ATTEMPTS - 1];
    const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - oldestAttempt.timestamp)) / 1000);
    return { isLocked: true, remainingTime };
  }

  return { isLocked: false };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  register: async (email, password, userData) => {
    try {
      set({ isLoading: true, error: null });

      // Validate password
      const { isValid, error: passwordError } = validatePassword(password);
      if (!passwordError) {
        throw new Error(passwordError);
      }

      // Check if date of birth is used in password
      if (userData.role === 'patient' && userData.dateOfBirth) {
        const dateFormats = [
          userData.dateOfBirth,
          userData.dateOfBirth.replace(/-/g, ''),
          new Date(userData.dateOfBirth).toLocaleDateString(),
        ];

        if (dateFormats.some(date => password.includes(date))) {
          throw new Error('Password cannot contain your date of birth');
        }
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone_number: userData.phoneNumber,
        });

      if (profileError) throw profileError;

      // Create role-specific profile
      if (userData.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            user_id: authData.user.id,
            specialization: userData.specialization,
            address: userData.address,
          });

        if (doctorError) throw doctorError;
      } else if (userData.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: authData.user.id,
            date_of_birth: userData.dateOfBirth,
            address: userData.address,
          });

        if (patientError) throw patientError;
      }

      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      // Check if user is locked out
      const { isLocked, remainingTime } = isUserLockedOut(email);
      if (isLocked) {
        throw new Error(`Too many login attempts. Please try again in ${remainingTime} seconds.`);
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Record failed attempt
        loginAttempts.push({ email, timestamp: Date.now() });
        
        // Clean up old attempts
        const now = Date.now();
        while (loginAttempts.length > 0 && now - loginAttempts[0].timestamp > LOCKOUT_DURATION) {
          loginAttempts.shift();
        }

        throw authError;
      }

      if (!authData.user) throw new Error('Login failed');

      // Clear login attempts on successful login
      const index = loginAttempts.findIndex(attempt => attempt.email === email);
      if (index !== -1) {
        loginAttempts.splice(index, 1);
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      // Get role-specific data
      let roleData = null;
      if (userData.role === 'doctor') {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (doctorError) throw doctorError;
        roleData = { doctor: doctorData };
      } else if (userData.role === 'patient') {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (patientError) throw patientError;
        roleData = { patient: patientData };
      }

      set({ user: { ...userData, ...roleData }, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, user: null });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  initAuth: () => {
    const handleError = async (error: any) => {
      // Check for various refresh token error messages
      if (
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found')
      ) {
        await supabase.auth.signOut();
        set({ user: null, isLoading: false, error: null });
        return;
      }
      set({ error: error.message, isLoading: false });
    };

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        await handleError(error);
        return;
      }

      if (!session) {
        set({ user: null, isLoading: false });
        return;
      }

      try {
        // Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        // Get role-specific data
        let roleData = null;
        if (userData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (doctorError) throw doctorError;
          roleData = { doctor: doctorData };
        } else if (userData.role === 'patient') {
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (patientError) throw patientError;
          roleData = { patient: patientData };
        }

        set({ user: { ...userData, ...roleData }, isLoading: false, error: null });
      } catch (error: any) {
        await handleError(error);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({ user: null, isLoading: false });
          return;
        }

        try {
          // Get user profile
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          // Get role-specific data
          let roleData = null;
          if (userData.role === 'doctor') {
            const { data: doctorData, error: doctorError } = await supabase
              .from('doctors')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (doctorError) throw doctorError;
            roleData = { doctor: doctorData };
          } else if (userData.role === 'patient') {
            const { data: patientData, error: patientError } = await supabase
              .from('patients')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (patientError) throw patientError;
            roleData = { patient: patientData };
          }

          set({ user: { ...userData, ...roleData }, isLoading: false, error: null });
        } catch (error: any) {
          await handleError(error);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  },
}));