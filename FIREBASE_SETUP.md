# Firebase Setup Guide for RIDERCMS

This guide will help you configure Firebase Authentication for the RIDERCMS application.

## Prerequisites

- A Google Cloud Project
- Firebase project created in the Firebase Console
- Node.js and npm/yarn installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: `ridercms` (or your preferred name)
4. Follow the setup wizard and enable Google Analytics (optional)

## Step 2: Set Up Authentication

### Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Email link sign-in** (optional, for passwordless auth)

### Enable Phone Authentication

1. In the same **Sign-in method** page
2. Enable **Phone** provider
3. You'll need to configure reCAPTCHA v3 for phone authentication

### Configure reCAPTCHA

1. Go to **Project Settings** → **reCAPTCHA Admin Console**
2. Create a new reCAPTCHA v3 key or use an existing one
3. Add your domain(s) to the allowed list (e.g., `localhost`, `yourdomain.com`)

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", click "Web" or create a new web app
3. Copy the Firebase configuration object

Example:

```javascript
{
  apiKey: "AIzaSyBw...",
  authDomain: "ridercms-xxx.firebaseapp.com",
  projectId: "ridercms-xxx",
  storageBucket: "ridercms-xxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
}
```

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API
VITE_API_BASE_URL=http://localhost:3000/api
```

> **Note:** Never commit `.env.local` to version control. Add it to `.gitignore`.

## Step 5: Backend Configuration

Your backend API should have the following endpoints configured:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/sessionLogin` - Create session with Firebase ID token
- `POST /api/auth/verify-phone` - Mark phone as verified

These endpoints should:

1. Verify the Firebase ID token
2. Create or update the user in your database
3. Set an HTTP-only session cookie

## Step 6: Verify Setup

1. Start your development server:

   ```bash
   yarn dev
   ```

2. Navigate to the Auth page
3. Test the registration flow:
   - Enter email, password, name, phone number
   - Should receive OTP via SMS
   - Complete verification and create account

4. Test the login flow:
   - Enter email and password
   - Should be logged in and redirected to dashboard

## Troubleshooting

### "RecaptchaVerifier is not defined"

- Ensure reCAPTCHA is enabled in Firebase Console
- Check that the reCAPTCHA container ID matches (`recaptcha-container`)

### "Phone auth not working"

- Verify phone authentication is enabled in Firebase
- Check that your phone number is in international format (+254...)
- Ensure reCAPTCHA is properly configured

### "Session not created"

- Check backend logs for errors
- Verify Firebase credentials are correct
- Ensure backend is validating Firebase ID tokens properly

### "Environment variables not loading"

- Restart dev server after adding `.env.local`
- Ensure variable names start with `VITE_`
- Check `.env.local` file is in project root

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Phone Authentication Guide](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
