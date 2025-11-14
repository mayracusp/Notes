'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Patient, ClinicalNote } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import AudioRecorder from '@/components/AudioRecorder';

export default function PatientDetail() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [dentistName, setDentistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [transcriptionError, setTranscriptionError] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, notesRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/clinical-notes?patientId=${patientId}`),
      ]);

      if (!patientRes.ok) {
        router.push('/');
        return;
      }

      const patientData = await patientRes.json();
      const notesData = await notesRes.json();

      setPatient(patientData);
      setClinicalNotes(notesData);
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscription = (text: string) => {
    setNoteText(prevText => {
      if (prevText) {
        return `${prevText}\n\n${text}`;
      }
      return text;
    });
    setTranscriptionError('');
  };

  const handleTranscriptionError = (errorMsg: string) => {
    setTranscriptionError(errorMsg);
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          noteText,
          dentistName,
          isTranscribed: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to create clinical note');

      setNoteText('');
      setDentistName('');
      setShowAddNote(false);
      fetchPatientData();
    } catch (error) {
      setError('Failed to save clinical note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading patient data...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Patient not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Patients
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Date of Birth:</span>
                <span className="ml-2 text-gray-600">{formatDate(patient.dateOfBirth)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{patient.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-600">{patient.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Patient ID:</span>
                <span className="ml-2 text-gray-600">{patient.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Clinical Notes</h2>
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {showAddNote ? 'Cancel' : 'Add New Note'}
              </button>
            </div>
          </div>

          {showAddNote && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <form onSubmit={handleSubmitNote} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dentist Name
                  </label>
                  <input
                    type="text"
                    required
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Clinical Notes
                  </label>
                  <AudioRecorder
                    onTranscriptionComplete={handleTranscription}
                    onError={handleTranscriptionError}
                  />
                  {transcriptionError && (
                    <p className="mt-2 text-sm text-red-600">{transcriptionError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Notes
                  </label>
                  <textarea
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Type or record notes using the recorder above..."
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNote(false);
                      setNoteText('');
                      setDentistName('');
                      setError('');
                      setTranscriptionError('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Clinical Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-6">
            {clinicalNotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No clinical notes yet. Add the first note above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clinicalNotes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          {formatDateTime(note.date)}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Dr. {note.dentistName}
                        </div>
                      </div>
                      {note.isTranscribed && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          AI Transcribed
                        </span>
                      )}
                    </div>
                    <div className="text-gray-900 whitespace-pre-wrap">{note.noteText}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
