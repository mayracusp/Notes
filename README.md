# Dental Clinical Notes System

A modern web application for dental practices to manage patient records and create clinical notes with AI-powered voice transcription.

## Features

- **Patient Management**: Add, view, and search patient records
- **Clinical Notes**: Create and manage clinical notes for each patient
- **AI Clinical Documentation**: Record audio notes and automatically generate structured clinical documentation using AWS HealthScribe
- **Real-time Recording**: Built-in audio recorder with live recording feedback
- **HIPAA-Eligible**: Uses AWS HealthScribe, a HIPAA-eligible service designed for healthcare
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI Clinical Documentation**: AWS HealthScribe (HIPAA-eligible)
- **Cloud Storage**: Amazon S3
- **Data Storage**: JSON file-based storage (easily upgradeable to a database)
- **Audio Recording**: Browser MediaRecorder API

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- AWS Account with HealthScribe access
- AWS credentials (Access Key ID and Secret Access Key)
- Two S3 buckets (for audio input and HealthScribe output)
- IAM role with appropriate permissions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Notes
```

2. Install dependencies:
```bash
npm install
```

3. Set up AWS Resources:

### Step 3.1: Create S3 Buckets

Create two S3 buckets in the **us-east-1** region (required for HealthScribe):

```bash
# Bucket for audio uploads
aws s3 mb s3://your-healthscribe-audio-bucket --region us-east-1

# Bucket for HealthScribe output
aws s3 mb s3://your-healthscribe-output-bucket --region us-east-1
```

### Step 3.2: Create IAM Role for HealthScribe

Create an IAM role with the following permissions:

1. Go to AWS IAM Console
2. Create a new role with the following trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "transcribe.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Attach the following inline policy (replace bucket names):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-healthscribe-audio-bucket",
        "arn:aws:s3:::your-healthscribe-audio-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-healthscribe-output-bucket/*"
      ]
    }
  ]
}
```

4. Copy the Role ARN (you'll need this for the `.env.local` file)

### Step 3.3: Create AWS Access Keys

1. Go to AWS IAM Console
2. Create a new user or use an existing user
3. Attach the following policies:
   - `AmazonS3FullAccess` (or a custom policy with S3 permissions)
   - `AmazonTranscribeFullAccess`
4. Create access keys and save them securely

4. Set up environment variables:
```bash
cp .env.example .env.local
```

5. Edit `.env.local` and add your AWS credentials:
```
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-healthscribe-audio-bucket
AWS_S3_OUTPUT_BUCKET=your-healthscribe-output-bucket
AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Adding a Patient

1. Click "Add New Patient" on the home page
2. Fill in the patient information:
   - First Name
   - Last Name
   - Date of Birth
   - Email
   - Phone
3. Click "Add Patient" to save

### Creating Clinical Notes

1. Click on a patient from the list to view their details
2. Click "Add New Note" button
3. Enter the dentist's name
4. **Record Audio Notes** (optional):
   - Click "Start Recording" to begin audio capture
   - Speak your clinical notes
   - Click "Stop Recording" when finished
   - The AI will automatically transcribe the audio and add it to the notes field
5. Edit or add additional notes in the text area
6. Click "Save Clinical Note"

### Viewing Clinical Notes

- All clinical notes for a patient are displayed on their detail page
- Notes show:
  - Date and time created
  - Dentist name
  - Full note content
  - AI transcription indicator (if transcribed from audio)

## Features in Detail

### AI Clinical Documentation with AWS HealthScribe

The application uses AWS HealthScribe, a HIPAA-eligible service specifically designed for healthcare:

- **Records audio directly in the browser**
- **Generates structured clinical documentation** (not just transcription)
- **Identifies speaker roles** (clinician vs. patient)
- **Extracts medical entities** and terminology accurately
- **Creates preliminary clinical notes** with sections like Chief Complaint, History of Present Illness, and Assessment
- **HIPAA-eligible** for healthcare data compliance
- **Handles multiple recording sessions** per note
- **Shows real-time recording status** and processing feedback
- **Processing time**: Typically 1-2 minutes for clinical documentation generation

### Data Storage

Currently uses JSON file storage for simplicity:
- Patient data: `data/patients.json`
- Clinical notes: `data/clinical-notes.json`

**Upgrading to a Database:**
The storage layer (`lib/storage.ts`) is designed to be easily replaced with a database solution like PostgreSQL, MySQL, or MongoDB.

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 14.1+
- Edge 79+

**Note**: Audio recording requires HTTPS in production or localhost for development.

## Production Deployment

### Building for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure the following environment variables are set:

```
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-healthscribe-audio-bucket
AWS_S3_OUTPUT_BUCKET=your-healthscribe-output-bucket
AWS_HEALTHSCRIBE_DATA_ACCESS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
```

### Deployment Platforms

This application can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker containers
- Any Node.js hosting platform

## Security Considerations

1. **API Keys**: Never commit `.env.local` to version control
2. **HTTPS**: Always use HTTPS in production for microphone access
3. **Authentication**: Consider adding user authentication for production use
4. **Data Privacy**: Ensure compliance with HIPAA or local healthcare data regulations
5. **Rate Limiting**: Implement API rate limiting for production

## Future Enhancements

Potential improvements for production deployment:

- User authentication and role-based access control
- Real database integration (PostgreSQL, MongoDB)
- Patient photo uploads
- Treatment history tracking
- Appointment scheduling
- Billing and insurance integration
- PDF report generation
- Multi-language support
- Advanced search and filtering
- Data backup and recovery

## Troubleshooting

### Microphone Access Issues

- Ensure browser permissions allow microphone access
- Use HTTPS (required for microphone in production)
- Check browser console for error messages

### Transcription Errors

- Verify AWS credentials are correctly set in `.env.local`
- Ensure S3 buckets exist and are in us-east-1 region
- Check IAM role ARN is correct and has proper permissions
- Verify AWS account has access to HealthScribe (available in us-east-1)
- Ensure audio recording is clear and audible
- Check network connectivity
- Review AWS CloudWatch logs for detailed error messages
- Note: HealthScribe processing takes 1-2 minutes - be patient!

### Build Errors

- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## Support

For issues, questions, or contributions, please open an issue on the repository.

## License

MIT License - feel free to use this for your dental practice or modify as needed.

## Credits

Built with:
- Next.js
- AWS HealthScribe
- Amazon S3
- AWS SDK for JavaScript
- Tailwind CSS
- TypeScript
