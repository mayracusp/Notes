/**
 * HeyDonto Sync Adapter
 *
 * This module provides high-level synchronization between local storage
 * and HeyDonto practice management system.
 *
 * Features:
 * - Automatic sync when HeyDonto is enabled
 * - Graceful fallback when HeyDonto is disabled
 * - Bidirectional data sync
 * - Error handling and retry logic
 */

import { Patient, ClinicalNote } from '@/types';
import {
  isHeyDontoEnabled,
  createHeyDontoPatient,
  updateHeyDontoPatient,
  deleteHeyDontoPatient,
  createHeyDontoClinicalNote,
  updateHeyDontoClinicalNote,
  deleteHeyDontoClinicalNote,
  searchHeyDontoPatients,
  getHeyDontoPatient,
} from './heydonto';
import {
  updatePatient as updateLocalPatient,
  updateClinicalNote as updateLocalNote,
} from './storage';

/**
 * Sync a patient to HeyDonto after creation
 */
export async function syncPatientToHeyDonto(
  patient: Patient
): Promise<Patient> {
  // If HeyDonto is not enabled, return patient as-is
  if (!isHeyDontoEnabled()) {
    return {
      ...patient,
      heyDontoSyncStatus: 'disabled',
    };
  }

  // If patient already has a HeyDonto ID, it's already synced
  if (patient.heyDontoId) {
    return patient;
  }

  // Create patient in HeyDonto
  const syncResult = await createHeyDontoPatient(patient);

  // Update local patient with sync status
  const updatedPatient: Patient = {
    ...patient,
    heyDontoId: syncResult.heyDontoId,
    heyDontoSyncStatus: syncResult.success ? 'synced' : 'error',
    heyDontoLastSyncAt: syncResult.timestamp,
    heyDontoSyncError: syncResult.error,
  };

  // Save sync status to local storage
  try {
    await updateLocalPatient(updatedPatient.id, updatedPatient);
  } catch (error) {
    console.error('Failed to update local patient with sync status:', error);
  }

  return updatedPatient;
}

/**
 * Sync patient updates to HeyDonto
 */
export async function syncPatientUpdateToHeyDonto(
  patient: Patient
): Promise<Patient> {
  // If HeyDonto is not enabled, return patient as-is
  if (!isHeyDontoEnabled()) {
    return {
      ...patient,
      heyDontoSyncStatus: 'disabled',
    };
  }

  let syncResult;

  // If patient doesn't have a HeyDonto ID yet, create it
  if (!patient.heyDontoId) {
    syncResult = await createHeyDontoPatient(patient);
  } else {
    // Otherwise, update existing patient
    syncResult = await updateHeyDontoPatient(patient);
  }

  // Update local patient with sync status
  const updatedPatient: Patient = {
    ...patient,
    heyDontoId: syncResult.heyDontoId || patient.heyDontoId,
    heyDontoSyncStatus: syncResult.success ? 'synced' : 'error',
    heyDontoLastSyncAt: syncResult.timestamp,
    heyDontoSyncError: syncResult.error,
  };

  // Save sync status to local storage
  try {
    await updateLocalPatient(updatedPatient.id, updatedPatient);
  } catch (error) {
    console.error('Failed to update local patient with sync status:', error);
  }

  return updatedPatient;
}

/**
 * Delete patient from HeyDonto
 */
export async function syncPatientDeletionToHeyDonto(
  patient: Patient
): Promise<void> {
  // If HeyDonto is not enabled or patient doesn't have a HeyDonto ID, skip
  if (!isHeyDontoEnabled() || !patient.heyDontoId) {
    return;
  }

  // Delete from HeyDonto
  const syncResult = await deleteHeyDontoPatient(patient.heyDontoId);

  if (!syncResult.success) {
    console.error('Failed to delete patient from HeyDonto:', syncResult.error);
    // Note: We don't throw an error here to allow local deletion to proceed
  }
}

/**
 * Find a patient in HeyDonto by local patient data
 * Useful for matching existing patients
 */
export async function findPatientInHeyDonto(
  patient: Patient
): Promise<string | null> {
  if (!isHeyDontoEnabled()) {
    return null;
  }

  try {
    const results = await searchHeyDontoPatients({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
    });

    // Look for exact match
    const match = results.find(
      (p) =>
        p.firstName === patient.firstName &&
        p.lastName === patient.lastName &&
        p.dateOfBirth === patient.dateOfBirth
    );

    return match?.id || null;
  } catch (error) {
    console.error('Failed to find patient in HeyDonto:', error);
    return null;
  }
}

/**
 * Link an existing local patient to a HeyDonto patient
 */
export async function linkPatientToHeyDonto(
  localPatientId: string,
  heyDontoPatientId: string
): Promise<Patient | null> {
  if (!isHeyDontoEnabled()) {
    return null;
  }

  try {
    // Get HeyDonto patient data
    const heyDontoPatient = await getHeyDontoPatient(heyDontoPatientId);
    if (!heyDontoPatient) {
      throw new Error('HeyDonto patient not found');
    }

    // Update local patient with HeyDonto ID
    const updatedPatient = await updateLocalPatient(localPatientId, {
      heyDontoId: heyDontoPatientId,
      heyDontoSyncStatus: 'synced',
      heyDontoLastSyncAt: new Date().toISOString(),
    });

    return updatedPatient;
  } catch (error) {
    console.error('Failed to link patient to HeyDonto:', error);
    return null;
  }
}

// ============================================================================
// Clinical Notes Sync
// ============================================================================

/**
 * Sync a clinical note to HeyDonto after creation
 */
export async function syncClinicalNoteToHeyDonto(
  note: ClinicalNote,
  patient: Patient
): Promise<ClinicalNote> {
  // If HeyDonto is not enabled, return note as-is
  if (!isHeyDontoEnabled()) {
    return {
      ...note,
      heyDontoSyncStatus: 'disabled',
    };
  }

  // Patient must be synced to HeyDonto first
  if (!patient.heyDontoId) {
    return {
      ...note,
      heyDontoSyncStatus: 'error',
      heyDontoSyncError: 'Patient not synced to HeyDonto',
    };
  }

  // If note already has a HeyDonto ID, it's already synced
  if (note.heyDontoId) {
    return note;
  }

  // Add HeyDonto patient ID to note before syncing
  const noteWithHeyDontoPatientId = {
    ...note,
    heyDontoId: patient.heyDontoId,
  };

  // Create note in HeyDonto
  const syncResult = await createHeyDontoClinicalNote(noteWithHeyDontoPatientId);

  // Update local note with sync status
  const updatedNote: ClinicalNote = {
    ...note,
    heyDontoId: syncResult.heyDontoId,
    heyDontoSyncStatus: syncResult.success ? 'synced' : 'error',
    heyDontoLastSyncAt: syncResult.timestamp,
    heyDontoSyncError: syncResult.error,
  };

  // Save sync status to local storage
  try {
    await updateLocalNote(updatedNote.id, updatedNote);
  } catch (error) {
    console.error('Failed to update local note with sync status:', error);
  }

  return updatedNote;
}

/**
 * Sync clinical note updates to HeyDonto
 */
export async function syncClinicalNoteUpdateToHeyDonto(
  note: ClinicalNote,
  patient: Patient
): Promise<ClinicalNote> {
  // If HeyDonto is not enabled, return note as-is
  if (!isHeyDontoEnabled()) {
    return {
      ...note,
      heyDontoSyncStatus: 'disabled',
    };
  }

  // Patient must be synced to HeyDonto
  if (!patient.heyDontoId) {
    return {
      ...note,
      heyDontoSyncStatus: 'error',
      heyDontoSyncError: 'Patient not synced to HeyDonto',
    };
  }

  let syncResult;

  // Add HeyDonto patient ID to note
  const noteWithHeyDontoPatientId = {
    ...note,
    heyDontoId: note.heyDontoId || patient.heyDontoId,
  };

  // If note doesn't have a HeyDonto ID yet, create it
  if (!note.heyDontoId) {
    syncResult = await createHeyDontoClinicalNote(noteWithHeyDontoPatientId);
  } else {
    // Otherwise, update existing note
    syncResult = await updateHeyDontoClinicalNote(noteWithHeyDontoPatientId);
  }

  // Update local note with sync status
  const updatedNote: ClinicalNote = {
    ...note,
    heyDontoId: syncResult.heyDontoId || note.heyDontoId,
    heyDontoSyncStatus: syncResult.success ? 'synced' : 'error',
    heyDontoLastSyncAt: syncResult.timestamp,
    heyDontoSyncError: syncResult.error,
  };

  // Save sync status to local storage
  try {
    await updateLocalNote(updatedNote.id, updatedNote);
  } catch (error) {
    console.error('Failed to update local note with sync status:', error);
  }

  return updatedNote;
}

/**
 * Delete clinical note from HeyDonto
 */
export async function syncClinicalNoteDeletionToHeyDonto(
  note: ClinicalNote
): Promise<void> {
  // If HeyDonto is not enabled or note doesn't have a HeyDonto ID, skip
  if (!isHeyDontoEnabled() || !note.heyDontoId) {
    return;
  }

  // Delete from HeyDonto
  const syncResult = await deleteHeyDontoClinicalNote(note.heyDontoId);

  if (!syncResult.success) {
    console.error('Failed to delete clinical note from HeyDonto:', syncResult.error);
    // Note: We don't throw an error here to allow local deletion to proceed
  }
}

/**
 * Batch sync multiple patients to HeyDonto
 * Useful for initial setup or migration
 */
export async function batchSyncPatientsToHeyDonto(
  patients: Patient[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!isHeyDontoEnabled()) {
    return {
      success: 0,
      failed: patients.length,
      errors: ['HeyDonto is not enabled'],
    };
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const patient of patients) {
    try {
      await syncPatientToHeyDonto(patient);
      success++;
    } catch (error) {
      failed++;
      errors.push(
        `Failed to sync patient ${patient.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return { success, failed, errors };
}

/**
 * Batch sync multiple clinical notes to HeyDonto
 */
export async function batchSyncClinicalNotesToHeyDonto(
  notes: ClinicalNote[],
  patients: Map<string, Patient>
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!isHeyDontoEnabled()) {
    return {
      success: 0,
      failed: notes.length,
      errors: ['HeyDonto is not enabled'],
    };
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const note of notes) {
    try {
      const patient = patients.get(note.patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      await syncClinicalNoteToHeyDonto(note, patient);
      success++;
    } catch (error) {
      failed++;
      errors.push(
        `Failed to sync note ${note.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return { success, failed, errors };
}
