# Firebase Setup Fix Required

## Issue Found
The Firestore API is not enabled in your Firebase project. This is why quiz creation is failing.

## Solution

### Enable Firestore API

1. **Go to Google Cloud Console:**
   - Visit: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=local-quiz-938f8
   - Or go to: https://console.cloud.google.com/
   - Select your project: `local-quiz-938f8`

2. **Enable Firestore API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Firestore API"
   - Click "Enable"

3. **Enable Firebase Storage API (for photo uploads):**
   - Search for "Cloud Storage for Firebase API"
   - Click "Enable"

### Alternative: Enable via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `local-quiz-938f8`
3. Go to **Firestore Database** in the left menu
4. Click **Create Database**
5. Choose **Start in test mode** (for development)
6. Select a location for your database
7. Click **Enable**

### Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Start in **test mode** (for development)
4. Click **Done**

## After Enabling

1. Wait 1-2 minutes for the APIs to propagate
2. Restart your server
3. Test the API again

## Test Command

```bash
curl -X POST http://localhost:3001/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Quiz", "categories": [{"name": "Science", "questions": [{"points": 100, "question": "What is 2+2?", "answer": "4"}]}]}'
```

---

**Once Firestore and Storage are enabled, all API endpoints should work! 🚀**

