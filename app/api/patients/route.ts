import { NextRequest, NextResponse } from 'next/server';
import { getPatients, createPatient } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Patient, CreatePatientInput } from '@/types';

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

    const patient = await createPatient(newPatient);
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
