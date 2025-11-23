#!/bin/bash

# API Testing Script
BASE_URL="http://localhost:3001/api"

echo "🧪 Testing REST API Endpoints"
echo "================================"
echo ""

# Test Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""
echo "---"
echo ""

# Test Create Quiz
echo "2. Testing Create Quiz..."
QUIZ_RESPONSE=$(curl -s -X POST "$BASE_URL/quizzes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Quiz",
    "categories": [
      {
        "name": "Science",
        "questions": [
          {"points": 100, "question": "What is 2+2?", "answer": "4"},
          {"points": 200, "question": "What is the capital of France?", "answer": "Paris"}
        ]
      },
      {
        "name": "History",
        "questions": [
          {"points": 100, "question": "Who wrote Romeo and Juliet?", "answer": "Shakespeare"},
          {"points": 200, "question": "In which year did WWII end?", "answer": "1945"}
        ]
      }
    ]
  }')

echo "$QUIZ_RESPONSE" | jq .
QUIZ_ID=$(echo "$QUIZ_RESPONSE" | jq -r '.data.id // empty')
echo ""
echo "Quiz ID: $QUIZ_ID"
echo "---"
echo ""

if [ -z "$QUIZ_ID" ] || [ "$QUIZ_ID" = "null" ]; then
  echo "❌ Failed to create quiz. Exiting."
  exit 1
fi

# Test Get Quiz
echo "3. Testing Get Quiz by ID..."
curl -s "$BASE_URL/quizzes/$QUIZ_ID" | jq .
echo ""
echo "---"
echo ""

# Test Get All Quizzes
echo "4. Testing Get All Quizzes..."
curl -s "$BASE_URL/quizzes" | jq .
echo ""
echo "---"
echo ""

# Test Create Game
echo "5. Testing Create Game..."
GAME_RESPONSE=$(curl -s -X POST "$BASE_URL/games" \
  -H "Content-Type: application/json" \
  -d "{\"quizId\": \"$QUIZ_ID\"}")

echo "$GAME_RESPONSE" | jq .
GAME_ID=$(echo "$GAME_RESPONSE" | jq -r '.data.id // empty')
echo ""
echo "Game ID: $GAME_ID"
echo "---"
echo ""

if [ -z "$GAME_ID" ] || [ "$GAME_ID" = "null" ]; then
  echo "❌ Failed to create game. Exiting."
  exit 1
fi

# Test Get Game
echo "6. Testing Get Game by ID..."
curl -s "$BASE_URL/games/$GAME_ID" | jq .
echo ""
echo "---"
echo ""

# Test Create Contestant (without photo for now)
echo "7. Testing Create Contestant..."
echo "Note: Photo upload requires multipart/form-data. Testing basic creation..."
echo "For photo upload, use:"
echo "curl -X POST \"$BASE_URL/contestants\" -F \"name=John Doe\" -F \"gameId=$GAME_ID\" -F \"route=/contestant1\" -F \"photo=@/path/to/photo.jpg\""
echo ""
echo "---"
echo ""

# Test Pause Game
echo "8. Testing Pause Game..."
curl -s -X PUT "$BASE_URL/games/$GAME_ID/pause" \
  -H "Content-Type: application/json" \
  -d '{"paused": true}' | jq .
echo ""
echo "---"
echo ""

# Test Resume Game
echo "9. Testing Resume Game..."
curl -s -X PUT "$BASE_URL/games/$GAME_ID/pause" \
  -H "Content-Type: application/json" \
  -d '{"paused": false}' | jq .
echo ""
echo "---"
echo ""

# Test Reset Game
echo "10. Testing Reset Game..."
curl -s -X PUT "$BASE_URL/games/$GAME_ID/reset" | jq .
echo ""
echo "---"
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "Created Resources:"
echo "  Quiz ID: $QUIZ_ID"
echo "  Game ID: $GAME_ID"

