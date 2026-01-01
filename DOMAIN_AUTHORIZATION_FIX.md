# Fix OAuth Domain Authorization Error

## The Problem
```
FirebaseError: Firebase: This domain is not authorized for OAuth operations for your Firebase project.
```

## Quick Fix (2 minutes)

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** (in the left sidebar)
4. Click on **Settings** tab
5. Scroll down to **Authorized domains** section

### Step 2: Add Your Domains
Add these domains to the authorized domains list:

#### For Local Development:
- `127.0.0.1`
- `127.0.0.1:5500`
- `localhost`

#### For Production (when deployed):
- `yourdomain.com` (replace with your actual domain)
- `www.yourdomain.com`

### Step 3: Save
1. Click **Add domain** for each domain
2. Click **Save** (if there's a save button)

## Important Notes

### Why `127.0.0.1` and not `localhost`?
Firebase treats these as different domains. Add both to be safe.

### Port Numbers
Include the port number if you're using a specific port (like `:5500`).

### SSL/HTTPS
- For production, you'll need HTTPS
- Local development works fine with HTTP

## After Adding Domains

1. **Refresh your browser page** (important!)
2. Try Google Sign-In again
3. It should work immediately

## Testing All Providers

Once domains are authorized:
- **Google Sign-In**: Should work immediately
- **Microsoft Sign-In**: Should work immediately  
- **Apple Sign-In**: Requires additional Apple Developer setup

## Common Issues

### "Still not working after adding domains"
- **Refresh the browser** - this is required
- **Clear browser cache** - sometimes needed
- **Check exact domain** - make sure you added the exact domain you're using

### "Which domain should I add?"
Look at your browser address bar:
- If it shows `127.0.0.1:5500` → add `127.0.0.1:5500`
- If it shows `localhost:5500` → add `localhost:5500`

## Security Note
Only add domains you trust. This prevents unauthorized sites from using your Firebase authentication.
