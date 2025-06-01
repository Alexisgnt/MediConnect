import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, X, User, Phone, MapPin } from 'lucide-react';
import Calendar from 'react-calendar';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const DoctorAppointments: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.doctor?.id) {
      fetchAppointments();
    }
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
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
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .order('start_time');

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the patient's user ID first
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('user_id')
        .eq('id', selectedAppointment.patient.id)
        .single();

      if (patientError) throw patientError;

      // Start a transaction
      const { error: cancelError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', selectedAppointment.id);

      if (cancelError) throw cancelError;

      // Create notification for the patient using the patient's user_id
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: patientData.user_id,
          title: 'Appointment Cancelled',
          message: `Your appointment with Dr. ${user?.first_name} ${user?.last_name} on ${format(parseISO(selectedAppointment.date), 'MMMM d, yyyy')} at ${selectedAppointment.start_time} has been cancelled.`,
          type: 'warning',
          read: false
        });

      if (notificationError) throw notificationError;

      await fetchAppointments();
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentCountForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.date === dateStr).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Appointments</h2>
          <p className="text-neutral-600">Manage your appointments</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="w-full"
            tileContent={({ date }) => {
              const count = getAppointmentCountForDate(date);
              return count > 0 ? (
                <div className="absolute bottom-0 right-0 left-0 text-center">
                  <div className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary-100 text-primary-700 rounded-full">
                    {count}
                  </div>
                </div>
              ) : null;
            }}
          />
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-neutral-800">
            Appointments for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>

          {appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:bg-neutral-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">
                      {appointment.start_time} - {appointment.end_time}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <h4 className="font-medium text-neutral-800">
                    {appointment.patient.user.first_name} {appointment.patient.user.last_name}
                  </h4>

                  <div className="flex items-center text-sm text-neutral-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{appointment.patient.user.phone_number}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsViewModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  {appointment.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsCancelModalOpen(true);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {appointments.length === 0 && (
            <Card>
              <div className="text-center py-6">
                <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No appointments scheduled for this date</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium text-neutral-800">
                  {selectedAppointment.patient.user.first_name} {selectedAppointment.patient.user.last_name}
                </h3>
                <p className="text-neutral-600">{selectedAppointment.patient.user.phone_number}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                selectedAppointment.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : selectedAppointment.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Appointment Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-neutral-500 mr-2" />
                    <span>{format(parseISO(selectedAppointment.date), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-neutral-500 mr-2" />
                    <span>{selectedAppointment.start_time} - {selectedAppointment.end_time}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Date of Birth:</span> {format(parseISO(selectedAppointment.patient.date_of_birth), 'MMMM d, yyyy')}</p>
                  <p><span className="font-medium">Blood Type:</span> {selectedAppointment.patient.blood_type || 'Not specified'}</p>
                  <p><span className="font-medium">Height:</span> {selectedAppointment.patient.height ? `${selectedAppointment.patient.height} cm` : 'Not specified'}</p>
                  <p><span className="font-medium">Weight:</span> {selectedAppointment.patient.weight ? `${selectedAppointment.patient.weight} kg` : 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-neutral-800 mb-2">Medical Information</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Allergies:</p>
                  <p className="text-sm">{selectedAppointment.patient.allergies?.join(', ') || 'None reported'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Chronic Conditions:</p>
                  <p className="text-sm">{selectedAppointment.patient.chronic_conditions?.join(', ') || 'None reported'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Medications:</p>
                  <p className="text-sm">{selectedAppointment.patient.medications?.join(', ') || 'None reported'}</p>
                </div>
              </div>
            </div>

            {selectedAppointment.patient.emergency_contact && (
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Emergency Contact</h4>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedAppointment.patient.emergency_contact.name}</p>
                    <p><span className="font-medium">Relationship:</span> {selectedAppointment.patient.emergency_contact.relationship}</p>
                    <p><span className="font-medium">Phone:</span> {selectedAppointment.patient.emergency_contact.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        title="Cancel Appointment"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <p className="text-neutral-800">
              Are you sure you want to cancel the appointment with {selectedAppointment.patient.user.first_name} {selectedAppointment.patient.user.last_name} on {format(parseISO(selectedAppointment.date), 'MMMM d, yyyy')} at {selectedAppointment.start_time}?
            </p>
            <p className="text-sm text-neutral-600">
              This action cannot be undone. The patient will be notified of the cancellation.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                No, Keep Appointment
              </Button>
              <Button
                variant="danger"
                onClick={cancelAppointment}
                isLoading={isLoading}
              >
                Yes, Cancel Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorAppointments;