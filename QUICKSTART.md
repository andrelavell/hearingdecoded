# Quick Start Guide

## ✅ Setup Complete!

Your podcast platform is ready to use. The database has been configured with all necessary tables and storage buckets.

## 🚀 Start the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## 📝 Important: Add Your OpenAI API Key

To enable transcription, edit `.env.local` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

Get your key from: https://platform.openai.com/api-keys

## 🎯 What to Do Next

### 1. Visit the Admin Panel
Go to: [http://localhost:3000/admin](http://localhost:3000/admin)

### 2. Upload Your First Episode
- Click "Upload Episode"
- Add an MP3 file (your podcast audio)
- Add an image (episode artwork)
- Fill in the details:
  - **Title**: e.g., "Turning Obstacles Into Opportunities"
  - **Host**: e.g., "Sarah Johnson"
  - **Category**: e.g., "Motivation"
  - **Description**: Brief episode summary
- Click "Upload Episode"

### 3. View on Homepage
- Go to [http://localhost:3000](http://localhost:3000)
- Click on your episode
- Click "Listen now" to play the audio
- Transcription will appear in real-time (if OpenAI key is configured)

## 🎨 Player Features

- ▶️ **Play/Pause**: Click the center button
- ⏪ **Skip Back**: Jump back 15 seconds
- ⏩ **Skip Forward**: Jump ahead 15 seconds
- 📊 **Scrubber**: Click anywhere on the progress bar to jump to that time
- 📝 **Live Captions**: Shows current transcript as audio plays

## 🔧 Admin Features

- **Upload**: Add new episodes with audio, images, and metadata
- **Edit**: Update episode details (title, description, host, category)
- **Delete**: Remove episodes (transcripts are automatically deleted)
- **View Site**: Quick link back to the public homepage

## 🌐 Deploy to Netlify

When ready to deploy:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Or connect your GitHub repo to Netlify for automatic deployments.

## 🎓 Tips

1. **Test Without Transcription**: You can test the site without an OpenAI key. Just skip the transcription feature for now.

2. **Episode Numbers**: The site shows "Episode 01" by default. You can customize this in `components/EpisodePlayer.tsx`.

3. **Image Sizes**: For best results, use square images (e.g., 1000x1000px) for episode artwork.

4. **Audio Format**: MP3 files work best. The player supports standard web audio formats.

5. **Transcription Time**: Large audio files may take a few minutes to transcribe. It happens in the background.

## 🐛 Troubleshooting

**Can't upload files?**
- Check that Supabase storage bucket is created (run setup script again if needed)

**Transcription not working?**
- Add your OpenAI API key to `.env.local`
- Check console for errors

**Site won't start?**
- Make sure dependencies are installed: `npm install`
- Check that `.env.local` has your Supabase credentials

## 📚 Learn More

- Edit the homepage: `app/page.tsx`
- Customize the player: `components/AudioPlayer.tsx`
- Modify the admin panel: `components/AdminPanel.tsx`
- Update styling: `tailwind.config.ts` and `app/globals.css`

Enjoy your new podcast platform! 🎉
