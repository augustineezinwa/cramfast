# CramFast - AI-Powered Flashcard Generator

Convert your handwritten notes into exam-ready flashcards using AI.

## Features

- 📸 Upload up to 50 images of handwritten notes
- 🤖 AI-powered flashcard generation using OpenAI GPT-4 Vision
- 📚 Session management with sidebar navigation
- 🔐 Google Sign-in authentication via Firebase
- 🎴 Interactive flashcard viewer with flip animations
- ⚡ Real-time updates with Convex

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Convex (database & serverless functions)
- **Authentication**: Firebase Auth (Google Sign-in)
- **AI**: OpenAI GPT-4 Vision API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication enabled
- Convex account
- OpenAI API key

### Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Copy your Firebase config values

3. **Set up Convex:**
```bash
npx convex dev
```
   - This will create a new Convex project or connect to an existing one
   - Copy the `NEXT_PUBLIC_CONVEX_URL` from the output

4. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration values
   - Add your Convex URL
   - In Convex dashboard, add `OPENAI_API_KEY` as an environment variable

5. **Run the development server:**
```bash
npm run dev
```

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   └── dashboard/         # Main app dashboard
├── components/            # React components
│   ├── AuthProvider.tsx  # Firebase auth context
│   ├── SessionList.tsx   # Sidebar session list
│   ├── SessionView.tsx   # Main session view
│   ├── ImageUpload.tsx   # Image upload component
│   └── FlashcardViewer.tsx # Flashcard display component
├── convex/               # Convex backend
│   ├── schema.ts        # Database schema
│   ├── sessions.ts      # Session mutations/queries
│   └── flashcards.ts    # Flashcard generation actions
└── lib/                 # Utility functions
    ├── firebase.ts      # Firebase configuration
    └── auth.ts          # Auth helpers
```

## Usage

1. **Sign in** with your Google account
2. **Create a new session** from the sidebar
3. **Upload images** of your handwritten notes (up to 50)
4. **Click "Generate Flashcards"** to process your notes
5. **Study** your flashcards with the interactive viewer

## Environment Variables

Required environment variables (in `.env.local`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CONVEX_URL=
```

Required Convex environment variable (set in Convex dashboard):
- `OPENAI_API_KEY`

## Best Practices Implemented

- ✅ Type-safe code with TypeScript
- ✅ Server-side rendering with Next.js App Router
- ✅ Real-time data synchronization with Convex
- ✅ Secure authentication with Firebase
- ✅ Responsive UI with Tailwind CSS
- ✅ Error handling and loading states
- ✅ Clean component architecture
- ✅ Environment variable management

## License

MIT
