import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Calendar, UserPlus, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { SPECIALIZATIONS } from '../../types';

const DoctorSearch: React.FC = () => {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [doctorRequests, setDoctorRequests] = useState<any[]>([]);
  const [acceptedDoctors, setAcceptedDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorToRemove, setDoctorToRemove] = useState<any>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
    fetchDoctorRequests();
    fetchAcceptedDoctors();
  }, [searchQuery, specialization]);

  const fetchDoctors = async () => {
    try {
      let query = supabase
        .from('doctors')
        .select(`
          *,
          user:users(
            first_name,
            last_name,
            email,
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
      setDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      setError(error.message);
    }
  };

  const fetchDoctorRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_requests')
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctorRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching doctor requests:', error);
      setError(error.message);
    }
  };

  const fetchAcceptedDoctors = async () => {
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
      setAcceptedDoctors(data?.map(d => d.doctor) || []);
    } catch (error: any) {
      console.error('Error fetching accepted doctors:', error);
      setError(error.message);
    }
  };

  const handleBookAppointment = (doctorId: string) => {
    navigate('/patient/appointments', { state: { selectedDoctorId: doctorId } });
  };

  const requestDoctor = async (doctorId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('doctor_patient_requests')
        .insert({
          doctor_id: doctorId,
          patient_id: user?.patient?.id,
          status: 'pending',
          initiated_by: 'patient'
        });

      if (error) throw error;

      await fetchDoctorRequests();
    } catch (error: any) {
      console.error('Error requesting doctor:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDoctor = async () => {
    if (!doctorToRemove) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('doctor_patient_requests')
        .update({ status: 'rejected' })
        .eq('doctor_id', doctorToRemove.id)
        .eq('patient_id', user?.patient?.id)
        .eq('status', 'accepted');

      if (error) throw error;

      await fetchAcceptedDoctors();
      await fetchDoctorRequests();
      setIsRemoveModalOpen(false);
      setDoctorToRemove(null);
    } catch (error: any) {
      console.error('Error removing doctor:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequest = async (doctorId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('doctor_patient_requests')
        .delete()
        .eq('doctor_id', doctorId)
        .eq('patient_id', user?.patient?.id)
        .eq('status', 'pending');

      if (error) throw error;

      await fetchDoctorRequests();
    } catch (error: any) {
      console.error('Error canceling request:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRequestStatus = (doctorId: string) => {
    return doctorRequests.find(req => req.doctor_id === doctorId);
  };

  const isAcceptedDoctor = (doctorId: string) => {
    return acceptedDoctors.some(doc => doc.id === doctorId);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <Card>
        <h3 className="text-lg font-medium text-neutral-800 mb-4">My Primary Doctors</h3>
        <div className="space-y-4">
          {acceptedDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedDoctors.map((doctor) => (
                <div key={doctor.id} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium text-neutral-800">
                        Dr. {doctor.user.first_name} {doctor.user.last_name}
                      </h4>
                      <p className="text-sm text-neutral-600">{doctor.specialization}</p>
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{doctor.user.phone_number}</span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{doctor.address}</span>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleBookAppointment(doctor.id)}
                      >
                        Book Appointment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDoctorToRemove(doctor);
                          setIsRemoveModalOpen(true);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-600">No primary doctors assigned</p>
          )}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => {
          const request = getRequestStatus(doctor.id);
          const isAccepted = isAcceptedDoctor(doctor.id);

          return (
            <Card key={doctor.id}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-800">
                    Dr. {doctor.user.first_name} {doctor.user.last_name}
                  </h3>
                  <p className="text-neutral-600">{doctor.specialization}</p>
                </div>

                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{doctor.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{doctor.user.phone_number}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {isAccepted ? (
                    <Button
                      fullWidth
                      onClick={() => handleBookAppointment(doctor.id)}
                      leftIcon={<Calendar className="h-5 w-5" />}
                    >
                      Book Appointment
                    </Button>
                  ) : request ? (
                    <div className="space-y-2">
                      <div className={`text-center px-3 py-2 rounded-md text-sm font-medium ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' && (
                          <>
                            <Clock className="inline-block w-4 h-4 mr-1" />
                            Request Pending
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <>
                            <Check className="inline-block w-4 h-4 mr-1" />
                            Request Accepted
                          </>
                        )}
                        {request.status === 'rejected' && (
                          <>
                            <X className="inline-block w-4 h-4 mr-1" />
                            Request Rejected
                          </>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <Button
                          fullWidth
                          variant="outline"
                          onClick={() => cancelRequest(doctor.id)}
                          leftIcon={<X className="h-5 w-5" />}
                          isLoading={isLoading}
                        >
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      fullWidth
                      onClick={() => requestDoctor(doctor.id)}
                      leftIcon={<UserPlus className="h-5 w-5" />}
                      isLoading={isLoading}
                    >
                      Request as Primary Doctor
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {doctors.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-neutral-600">No doctors found matching your criteria</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isRemoveModalOpen}
        onClose={() => {
          setIsRemoveModalOpen(false);
          setDoctorToRemove(null);
        }}
        title="Remove Primary Doctor"
      >
        {doctorToRemove && (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-warning">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <p className="text-center text-neutral-800">
              Are you sure you want to remove Dr. {doctorToRemove.user.first_name} {doctorToRemove.user.last_name} as your primary {doctorToRemove.specialization} doctor?
            </p>
            <p className="text-sm text-center text-neutral-600">
              This action cannot be undone. You will need to send a new request if you want to add them back.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setDoctorToRemove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={removeDoctor}
                isLoading={isLoading}
              >
                Remove Doctor
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorSearch;