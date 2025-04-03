# ChRoom - Real-time Chat Application

A lightweight real-time chat application built with React, TypeScript, and Firebase.

## Features

- User authentication (email/password and Google sign-in)
- Create and join chat rooms with unique codes
- Real-time messaging
- Member presence tracking

## Technologies

- React with TypeScript
- Firebase (Authentication, Firestore)
- Tailwind CSS

## Setup

1. Clone the repository
2. Navigate to the frontend directory: `cd ChRoom/frontend`
3. Install dependencies: `npm install`
4. Create a `.env` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Run the development server: `npm run dev`

## Usage

- Create an account or sign in with Google
- Create a new chat room or join an existing one with a room code
- Start chatting!
