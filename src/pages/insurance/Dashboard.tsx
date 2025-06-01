import React from 'react';
import { Users, Activity, CheckSquare } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

const InsuranceDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-800">Welcome, {user?.firstName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Total Doctors"
          className="bg-primary-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary-700">24</p>
              <p className="text-sm text-primary-600">Registered doctors</p>
            </div>
            <Users className="h-10 w-10 text-primary-500" />
          </div>
        </Card>

        <Card
          title="Active Cases"
          className="bg-secondary-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-secondary-700">156</p>
              <p className="text-sm text-secondary-600">Current patients</p>
            </div>
            <Activity className="h-10 w-10 text-secondary-500" />
          </div>
        </Card>

        <Card
          title="Pending Approvals"
          className="bg-neutral-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-neutral-700">8</p>
              <p className="text-sm text-neutral-600">Doctor applications</p>
            </div>
            <CheckSquare className="h-10 w-10 text-neutral-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Recent Doctor Applications"
          subtitle="Latest registration requests"
        >
          <div className="space-y-4">
            <p className="text-neutral-600">No pending applications</p>
          </div>
        </Card>

        <Card
          title="System Statistics"
          subtitle="Platform overview"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total Appointments</span>
              <span className="font-medium">487</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Active Patients</span>
              <span className="font-medium">312</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Average Wait Time</span>
              <span className="font-medium">2.3 days</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InsuranceDashboard;