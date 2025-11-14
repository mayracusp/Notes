import { NextRequest, NextResponse } from 'next/server';
import { getPatients, createPatient } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Patient, CreatePatientInput } from '@/types';
import { syncPatientToHeyDonto } from '@/lib/heydonto-sync';

export async function GET() {
  try {
    const patients = await getPatients();
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreatePatientInput = await request.json();

    const newPatient: Patient = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create patient locally
    const patient = await createPatient(newPatient);

    // Sync to HeyDonto if enabled (async, non-blocking)
    syncPatientToHeyDonto(patient).catch((error) => {
      console.error('Failed to sync patient to HeyDonto:', error);
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
