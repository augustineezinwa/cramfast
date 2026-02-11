# CramFast Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication → Sign-in method → Google
   - Copy your Firebase config values

3. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   - Follow the prompts to create/login to Convex
   - Copy the `NEXT_PUBLIC_CONVEX_URL` from the output

4. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your Firebase config values
   - Add your Convex URL
   - In Convex dashboard → Settings → Environment Variables, add:
     - `OPENAI_API_KEY` = your OpenAI API key

5. **Run the app:**
   ```bash
   npm run dev
   ```

## Features Implemented

✅ **Landing Page** - Marketing page selling the business idea
✅ **Google Sign-in** - Firebase Authentication integration
✅ **Session Management** - Create and manage multiple flashcard sessions
✅ **Image Upload** - Upload up to 50 images of handwritten notes
✅ **AI Flashcard Generation** - Uses OpenAI GPT-4 Vision to:
   - Extract text from handwritten notes
   - Generate structured flashcards with front/back
   - Return exam-ready Q&A format
✅ **Flashcard Viewer** - Interactive 3D flip cards with navigation
✅ **Real-time Updates** - Convex provides live data synchronization

## Architecture

- **Frontend**: Next.js 14 App Router with TypeScript
- **Backend**: Convex (serverless functions + database)
- **Auth**: Firebase Auth (Google Sign-in)
- **AI**: OpenAI GPT-4 Vision API
- **Styling**: Tailwind CSS

## API Flow

1. User uploads images → Stored as base64 in Convex
2. User clicks "Generate" → Convex action processes:
   - Extracts text from each image using GPT-4 Vision
   - Combines all extracted text
   - Generates flashcards using GPT-4 with JSON format
   - Saves flashcards to Convex database
3. Frontend automatically updates via Convex reactive queries

## Notes

- Images are stored as base64 strings (MVP approach)
- For production, consider using Firebase Storage or Convex File Storage
- OpenAI API key should be kept secure in Convex environment variables
- The app handles up to 50 images per session
