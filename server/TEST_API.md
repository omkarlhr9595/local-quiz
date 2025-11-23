# API Testing Guide

## Quick Test Script

Run the automated test script:
```bash
cd server
./test-api.sh
```

**Note:** Requires `jq` for JSON formatting. Install with `brew install jq` (macOS) or your package manager.

---

## Manual Testing with curl

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Create Quiz
```bash
curl -X POST http://localhost:3001/api/quizzes \
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
      }
    ]
  }'
```

Save the `id` from the response for next steps.

### 3. Get Quiz by ID
```bash
curl http://localhost:3001/api/quizzes/{QUIZ_ID}
```

### 4. Get All Quizzes
```bash
curl http://localhost:3001/api/quizzes
```

### 5. Create Game
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{"quizId": "{QUIZ_ID}"}'
```

Save the `id` from the response.

### 6. Get Game by ID
```bash
curl http://localhost:3001/api/games/{GAME_ID}
```

### 7. Create Contestant (with photo)
```bash
curl -X POST http://localhost:3001/api/contestants \
  -F "name=John Doe" \
  -F "gameId={GAME_ID}" \
  -F "route=/contestant1" \
  -F "photo=@/path/to/photo.jpg"
```

**Note:** Replace `/path/to/photo.jpg` with an actual image file path.

### 8. Get Contestants by Game ID
```bash
curl "http://localhost:3001/api/contestants?gameId={GAME_ID}"
```

### 9. Pause Game
```bash
curl -X PUT http://localhost:3001/api/games/{GAME_ID}/pause \
  -H "Content-Type: application/json" \
  -d '{"paused": true}'
```

### 10. Resume Game
```bash
curl -X PUT http://localhost:3001/api/games/{GAME_ID}/pause \
  -H "Content-Type: application/json" \
  -d '{"paused": false}'
```

### 11. Reset Game
```bash
curl -X PUT http://localhost:3001/api/games/{GAME_ID}/reset
```

---

## Testing with Postman

1. Import the collection (if available)
2. Set base URL: `http://localhost:3001/api`
3. Test endpoints in order:
   - Health check
   - Create quiz
   - Get quiz
   - Create game
   - Create contestant (with photo)
   - Game controls

---

## Expected Responses

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Common Issues

1. **404 Not Found**: Check the endpoint URL and ensure server is running
2. **400 Bad Request**: Verify request body matches expected format
3. **500 Internal Server Error**: Check server logs for details
4. **Photo Upload Fails**: Ensure file exists and is a valid image (JPEG, PNG, etc.)

---

**Happy Testing! 🚀**

