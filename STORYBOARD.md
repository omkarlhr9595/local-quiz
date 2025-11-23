# Quiz Game Application - Storyboard & Requirements

## 🎯 Project Overview
A real-time multiplayer quiz game application for hosting quiz events with friends. The system uses WebSockets for real-time communication across multiple screens/monitors.

---

## 📺 Screen Architecture

### 1. **Main Monitor** (Display Screen)
- **Purpose**: Public display for all participants
- **Route**: `/main` (Monitor route)
- **Shows**:
  - Category grid with point values
  - Questions when revealed
  - Contestant photos with earned points
  - Leaderboard
  - Victory animations/sounds

### 2. **Host Monitor** (Control Panel)
- **Purpose**: Game control and management
- **Shows**:
  - Same grid view (for reference)
  - Question details before revealing
  - Answer confirmation buttons (Correct/Incorrect)
  - Contestant list and status
  - Game controls (start, pause, reset)

### 3. **Contestant Monitors** (Multiple - One per friend)
- **Purpose**: Individual player interface
- **Shows**:
  - Current question (when revealed)
  - Buzzer status (green glow when first to press spacebar)
  - Personal score
  - Waiting/active status

---

## 🎮 Game Flow

### Phase 1: Setup
1. **Host Action**: Host creates room (gets host route, e.g., `/host`)
2. **Host Action**: Host loads quiz with categories and questions
3. **Host Action**: Host uploads photos for each contestant:
   - Upload photo for Contestant 1
   - Upload photo for Contestant 2
   - Upload photo for Contestant 3
   - ... up to Contestant N
4. **Host Action**: Host assigns names to contestants (optional)
5. **Contestant Action**: Contestants simply join via their assigned route:
   - Contestant 1: `/contestant1` (just opens the route, no action needed)
   - Contestant 2: `/contestant2` (just opens the route, no action needed)
   - Contestant 3: `/contestant3` (just opens the route, no action needed)
   - ... up to Contestant N: `/contestantN` (just opens the route, no action needed)
6. **Host Action**: Host sees all contestants joined
7. **Host Action**: Host starts the game

### Phase 2: Grid Display (Main Monitor)
- Shows grid layout:
  ```
  Category 1 | Category 2 | Category 3 | Category 4 | Category N
  ----------------------------------------------------------------
     100     |    100    |    100    |    100    |    100
     200     |    200    |    200    |    200    |    200
     300     |    300    |    300    |    300    |    300
     400     |    400    |    400    |    400    |    400
     500     |    500    |    500    |    500    |    500
  ```
- Cards show point values
- Clicked/answered cards are disabled/grayed out

### Phase 3: Question Selection
1. **Contestant Action**: Contestant clicks on a card (e.g., "Category 1 - 300 points")
2. **Host Action**: Host sees the selection on host monitor
3. **Host Action**: Host clicks "Reveal Question" button
4. **System Action**: Question appears on Main Monitor
5. **System Action**: Question appears on all Contestant Monitors

### Phase 4: Buzzer System (Fastest Finger First)
1. **Contestant Action**: Contestants press **SPACEBAR** to buzz in (fastest finger first)
2. **System Action**: System maintains a **queue** of contestants who pressed spacebar in order:
   - First contestant to press spacebar:
     - Their screen glows **GREEN**
     - They are at the front of the queue
     - Main monitor shows which contestant is answering
   - Subsequent contestants who press spacebar:
     - Added to queue in order (2nd, 3rd, etc.)
     - Their screens show their position in queue or "Waiting..."
   - Other contestants see "Locked" or "Someone answered" status
3. **Contestant Action**: First contestant in queue says their answer **out loud** (no typing needed - everyone is in the same room)

### Phase 5: Answer Evaluation
1. **Contestant Action**: First contestant in queue says their answer **out loud** (heard by everyone in the room)
2. **Host Action**: Host hears the answer and clicks:
   - ✅ **"Correct"** button, OR
   - ❌ **"Incorrect"** button

### Phase 6: Correct Answer Flow
1. **System Action**: If answer is **CORRECT**:
   - Victory sound plays on Main Monitor
   - Contestant's photo appears on Main Monitor
   - Points earned are displayed (e.g., "+300")
   - After 3-5 seconds, leaderboard appears on Main Monitor
   - Selected card is marked as answered
   - Grid returns to view

### Phase 7: Incorrect Answer Flow
1. **System Action**: If answer is **INCORRECT**:
   - First contestant is removed from queue
   - Next contestant in queue (whoever pressed spacebar 2nd) automatically gets:
     - Green glow on their screen
     - Main monitor shows they are now answering
   - This contestant says their answer out loud
   - Host evaluates again (Correct/Incorrect)
   - Process repeats with queue order until:
     - Correct answer is given, OR
     - All contestants in queue have failed
   - If queue is empty and no one answered correctly, question ends

### Phase 8: End of Question
- After correct answer or all fail, return to grid
- Host can select next question
- Game continues until all questions answered or host ends game

---

## 🔧 Technical Requirements

### Route Structure
```
/host              - Host control panel
/main              - Main monitor display (public view) - Route for monitor screen
/contestant1       - Contestant 1 interface
/contestant2       - Contestant 2 interface
/contestant3       - Contestant 3 interface
...
/contestantN       - Contestant N interface
```

### Real-time Communication
- **Technology**: WebSockets (Socket.io)
- **Events to Handle**:
  - Room creation (host route)
  - Photo upload (by host for each contestant)
  - Contestant join (via assigned routes - passive, just route access)
  - Question selection
  - Question reveal
  - Game pause/resume
  - Buzzer press (spacebar) - with timestamp for queue ordering
  - Buzzer queue updates (who's next in line)
  - Host confirmation (correct/incorrect)
  - Score updates (no negative values)
  - Leaderboard updates

### Data Structure
```typescript
// Quiz Structure
{
  categories: [
    {
      name: "Category 1",
      questions: [
        { points: 100, question: "...", answer: "..." },
        { points: 200, question: "...", answer: "..." },
        // ... up to 500
      ]
    },
    // ... more categories
  ]
}

// Contestant Structure
{
  id: string,
  name: string,
  photo: string (URL),
  score: number,
  isActive: boolean
}

// Buzzer Queue Structure
{
  questionId: string,
  queue: [
    { contestantId: string, timestamp: number }, // First to press
    { contestantId: string, timestamp: number }, // Second to press
    // ... ordered by timestamp
  ],
  currentAnswering: string | null // contestantId currently answering
}
```

### Key Features
1. **Route-Based Room System**: 
   - Host creates room at `/host` route
   - Host uploads photos for all contestants
   - Host manages all setup and configuration
   - Contestants simply join via assigned routes: `/contestant1`, `/contestant2`, etc. (no actions required from contestants)
   - All participants in same physical room
2. **Buzzer Queue System**: Tracks order of spacebar presses (fastest finger first)
   - Maintains queue of contestants who buzzed in
   - Automatically moves to next in queue if answer is incorrect
3. **Verbal Answers**: Contestants say answers out loud (no typing/input needed)
4. **Sound Effects**: Victory sound on correct answer
5. **Photo Display**: Contestant photos shown on main monitor
6. **Leaderboard**: Real-time score tracking
7. **Card State Management**: Track which questions are answered
8. **Host Controls**: Host can pause game mid-way
9. **Scoring**: No negative points (scores cannot go below 0)
10. **Question Types**: Text questions only
11. **Game Type**: Single game (no multiple rounds)

---

## 🎨 UI/UX Considerations

### Main Monitor
- Large, clear fonts
- High contrast for visibility
- Smooth transitions between states
- Full-screen display mode

### Host Monitor
- Control panel layout
- Quick action buttons (Pause/Resume, Reset)
- Contestant status indicators
- Question preview before reveal
- Photo upload interface for each contestant
- Contestant name assignment
- Route: `/host`

### Contestant Monitor
- Clear question display
- Prominent buzzer indicator (green glow)
- Personal score visible
- Simple, focused interface
- Routes: `/contestant1`, `/contestant2`, `/contestant3`, ... `/contestantN`
- No actions required - just displays content and responds to spacebar

---
