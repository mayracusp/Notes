import { NextRequest, NextResponse } from 'next/server';
import { getPatient, updatePatient, deletePatient } from '@/lib/storage';
import {
  syncPatientUpdateToHeyDonto,
  syncPatientDeletionToHeyDonto,
} from '@/lib/heydonto-sync';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await getPatient(params.id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const patient = await updatePatient(params.id, updates);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Sync updates to HeyDonto if enabled (async, non-blocking)
    syncPatientUpdateToHeyDonto(patient).catch((error) => {
      console.error('Failed to sync patient update to HeyDonto:', error);
    });

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get patient before deleting (for HeyDonto sync)
    const patient = await getPatient(params.id);

    const success = await deletePatient(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Sync deletion to HeyDonto if enabled (async, non-blocking)
    if (patient) {
      syncPatientDeletionToHeyDonto(patient).catch((error) => {
        console.error('Failed to sync patient deletion to HeyDonto:', error);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
