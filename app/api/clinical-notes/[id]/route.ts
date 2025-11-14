import { NextRequest, NextResponse } from 'next/server';
import { getClinicalNote, updateClinicalNote, deleteClinicalNote } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const note = await getClinicalNote(params.id);

    if (!note) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clinical note' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const note = await updateClinicalNote(params.id, updates);

    if (!note) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update clinical note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteClinicalNote(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Clinical note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete clinical note' }, { status: 500 });
  }
}
