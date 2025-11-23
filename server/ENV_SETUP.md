# Environment Variables Setup

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

## How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - Storage bucket is usually `{project-id}.appspot.com`

## Important Notes

- Keep your `.env` file secure and never commit it to git
- The `.env` file is already in `.gitignore`
- Make sure to replace all placeholder values with your actual Firebase credentials

