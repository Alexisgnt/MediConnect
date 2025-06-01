export type UserRole = 'doctor' | 'patient';

export const SPECIALIZATIONS = [
  'General Practice',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Urology',
  'Dentistry',
  'Oral Surgery',
  'Orthodontics',
  'Emergency Medicine',
  'Anesthesiology',
  'Physical Medicine',
  'Sports Medicine',
  'Allergy & Immunology',
  'Infectious Disease',
  'Nephrology',
  'Pain Medicine',
  'Plastic Surgery',
  'Vascular Surgery'
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: Specialization;
  phoneNumber: string;
  address: string;
  schedule?: Schedule;
  patients?: string[]; // Array of patient IDs
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: Date;
  phoneNumber: string;
  address: string;
  primaryDoctors?: { [key in Specialization]?: string }; // Map of specialization to doctor ID
  medicalRecords?: MedicalRecord[];
}

export interface Schedule {
  workingDays: WorkingDay[];
  vacations: Vacation[];
  timeSlots: TimeSlot[];
}

export interface WorkingDay {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
}

export interface Vacation {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  isBooked: boolean;
  patientId?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}