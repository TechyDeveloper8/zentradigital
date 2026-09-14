# 🌐 Zentra Digital - Fullstack Website & Enterprise ERP Portal

Modern, agency website and internal business operating system organized in clean **Frontend** and **Backend** directories for easy development, management, and hosting.

---

## 📂 Architecture

```
zentra/
├── frontend/        # React 19 + Vite Single Page Application (Marketing & Portals)
├── backend/         # Express + SQLite + WebSocket REST & Realtime API Server
├── package.json     # Root orchestrator with simultaneous dev & build scripts
├── DEPLOYMENT_GUIDE.md # Complete hosting instructions (Vercel, Netlify, Render, cPanel, VPS)
└── README.md        # This file
```

---

## ⚡ Quickstart

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Run both Frontend & Backend
```bash
npm run dev
```
- **Public Website**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Portal Login (Internal)**: [http://localhost:5173/login](http://localhost:5173/login)

### 3. Dedicated Scripts
- `npm run dev:frontend` - Run only the frontend
- `npm run dev:backend` - Run only the backend
- `npm run build` - Compile the frontend for production

---

## 🚀 Deployment & Uploading
For step-by-step instructions on uploading and deploying to **Vercel**, **Netlify**, **Render**, **Railway**, **cPanel**, or **VPS**, see the complete **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.
