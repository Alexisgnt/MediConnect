export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'doctor' | 'patient'
          phone_number: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'doctor' | 'patient'
          phone_number: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'doctor' | 'patient'
          phone_number?: string
          created_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialization: string
          address: string
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization: string
          address: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string
          address?: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          date_of_birth: string
          address: string
          primary_doctor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date_of_birth: string
          address: string
          primary_doctor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date_of_birth?: string
          address?: string
          primary_doctor_id?: string | null
          created_at?: string
        }
      }
      doctor_patient_requests: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          initiated_by: 'doctor' | 'patient'
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          initiated_by: 'doctor' | 'patient'
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          initiated_by?: 'doctor' | 'patient'
        }
      }
      doctor_schedules: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      doctor_vacations: {
        Row: {
          id: string
          doctor_id: string
          start_date: string
          end_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          start_date: string
          end_date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          date: string
          diagnosis: string
          treatment: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          date: string
          diagnosis: string
          treatment: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          date?: string
          diagnosis?: string
          treatment?: string
          notes?: string | null
          created_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          medical_record_id: string
          medication_name: string
          dosage: string
          frequency: string
          duration: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medical_record_id: string
          medication_name: string
          dosage: string
          frequency: string
          duration: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medical_record_id?: string
          medication_name?: string
          dosage?: string
          frequency?: string
          duration?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}