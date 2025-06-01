import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, Clock, Activity, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.patient?.id) {
      fetchUpcomingAppointments();
      fetchRecentRecords();
    }
  }, [user]);

  const fetchUpcomingAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(
            id,
            specialization,
            user:users(
              first_name,
              last_name
            )
          )
        `)
        .eq('patient_id', user?.patient?.id)
        .eq('status', 'scheduled')
        .gte('date', today)
        .order('date')
        .order('start_time')
        .limit(3);

      if (error) throw error;
      setUpcomingAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    }
  };

  const fetchRecentRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:doctors(
            id,
            specialization,
            user:users(
              first_name,
              last_name
            )
          )
        `)
        .eq('patient_id', user?.patient?.id)
        .order('date', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching records:', error);
      setError(error.message);
    }
  };

  const stats = [
    {
      title: 'Primary Doctor',
      value: user?.patient?.primary_doctor_id ? 'Assigned' : 'Not Assigned',
      icon: <User className="h-6 w-6 text-primary-500" />,
      color: user?.patient?.primary_doctor_id ? 'text-success' : 'text-warning'
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: <Calendar className="h-6 w-6 text-secondary-500" />
    },
    {
      title: 'Medical Records',
      value: recentRecords.length,
      icon: <FileText className="h-6 w-6 text-success" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-neutral-800">
          Welcome back, {user?.first_name}
        </h2>
        <p className="text-neutral-600">Here's an overview of your health information</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="flex items-center p-6">
            <div className="p-3 rounded-full bg-neutral-100 mr-4">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-neutral-600">{stat.title}</p>
              <p className={`text-2xl font-semibold ${stat.color || 'text-neutral-800'}`}>
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Appointments">
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-neutral-800">
                      Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}
                    </h4>
                    <p className="text-sm text-neutral-600">{appointment.doctor.specialization}</p>
                    <div className="flex items-center text-sm text-neutral-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                      <Clock className="h-4 w-4 mx-2" />
                      <span>{appointment.start_time}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/patient/appointments')}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No upcoming appointments</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/patient/appointments')}
                >
                  Schedule an Appointment
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Recent Medical Records">
          <div className="space-y-4">
            {recentRecords.map((record) => (
              <div key={record.id} className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-neutral-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(record.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <h4 className="font-medium text-neutral-800">{record.diagnosis}</h4>
                    <p className="text-sm text-neutral-600">
                      Dr. {record.doctor.user.first_name} {record.doctor.user.last_name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/patient/records')}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {recentRecords.length === 0 && (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No medical records found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/patient/records')}
                >
                  View All Records
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;