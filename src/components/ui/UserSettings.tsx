import React, { useState } from 'react';
import { Settings, User, Phone, MapPin, Lock } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phoneNumber: user?.phone_number || '',
    address: user?.doctor?.address || user?.patient?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Update user phone number
      const { error: userError } = await supabase
        .from('users')
        .update({ phone_number: formData.phoneNumber })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Update role-specific information
      if (user?.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update({ address: formData.address })
          .eq('id', user.doctor?.id);

        if (doctorError) throw doctorError;
      } else if (user?.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .update({ address: formData.address })
          .eq('id', user.patient?.id);

        if (patientError) throw patientError;
      }

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) throw passwordError;
      }

      setSuccess('Profile updated successfully');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Refresh the page after 1 second to update the UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-error rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-success rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-neutral-800">Contact Information</h4>
          <Input
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            leftIcon={<Phone className="h-5 w-5 text-neutral-400" />}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            leftIcon={<MapPin className="h-5 w-5 text-neutral-400" />}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-neutral-800">Change Password</h4>
          <Input
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
          />
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={updateProfile}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserSettings;