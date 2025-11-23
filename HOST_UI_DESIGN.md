# Host UI Design - Complete Plan

## 🎯 Overview
The Host interface consists of **three separate pages**:
1. **Quiz Setup Page** - Create and configure quizzes, categories, and questions
2. **Contestant Setup Page** - Add contestants with photos and names
3. **Host Control Panel** - Run the game (game control, buzzer management, scoring)

---

## 📍 Navigation Structure

```
/host
├── /host/quizzes          → Quiz Setup Page (Create/Edit Quiz Templates)
├── /host/setup            → Game Setup Page (Select Quiz → Create Game → Add Contestants)
└── /host/game             → Host Control Panel (Play the Game)
```

**Navigation Bar** (present on all host pages):
```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Host] [📝 Quizzes] [🎮 Setup Game] [▶️ Play Game]       │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Simplified Flow

**How it works:**
1. **Quiz** = Template (categories and questions) - Created once, reused many times
2. **Game** = Instance of a Quiz being played - Created from a Quiz
3. **Contestants** = Players in a Game - Belong to a specific Game

**User Journey:**
1. Create Quiz templates in `/host/quizzes` (one-time setup)
2. Setup a new Game in `/host/setup`:
   - Select a Quiz template
   - Create Game from that Quiz
   - Add Contestants (up to 5)
3. Play the Game in `/host/game`

---

# 📝 Page 1: Quiz Setup Page (`/host/quizzes`)

## 🎯 Purpose
Create, edit, and manage quizzes. Each quiz contains categories, and each category contains questions with point values.

---

## 📐 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Host] [📝 Quizzes] [👥 Contestants] [🎮 Game Control]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Quiz Management                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Select Quiz ▼] [+ New Quiz] [Edit] [Delete]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Quiz Name: [___________________________]            │   │
│  │                                                       │   │
│  │  Categories:                                         │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Category 1: [Science________] [Delete]       │   │   │
│  │  │   Questions:                                 │   │   │
│  │  │   ┌─────────────────────────────────────┐   │   │   │
│  │  │   │ Points: [100]                        │   │   │   │
│  │  │   │ Question: [What is 2+2?]             │   │   │   │
│  │  │   │ Answer: [4]                          │   │   │   │
│  │  │   │ [Delete]                             │   │   │   │
│  │  │   └─────────────────────────────────────┘   │   │   │
│  │  │   ┌─────────────────────────────────────┐   │   │   │
│  │  │   │ Points: [200]                        │   │   │   │
│  │  │   │ Question: [What is capital of...]    │   │   │   │
│  │  │   │ Answer: [Paris]                      │   │   │   │
│  │  │   │ [Delete]                             │   │   │   │
│  │  │   └─────────────────────────────────────┘   │   │   │
│  │  │   [+ Add Question]                          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │   │
│  │                                                       │   │
│  │  [+ Add Category]                                    │   │
│  │                                                       │   │
│  │  [Save Quiz] [Cancel]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Detailed Features

### Quiz Management Section
- **Select Quiz Dropdown**: Load existing quiz to edit
- **New Quiz Button**: Start creating a new quiz
- **Edit Button**: Edit selected quiz
- **Delete Button**: Delete selected quiz (with confirmation)

### Quiz Form
- **Quiz Name Input**: Text field for quiz name
- **Categories Section**: 
  - List of categories (expandable/collapsible)
  - Each category has:
    - **Category Name Input**
    - **Delete Category Button**
    - **Questions List** (within category)
      - Each question has:
        - **Points Input** (number, typically 100, 200, 300, 400, 500)
        - **Question Text** (textarea)
        - **Answer Text** (textarea)
        - **Delete Question Button**
      - **Add Question Button** (adds new question to category)
  - **Add Category Button** (adds new category)

### Actions
- **Save Quiz**: Saves/updates quiz to database
- **Cancel**: Discards changes, returns to quiz list

### Validation
- Quiz name required
- At least one category required
- Each category must have at least one question
- Points must be positive numbers
- Question and answer text required

---

## 🔄 User Flow

1. Host navigates to `/host/quizzes`
2. Host clicks "New Quiz" or selects existing quiz
3. Host enters quiz name
4. Host adds categories (e.g., "Science", "History", "Sports")
5. For each category, host adds questions:
   - Sets point value (100, 200, 300, 400, 500)
   - Enters question text
   - Enters answer text
6. Host clicks "Save Quiz"
7. Quiz is saved and available for use in games

---

## 🎯 Key Components Needed

1. **QuizSelector** - Dropdown to select existing quizzes
2. **QuizForm** - Form for quiz name
3. **CategoryList** - List of categories with add/delete
4. **CategoryItem** - Individual category with name and questions
5. **QuestionList** - List of questions within a category
6. **QuestionItem** - Individual question form (points, question, answer)
7. **QuizActions** - Save/Cancel buttons

---

# 🎮 Page 2: Game Setup Page (`/host/setup`)

## 🎯 Purpose
Create a new game by selecting a quiz template, then add contestants. This combines quiz selection, game creation, and contestant setup into one simple flow.

---

## 📐 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Host] [📝 Quizzes] [👥 Contestants] [🎮 Game Control]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Game Selection                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Game: [Select Game ▼] [+ New Game]                  │   │
│  │ Quiz: [Select Quiz ▼]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Contestants (2/5)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Contestant 1                                  │   │   │
│  │  │ ┌─────┐                                       │   │   │
│  │  │ │Photo│  Name: [John Doe________]            │   │   │
│  │  │ └─────┘  Route: /contestant1 (read-only)     │   │   │
│  │  │          [Upload Photo] [Remove]              │   │   │
│  │  └─────────────────────────────────────────────┘   │   │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │   │
│  │  │ Contestant 2                                  │   │   │
│  │  │ ┌─────┐                                       │   │   │
│  │  │ │Photo│  Name: [Jane Smith_____]              │   │   │
│  │  │ └─────┘  Route: /contestant2 (read-only)     │   │   │
│  │  │          [Upload Photo] [Remove]              │   │   │
│  │  └─────────────────────────────────────────────┘   │   │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │   │
│  │  │ Contestant 3                                  │   │   │
│  │  │ ┌─────┐                                       │   │   │
│  │  │ │Photo│  Name: [________________]            │   │   │
│  │  │ └─────┘  Route: /contestant3 (read-only)     │   │   │
│  │  │          [Upload Photo] [Remove]              │   │   │
│  │  └─────────────────────────────────────────────┘   │   │   │
│  │                                                       │   │
│  │  [+ Add Contestant] (up to 5)                        │   │
│  │                                                       │   │
│  │  [Save & Continue to Game]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Detailed Features

### Step 1: Select Quiz Template
- **Quiz Dropdown**: Select a quiz template (created in Quizzes page)
- **Quiz Preview**: Shows number of categories and total questions
- **Create Game Button**: Creates a new game instance from the selected quiz

### Step 2: Add Contestants
- **Contestant List**: Shows up to 5 contestants
- **Contestant Card** (for each):
  - **Photo Preview**: Circular avatar (shows placeholder if no photo)
  - **Name Input**: Text field for contestant name
  - **Route Display**: Read-only, auto-generated (`/contestant1`, `/contestant2`, etc.)
  - **Upload Photo Button**: Opens file picker, uploads to Firebase Storage
  - **Remove Button**: Removes contestant from game

### Actions
- **Add Contestant Button**: Adds new contestant slot (max 5)
- **Start Game Button**: Saves all contestants and navigates to Game Control page

**Important:** 
- Contestants belong to a **Game**, not directly to a Quiz
- Each Game is created from a Quiz template
- You can create multiple Games from the same Quiz template

### Validation
- At least 1 contestant required
- Photo upload recommended but not required
- Name required for each contestant
- Maximum 5 contestants

---

## 🔄 User Flow

1. Host navigates to `/host/setup`
2. **Step 1**: Host selects a quiz template from dropdown
3. Host clicks "Create Game" - this creates a game instance
4. **Step 2**: Host adds contestants (up to 5):
   - Click "Add Contestant"
   - Enter name
   - Upload photo (required by backend currently)
   - Route auto-generated (`/contestant1`, `/contestant2`, etc.)
5. Host clicks "Start Game"
6. Navigates to `/host/game?gameId=...` with game ready to play

---

## 🎯 Key Components Needed

1. **QuizSelector** - Select quiz template
2. **QuizPreview** - Show quiz details
3. **GameCreator** - Create game from quiz
4. **ContestantList** - List of contestants
5. **ContestantCard** - Individual contestant form
6. **PhotoUpload** - File upload component with preview
7. **GameActions** - Add contestant/Start game buttons

---

# 🎮 Page 3: Host Control Panel (`/host/game`)

## 🎯 Purpose
Run the active game session. Control question reveals, manage buzzer queue, score answers, and control main monitor display.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Host] [📝 Quizzes] [👥 Contestants] [🎮 Game Control]   │
├─────────────────────────────────────────────────────────────┤
│  Game: [Current Game] | Quiz: [Current Quiz]                │
│  Status: [Active] | [⏸ Pause] [🔄 Reset]                   │
├─────────────────────────────────────────────────────────────┤
│  Main Monitor Controls:                                      │
│  [📊 Show Grid] [❓ Show Question] [🏆 Show Leaderboard]     │
│  [📸 Show Photo] [🔇 Mute Sound]                            │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   LEFT PANEL         │        RIGHT PANEL                   │
│   (60% width)        │        (40% width)                    │
│                      │                                      │
│   Quiz Grid          │   Current Question                    │
│   (Categories x     │   - Question Preview                  │
│    Points)           │   - Reveal Button                    │
│                      │                                      │
│                      │   Buzzer Queue                       │
│                      │   - Who buzzed in                   │
│                      │   - Current answering                │
│                      │                                      │
│                      │   Answer Controls                    │
│                      │   - Correct/Incorrect              │
│                      │                                      │
│                      │   Leaderboard                        │
│                      │   - Rankings                        │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 🎨 Detailed Sections

### 1. Top Bar - Game Info & Status

```
┌─────────────────────────────────────────────────────────────┐
│ Game: [Game Name] | Quiz: [Quiz Name]                        │
│ Status: [Active Badge] | [⏸ Pause] [🔄 Reset]              │
└─────────────────────────────────────────────────────────────┘
```

- **Game Name Display**: Shows current game
- **Quiz Name Display**: Shows current quiz
- **Status Badge**: Color-coded (Waiting | Active | Paused)
- **Pause Button**: Pauses game (disables buzzer)
- **Reset Button**: Resets game to initial state (with confirmation)

### 2. Main Monitor Control Bar (Hot Buttons)

```
┌─────────────────────────────────────────────────────────────┐
│ Main Monitor:                                                │
│ [📊 Show Grid] [❓ Show Question] [🏆 Show Leaderboard]      │
│ [📸 Show Photo] [🔇 Mute Sound]                            │
└─────────────────────────────────────────────────────────────┘
```

**Hot Buttons:**
- **Show Grid**: Displays quiz grid on main monitor
- **Show Question**: Shows current question (if revealed)
- **Show Leaderboard**: Displays current leaderboard
- **Show Photo**: Shows contestant photo with points (after correct answer)
- **Mute Sound**: Toggle victory sound on/off

**Behavior:**
- Only one view active at a time (except Mute Sound)
- Active button highlighted
- Updates main monitor in real-time via Socket.io

### 3. Left Panel - Quiz Grid

#### Grid Display
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Category 1 │ Category 2  │ Category 3  │ Category 4  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    100      │    100      │    100      │    100      │
│   [Card]    │   [Card]    │   [Card]    │   [Card]    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    200      │    200      │    200      │    200      │
│   [Card]    │   [Card]    │   [Card]    │   [Card]    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    300      │    300      │    300      │    300      │
│   [Card]    │   [Card]    │   [Card]    │   [Card]    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    400      │    400      │    400      │    400      │
│   [Card]    │   [Card]    │   [Card]    │   [Card]    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    500      │    500      │    500      │    500      │
│   [Card]    │   [Card]    │   [Card]    │   [Card]    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Card States
- **Available**: Blue/Neutral background, clickable, hover effect
- **Selected** (by host): Yellow/Orange highlight, shows "Selected"
- **Answered**: Grayed out, shows checkmark ✓
- **Hover**: Slight elevation/shadow

#### Card Interaction
- **Host clicks card** → Card highlights, question preview appears in right panel
- **Host clicks "Reveal Question"** → Question revealed to all screens
- **After reveal** → Buzzer enabled, contestants can buzz in

### 4. Right Panel - Top Section: Current Question

#### Question Preview (Before Reveal)
```
┌─────────────────────────────────────┐
│  Selected Question                  │
├─────────────────────────────────────┤
│  Category: Science                  │
│  Points: 300                        │
│                                     │
│  Question:                          │
│  What is the speed of light?        │
│                                     │
│  Answer: 299,792,458 m/s            │
│                                     │
│  [Reveal Question]                  │
│  (Shows question to all screens)    │
└─────────────────────────────────────┘
```

#### Question Display (After Reveal)
```
┌─────────────────────────────────────┐
│  Current Question                   │
├─────────────────────────────────────┤
│  Category: Science | 300 points    │
│                                     │
│  What is the speed of light?        │
│                                     │
│  ✓ Question Revealed                │
└─────────────────────────────────────┘
```

### 5. Right Panel - Middle Section: Buzzer Queue

```
┌─────────────────────────────────────┐
│  Buzzer Queue                       │
├─────────────────────────────────────┤
│  🟢 1. John Doe (Answering)        │
│  ⚪ 2. Jane Smith                   │
│  ⚪ 3. Bob Johnson                  │
└─────────────────────────────────────┘
```

**Features:**
- Shows contestants who buzzed in (fastest first)
- Current answering contestant highlighted in green
- Updates in real-time
- Shows "No one has buzzed in yet" when empty

### 6. Right Panel - Bottom Section: Answer Controls

```
┌─────────────────────────────────────┐
│  Answering: John Doe                │
│                                     │
│  [✓ Correct]  [✗ Incorrect]        │
└─────────────────────────────────────┘
```

**Features:**
- Shows current answering contestant name
- **Correct Button**: Awards points, plays victory sound, shows photo
- **Incorrect Button**: Moves to next in queue, no points awarded
- Only visible when someone is answering

### 7. Right Panel - Bottom Section: Leaderboard

```
┌─────────────────────────────────────┐
│  Leaderboard                        │
├─────────────────────────────────────┤
│  🥇 John Doe        500 pts         │
│  🥈 Jane Smith      300 pts         │
│  🥉 Bob Johnson     200 pts         │
│     Alice Brown     100 pts         │
└─────────────────────────────────────┘
```

**Features:**
- Shows all contestants with photos
- Top 3 get medals (🥇🥈🥉)
- Updates in real-time after each answer
- Sorted by score (highest first)

---

## 🔄 Game Flow

### Initial State
1. Host navigates to `/host/game`
2. Game status: "Waiting"
3. Quiz grid displayed
4. No question selected

### Question Selection & Reveal
1. **Contestant verbally says**: "Category 1, 300 points"
2. **Host clicks** on that card in the grid
3. Card highlights (selected state)
4. Question preview appears in right panel
5. Host reviews question and answer
6. Host clicks **"Reveal Question"** button
7. Question appears on:
   - Main monitor
   - All contestant screens
8. Buzzer system enabled

### Buzzer & Answering
1. Contestants press **spacebar** to buzz in
2. Host sees buzzer queue update in real-time
3. First contestant highlighted (currently answering)
4. Contestant answers **verbally**
5. Host clicks **"Correct"** or **"Incorrect"**

### After Answer
**If Correct:**
- Points awarded to contestant
- Victory sound plays (if not muted)
- Contestant photo shown on main monitor with points earned
- Leaderboard updates
- After 3 seconds, leaderboard shown on main monitor
- Question card marked as answered

**If Incorrect:**
- No points awarded
- Next contestant in queue becomes current
- Process repeats until correct answer or queue empty
- If queue empty, question remains available

### Repeat
- Process repeats for each question
- Game continues until all questions answered
- Host can pause/resume at any time

---

## 🎨 Design Specifications

### Color Scheme
- **Primary**: Blue/Indigo (for actions)
- **Success**: Green (correct answers, active buzzer)
- **Danger**: Red (incorrect answers)
- **Warning**: Yellow/Orange (selected questions)
- **Neutral**: Gray (answered questions, inactive)

### Typography
- **Headers**: Bold, larger font
- **Body**: Regular, readable
- **Scores**: Large, prominent
- **Labels**: Small, muted

### Spacing & Layout
- **Padding**: Consistent 16px/24px
- **Card spacing**: 8px gaps
- **Section spacing**: 24px between sections
- **Border radius**: 8px for cards, 12px for panels

### Interactive Elements
- **Buttons**: Clear hover states, disabled states
- **Cards**: Hover elevation, click feedback
- **Status indicators**: Color-coded badges
- **Real-time updates**: Smooth transitions

---

## 📱 Responsive Considerations

- **Desktop**: Full layout as described
- **Tablet**: Stack panels vertically if needed
- **Mobile**: Single column, collapsible sections (not recommended for game control)

---

## 🎯 Key Components Needed (All Pages)

### Quiz Setup Page
1. **QuizSelector** - Dropdown to select existing quizzes
2. **QuizForm** - Form for quiz name
3. **CategoryList** - List of categories
4. **CategoryItem** - Individual category with questions
5. **QuestionList** - List of questions within category
6. **QuestionItem** - Question form (points, question, answer)
7. **QuizActions** - Save/Cancel buttons

### Contestant Setup Page
1. **GameSelector** - Select/create game
2. **QuizSelector** - Select quiz for game
3. **ContestantList** - List of contestants
4. **ContestantCard** - Individual contestant form
5. **PhotoUpload** - File upload with preview
6. **ContestantActions** - Add/Save buttons

### Host Control Panel
1. **GameInfo** - Game/Quiz name display
2. **GameControls** - Pause/Resume/Reset buttons
3. **MainMonitorControls** - Hot buttons for main monitor
4. **QuizGrid** - Grid of category/point cards
5. **QuestionPreview** - Shows question before reveal
6. **QuestionDisplay** - Shows current question
7. **BuzzerQueue** - Shows who buzzed in
8. **AnswerControls** - Correct/Incorrect buttons
9. **Leaderboard** - Score rankings

---

## 💡 Additional Features (Optional)

- **Sound toggle** - Enable/disable victory sounds
- **Question timer** - Optional countdown (future)
- **Statistics** - Show game stats
- **Export results** - Download game results
- **Fullscreen mode** - For main monitor preview
- **Quiz templates** - Pre-made quiz templates
- **Bulk question import** - Import questions from CSV/JSON

---

## 🔗 Navigation Flow

```
Setup Phase:
1. /host/quizzes → Create quiz templates (one-time)
2. /host/setup → Select quiz → Create game → Add contestants
3. /host/game → Play the game

During Game:
/host/game → Control game, manage buzzer, score answers

After Game:
/host/game → View results, reset, or go to /host/setup to create new game
```

## 💡 Key Concepts (Simplified)

**Quiz vs Game:**
- **Quiz** = Template (like a recipe) - Created once, reused
- **Game** = Instance (like a meal made from recipe) - Created from Quiz, has contestants

**Contestants:**
- Belong to a **Game**, not a Quiz
- Each Game has its own set of contestants
- Can create multiple Games from same Quiz with different contestants

---

**This structure separates concerns:**
- ✅ Quiz configuration is separate and reusable
- ✅ Contestant setup is separate and game-specific
- ✅ Game control is focused on running the game
- ✅ Clear navigation between setup and gameplay
