# 🚀 Zentra Digital - Deployment & Hosting Guide

This guide explains how to upload, host, and deploy both the **Frontend** and **Backend** of the Zentra Digital website and ERP system.

---

## 📁 Repository Structure Overview

```
zentra/
├── frontend/                     # React + Vite Single Page Application
│   ├── public/                   # Static assets, sitemap, robots.txt, icons
│   ├── src/                      # React UI, components, pages, portals
│   ├── index.html                # Main HTML entry point
│   ├── vite.config.js            # Build & proxy configuration
│   ├── package.json              # Frontend dependencies
│   ├── .env.example              # Frontend environment variables template
│   └── README.md                 # Frontend-specific documentation
│
├── backend/                      # Node.js + Express + SQLite + WebSocket Server
│   ├── db/                       # Database schema, seed data, and connection
│   ├── middleware/               # Authentication & role guard middleware
│   ├── routes/                   # REST API routes (CRM, ERP, Sales, Billing, etc.)
│   ├── uploads/                  # Upload directory for project files & assets
│   ├── server.js                 # Express server & API routes
│   ├── websocket.js              # Real-time WebSocket server
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Backend environment variables template
│   └── README.md                 # Backend-specific documentation
│
├── package.json                  # Workspace orchestrator (runs both or either)
├── .gitignore                    # Excludes node_modules, build outputs, and credentials
├── DEPLOYMENT_GUIDE.md           # This deployment & hosting guide
└── README.md                     # Project overview and local quickstart
```

---

## ⚡ Local Development Quickstart

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or install individually: `cd frontend && npm install` and `cd backend && npm install`)*

### 2. Start Both Servers with One Command
From the repository root:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **WebSocket**: ws://localhost:5000/ws
- **Hidden Portal Login URL**: http://localhost:5173/login

---

## 🌐 Deployment Options

### Option 1: Modern Cloud Deployment (Recommended - Free / Low Cost)

#### Part A: Deploy Backend to Render (or Railway / DigitalOcean App Platform)
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com) (or Railway).
3. Click **New +** → **Web Service**.
4. Connect your repository.
5. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `JWT_SECRET`: A secure random string (e.g. `your-random-production-jwt-key`)
7. Click **Deploy**.
8. Copy your live backend URL (e.g., `https://zentra-backend.onrender.com`).

#### Part B: Deploy Frontend to Vercel (or Netlify / Cloudflare Pages)
1. Sign in to [Vercel](https://vercel.com) (or Netlify).
2. Click **Add New...** → **Project** and select this repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://zentra-backend.onrender.com/api` (your backend URL from Part A)
   - `VITE_WS_URL`: `wss://zentra-backend.onrender.com/ws` (WebSocket URL from Part A)
5. Click **Deploy**. Your website is live worldwide on high-speed CDN!

---

### Option 2: Upload to cPanel / Shared Hosting

#### 1. Upload the Frontend (Static Files)
1. On your local machine, run:
   ```bash
   npm run build
   ```
2. Open the newly generated `frontend/dist` folder.
3. In your cPanel:
   - Open **File Manager** → navigate to `public_html/`.
   - Upload all contents inside `frontend/dist/` (including `assets/` and `index.html`).
4. To allow React client-side routing on Apache/cPanel, create or verify `.htaccess` in `public_html/`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

#### 2. Set Up the Backend on cPanel (Node.js App)
1. In cPanel, find **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: 20.x or higher
   - **Application root**: `backend`
   - **Application startup file**: `server.js`
3. Upload the contents of the `backend/` folder to that directory.
4. Click **Run NPM Install** in cPanel.
5. In **Environment variables**, set `PORT` and `JWT_SECRET`.
6. Start the Node.js application.

---

### Option 3: Single VPS / Cloud Server (Ubuntu / Debian / Nginx)

If hosting both on a VPS (such as DigitalOcean, AWS EC2, or Linode):

1. **Clone the repo on your server**:
   ```bash
   git clone https://github.com/TechyDeveloper8/zentradigital.git
   cd zentradigital
   npm run install:all
   npm run build
   ```

2. **Start Backend with PM2**:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name zentra-backend
   pm2 save
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend static files
       location / {
           root /var/www/zentradigital/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       # WebSocket proxy
       location /ws {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

---

## 🔒 Portal Access Note

The internal portal login button has been hidden from the public front navigation as requested. 

Authorized users, administrators, and clients can access the portal directly at:
```
http://yourdomain.com/login
```
