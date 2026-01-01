# Social Sign-In Setup Guide

## Firebase Console Configuration

### 1. Enable Authentication Providers
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following providers:

#### Google
- Status: **Enabled**
- Add your domain to **Authorized domains**:
  - `127.0.0.1:5500` (for local testing)
  - `yourdomain.com` (for production)

#### Microsoft
- Status: **Enabled**
- Add your domain to **Authorized domains**
- No additional configuration needed

#### Apple
- Status: **Enabled**
- Add your domain to **Authorized domains**
- **Important**: Apple Sign-In requires:
  - Apple Developer Program membership ($99/year)
  - App ID configuration with "Sign In with Apple" capability
  - Service ID configuration

### 2. Domain Configuration
For each provider, add these domains:
- `127.0.0.1:5500` (local development)
- `localhost` (alternative local)
- Your production domain(s)

## What's Already Implemented

### Frontend (index_firebase.html)
- ✅ Social sign-in buttons added to both Sign In and Sign Up forms
- ✅ Professional branding with official icons
- ✅ Proper styling and hover states

### Backend (auth_firebase.js)
- ✅ `signInWithGoogle()` function
- ✅ `signInWithMicrosoft()` function  
- ✅ `signInWithApple()` function
- ✅ `handleSocialSignIn()` - unified handler
- ✅ `createOrUpdateUserProfile()` - automatic profile creation
- ✅ Error handling for popup blocked/cancelled
- ✅ Loading states on buttons

### Features
- **One-click sign-in**: No password needed
- **Automatic profile creation**: Creates Firestore profile on first sign-in
- **Provider tracking**: Stores which provider was used
- **Error handling**: User-friendly error messages
- **Security**: Uses Firebase's secure OAuth flow

## Testing

1. **Google Sign-In**: Works immediately after enabling in Firebase
2. **Microsoft Sign-In**: Works immediately after enabling in Firebase
3. **Apple Sign-In**: Requires Apple Developer account setup

## User Experience

- Users see "Or sign in with:" options
- Clicking opens provider's OAuth popup
- If new user: Profile automatically created with `role: "user"`
- If existing user: Profile updated with latest info
- Provider preference is stored in `auth_provider` field

## Notes

- Apple Sign-In is optional (requires paid Apple Developer account)
- Google and Microsoft work immediately after Firebase setup
- Users can sign in with multiple providers to the same email
- Admin promotion still works the same way (edit Firestore profile)
