# Media Messaging Setup Guide

## Overview
Your chat application now supports sending images and videos using Cloudinary for cloud storage.

## Setup Steps

### 1. Create a Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a **FREE** account
3. After signup, go to your Dashboard
4. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Add Environment Variables

Add these to your `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important**: Replace the placeholder values with your actual Cloudinary credentials.

### 3. Install Dependencies

The Cloudinary package has been added to your backend. Run:

```bash
cd backend
npm install
```

### 4. Deploy to Production

When deploying to Render, add these environment variables in the Render dashboard:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## How It Works

### Backend Flow
1. User selects an image/video in the frontend
2. File is sent to `/api/media/upload` as multipart/form-data
3. Backend uploads file to Cloudinary
4. Cloudinary returns a secure URL
5. Message is saved to MongoDB with the media URL
6. Socket.IO emits the message (with URL, not the file itself)

### Frontend Flow
1. Click the **+** button in the chat input
2. Select an image or video
3. Preview appears with option to add a caption
4. Click send - file uploads with loading indicator
5. Media message appears in chat
6. Images are clickable to view full size
7. Videos have native playback controls

## Features

### Supported Formats
- **Images**: JPEG, PNG, JPG, WEBP, GIF
- **Videos**: MP4, MOV, WEBM

### File Size Limits
- **Images**: 5MB
- **Videos**: 50MB

### UI Features
- ✅ Preview before sending
- ✅ Optional captions
- ✅ Loading indicator during upload
- ✅ WhatsApp-style message bubbles
- ✅ Timestamp overlay on media-only messages
- ✅ Click to view images full-screen
- ✅ Native video controls

## Testing

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Open two browser windows
4. Log in as different users
5. Click the **+** button
6. Select an image or video
7. Add a caption (optional)
8. Click send
9. Verify the media appears in both windows

## Troubleshooting

### "Failed to upload media"
- Check your Cloudinary credentials in `.env`
- Ensure the file is under 50MB
- Check the file format is supported

### Media not displaying
- Check browser console for errors
- Verify the Cloudinary URL is accessible
- Check CSP settings in `backend/server.js`

### Upload is slow
- This is normal for large videos
- Cloudinary optimizes media automatically
- Consider reducing video file size before uploading

## Production Notes

- All media is stored on Cloudinary (not your server)
- Cloudinary free tier includes 25GB storage
- URLs are permanent and globally accessible
- Media is automatically optimized for web delivery
