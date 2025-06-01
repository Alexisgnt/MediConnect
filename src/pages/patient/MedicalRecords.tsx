import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const MedicalRecords: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState({
    address: user?.patient?.address || '',
    phoneNumber: user?.phone_number || '',
    dateOfBirth: user?.patient?.date_of_birth || '',
    height: user?.patient?.height || '',
    weight: user?.patient?.weight || '',
    bloodType: user?.patient?.blood_type || '',
    allergies: user?.patient?.allergies || [],
    chronicConditions: user?.patient?.chronic_conditions || [],
    pastSurgeries: user?.patient?.past_surgeries || [],
    medications: user?.patient?.medications || [],
    emergencyContact: user?.patient?.emergency_contact || {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  useEffect(() => {
    if (user?.patient?.id) {
      fetchMedicalRecords();
    }
  }, [user]);

  const fetchMedicalRecords = async () => {
    try {
      setIsLoading(true);
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
          ),
          prescriptions(*)
        `)
        .eq('patient_id', user?.patient?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Update patient information
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          address: patientInfo.address,
          date_of_birth: patientInfo.dateOfBirth,
          height: patientInfo.height,
          weight: patientInfo.weight,
          blood_type: patientInfo.bloodType,
          allergies: patientInfo.allergies,
          chronic_conditions: patientInfo.chronicConditions,
          past_surgeries: patientInfo.pastSurgeries,
          medications: patientInfo.medications,
          emergency_contact: patientInfo.emergencyContact
        })
        .eq('id', user?.patient?.id);

      if (patientError) throw patientError;

      // Update user phone number
      const { error: userError } = await supabase
        .from('users')
        .update({
          phone_number: patientInfo.phoneNumber
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating patient info:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArrayInput = (field: 'allergies' | 'chronicConditions' | 'medications', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setPatientInfo(prev => ({ ...prev, [field]: items }));
  };

  const handleSurgeryInput = (index: number, field: string, value: string) => {
    setPatientInfo(prev => ({
      ...prev,
      pastSurgeries: prev.pastSurgeries.map((surgery, i) =>
        i === index ? { ...surgery, [field]: value } : surgery
      )
    }));
  };

  const addSurgery = () => {
    setPatientInfo(prev => ({
      ...prev,
      pastSurgeries: [
        ...prev.pastSurgeries,
        { procedure: '', date: '', hospital: '', surgeon: '' }
      ]
    }));
  };

  const removeSurgery = (index: number) => {
    setPatientInfo(prev => ({
      ...prev,
      pastSurgeries: prev.pastSurgeries.filter((_, i) => i !== index)
    }));
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.diagnosis.toLowerCase().includes(searchLower) ||
      record.treatment.toLowerCase().includes(searchLower) ||
      `Dr. ${record.doctor.user.first_name} ${record.doctor.user.last_name}`.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-800">Medical Records</h2>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          leftIcon={<Edit className="h-5 w-5" />}
        >
          Edit Medical Info
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-500">Basic Information</h4>
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                <span className="font-medium">Height:</span> {user?.patient?.height} cm
              </p>
              <p className="text-sm">
                <span className="font-medium">Weight:</span> {user?.patient?.weight} kg
              </p>
              <p className="text-sm">
                <span className="font-medium">Blood Type:</span> {user?.patient?.blood_type || 'Not specified'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-500">Medical Conditions</h4>
            <div className="space-y-2 mt-2">
              <div>
                <p className="text-sm font-medium">Allergies:</p>
                <p className="text-sm">{user?.patient?.allergies?.join(', ') || 'None reported'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Chronic Conditions:</p>
                <p className="text-sm">{user?.patient?.chronic_conditions?.join(', ') || 'None reported'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Current Medications:</p>
                <p className="text-sm">{user?.patient?.medications?.join(', ') || 'None reported'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-500">Emergency Contact</h4>
            <div className="space-y-2 mt-2">
              {user?.patient?.emergency_contact ? (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {user.patient.emergency_contact.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Relationship:</span> {user.patient.emergency_contact.relationship}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {user.patient.emergency_contact.phone}
                  </p>
                </>
              ) : (
                <p className="text-sm text-neutral-500">No emergency contact specified</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => {
            setSelectedRecord(record);
            setIsViewModalOpen(true);
          }}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">
                    {format(new Date(record.date), 'MMMM d, yyyy')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">
                    Dr. {record.doctor.user.first_name} {record.doctor.user.last_name} - {record.doctor.specialization}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-neutral-800">{record.diagnosis}</h3>
                <p className="text-neutral-600">{record.treatment}</p>

                {record.prescriptions.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <FileText className="h-4 w-4" />
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
                  setIsViewModalOpen(true);
                }}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}

        {filteredRecords.length === 0 && (
          <Card>
            <div className="text-center py-6">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No medical records found</p>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRecord(null);
        }}
        title="Medical Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <span className="text-neutral-600">
                  {format(new Date(selectedRecord.date), 'MMMM d, yyyy')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-neutral-500" />
                <span className="text-neutral-600">
                  Dr. {selectedRecord.doctor.user.first_name} {selectedRecord.doctor.user.last_name}
                </span>
                <span className="text-sm text-neutral-500">
                  ({selectedRecord.doctor.specialization})
                </span>
              </div>
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
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Medical Information"
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-neutral-800">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Height (cm)"
                type="number"
                value={patientInfo.height}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, height: e.target.value }))}
              />
              <Input
                label="Weight (kg)"
                type="number"
                value={patientInfo.weight}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, weight: e.target.value }))}
              />
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Blood Type
                </label>
                <select
                  className="input-field"
                  value={patientInfo.bloodType}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, bloodType: e.target.value }))}
                >
                  <option value="">Select blood type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-neutral-800">Medical Conditions</h4>
            <Input
              label="Allergies"
              value={patientInfo.allergies.join(', ')}
              onChange={(e) => handleArrayInput('allergies', e.target.value)}
              placeholder="Enter allergies separated by commas"
            />
            <Input
              label="Chronic Conditions"
              value={patientInfo.chronicConditions.join(', ')}
              onChange={(e) => handleArrayInput('chronicConditions', e.target.value)}
              placeholder="Enter conditions separated by commas"
            />
            <Input
              label="Current Medications"
              value={patientInfo.medications.join(', ')}
              onChange={(e) => handleArrayInput('medications', e.target.value)}
              placeholder="Enter medications separated by commas"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-neutral-800">Past Surgeries</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={addSurgery}
              >
                Add Surgery
              </Button>
            </div>
            {patientInfo.pastSurgeries.map((surgery, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium text-neutral-700">Surgery {index + 1}</h5>
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSurgery(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Procedure"
                    value={surgery.procedure}
                    onChange={(e) => handleSurgeryInput(index, 'procedure', e.target.value)}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={surgery.date}
                    onChange={(e) => handleSurgeryInput(index, 'date', e.target.value)}
                  />
                  <Input
                    label="Hospital"
                    value={surgery.hospital}
                    onChange={(e) => handleSurgeryInput(index, 'hospital', e.target.value)}
                  />
                  <Input
                    label="Surgeon"
                    value={surgery.surgeon}
                    onChange={(e) => handleSurgeryInput(index, 'surgeon', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-neutral-800">Emergency Contact</h4>
            <Input
              label="Name"
              value={patientInfo.emergencyContact.name}
              onChange={(e) => setPatientInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, name: e.target.value }
              }))}
            />
            <Input
              label="Relationship"
              value={patientInfo.emergencyContact.relationship}
              onChange={(e) => setPatientInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
              }))}
            />
            <Input
              label="Phone Number"
              value={patientInfo.emergencyContact.phone}
              onChange={(e) => setPatientInfo(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
              }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={updatePatientInfo}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MedicalRecords;