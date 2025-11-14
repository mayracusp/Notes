/**
 * HeyDonto Webhook Endpoint
 *
 * Receives real-time updates from HeyDonto when data changes in the PMS.
 * This enables bidirectional sync - changes in the PMS are reflected in your app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyHeyDontoWebhook } from '@/lib/heydonto';
import { updatePatient, updateClinicalNote } from '@/lib/storage';

/**
 * Handle incoming webhook from HeyDonto
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-heydonto-signature') || '';

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    if (!verifyHeyDontoWebhook(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { event, data } = payload;

    console.log('Received HeyDonto webhook:', event);

    // Handle different webhook events
    switch (event) {
      case 'patient.created':
      case 'patient.updated':
        await handlePatientUpdate(data);
        break;

      case 'patient.deleted':
        await handlePatientDeletion(data);
        break;

      case 'clinical_note.created':
      case 'clinical_note.updated':
        await handleClinicalNoteUpdate(data);
        break;

      case 'clinical_note.deleted':
        await handleClinicalNoteDeletion(data);
        break;

      case 'appointment.created':
      case 'appointment.updated':
      case 'appointment.deleted':
        // Handle appointment events (if needed)
        console.log('Appointment event received:', event, data);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    // Return success response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle patient update from webhook
 */
async function handlePatientUpdate(data: any) {
  try {
    // Find patient by HeyDonto ID
    const heyDontoId = data.id;
    const externalId = data.externalId; // Our local patient ID

    if (!externalId) {
      console.warn('Patient webhook missing externalId:', data);
      return;
    }

    // Update local patient with data from HeyDonto
    await updatePatient(externalId, {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      email: data.email || '',
      phone: data.phone || '',
      heyDontoId,
      heyDontoSyncStatus: 'synced',
      heyDontoLastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('Patient updated from webhook:', externalId);
  } catch (error) {
    console.error('Failed to handle patient update webhook:', error);
  }
}

/**
 * Handle patient deletion from webhook
 */
async function handlePatientDeletion(data: any) {
  try {
    const externalId = data.externalId;

    if (!externalId) {
      console.warn('Patient deletion webhook missing externalId:', data);
      return;
    }

    // Mark patient as deleted or remove sync status
    // Note: We may not want to actually delete the patient from our local database
    await updatePatient(externalId, {
      heyDontoSyncStatus: 'disabled',
      updatedAt: new Date().toISOString(),
    });

    console.log('Patient deletion processed from webhook:', externalId);
  } catch (error) {
    console.error('Failed to handle patient deletion webhook:', error);
  }
}

/**
 * Handle clinical note update from webhook
 */
async function handleClinicalNoteUpdate(data: any) {
  try {
    const heyDontoId = data.id;
    const externalId = data.externalId; // Our local note ID

    if (!externalId) {
      console.warn('Clinical note webhook missing externalId:', data);
      return;
    }

    // Update local note with data from HeyDonto
    await updateClinicalNote(externalId, {
      noteText: data.noteText,
      heyDontoId,
      heyDontoAppointmentId: data.appointmentId,
      heyDontoTreatmentCodes: data.treatmentCodes,
      heyDontoSyncStatus: 'synced',
      heyDontoLastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('Clinical note updated from webhook:', externalId);
  } catch (error) {
    console.error('Failed to handle clinical note update webhook:', error);
  }
}

/**
 * Handle clinical note deletion from webhook
 */
async function handleClinicalNoteDeletion(data: any) {
  try {
    const externalId = data.externalId;

    if (!externalId) {
      console.warn('Clinical note deletion webhook missing externalId:', data);
      return;
    }

    // Mark note as deleted or remove sync status
    await updateClinicalNote(externalId, {
      heyDontoSyncStatus: 'disabled',
      updatedAt: new Date().toISOString(),
    });

    console.log('Clinical note deletion processed from webhook:', externalId);
  } catch (error) {
    console.error('Failed to handle clinical note deletion webhook:', error);
  }
}

/**
 * GET endpoint to verify webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'HeyDonto webhook endpoint is active',
    endpoint: '/api/heydonto/webhook',
  });
}
