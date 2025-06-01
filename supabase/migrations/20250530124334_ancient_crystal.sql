-- Add medical information fields to patients table
ALTER TABLE patients
ADD COLUMN height NUMERIC,
ADD COLUMN weight NUMERIC,
ADD COLUMN blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
ADD COLUMN allergies TEXT[],
ADD COLUMN chronic_conditions TEXT[],
ADD COLUMN past_surgeries JSONB DEFAULT '[]'::jsonb,
ADD COLUMN medications TEXT[],
ADD COLUMN emergency_contact JSONB;