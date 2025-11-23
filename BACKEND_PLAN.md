# Backend Development Plan

## 🎯 Backend Development Phases

### Phase 1: Foundation & Configuration ✅
- [x] Express server setup
- [x] Socket.io integration
- [x] TypeScript configuration
- [ ] Firebase Admin SDK setup
- [ ] Environment variables configuration
- [ ] CORS configuration (proper setup)

### Phase 2: Firebase Setup
- [ ] Firebase project creation/configuration
- [ ] Firestore database structure
- [ ] Firebase Storage setup
- [ ] Service account key configuration
- [ ] Firebase initialization in server

### Phase 3: Data Models & Types
- [ ] Shared TypeScript types/interfaces
- [ ] Quiz data structure
- [ ] Contestant data structure
- [ ] Game state structure
- [ ] Buzzer queue structure

### Phase 4: REST API Routes
- [ ] Quiz management routes
  - `POST /api/quizzes` - Create/upload quiz
  - `GET /api/quizzes/:id` - Get quiz data
  - `GET /api/quizzes` - List all quizzes
- [ ] Contestant management routes
  - `POST /api/contestants` - Create contestant with photo upload
  - `GET /api/contestants` - Get all contestants
  - `PUT /api/contestants/:id` - Update contestant
  - `DELETE /api/contestants/:id` - Delete contestant
- [ ] Game management routes
  - `POST /api/games` - Create new game session
  - `GET /api/games/:id` - Get game state
  - `PUT /api/games/:id/pause` - Pause/resume game
  - `PUT /api/games/:id/reset` - Reset game

### Phase 5: File Upload (Photo Storage)
- [ ] Multer configuration for file uploads
- [ ] Upload to Firebase Storage
- [ ] Generate public URLs
- [ ] File validation (image types, size limits)
- [ ] Error handling

### Phase 6: Socket.io Event Handlers
- [ ] Room management
  - `join-room` - Join game room
  - `leave-room` - Leave game room
- [ ] Question flow
  - `select-question` - Contestant selects question
  - `host-reveal-question` - Host reveals question
  - `question-revealed` - Broadcast to all clients
- [ ] Buzzer system
  - `buzzer-press` - Contestant presses spacebar
  - `buzzer-queue-update` - Update queue and broadcast
  - `buzzer-reset` - Reset buzzer for new question
- [ ] Answer evaluation
  - `host-answer-confirm` - Host confirms correct/incorrect
  - `answer-result` - Broadcast result to all
- [ ] Score & leaderboard
  - `score-update` - Update and broadcast scores
  - `leaderboard-update` - Broadcast leaderboard
- [ ] Game controls
  - `game-pause` - Pause game
  - `game-resume` - Resume game
  - `game-reset` - Reset game state

### Phase 7: Game State Management
- [ ] In-memory game state (or Firestore)
- [ ] Room/Game session management
- [ ] Buzzer queue logic
- [ ] Score calculation
- [ ] Leaderboard generation

### Phase 8: Error Handling & Validation
- [ ] Input validation
- [ ] Error middleware
- [ ] Socket.io error handling
- [ ] Firebase error handling

### Phase 9: Testing & Documentation
- [ ] API endpoint testing (manual/Postman)
- [ ] Socket.io event testing
- [ ] API documentation (comments/README)

---

## 📁 Backend File Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   ├── firebase.ts          # Firebase initialization
│   │   └── multer.ts            # Multer configuration
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── quiz.routes.ts       # Quiz API routes
│   │   ├── contestant.routes.ts # Contestant API routes
│   │   └── game.routes.ts       # Game API routes
│   ├── socket/
│   │   ├── index.ts             # Socket.io setup
│   │   ├── handlers/
│   │   │   ├── room.handler.ts  # Room management
│   │   │   ├── question.handler.ts # Question flow
│   │   │   ├── buzzer.handler.ts   # Buzzer system
│   │   │   ├── answer.handler.ts  # Answer evaluation
│   │   │   └── game.handler.ts    # Game controls
│   │   └── types.ts             # Socket event types
│   ├── services/
│   │   ├── quiz.service.ts      # Quiz business logic
│   │   ├── contestant.service.ts # Contestant logic
│   │   ├── game.service.ts      # Game state management
│   │   ├── storage.service.ts   # Firebase Storage
│   │   └── firestore.service.ts # Firestore operations
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── utils/
│       ├── validation.ts        # Input validation
│       └── errors.ts            # Error utilities
├── package.json
└── tsconfig.json
```

---

## 🔥 Firebase Structure

### Firestore Collections

#### `quizzes`
```typescript
{
  id: string,
  name: string,
  createdAt: timestamp,
  categories: [
    {
      name: string,
      questions: [
        {
          points: number,
          question: string,
          answer: string
        }
      ]
    }
  ]
}
```

#### `games`
```typescript
{
  id: string,
  quizId: string,
  status: 'waiting' | 'active' | 'paused' | 'ended',
  currentQuestion: {
    categoryIndex: number,
    questionIndex: number,
    points: number
  } | null,
  buzzerQueue: [
    { contestantId: string, timestamp: number }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `contestants`
```typescript
{
  id: string,
  name: string,
  photoUrl: string,
  gameId: string,
  score: number,
  route: string, // '/contestant1', '/contestant2', etc.
  createdAt: timestamp
}
```

### Firebase Storage
- Path: `contestants/{gameId}/{contestantId}/photo.{ext}`
- Public URLs stored in Firestore

---

## 🔌 Socket.io Events Detail

### Client → Server Events

#### Room Management
```typescript
'join-room': {
  gameId: string,
  role: 'host' | 'contestant',
  contestantId?: string
}

'leave-room': {
  gameId: string
}
```

#### Question Flow
```typescript
'select-question': {
  gameId: string,
  categoryIndex: number,
  questionIndex: number,
  contestantId: string
}

'host-reveal-question': {
  gameId: string,
  categoryIndex: number,
  questionIndex: number
}
```

#### Buzzer
```typescript
'buzzer-press': {
  gameId: string,
  contestantId: string,
  timestamp: number
}
```

#### Answer Evaluation
```typescript
'host-answer-confirm': {
  gameId: string,
  contestantId: string,
  isCorrect: boolean,
  points: number
}
```

#### Game Controls
```typescript
'game-pause': { gameId: string }
'game-resume': { gameId: string }
'game-reset': { gameId: string }
```

### Server → Client Events

```typescript
'room-joined': { gameId: string, role: string }
'question-selected': { categoryIndex, questionIndex, contestantId }
'question-revealed': { question, points, category }
'buzzer-queue-update': { queue: Array, currentAnswering: string | null }
'answer-result': { contestantId, isCorrect, points }
'score-update': { contestantId, newScore }
'leaderboard-update': { leaderboard: Array }
'game-state-change': { status: string }
'error': { message: string }
```

---

## 🚀 Implementation Order

### Step 1: Firebase Setup (Priority 1)
1. Create Firebase project (or use existing)
2. Get service account key
3. Initialize Firebase Admin in server
4. Test Firestore connection
5. Test Storage connection

### Step 2: Shared Types (Priority 2)
1. Create types in `shared/types/`
2. Define all interfaces
3. Export from shared package

### Step 3: Basic REST API (Priority 3)
1. Quiz routes (create, get)
2. Contestant routes (create with photo upload)
3. Game routes (create, get)

### Step 4: Socket.io Foundation (Priority 4)
1. Room join/leave
2. Basic connection handling
3. Error handling

### Step 5: Question Flow (Priority 5)
1. Question selection
2. Question reveal
3. Broadcast to all clients

### Step 6: Buzzer System (Priority 6)
1. Buzzer press handling
2. Queue management
3. Queue updates broadcast

### Step 7: Answer & Scoring (Priority 7)
1. Answer confirmation
2. Score calculation
3. Leaderboard generation

### Step 8: Game Controls (Priority 8)
1. Pause/resume
2. Reset functionality

---

## 📝 Environment Variables Needed

```env
# Server
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-bucket-name

# CORS
CLIENT_URL=http://localhost:5173
```

---

## ✅ Success Criteria

- [ ] Firebase connected and working
- [ ] Can create quiz and save to Firestore
- [ ] Can upload contestant photos to Storage
- [ ] REST API endpoints working (test with Postman/curl)
- [ ] Socket.io connection established
- [ ] Can join rooms
- [ ] Question selection and reveal working
- [ ] Buzzer system working with queue
- [ ] Score updates working
- [ ] Leaderboard updates working

---

**Status**: 📋 Backend Plan Ready - Start with Phase 1 & 2

