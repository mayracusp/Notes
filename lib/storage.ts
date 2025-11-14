import fs from 'fs/promises';
import path from 'path';
import { Patient, ClinicalNote } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const NOTES_FILE = path.join(DATA_DIR, 'clinical-notes.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Patient operations
export async function getPatients(): Promise<Patient[]> {
  return readJSONFile<Patient[]>(PATIENTS_FILE, []);
}

export async function getPatient(id: string): Promise<Patient | null> {
  const patients = await getPatients();
  return patients.find(p => p.id === id) || null;
}

export async function createPatient(patient: Patient): Promise<Patient> {
  const patients = await getPatients();
  patients.push(patient);
  await writeJSONFile(PATIENTS_FILE, patients);
  return patient;
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const patients = await getPatients();
  const index = patients.findIndex(p => p.id === id);

  if (index === -1) return null;

  patients[index] = { ...patients[index], ...updates, updatedAt: new Date().toISOString() };
  await writeJSONFile(PATIENTS_FILE, patients);
  return patients[index];
}

export async function deletePatient(id: string): Promise<boolean> {
  const patients = await getPatients();
  const filtered = patients.filter(p => p.id !== id);

  if (filtered.length === patients.length) return false;

  await writeJSONFile(PATIENTS_FILE, filtered);
  return true;
}

// Clinical notes operations
export async function getClinicalNotes(): Promise<ClinicalNote[]> {
  return readJSONFile<ClinicalNote[]>(NOTES_FILE, []);
}

export async function getClinicalNote(id: string): Promise<ClinicalNote | null> {
  const notes = await getClinicalNotes();
  return notes.find(n => n.id === id) || null;
}

export async function getClinicalNotesByPatient(patientId: string): Promise<ClinicalNote[]> {
  const notes = await getClinicalNotes();
  return notes.filter(n => n.patientId === patientId).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function createClinicalNote(note: ClinicalNote): Promise<ClinicalNote> {
  const notes = await getClinicalNotes();
  notes.push(note);
  await writeJSONFile(NOTES_FILE, notes);
  return note;
}

export async function updateClinicalNote(id: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote | null> {
  const notes = await getClinicalNotes();
  const index = notes.findIndex(n => n.id === id);

  if (index === -1) return null;

  notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
  await writeJSONFile(NOTES_FILE, notes);
  return notes[index];
}

export async function deleteClinicalNote(id: string): Promise<boolean> {
  const notes = await getClinicalNotes();
  const filtered = notes.filter(n => n.id !== id);

  if (filtered.length === notes.length) return false;

  await writeJSONFile(NOTES_FILE, filtered);
  return true;
}
