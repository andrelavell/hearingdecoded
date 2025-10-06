# Hearing Decoded - Podcast Platform

A modern podcast platform with real-time transcription using Whisper AI.

## Features

- 🎙️ **Episode Listing**: Browse all podcast episodes on the homepage
- 🎵 **Modern Audio Player**: Full-featured player with scrubber, play/pause, and skip controls
- 📝 **Live Transcription**: Real-time captions synced with audio playback
- 🛠️ **Admin Panel**: Upload and manage episodes, images, and metadata
- ⚡ **Fast & Efficient**: Built with Next.js 14 and Supabase for optimal performance
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Transcription**: OpenAI Whisper API
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Netlify

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env.local` file is already set up with your Supabase credentials. You need to add your OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Set Up Supabase Database

Make the setup script executable and run it:

```bash
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

This will create the necessary tables, storage buckets, and policies.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Episodes

1. Go to `/admin` in your browser
2. Click "Upload Episode"
3. Fill in the episode details:
   - Upload MP3 audio file
   - Upload episode image (optional)
   - Enter title, description, host name, and category
4. Click "Upload Episode"
5. The episode will be uploaded and automatically transcribed in the background

### Managing Episodes

- **Edit**: Click the edit icon to update episode details
- **Delete**: Click the trash icon to remove an episode
- All transcripts are automatically deleted when an episode is removed

### Viewing Episodes

- Browse episodes on the homepage
- Click an episode to view its details
- Click "Listen now" to reveal the audio player
- Transcriptions appear in real-time as the audio plays

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Option 2: Deploy via Git

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify will auto-detect Next.js and configure build settings
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
5. Deploy!

## Project Structure

```
├── app/
│   ├── api/            # API routes
│   ├── admin/          # Admin panel
│   ├── episode/        # Episode pages
│   └── page.tsx        # Homepage
├── components/         # React components
├── lib/               # Utilities and Supabase client
├── supabase/          # Database schema
└── scripts/           # Setup scripts
```

## Database Schema

### Episodes Table
- `id`: UUID (primary key)
- `title`: Text
- `description`: Text
- `host`: Text
- `category`: Text
- `audio_url`: Text
- `image_url`: Text
- `duration`: Integer
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Transcripts Table
- `id`: UUID (primary key)
- `episode_id`: UUID (foreign key)
- `start_time`: Decimal
- `end_time`: Decimal
- `text`: Text
- `created_at`: Timestamp

## Customization

### Styling
- Colors and styles can be customized in `tailwind.config.ts`
- Global styles are in `app/globals.css`

### Audio Player
- Player component is in `components/AudioPlayer.tsx`
- Customize controls, colors, and behavior as needed

### Transcription
- Transcription API is in `app/api/transcribe/route.ts`
- Uses OpenAI Whisper API (can be swapped for other services)

## Troubleshooting

### Transcription Not Working
- Make sure `OPENAI_API_KEY` is set in `.env.local`
- Check OpenAI API usage limits and billing
- Check browser console for errors

### File Upload Issues
- Verify Supabase storage bucket is created
- Check storage policies are set correctly
- Ensure file size limits are not exceeded

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Run the setup script to initialize the database
- Check Supabase dashboard for connection status

## Support

For issues or questions, check:
- Supabase Dashboard: https://app.supabase.com
- OpenAI API Status: https://status.openai.com
- Next.js Documentation: https://nextjs.org/docs

## License

MIT
