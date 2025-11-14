import { NextRequest, NextResponse } from 'next/server';
import { getClinicalNotes, createClinicalNote, getClinicalNotesByPatient } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { ClinicalNote, CreateClinicalNoteInput } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (patientId) {
      const notes = await getClinicalNotesByPatient(patientId);
      return NextResponse.json(notes);
    }

    const notes = await getClinicalNotes();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clinical notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateClinicalNoteInput = await request.json();

    const newNote: ClinicalNote = {
      id: generateId(),
      date: new Date().toISOString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const note = await createClinicalNote(newNote);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create clinical note' }, { status: 500 });
  }
}
