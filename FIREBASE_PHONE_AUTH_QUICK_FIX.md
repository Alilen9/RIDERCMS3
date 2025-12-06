# Quick Fix for Firebase Phone Auth Error

## If you're getting: `auth/invalid-app-credential` error

### ✅ Quick Checklist (5 minutes)

- [ ] **Firebase Console**: Go to your project → Authentication → Sign-in method
- [ ] **Is Phone enabled?** Toggle should be blue (ON)
- [ ] **reCAPTCHA configured?** Should show "Enabled" or have configuration details
- [ ] **Authorized domains**: Check Settings tab → Add `localhost` and `127.0.0.1` if missing
- [ ] **Clear browser**: DevTools → Application → Storage → Delete all for localhost
- [ ] **Restart dev server**: Stop and `yarn dev` again

### If Still Not Working: Detailed Steps

#### Step 1: Verify Phone Authentication is ON
This site key is not enabled for the invisible captcha.
```
Firebase Console 
  → Authentication 
    → Sign-in method 
      → Phone (should be enabled/blue)
```

#### Step 2: Set Up reCAPTCHA

```
Firebase Console 
  → Authentication 
    → Settings tab
      → Look for "reCAPTCHA Enterprise configuration"
      → Click Create/Configure if not set up
```

#### Step 3: Add Authorized Domains

```
Firebase Console 
  → Authentication 
    → Settings tab
      → Authorized domains
      → Add domain: localhost
      → Add domain: 127.0.0.1
```

#### Step 4: Create Test Phone Numbers (For Development)

```
Firebase Console 
  → Authentication 
    → Sign-in method 
      → Phone 
        → Phone numbers for testing
        → Add: +15551234567
        → Use OTP: 000000
```

#### Step 5: Restart Everything

```bash
# Stop dev server (Ctrl+C)
# Clear browser cache or use Incognito mode
# Restart
yarn dev
```

### Testing

1. Go to Registration form
2. Enter: `+15551234567` (or your test number)
3. Should receive OTP in console or use test OTP `000000`

---

## Error Messages Explained

| Error | Cause | Fix |
|-------|-------|-----|
| `auth/invalid-app-credential` | reCAPTCHA not configured or domain not authorized | Follow Step 2 & 3 above |
| `auth/invalid-phone-number` | Phone format wrong | Use: `+[country code][number]` |
| `auth/too-many-requests` | Too many attempts | Wait 15-30 minutes |
| reCAPTCHA v2 warning (non-blocking) | reCAPTCHA v2 being used | This is OK, phone auth might still work |

---

## For Production

When deploying to production:

1. Add your production domain to authorized domains
2. Set up production reCAPTCHA key for your domain
3. Update `VITE_API_BASE_URL` to production backend URL
4. Test phone auth in production environment

---

## Still Stuck?

See: `FIREBASE_RECAPTCHA_SETUP.md` for comprehensive troubleshooting guide
