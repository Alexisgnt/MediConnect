import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Clock, Calendar, FileText, Plus } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const PatientManagement: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    prescriptions: [{ medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }]
  });

  useEffect(() => {
    if (user?.doctor?.id) {
      fetchPatients();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_requests')
        .select(`
          patient:patients(
            id,
            date_of_birth,
            blood_type,
            height,
            weight,
            allergies,
            chronic_conditions,
            medications,
            user:users(
              first_name,
              last_name,
              email,
              phone_number
            )
          )
        `)
        .eq('doctor_id', user?.doctor?.id)
        .eq('status', 'accepted');

      if (error) throw error;
      setPatients(data?.map(d => d.patient) || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setError(error.message);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_requests')
        .select(`
          id,
          patient:patients(
            id,
            date_of_birth,
            blood_type,
            user:users(
              first_name,
              last_name,
              email,
              phone_number
            )
          )
        `)
        .eq('doctor_id', user?.doctor?.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      setError(error.message);
    }
  };

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('doctor_patient_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      await Promise.all([fetchPatients(), fetchPendingRequests()]);
    } catch (error: any) {
      console.error('Error handling request:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removePatient = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('doctor_patient_requests')
        .update({ status: 'rejected' })
        .eq('doctor_id', user?.doctor?.id)
        .eq('patient_id', patientId)
        .eq('status', 'accepted');

      if (error) throw error;

      await fetchPatients();
    } catch (error: any) {
      console.error('Error removing patient:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addPrescription = () => {
    setNewRecord(prev => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        { medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }
      ]
    }));
  };

  const removePrescription = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    setNewRecord(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const addMedicalRecord = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Add medical record
      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: selectedPatient.id,
          doctor_id: user?.doctor?.id,
          date: new Date().toISOString(),
          diagnosis: newRecord.diagnosis,
          treatment: newRecord.treatment,
          notes: newRecord.notes
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Add prescriptions
      if (newRecord.prescriptions.length > 0) {
        const { error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert(
            newRecord.prescriptions.map(p => ({
              medical_record_id: recordData.id,
              ...p
            }))
          );

        if (prescriptionError) throw prescriptionError;
      }

      setIsAddRecordModalOpen(false);
      setNewRecord({
        diagnosis: '',
        treatment: '',
        notes: '',
        prescriptions: [{ medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }]
      });
    } catch (error: any) {
      console.error('Error adding medical record:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.user.first_name.toLowerCase().includes(searchLower) ||
      patient.user.last_name.toLowerCase().includes(searchLower) ||
      patient.user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-neutral-800 mb-4">Pending Requests</h3>
          <div className="divide-y divide-neutral-200">
            {pendingRequests.map((request) => (
              <div key={request.id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-neutral-800">
                    {request.patient.user.first_name} {request.patient.user.last_name}
                  </h4>
                  <div className="text-sm text-neutral-600">
                    <p>{request.patient.user.email}</p>
                    <p>{request.patient.user.phone_number}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, 'accepted')}
                    leftIcon={<UserPlus className="h-4 w-4" />}
                    isLoading={isLoading}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequest(request.id, 'rejected')}
                    leftIcon={<X className="h-4 w-4" />}
                    isLoading={isLoading}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
          className="flex-1 max-w-md"
        />
      </div>

      <Card>
        <div className="divide-y divide-neutral-200">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-medium text-neutral-800">
                    {patient.user.first_name} {patient.user.last_name}
                  </h4>
                  <div className="text-sm text-neutral-600">
                    <p>{patient.user.email}</p>
                    <p>{patient.user.phone_number}</p>
                    <p>Blood Type: {patient.blood_type || 'Not specified'}</p>
                    {patient.allergies && patient.allergies.length > 0 && (
                      <p>Allergies: {patient.allergies.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(patient);
                      setIsViewModalOpen(true);
                    }}
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    leftIcon={<Calendar className="h-4 w-4" />}
                  >
                    Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePatient(patient.id)}
                    leftIcon={<X className="h-4 w-4" />}
                    isLoading={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="py-8 text-center">
              <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No patients found</p>
            </div>
          )}
        </div>
      </Card>

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
                <p className="text-neutral-600">{selectedPatient.user.email}</p>
              </div>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsAddRecordModalOpen(true);
                }}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Medical Record
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Date of Birth:</span> {format(new Date(selectedPatient.date_of_birth), 'MMMM d, yyyy')}</p>
                  <p><span className="font-medium">Phone:</span> {selectedPatient.user.phone_number}</p>
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

            {selectedPatient.past_surgeries?.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">Past Surgeries</h4>
                <div className="space-y-2">
                  {selectedPatient.past_surgeries.map((surgery: any, index: number) => (
                    <div key={index} className="p-3 bg-neutral-50 rounded-lg">
                      <p className="font-medium">{surgery.procedure}</p>
                      <p className="text-sm text-neutral-600">
                        {format(new Date(surgery.date), 'MMMM d, yyyy')} at {surgery.hospital}
                      </p>
                      <p className="text-sm text-neutral-600">Surgeon: {surgery.surgeon}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddRecordModalOpen}
        onClose={() => {
          setIsAddRecordModalOpen(false);
          setNewRecord({
            diagnosis: '',
            treatment: '',
            notes: '',
            prescriptions: [{ medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }]
          });
        }}
        title="Add Medical Record"
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Diagnosis"
            value={newRecord.diagnosis}
            onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosis: e.target.value }))}
            required
          />

          <Input
            label="Treatment"
            value={newRecord.treatment}
            onChange={(e) => setNewRecord(prev => ({ ...prev, treatment: e.target.value }))}
            required
          />

          <Input
            label="Notes"
            value={newRecord.notes}
            onChange={(e) => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-neutral-800">Prescriptions</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={addPrescription}
              >
                Add Prescription
              </Button>
            </div>

            {newRecord.prescriptions.map((prescription, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium text-neutral-700">Prescription {index + 1}</h5>
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removePrescription(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Medication Name"
                    value={prescription.medication_name}
                    onChange={(e) => handlePrescriptionChange(index, 'medication_name', e.target.value)}
                    required
                  />
                  <Input
                    label="Dosage"
                    value={prescription.dosage}
                    onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                    required
                  />
                  <Input
                    label="Frequency"
                    value={prescription.frequency}
                    onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                    required
                  />
                  <Input
                    label="Duration"
                    value={prescription.duration}
                    onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                    required
                  />
                  <div className="col-span-2">
                    <Input
                      label="Notes"
                      value={prescription.notes}
                      onChange={(e) => handlePrescriptionChange(index, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRecordModalOpen(false);
                setNewRecord({
                  diagnosis: '',
                  treatment: '',
                  notes: '',
                  prescriptions: [{ medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }]
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addMedicalRecord}
              isLoading={isLoading}
            >
              Add Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientManagement;