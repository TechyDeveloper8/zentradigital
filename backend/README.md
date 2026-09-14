# ⚙️ Zentra Digital - Backend API & Real-Time Server

REST API and WebSocket server built with Node.js, Express, better-sqlite3, and ws.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
- `PORT=5000`
- `JWT_SECRET=zentra-enterprise-jwt-secret-key-2026`

### 3. Run Server
- **Development (with auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

API Health check: `http://localhost:5000/api/health`  
WebSocket hub: `ws://localhost:5000/ws`

## 📁 Key Folders
- `db/`: SQLite database initialization, automated table creation, and seed data.
- `middleware/`: Authentication and role authorization guards.
- `routes/`: Modular endpoints (auth, clients, employees, tasks, projects, campaigns, sales, etc.).
- `uploads/`: Static storage for uploaded user attachments.
