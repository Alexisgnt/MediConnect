-- Create doctor_patient_requests table
CREATE TABLE doctor_patient_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    initiated_by TEXT NOT NULL CHECK (initiated_by IN ('doctor', 'patient')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance
CREATE INDEX idx_doctor_patient_requests_doctor_id ON doctor_patient_requests(doctor_id);
CREATE INDEX idx_doctor_patient_requests_patient_id ON doctor_patient_requests(patient_id);
CREATE INDEX idx_doctor_patient_requests_status ON doctor_patient_requests(status);