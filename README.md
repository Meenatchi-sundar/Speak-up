# SpeakUp Practice

A full-stack web application designed to help users improve their communication skills through AI-powered mock interviews, group discussions, and grammar practice.

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend/Auth/DB: Supabase (Postgres + RLS)
- AI Engine: Google Gemini API (Vercel Serverless Function)
- Voice: Web Speech API (SpeechSynthesis & SpeechRecognition)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Setup**
   - Create a new project on [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the contents of `schema.sql` to create all tables and RLS policies.
   - Go to Project Settings -> API and get your Project URL and anon public key.

3. **Environment Variables**
   - Copy `.env.example` to `.env` or `.env.local`
   - Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Add your `GEMINI_API_KEY`.

4. **Run Locally**
   To test the frontend:
   ```bash
   npm run dev
   ```
   *Note: Since the Gemini API uses serverless functions under `api/`, you may need to deploy to Vercel or use `vercel dev` locally to test the AI responses. Vite's default dev server does not natively run Vercel Serverless functions.*
