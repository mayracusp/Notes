export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
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
