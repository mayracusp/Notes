import { NextRequest, NextResponse } from 'next/server';
import { transcribeWithHealthScribe } from '@/lib/healthscribe';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if AWS credentials are configured
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsS3Bucket = process.env.AWS_S3_BUCKET_NAME;
    const awsOutputBucket = process.env.AWS_S3_OUTPUT_BUCKET;
    const awsRoleArn = process.env.AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN;

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsS3Bucket || !awsOutputBucket || !awsRoleArn) {
      return NextResponse.json(
        {
          error: 'AWS credentials not configured. Please add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_S3_OUTPUT_BUCKET, and AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN to your .env.local file.'
        },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe the audio using AWS HealthScribe
    const clinicalNotes = await transcribeWithHealthScribe(buffer, audioFile.name);

    return NextResponse.json({ text: clinicalNotes });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
