# Firebase reCAPTCHA & Phone Authentication Setup

This guide will help you fix the `auth/invalid-app-credential` error when using phone authentication.

## Common Error Messages

```
Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.
POST https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=... 400 (Bad Request)
FirebaseError: Firebase: Error (auth/invalid-app-credential)
```

These errors indicate that reCAPTCHA is not properly configured for your Firebase project.

## Step 1: Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **ridercms** project
3. Navigate to **Authentication** → **Sign-in method** (left sidebar)
4. Find **Phone** in the list of providers
5. Click the toggle to **Enable** it
6. Review the terms and click **Enable**
7. Click **Save**

## Step 2: Configure reCAPTCHA v2

### Option A: Automatically Configure (Recommended)

1. Still in **Authentication** → **Settings** tab
2. Scroll to **reCAPTCHA Enterprise configuration**
3. Click **Create** or **Configure** button
4. Firebase will automatically create and configure reCAPTCHA v2 for you

### Option B: Manually Configure reCAPTCHA

1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **Create** (+ button)
3. Fill in the form:
   - **Label:** ridercms-phone-auth
   - **reCAPTCHA type:** reCAPTCHA v2 → "Invisible reCAPTCHA badge"
   - **Domains:** Add all domains where your app runs:
     - `localhost` (for development)
     - `127.0.0.1:5173` (for Vite development)
     - `yourdomain.com` (for production)
4. Accept terms and click **Create**
5. Copy the **Site Key** and **Secret Key**

## Step 3: Add Authorized Domains in Firebase

1. In Firebase Console, go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Click **Add domain** and add:
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - `yourdomain.com` (for production)
   - Any other domain where your app is hosted

**Important:** localhost and 127.0.0.1 must be added as separate entries!

## Step 4: Update Your .env.local File

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

## Step 5: Restart Your Development Server

After making changes to Firebase configuration:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
yarn dev
```

## Step 6: Test Phone Authentication

1. Navigate to http://localhost:5173 (or your dev URL)
2. Go to the Registration form
3. Fill in all fields with a valid phone number in E.164 format:
   - ✅ `+15551234567` (US)
   - ✅ `+254711223344` (Kenya)
   - ✅ `+447911123456` (UK)
   - ❌ `0711223344` (missing country code)
4. Click "Verify with OTP"
5. You should receive an SMS with a verification code

## Troubleshooting

### Still Getting "auth/invalid-app-credential"

**Check 1: Phone Authentication is Enabled**
- Go to Firebase Console → Authentication → Sign-in method
- Verify **Phone** is toggled ON (blue)

**Check 2: reCAPTCHA is Configured**
- Go to Firebase Console → Authentication → Settings
- Look for **reCAPTCHA Enterprise configuration**
- It should say "Enabled" or show configuration details
- If it says "Disabled" or shows no configuration, follow Step 2 above

**Check 3: Domain is Authorized**
- Go to Firebase Console → Authentication → Settings
- Find **Authorized domains**
- Verify your domain is listed:
  - For localhost development: `localhost` should be listed
  - Check if `127.0.0.1` is also listed
  - For production: your domain should be listed

**Check 4: Clear Browser Cache**
- Firebase configuration is cached in localStorage
- Clear browser cache: DevTools → Application → Clear site data
- Or use Incognito/Private mode for a fresh test

### Getting "Invalid phone number" Error

- Phone number must be in E.164 format: `+[country code][number]`
- Example: `+15551234567` (correct) vs `(555) 123-4567` (incorrect)
- Country codes:
  - US: +1
  - Kenya: +254
  - UK: +44
  - Full list: [E.164 Country Codes](https://www.itu.int/rec/T-REC-E.164-201011-I/en)

### Getting "reCAPTCHA error" in Console

This warning is usually harmless if phone auth still works:
```
Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.
```

However, if phone auth is not working:
- Verify reCAPTCHA v2 (not v3) is configured
- Check that your domain is authorized for the reCAPTCHA key
- Try using a different browser or incognito mode

### Getting "Too many requests" Error

- Firebase rate-limits phone auth attempts
- Wait a few minutes before trying again
- This usually resets after 15-30 minutes

### SMS Not Received

**Possible causes:**
1. Phone number is invalid or not in E.164 format
2. Your Firebase project is in sandbox mode (development only)
3. SMS delivery service is not configured
4. The phone number might be in a region that's not supported

**Solution:**
- For development testing, use test phone numbers:
  - In Firebase Console → Authentication → Sign-in method → Phone
  - Click the **Phone numbers for testing** section
  - Add test phone numbers (e.g., `+15551234567`)
  - Use fixed OTP code (e.g., `000000`)

## Reference: Firebase Phone Auth Architecture

```
┌─────────────────────────────────────────┐
│        Your React App (Frontend)        │
│  (Auth.tsx → signInWithPhoneNumber)     │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼─────────┐
        │   reCAPTCHA v2   │ ← Must be configured!
        └────────┬─────────┘
                 │
    ┌────────────▼────────────────┐
    │   Firebase Auth Service     │
    │   (Google's Servers)        │
    └────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │   SMS Provider              │
    │   (Twilio or similar)       │
    └────────────┬────────────────┘
                 │
    ┌────────────▼────────────────┐
    │   User's Phone Number       │
    │   (receives OTP code)       │
    └─────────────────────────────┘
```

If any step in this chain fails, you'll get an error.

## Still Having Issues?

Check these Firebase documentation pages:
- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA Security Keys](https://firebase.google.com/docs/auth/web/phone-auth#enable-app-verification)
- [Firebase Errors Reference](https://firebase.google.com/docs/auth/troubleshooting)

Or create an issue with:
1. Your Firebase project ID
2. The exact error message
3. Your domain/localhost setup
4. Screenshots of Firebase Console settings
