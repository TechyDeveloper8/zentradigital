# ⚙️ Zentra Digital - Backend API & Real-Time Server

REST API and WebSocket server built with Node.js, Express, MongoDB (Mongoose), and ws.

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
- `MONGODB_URI=mongodb://127.0.0.1:27017/zentra_digital` (or your MongoDB Atlas connection URI)

### 3. Database Seed & Reset
- **Seed Default System Roles & Persona Accounts**:
  ```bash
  npm run seed:mongo
  ```
- **Reset to Clean Fresh Database**:
  ```bash
  npm run reset:mongo
  ```

### 4. Run Server
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
- `models/`: Mongoose ODM schemas for all 33 collections (Organization, User, Employee, Client, Lead, Task, etc.).
- `db/`: MongoDB connection setup (`mongodb.js`), database helpers (`helpers.js`), seeding (`seed_mongo.js`), and database reset (`reset_mongo.js`).
- `middleware/`: Authentication and role authorization guards.
- `routes/`: Modular REST endpoints (auth, clients, employees, tasks, projects, campaigns, sales, media, etc.).
- `uploads/`: Static storage for uploaded user attachments and creatives.


