import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, User, Phone, MapPin, Activity, Plus } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const PatientProfile: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewRecordModalOpen, setIsViewRecordModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    prescriptions: [{ medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }]
  });

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          user:users(
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', user?.doctor?.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Fetch medical records
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          prescriptions(*)
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', user?.doctor?.id)
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;
      setMedicalRecords(recordsData || []);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
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
          patient_id: patientId,
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

      await fetchPatientData();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error || 'Patient not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">
            {patient.user.first_name} {patient.user.last_name}
          </h2>
          <p className="text-neutral-600">Patient Profile</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsAddRecordModalOpen(true)}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Add Medical Record
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 text-neutral-400 mr-2" />
                    <span>Born {format(new Date(patient.date_of_birth), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-neutral-400 mr-2" />
                    <span>{patient.user.phone_number}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                    <span>{patient.address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Medical Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Blood Type:</span> {patient.blood_type || 'Not specified'}</p>
                  <p><span className="font-medium">Height:</span> {patient.height ? `${patient.height} cm` : 'Not specified'}</p>
                  <p><span className="font-medium">Weight:</span> {patient.weight ? `${patient.weight} kg` : 'Not specified'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-800">Medical History</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddRecordModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Record
              </Button>
            </div>
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={() => {
                    setSelectedRecord(record);
                    setIsViewRecordModalOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-neutral-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{format(new Date(record.date), 'MMMM d, yyyy')}</span>
                      </div>
                      <h4 className="font-medium text-neutral-800">{record.diagnosis}</h4>
                      <p className="text-sm text-neutral-600">{record.treatment}</p>
                      {record.prescriptions.length > 0 && (
                        <div className="flex items-center text-sm text-neutral-500">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>{record.prescriptions.length} prescription(s)</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                        setIsViewRecordModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}

              {medicalRecords.length === 0 && (
                <div className="text-center py-6">
                  <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No medical records found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsAddRecordModalOpen(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add First Record
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Medical Conditions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Allergies</h4>
                <p className="text-sm mt-1">
                  {patient.allergies?.join(', ') || 'None reported'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Chronic Conditions</h4>
                <p className="text-sm mt-1">
                  {patient.chronic_conditions?.join(', ') || 'None reported'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Current Medications</h4>
                <p className="text-sm mt-1">
                  {patient.medications?.join(', ') || 'None reported'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Appointments</h3>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-neutral-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <Clock className="h-4 w-4 mr-2" />
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
                </div>
              ))}

              {appointments.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No appointments found</p>
                </div>
              )}
            </div>
          </Card>

          {patient.emergency_contact && (
            <Card>
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Emergency Contact</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {patient.emergency_contact.name}</p>
                <p><span className="font-medium">Relationship:</span> {patient.emergency_contact.relationship}</p>
                <p><span className="font-medium">Phone:</span> {patient.emergency_contact.phone}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isViewRecordModalOpen}
        onClose={() => {
          setIsViewRecordModalOpen(false);
          setSelectedRecord(null);
        }}
        title="Medical Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-neutral-500" />
              <span className="text-neutral-600">
                {format(new Date(selectedRecord.date), 'MMMM d, yyyy')}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Diagnosis</h4>
                <p className="text-neutral-800">{selectedRecord.diagnosis}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-500">Treatment</h4>
                <p className="text-neutral-800">{selectedRecord.treatment}</p>
              </div>

              {selectedRecord.notes && (
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Notes</h4>
                  <p className="text-neutral-800">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            {selectedRecord.prescriptions.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-neutral-800 mb-4">Prescriptions</h4>
                <div className="space-y-4">
                  {selectedRecord.prescriptions.map((prescription: any) => (
                    <div key={prescription.id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-neutral-500">Medication</h5>
                          <p className="text-neutral-800">{prescription.medication_name}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-500">Dosage</h5>
                          <p className="text-neutral-800">{prescription.dosage}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-500">Frequency</h5>
                          <p className="text-neutral-800">{prescription.frequency}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-500">Duration</h5>
                          <p className="text-neutral-800">{prescription.duration}</p>
                        </div>
                      </div>
                      {prescription.notes && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium text-neutral-500">Notes</h5>
                          <p className="text-neutral-800">{prescription.notes}</p>
                        </div>
                      )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default PatientProfile;