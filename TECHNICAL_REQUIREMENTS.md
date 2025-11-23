# Technical Requirements - Finalized

## ✅ Technical Stack Decisions

### Backend & Server
- **Framework**: Node.js with Express
- **WebSocket**: Socket.io
- **Database**: Firebase (Firestore)
- **Photo Storage**: Firebase Storage
- **API Architecture**: REST API + WebSockets
  - REST for initial setup, quiz loading, photo uploads
  - WebSockets for real-time game events

### Frontend
- **Framework**: React 19 + TypeScript + Vite (already set up)
- **Routing**: React Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

### Project Structure
- **Architecture**: Monorepo (frontend + backend in same repo)
- **Environment**: Local development only
- **Testing**: Skip for now
- **Code Quality**:
  - ESLint (already configured)
  - Prettier (to be added)
  - TypeScript strict mode (to be enabled)

### Deployment
- **CI/CD**: Not needed (local development only)

---

## 📁 Project Structure

```
local-quiz/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Route pages
│   │   ├── store/         # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities, API clients
│   │   ├── types/         # TypeScript types
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/        # REST API routes
│   │   ├── socket/         # Socket.io handlers
│   │   ├── services/      # Business logic
│   │   ├── config/        # Firebase config, etc.
│   │   ├── types/         # TypeScript types
│   │   └── ...
│   └── package.json
│
├── shared/                 # Shared types/utilities
│   └── types/             # Shared TypeScript types
│
├── package.json           # Root package.json (workspace)
└── README.md
```

---

## 🔧 Dependencies to Install

### Client (Frontend)
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "socket.io-client": "^4.x",
    "axios": "^1.x",
    "@radix-ui/react-*": "shadcn/ui components"
  },
  "devDependencies": {
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/react-router-dom": "^5.x"
  }
}
```

### Server (Backend)
```json
{
  "dependencies": {
    "express": "^4.x",
    "socket.io": "^4.x",
    "firebase-admin": "^12.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "multer": "^1.x"
  },
  "devDependencies": {
    "@types/express": "^4.x",
    "@types/node": "^20.x",
    "@types/cors": "^2.x",
    "@types/multer": "^1.x",
    "typescript": "^5.x",
    "ts-node": "^10.x",
    "nodemon": "^3.x"
  }
}
```

### Root (Workspace)
```json
{
  "scripts": {
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build"
  }
}
```

---

## 🔥 Firebase Setup

### Required Firebase Services
1. **Firestore Database**
   - Store quiz data (categories, questions, answers)
   - Store game state (scores, current question, buzzer queue)
   - Store contestant data (names, photos URLs)

2. **Firebase Storage**
   - Store contestant photos
   - Upload via REST API, serve via Firebase Storage URLs

### Firebase Configuration
- Need Firebase project credentials
- `firebase-admin` SDK for server
- Firestore collections:
  - `quizzes` - Quiz data
  - `games` - Active game sessions
  - `contestants` - Contestant info

---

## 🛣️ API Routes (REST)

### Quiz Management
- `POST /api/quizzes` - Create/upload quiz
- `GET /api/quizzes/:id` - Get quiz data
- `GET /api/quizzes` - List all quizzes

### Contestant Management
- `POST /api/contestants` - Create contestant (with photo upload)
- `GET /api/contestants` - Get all contestants
- `PUT /api/contestants/:id` - Update contestant

### Game Management
- `POST /api/games` - Create new game session
- `GET /api/games/:id` - Get game state
- `PUT /api/games/:id/pause` - Pause/resume game

---

## 🔌 Socket.io Events

### Client → Server
- `join-room` - Join game room
- `select-question` - Contestant selects question
- `buzzer-press` - Contestant presses spacebar
- `host-reveal-question` - Host reveals question
- `host-answer-confirm` - Host confirms correct/incorrect

### Server → Client
- `room-joined` - Confirmation of room join
- `question-selected` - Question was selected
- `question-revealed` - Question revealed to all
- `buzzer-queue-update` - Buzzer queue changed
- `answer-result` - Answer was correct/incorrect
- `score-update` - Score updated
- `leaderboard-update` - Leaderboard changed
- `game-state-change` - Game paused/resumed

---

## 📝 Next Steps

1. ✅ Set up monorepo structure
2. ✅ Configure TypeScript strict mode
3. ✅ Add Prettier
4. ✅ Set up Tailwind CSS
5. ✅ Install shadcn/ui
6. ✅ Set up Express server
7. ✅ Configure Socket.io
8. ✅ Set up Firebase
9. ✅ Create basic routing structure
10. ✅ Set up Zustand stores

---

**Status**: ✅ Technical Stack Finalized - Ready for Implementation

