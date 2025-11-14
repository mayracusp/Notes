# Dental Clinical Notes System

A modern web application for dental practices to manage patient records and create clinical notes with AI-powered voice transcription.

## Features

- **Patient Management**: Add, view, and search patient records
- **Clinical Notes**: Create and manage clinical notes for each patient
- **AI Voice Transcription**: Record audio notes and automatically transcribe them using OpenAI's Whisper API
- **Real-time Recording**: Built-in audio recorder with live recording feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI Transcription**: OpenAI Whisper API
- **Data Storage**: JSON file-based storage (easily upgradeable to a database)
- **Audio Recording**: Browser MediaRecorder API

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key (for transcription feature)

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

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

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

### AI Voice Transcription

The application uses OpenAI's Whisper model for highly accurate medical transcription:

- Records audio directly in the browser
- Supports various audio formats
- Transcribes medical and dental terminology accurately
- Handles multiple recording sessions per note
- Shows real-time recording status and timer

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
OPENAI_API_KEY=your_production_api_key
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

- Verify OpenAI API key is correctly set
- Check API key has sufficient credits
- Ensure audio recording is clear and audible
- Check network connectivity

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
- OpenAI Whisper API
- Tailwind CSS
- TypeScript
