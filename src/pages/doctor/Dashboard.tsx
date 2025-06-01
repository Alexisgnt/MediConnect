import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, FileText, Activity, User, MapPin } from 'lucide-react';
import { format, differenceInMinutes, parseISO, isAfter } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (user?.doctor?.id) {
      fetchDashboardData();
    }
  }, [user]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            date_of_birth,
            blood_type,
            height,
            weight,
            allergies,
            chronic_conditions,
            medications,
            emergency_contact,
            user:users(
              first_name,
              last_name,
              phone_number
            )
          )
        `)
        .eq('doctor_id', user?.doctor?.id)
        .eq('date', today)
        .neq('status', 'cancelled')
        .order('start_time');

      if (appointmentsError) throw appointmentsError;
      setUpcomingAppointments(appointments || []);

      // Fetch recent medical records
      const { data: records, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(
            id,
            date_of_birth,
            blood_type,
            height,
            weight,
            allergies,
            chronic_conditions,
            medications,
            emergency_contact,
            user:users(
              first_name,
              last_name,
              phone_number
            )
          )
        `)
        .eq('doctor_id', user?.doctor?.id)
        .order('date', { ascending: false })
        .limit(5);

      if (recordsError) throw recordsError;
      setRecentRecords(records || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeAppointment = async (appointmentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentStatus = (appointment: any) => {
    const appointmentDateTime = new Date(
      `${appointment.date}T${appointment.start_time}`
    );
    const minutesDiff = differenceInMinutes(appointmentDateTime, currentTime);

    if (appointment.status === 'completed') {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800'
      };
    }

    if (minutesDiff < 0) {
      return {
        label: 'Late',
        className: 'bg-red-100 text-red-800'
      };
    }

    if (minutesDiff <= 30) {
      return {
        label: `In ${minutesDiff} minutes`,
        className: 'bg-yellow-100 text-yellow-800'
      };
    }

    return {
      label: `In ${Math.floor(minutesDiff / 60)}h ${minutesDiff % 60}m`,
      className: 'bg-blue-100 text-blue-800'
    };
  };

  const stats = [
    {
      title: "Today's Appointments",
      value: upcomingAppointments.length,
      icon: <CalendarIcon className="h-6 w-6 text-secondary-500" />
    },
    {
      title: 'Completed Today',
      value: upcomingAppointments.filter(apt => apt.status === 'completed').length,
      icon: <Clock className="h-6 w-6 text-success" />
    },
    {
      title: 'Recent Records',
      value: recentRecords.length,
      icon: <FileText className="h-6 w-6 text-primary-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-neutral-800">
          Welcome back, Dr. {user?.first_name} {user?.last_name}
        </h2>
        <p className="text-neutral-600">Here's an overview of your practice today</p>
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
              <p className="text-2xl font-semibold text-neutral-800">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Today's Appointments">
          <div className="divide-y divide-neutral-200">
            {upcomingAppointments.map((appointment) => {
              const status = getAppointmentStatus(appointment);
              return (
                <div key={appointment.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-neutral-800">
                        {appointment.patient.user.first_name} {appointment.patient.user.last_name}
                      </h4>
                      <div className="flex items-center text-sm text-neutral-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{appointment.start_time} - {appointment.end_time}</span>
                      </div>
                      <p className="text-sm text-neutral-600">
                        Phone: {appointment.patient.user.phone_number}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(appointment.patient);
                          setIsViewModalOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      {appointment.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => completeAppointment(appointment.id)}
                          isLoading={isLoading}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {upcomingAppointments.length === 0 && (
              <div className="py-6 text-center">
                <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Recent Medical Records">
          <div className="divide-y divide-neutral-200">
            {recentRecords.map((record) => (
              <div key={record.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-neutral-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{format(new Date(record.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <h4 className="font-medium text-neutral-800">{record.diagnosis}</h4>
                    <p className="text-sm text-neutral-600">
                      {record.patient.user.first_name} {record.patient.user.last_name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(record.patient);
                      setIsViewModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {recentRecords.length === 0 && (
              <div className="py-6 text-center">
                <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No recent medical records</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPatient(null);
        }}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium text-neutral-800">
                  {selectedPatient.user.first_name} {selectedPatient.user.last_name}
                </h3>
                <p className="text-neutral-600">{selectedPatient.user.phone_number}</p>
              </div>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate(`/doctor/patients/${selectedPatient.id}`);
                }}
              >
                View Full Profile
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Date of Birth:</span> {format(new Date(selectedPatient.date_of_birth), 'MMMM d, yyyy')}</p>
                  <p><span className="font-medium">Blood Type:</span> {selectedPatient.blood_type || 'Not specified'}</p>
                  <p><span className="font-medium">Height:</span> {selectedPatient.height ? `${selectedPatient.height} cm` : 'Not specified'}</p>
                  <p><span className="font-medium">Weight:</span> {selectedPatient.weight ? `${selectedPatient.weight} kg` : 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Medical Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Allergies:</p>
                    <p>{selectedPatient.allergies?.join(', ') || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Chronic Conditions:</p>
                    <p>{selectedPatient.chronic_conditions?.join(', ') || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Current Medications:</p>
                    <p>{selectedPatient.medications?.join(', ') || 'None reported'}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedPatient.emergency_contact && (
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Emergency Contact</h4>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedPatient.emergency_contact.name}</p>
                    <p><span className="font-medium">Relationship:</span> {selectedPatient.emergency_contact.relationship}</p>
                    <p><span className="font-medium">Phone:</span> {selectedPatient.emergency_contact.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorDashboard;