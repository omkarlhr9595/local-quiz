# Technical Requirements - Questions

## 🖥️ Backend & Server

1. **Backend Framework**: What do you prefer?
   - Node.js with Express
   - Node.js with Fastify
   - Python (FastAPI/Flask)
   - Other?

2. **WebSocket Library**: Socket.io was mentioned - is this your preference?
   - Socket.io (most popular, easy to use)
   - ws (lightweight, native WebSocket)
   - Other?

3. **Database/Storage**: How should we store quiz data and game state?
   - In-memory (Redis) - fast, but lost on restart
   - File-based (JSON files) - simple, persistent
   - SQLite - lightweight database
   - PostgreSQL/MongoDB - full database
   - No database - all in memory with Socket.io rooms

4. **Photo Storage**: How should we handle contestant photos?
   - Local file system (save to `uploads/` folder)
   - Cloud storage (AWS S3, Cloudinary, etc.)
   - Base64 encoding (store in memory/database)
   - Temporary storage (cleared after game)

---

## 🎨 Frontend (Already have React + TypeScript + Vite)

5. **Routing**: What routing library?
   - React Router (most common)
   - TanStack Router (type-safe, mentioned in Vite options)
   - Other?

6. **State Management**: How to manage global state?
   - React Context API
   - Zustand (lightweight)
   - Redux Toolkit
   - Just props + Socket.io events (no global state)

7. **Styling**: What styling approach?
   - CSS Modules
   - Tailwind CSS (utility-first)
   - Styled Components
   - Plain CSS
   - CSS-in-JS (emotion, etc.)

8. **UI Components**: Build from scratch or use a library?
   - Build custom components
   - Use a component library (Material-UI, Chakra UI, shadcn/ui, etc.)

---

## 🏗️ Architecture

9. **Project Structure**: Monorepo or separate repos?
   - Monorepo (frontend + backend in same repo)
   - Separate repos (frontend and backend)
   - Single app (frontend only, backend as separate service)

10. **API Structure**: REST + WebSockets or WebSockets only?
    - WebSockets only (Socket.io handles everything)
    - REST API + WebSockets (REST for setup, WebSockets for real-time)
    - GraphQL + WebSockets

11. **Environment**: Development vs Production
    - Local development only?
    - Need deployment (Vercel, Netlify, Railway, etc.)?
    - Self-hosted?

---

## 🔧 Development Tools

12. **Testing**: Do you want testing setup?
    - Yes (Jest, Vitest, React Testing Library)
    - No (skip for now)

13. **Code Quality**: Linting and formatting?
    - Already have ESLint - keep it?
    - Add Prettier?
    - Add TypeScript strict mode?

14. **Build & Deploy**: Deployment requirements?
    - Docker containerization?
    - CI/CD pipeline?
    - Manual deployment?

---

## 🎯 Priority Questions

**Most Important to Answer First:**
1. Backend framework choice (affects entire architecture)
2. Database/storage approach (affects data persistence)
3. Photo storage method (affects file handling)
4. Project structure (monorepo vs separate)

**Can be decided later:**
- Styling approach
- UI component library
- Testing setup

---

Please answer the questions above so we can finalize the technical stack! 🚀

