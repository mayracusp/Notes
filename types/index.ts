export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  // HeyDonto integration fields
  heyDontoId?: string; // Patient ID in HeyDonto/PMS
  heyDontoSyncStatus?: 'pending' | 'synced' | 'error' | 'disabled';
  heyDontoLastSyncAt?: string;
  heyDontoSyncError?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string;
  noteText: string;
  audioUrl?: string;
  isTranscribed: boolean;
  dentistName: string;
  createdAt: string;
  updatedAt: string;
  // HeyDonto integration fields
  heyDontoId?: string; // Note ID in HeyDonto/PMS
  heyDontoAppointmentId?: string; // Link to appointment in PMS
  heyDontoTreatmentCodes?: string[]; // Treatment codes from PMS
  heyDontoSyncStatus?: 'pending' | 'synced' | 'error' | 'disabled';
  heyDontoLastSyncAt?: string;
  heyDontoSyncError?: string;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

export interface CreateClinicalNoteInput {
  patientId: string;
  noteText: string;
  audioUrl?: string;
  isTranscribed: boolean;
  dentistName: string;
}

// HeyDonto API Types
export interface HeyDontoConfig {
  apiKey: string;
  apiUrl: string;
  practiceId: string;
  enabled: boolean;
  webhookSecret?: string;
}

export interface HeyDontoPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  externalId?: string; // Our local patient ID
  // Additional fields from PMS
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface HeyDontoClinicalNote {
  id: string;
  patientId: string;
  appointmentId?: string;
  providerId?: string;
  date: string;
  noteText: string;
  treatmentCodes?: string[];
  externalId?: string; // Our local note ID
}

export interface HeyDontoAppointment {
  id: string;
  patientId: string;
  providerId?: string;
  startTime: string;
  endTime: string;
  status: string;
  appointmentType?: string;
  notes?: string;
}

export interface HeyDontoSyncResult {
  success: boolean;
  heyDontoId?: string;
  error?: string;
  timestamp: string;
}
