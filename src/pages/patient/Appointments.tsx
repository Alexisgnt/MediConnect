import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X, User, Search } from 'lucide-react';
import { format, isWithinInterval, parseISO, addMinutes } from 'date-fns';
import Calendar from 'react-calendar';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { SPECIALIZATIONS } from '../../types';
import 'react-calendar/dist/Calendar.css';

const Appointments: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [connectedDoctors, setConnectedDoctors] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorSchedule, setDoctorSchedule] = useState<any[]>([]);
  const [doctorVacations, setDoctorVacations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchConnectedDoctors();
  }, []);

  useEffect(() => {
    if (showAllDoctors) {
      fetchAllDoctors();
    }
  }, [showAllDoctors, searchQuery, specialization]);

  useEffect(() => {
    const selectedDoctorId = location.state?.selectedDoctorId;
    if (selectedDoctorId) {
      const doctor = connectedDoctors.find(d => d.id === selectedDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [location.state, connectedDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorSchedule();
      fetchDoctorVacations();
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchConnectedDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_requests')
        .select(`
          doctor:doctors(
            id,
            specialization,
            address,
            user:users(
              first_name,
              last_name,
              phone_number
            )
          )
        `)
        .eq('patient_id', user?.patient?.id)
        .eq('status', 'accepted');

      if (error) throw error;
      setConnectedDoctors(data?.map(d => d.doctor) || []);
    } catch (error: any) {
      console.error('Error fetching connected doctors:', error);
      setError(error.message);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      let query = supabase
        .from('doctors')
        .select(`
          *,
          user:users(
            first_name,
            last_name,
            phone_number
          )
        `);

      if (searchQuery) {
        query = query.or(`user.first_name.ilike.%${searchQuery}%,user.last_name.ilike.%${searchQuery}%`);
      }

      if (specialization) {
        query = query.eq('specialization', specialization);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAllDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching all doctors:', error);
      setError(error.message);
    }
  };

  const fetchAppointments = async () => {
    try {
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
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    }
  };

  const fetchDoctorSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', selectedDoctor.id);

      if (error) throw error;
      setDoctorSchedule(data || []);
    } catch (error: any) {
      console.error('Error fetching doctor schedule:', error);
      setError(error.message);
    }
  };

  const fetchDoctorVacations = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_vacations')
        .select('*')
        .eq('doctor_id', selectedDoctor.id)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setDoctorVacations(data || []);
    } catch (error: any) {
      console.error('Error fetching doctor vacations:', error);
      setError(error.message);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      const dayOfWeek = selectedDate.getDay();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Get schedule for the selected day
      const schedule = doctorSchedule.find(s => s.day_of_week === dayOfWeek);
      if (!schedule) {
        setAvailableSlots([]);
        return;
      }

      // Check for vacation
      const isVacation = doctorVacations.some(vacation =>
        isWithinInterval(selectedDate, {
          start: parseISO(vacation.start_date),
          end: parseISO(vacation.end_date),
        })
      );

      if (isVacation) {
        setAvailableSlots([]);
        return;
      }

      // Get existing appointments
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('doctor_id', selectedDoctor.id)
        .eq('date', dateStr)
        .neq('status', 'cancelled');

      if (appointmentsError) throw appointmentsError;

      // Generate 30-minute slots
      const slots: string[] = [];
      const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
      
      let currentSlot = new Date(2000, 0, 1, startHour, startMinute);
      const endTime = new Date(2000, 0, 1, endHour, endMinute);

      while (currentSlot < endTime) {
        const timeString = format(currentSlot, 'HH:mm');
        const nextSlot = addMinutes(currentSlot, 30);
        const nextTimeString = format(nextSlot, 'HH:mm');

        const isBooked = existingAppointments?.some(
          (apt) => apt.start_time <= timeString && apt.end_time > timeString
        );

        if (!isBooked) {
          slots.push(timeString);
        }

        currentSlot = nextSlot;
      }

      setAvailableSlots(slots);
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      setError(error.message);
      setAvailableSlots([]);
    }
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user?.patient?.id) {
      setError('Unable to book appointment. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const endTime = format(addMinutes(parseISO(`2000-01-01T${selectedTime}`), 30), 'HH:mm');

      // Check if slot is still available
      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', selectedDoctor.id)
        .eq('date', dateStr)
        .eq('start_time', selectedTime)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      if (existingAppointments && existingAppointments.length > 0) {
        throw new Error('This time slot is no longer available. Please select another time.');
      }

      // Create the appointment
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          doctor_id: selectedDoctor.id,
          patient_id: user.patient.id,
          date: dateStr,
          start_time: selectedTime,
          end_time: endTime,
          status: 'scheduled',
        });

      if (insertError) throw insertError;

      // Reset form and refresh data
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime('');
      await fetchAppointments();
      setError(null);
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;
      await fetchAppointments();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      setError(error.message);
    }
  };

  const getDayAvailability = (date: Date) => {
    // Check if date is in the past
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return 'unavailable';
    }

    // Check if it's a vacation day
    const isVacation = doctorVacations.some(vacation =>
      isWithinInterval(date, {
        start: parseISO(vacation.start_date),
        end: parseISO(vacation.end_date),
      })
    );

    if (isVacation) {
      return 'unavailable';
    }

    // Check if doctor works on this day
    const schedule = doctorSchedule.find(s => s.day_of_week === date.getDay());
    return schedule ? 'available' : 'unavailable';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-800">My Appointments</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-800">Book an Appointment</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Doctor
              </label>
              <select
                className="input-field w-full"
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doctor = connectedDoctors.find(d => d.id === e.target.value);
                  setSelectedDoctor(doctor);
                  setSelectedDate(null);
                  setSelectedTime('');
                }}
              >
                <option value="">Choose a doctor</option>
                {connectedDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.user.first_name} {doctor.user.last_name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-neutral-500" />
                    <h4 className="font-medium">
                      Dr. {selectedDoctor.user.first_name} {selectedDoctor.user.last_name}
                    </h4>
                  </div>
                  <p className="text-sm text-neutral-600">{selectedDoctor.specialization}</p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Calendar
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    tileClassName={({ date }) => {
                      const availability = getDayAvailability(date);
                      return `
                        ${availability === 'available' ? 'bg-green-50 hover:bg-green-100' : ''}
                        ${availability === 'unavailable' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''}
                      `;
                    }}
                    tileDisabled={({ date }) => getDayAvailability(date) === 'unavailable'}
                  />
                </div>

                {selectedDate && (
                  <div>
                    <h4 className="font-medium mb-2">Available Time Slots</h4>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              selectedTime === slot
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-600">No available time slots for this date</p>
                    )}
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={bookAppointment}
                  isLoading={isLoading}
                  disabled={!selectedDate || !selectedTime}
                >
                  Book Appointment
                </Button>
              </div>
            )}

            {connectedDoctors.length === 0 && (
              <div className="text-center py-6">
                <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-4">No connected doctors found</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/patient/doctors')}
                >
                  Find Doctors
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-800">Upcoming Appointments</h3>
          
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-neutral-800">
                    Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}
                  </h4>
                  <p className="text-sm text-neutral-600">{appointment.doctor.specialization}</p>
                  <div className="flex items-center text-neutral-600 text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                    <Clock className="h-4 w-4 mx-2" />
                    <span>{appointment.start_time} - {appointment.end_time}</span>
                  </div>
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
                {appointment.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelAppointment(appointment.id)}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {appointments.length === 0 && (
            <Card>
              <div className="text-center py-6">
                <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No appointments scheduled</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-800">Find Other Doctors</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAllDoctors(!showAllDoctors);
                if (!showAllDoctors) {
                  fetchAllDoctors();
                }
              }}
            >
              {showAllDoctors ? 'Hide' : 'Show All Doctors'}
            </Button>
          </div>

          {showAllDoctors && (
            <>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search doctors by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
                  className="flex-1"
                />
                
                <select
                  className="input-field w-full sm:w-64"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDoctors.map((doctor) => {
                  const isConnected = connectedDoctors.some(d => d.id === doctor.id);
                  return (
                    <div key={doctor.id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="space-y-2">
                        <h4 className="font-medium text-neutral-800">
                          Dr. {doctor.user.first_name} {doctor.user.last_name}
                        </h4>
                        <p className="text-sm text-neutral-600">{doctor.specialization}</p>
                        <div className="flex items-center text-sm text-neutral-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>{doctor.user.phone_number}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setSelectedDate(null);
                              setSelectedTime('');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Book Appointment
                          </Button>
                          {!isConnected && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/patient/doctors')}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {allDoctors.length === 0 && (
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No doctors found matching your criteria</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Appointments;