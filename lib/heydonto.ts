/**
 * HeyDonto API Client
 *
 * This module provides integration with HeyDonto's practice management system API.
 * HeyDonto enables real-time synchronization with dental PMS systems like Dentrix,
 * Eaglesoft, OpenDental, and others.
 *
 * Features:
 * - FHIR/HL7 compliant API integration
 * - Real-time patient data sync
 * - Clinical notes synchronization
 * - Appointment management
 * - HIPAA-compliant data handling
 */

import {
  HeyDontoConfig,
  HeyDontoPatient,
  HeyDontoClinicalNote,
  HeyDontoAppointment,
  HeyDontoSyncResult,
  Patient,
  ClinicalNote,
} from '@/types';

/**
 * Get HeyDonto configuration from environment variables
 */
export function getHeyDontoConfig(): HeyDontoConfig | null {
  const apiKey = process.env.HEYDONTO_API_KEY;
  const apiUrl = process.env.HEYDONTO_API_URL || 'https://api.heydonto.com/v1';
  const practiceId = process.env.HEYDONTO_PRACTICE_ID;
  const enabled = process.env.HEYDONTO_ENABLED === 'true';
  const webhookSecret = process.env.HEYDONTO_WEBHOOK_SECRET;

  if (!enabled) {
    return null;
  }

  if (!apiKey || !practiceId) {
    console.warn('HeyDonto is enabled but API credentials are missing');
    return null;
  }

  return {
    apiKey,
    apiUrl,
    practiceId,
    enabled,
    webhookSecret,
  };
}

/**
 * Check if HeyDonto integration is enabled and configured
 */
export function isHeyDontoEnabled(): boolean {
  const config = getHeyDontoConfig();
  return config !== null && config.enabled;
}

/**
 * Make an authenticated request to HeyDonto API
 */
async function makeHeyDontoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getHeyDontoConfig();

  if (!config) {
    throw new Error('HeyDonto is not configured');
  }

  const url = `${config.apiUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
    'X-Practice-ID': config.practiceId,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HeyDonto API error (${response.status}): ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('HeyDonto API request failed:', error);
    throw error;
  }
}

/**
 * Map local Patient data to HeyDonto format
 */
export function mapPatientToHeyDonto(patient: Patient): Partial<HeyDontoPatient> {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    email: patient.email,
    phone: patient.phone,
    externalId: patient.id,
  };
}

/**
 * Map HeyDonto Patient data to local format
 */
export function mapHeyDontoToPatient(
  heyDontoPatient: HeyDontoPatient,
  existingPatient?: Patient
): Partial<Patient> {
  const baseData: Partial<Patient> = {
    firstName: heyDontoPatient.firstName,
    lastName: heyDontoPatient.lastName,
    dateOfBirth: heyDontoPatient.dateOfBirth,
    email: heyDontoPatient.email || '',
    phone: heyDontoPatient.phone || '',
    heyDontoId: heyDontoPatient.id,
    heyDontoSyncStatus: 'synced',
    heyDontoLastSyncAt: new Date().toISOString(),
  };

  // If we have an existing patient, preserve their local ID
  if (existingPatient) {
    baseData.id = existingPatient.id;
  }

  return baseData;
}

/**
 * Map local ClinicalNote to HeyDonto format
 */
export function mapClinicalNoteToHeyDonto(
  note: ClinicalNote
): Partial<HeyDontoClinicalNote> {
  return {
    patientId: note.heyDontoId || '', // Use HeyDonto patient ID
    appointmentId: note.heyDontoAppointmentId,
    date: note.date,
    noteText: note.noteText,
    treatmentCodes: note.heyDontoTreatmentCodes,
    externalId: note.id,
  };
}

// ============================================================================
// Patient API Methods
// ============================================================================

/**
 * Create a new patient in HeyDonto
 */
export async function createHeyDontoPatient(
  patient: Patient
): Promise<HeyDontoSyncResult> {
  try {
    const heyDontoData = mapPatientToHeyDonto(patient);

    const result = await makeHeyDontoRequest<HeyDontoPatient>(
      '/patients',
      {
        method: 'POST',
        body: JSON.stringify(heyDontoData),
      }
    );

    return {
      success: true,
      heyDontoId: result.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to create patient in HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Update an existing patient in HeyDonto
 */
export async function updateHeyDontoPatient(
  patient: Patient
): Promise<HeyDontoSyncResult> {
  try {
    if (!patient.heyDontoId) {
      throw new Error('Patient does not have a HeyDonto ID');
    }

    const heyDontoData = mapPatientToHeyDonto(patient);

    const result = await makeHeyDontoRequest<HeyDontoPatient>(
      `/patients/${patient.heyDontoId}`,
      {
        method: 'PUT',
        body: JSON.stringify(heyDontoData),
      }
    );

    return {
      success: true,
      heyDontoId: result.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to update patient in HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get a patient from HeyDonto by ID
 */
export async function getHeyDontoPatient(
  heyDontoId: string
): Promise<HeyDontoPatient | null> {
  try {
    const result = await makeHeyDontoRequest<HeyDontoPatient>(
      `/patients/${heyDontoId}`
    );
    return result;
  } catch (error) {
    console.error('Failed to get patient from HeyDonto:', error);
    return null;
  }
}

/**
 * Search for patients in HeyDonto
 */
export async function searchHeyDontoPatients(
  query: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    email?: string;
  }
): Promise<HeyDontoPatient[]> {
  try {
    const queryParams = new URLSearchParams(
      Object.entries(query).filter(([_, v]) => v !== undefined) as [string, string][]
    );

    const result = await makeHeyDontoRequest<{ patients: HeyDontoPatient[] }>(
      `/patients/search?${queryParams.toString()}`
    );

    return result.patients || [];
  } catch (error) {
    console.error('Failed to search patients in HeyDonto:', error);
    return [];
  }
}

/**
 * Delete a patient from HeyDonto
 */
export async function deleteHeyDontoPatient(
  heyDontoId: string
): Promise<HeyDontoSyncResult> {
  try {
    await makeHeyDontoRequest(
      `/patients/${heyDontoId}`,
      {
        method: 'DELETE',
      }
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to delete patient from HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Clinical Notes API Methods
// ============================================================================

/**
 * Create a clinical note in HeyDonto
 */
export async function createHeyDontoClinicalNote(
  note: ClinicalNote
): Promise<HeyDontoSyncResult> {
  try {
    const heyDontoData = mapClinicalNoteToHeyDonto(note);

    const result = await makeHeyDontoRequest<HeyDontoClinicalNote>(
      '/clinical-notes',
      {
        method: 'POST',
        body: JSON.stringify(heyDontoData),
      }
    );

    return {
      success: true,
      heyDontoId: result.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to create clinical note in HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Update a clinical note in HeyDonto
 */
export async function updateHeyDontoClinicalNote(
  note: ClinicalNote
): Promise<HeyDontoSyncResult> {
  try {
    if (!note.heyDontoId) {
      throw new Error('Clinical note does not have a HeyDonto ID');
    }

    const heyDontoData = mapClinicalNoteToHeyDonto(note);

    const result = await makeHeyDontoRequest<HeyDontoClinicalNote>(
      `/clinical-notes/${note.heyDontoId}`,
      {
        method: 'PUT',
        body: JSON.stringify(heyDontoData),
      }
    );

    return {
      success: true,
      heyDontoId: result.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to update clinical note in HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get clinical notes for a patient from HeyDonto
 */
export async function getHeyDontoPatientNotes(
  heyDontoPatientId: string
): Promise<HeyDontoClinicalNote[]> {
  try {
    const result = await makeHeyDontoRequest<{ notes: HeyDontoClinicalNote[] }>(
      `/patients/${heyDontoPatientId}/clinical-notes`
    );

    return result.notes || [];
  } catch (error) {
    console.error('Failed to get clinical notes from HeyDonto:', error);
    return [];
  }
}

/**
 * Delete a clinical note from HeyDonto
 */
export async function deleteHeyDontoClinicalNote(
  heyDontoId: string
): Promise<HeyDontoSyncResult> {
  try {
    await makeHeyDontoRequest(
      `/clinical-notes/${heyDontoId}`,
      {
        method: 'DELETE',
      }
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to delete clinical note from HeyDonto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Appointment API Methods
// ============================================================================

/**
 * Get appointments for a patient from HeyDonto
 */
export async function getHeyDontoPatientAppointments(
  heyDontoPatientId: string
): Promise<HeyDontoAppointment[]> {
  try {
    const result = await makeHeyDontoRequest<{ appointments: HeyDontoAppointment[] }>(
      `/patients/${heyDontoPatientId}/appointments`
    );

    return result.appointments || [];
  } catch (error) {
    console.error('Failed to get appointments from HeyDonto:', error);
    return [];
  }
}

/**
 * Get a specific appointment from HeyDonto
 */
export async function getHeyDontoAppointment(
  appointmentId: string
): Promise<HeyDontoAppointment | null> {
  try {
    const result = await makeHeyDontoRequest<HeyDontoAppointment>(
      `/appointments/${appointmentId}`
    );
    return result;
  } catch (error) {
    console.error('Failed to get appointment from HeyDonto:', error);
    return null;
  }
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify HeyDonto webhook signature
 */
export function verifyHeyDontoWebhook(
  payload: string,
  signature: string
): boolean {
  const config = getHeyDontoConfig();

  if (!config || !config.webhookSecret) {
    console.warn('Webhook secret not configured');
    return false;
  }

  // TODO: Implement signature verification based on HeyDonto's webhook documentation
  // This is a placeholder - actual implementation will depend on HeyDonto's signature method
  // Common methods include HMAC-SHA256

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Failed to verify webhook signature:', error);
    return false;
  }
}
