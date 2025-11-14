import {
  TranscribeClient,
  StartMedicalScribeJobCommand,
  GetMedicalScribeJobCommand,
  MedicalScribeJobStatus
} from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { generateId } from './utils';

// Initialize AWS clients
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Upload audio file to S3
 */
export async function uploadAudioToS3(
  audioBuffer: Buffer,
  fileName: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const key = `audio-uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: audioBuffer,
    ContentType: 'audio/webm',
  });

  await s3Client.send(command);

  return `s3://${bucketName}/${key}`;
}

/**
 * Start a Medical Scribe Job
 */
export async function startHealthScribeJob(
  audioS3Uri: string
): Promise<string> {
  const jobName = `scribe-job-${generateId()}`;
  const outputBucket = process.env.AWS_S3_OUTPUT_BUCKET;
  const dataAccessRoleArn = process.env.AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN;

  if (!outputBucket) {
    throw new Error('AWS_S3_OUTPUT_BUCKET environment variable is not set');
  }

  if (!dataAccessRoleArn) {
    throw new Error('AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN environment variable is not set');
  }

  const params = {
    MedicalScribeJobName: jobName,
    DataAccessRoleArn: dataAccessRoleArn,
    Media: {
      MediaFileUri: audioS3Uri,
    },
    OutputBucketName: outputBucket,
    Settings: {
      ShowSpeakerLabels: true,
      MaxSpeakerLabels: 2,
    },
  };

  const command = new StartMedicalScribeJobCommand(params);
  const response = await transcribeClient.send(command);

  if (!response.MedicalScribeJob?.MedicalScribeJobName) {
    throw new Error('Failed to start HealthScribe job');
  }

  return response.MedicalScribeJob.MedicalScribeJobName;
}

/**
 * Poll for job completion and return the result
 */
export async function waitForHealthScribeJob(
  jobName: string,
  maxAttempts: number = 60,
  delayMs: number = 5000
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const command = new GetMedicalScribeJobCommand({
      MedicalScribeJobName: jobName,
    });

    const response = await transcribeClient.send(command);
    const job = response.MedicalScribeJob;

    if (!job) {
      throw new Error('Job not found');
    }

    const status = job.MedicalScribeJobStatus;

    if (status === MedicalScribeJobStatus.COMPLETED) {
      return job;
    }

    if (status === MedicalScribeJobStatus.FAILED) {
      throw new Error(`HealthScribe job failed: ${job.FailureReason || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('HealthScribe job timed out');
}

/**
 * Extract clinical notes from HealthScribe output
 */
export async function extractClinicalNotes(job: any): Promise<string> {
  const outputLocation = job.MedicalScribeOutput?.ClinicalDocumentUri;

  if (!outputLocation) {
    throw new Error('No clinical document found in job output');
  }

  // Parse S3 URI
  const match = outputLocation.match(/s3:\/\/([^\/]+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid S3 URI format');
  }

  const [, bucket, key] = match;

  // Download the clinical document from S3
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('No content in clinical document');
  }

  // Convert stream to string
  const bodyContents = await response.Body.transformToString();
  const clinicalDoc = JSON.parse(bodyContents);

  // Extract the clinical summary text
  // The structure may vary, but typically includes sections like:
  // - Chief Complaint
  // - History of Present Illness
  // - Assessment and Plan
  let clinicalText = '';

  if (clinicalDoc.ClinicalDocumentation) {
    const sections = clinicalDoc.ClinicalDocumentation.Sections || [];

    for (const section of sections) {
      if (section.SectionName && section.Summary) {
        clinicalText += `${section.SectionName}:\n${section.Summary.join('\n')}\n\n`;
      }
    }
  }

  // If no structured sections found, try to get the transcript
  if (!clinicalText && job.MedicalScribeOutput?.TranscriptFileUri) {
    const transcriptUri = job.MedicalScribeOutput.TranscriptFileUri;
    const transcriptMatch = transcriptUri.match(/s3:\/\/([^\/]+)\/(.+)/);

    if (transcriptMatch) {
      const [, transcriptBucket, transcriptKey] = transcriptMatch;
      const transcriptCommand = new GetObjectCommand({
        Bucket: transcriptBucket,
        Key: transcriptKey,
      });

      const transcriptResponse = await s3Client.send(transcriptCommand);
      if (transcriptResponse.Body) {
        const transcriptContents = await transcriptResponse.Body.transformToString();
        const transcript = JSON.parse(transcriptContents);
        clinicalText = transcript.Transcript || transcriptContents;
      }
    }
  }

  return clinicalText.trim() || 'No clinical notes generated';
}

/**
 * Main function to transcribe audio using AWS HealthScribe
 */
export async function transcribeWithHealthScribe(
  audioBuffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    // Step 1: Upload audio to S3
    console.log('Uploading audio to S3...');
    const audioS3Uri = await uploadAudioToS3(audioBuffer, fileName);
    console.log('Audio uploaded:', audioS3Uri);

    // Step 2: Start HealthScribe job
    console.log('Starting HealthScribe job...');
    const jobName = await startHealthScribeJob(audioS3Uri);
    console.log('Job started:', jobName);

    // Step 3: Wait for job completion
    console.log('Waiting for job completion...');
    const job = await waitForHealthScribeJob(jobName);
    console.log('Job completed');

    // Step 4: Extract clinical notes
    console.log('Extracting clinical notes...');
    const clinicalNotes = await extractClinicalNotes(job);
    console.log('Clinical notes extracted');

    return clinicalNotes;
  } catch (error) {
    console.error('HealthScribe error:', error);
    throw error;
  }
}
