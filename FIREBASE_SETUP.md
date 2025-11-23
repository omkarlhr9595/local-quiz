# Firebase Setup Guide

## ✅ What's Been Set Up

1. **Firebase Admin SDK Configuration** (`server/src/config/firebase.ts`)
   - Initializes Firestore database
   - Initializes Firebase Storage
   - Validates credentials on startup

2. **Storage Service** (`server/src/services/storage.service.ts`)
   - Photo upload to Firebase Storage
   - Photo deletion functionality
   - Public URL generation

3. **Multer Configuration** (`server/src/config/multer.ts`)
   - File upload middleware
   - Image validation (JPEG, PNG, GIF, WebP)
   - 5MB file size limit

4. **Shared Types** (`shared/types/index.ts`)
   - All TypeScript interfaces defined
   - Quiz, Contestant, Game types
   - Socket.io event payload types

## 📝 Next Steps

### 1. Create `.env` File

Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

Then add your Firebase credentials (see `server/ENV_SETUP.md` for details).

### 2. Test Firebase Connection

Once you've added your credentials, test the connection:

```bash
cd server
npm run dev
```

You should see:
- ✅ Firebase Admin initialized successfully
- Server running on port 3001

If you see an error, check:
- All environment variables are set correctly
- Private key includes `\n` characters properly
- Service account has proper permissions

### 3. Firebase Console Setup

Make sure in Firebase Console:
- **Firestore Database** is enabled
- **Storage** is enabled
- Storage rules allow uploads (for development, you can use public rules)

### 4. Storage Rules (Development)

For development, you can use these Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /contestants/{gameId}/{contestantId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Or remove auth for local dev
    }
  }
}
```

## 🔍 Testing

After setup, you can test:
1. Server starts without errors
2. Firebase connection is established
3. Ready to create REST API routes

---

**Status**: ✅ Firebase Configuration Complete - Add `.env` file to proceed

