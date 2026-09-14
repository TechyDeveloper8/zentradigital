# 💻 Zentra Digital - Frontend

High-performance React single-page application built with Vite, Tailwind-compatible styling, Lucide icons, and Three.js 3D interactive experiences.

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
- For local development with backend proxy on port 5000, the default `/api` works out of the box.
- For separate hosting (e.g. Vercel frontend + Render backend), set:
  ```env
  VITE_API_BASE_URL=https://your-backend.onrender.com/api
  VITE_WS_URL=wss://your-backend.onrender.com/ws
  ```

### 3. Run Development Server
```bash
npm run dev
```
Accessible at: `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```
Build files will be generated in `dist/`, ready to upload to any static hosting service (Vercel, Netlify, Cloudflare Pages, S3, or cPanel `public_html`).

## 📁 Key Folders
- `src/components/`: Reusable marketing website sections (Hero, About, Services, CaseStudies, etc.).
- `src/portals/`: Role-based portals (Admin, Client, Employee, Sales).
- `src/context/`: Authentication (`AuthContext`) and Real-time WebSockets (`SocketContext`).
- `src/api/`: Centralized HTTP fetch client (`client.js`) with JWT bearer tokens.
