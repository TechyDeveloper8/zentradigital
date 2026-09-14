import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Database connection and schema
import db from './db/database.js';

// Initialize WebSocket hub
import { initWebSocketServer } from './websocket.js';

// Import Route Handlers
import authRouter from './routes/auth.js';
import orgRouter from './routes/organization.js';
import employeesRouter from './routes/employees.js';
import attendanceRouter from './routes/attendance.js';
import dailyReportsRouter from './routes/dailyReports.js';
import leadsRouter from './routes/leads.js';
import proposalsRouter from './routes/proposals.js';
import clientsRouter from './routes/clients.js';
import servicesRouter from './routes/services.js';
import projectsRouter from './routes/projects.js';
import workflowsRouter from './routes/workflows.js';
import tasksRouter from './routes/tasks.js';
import contentCalendarRouter from './routes/contentCalendar.js';
import creativesRouter from './routes/creatives.js';
import reviewsRouter from './routes/reviews.js';
import clientRequestsRouter from './routes/clientRequests.js';
import dailyUpdatesRouter from './routes/dailyUpdates.js';
import chatsRouter from './routes/chats.js';
import notificationsRouter from './routes/notifications.js';
import filesRouter from './routes/files.js';
import campaignsRouter from './routes/campaigns.js';
import performanceRouter from './routes/performance.js';
import reportsRouter from './routes/reports.js';
import billingRouter from './routes/billing.js';
import auditLogsRouter from './routes/auditLogs.js';
import searchRouter from './routes/search.js';
import salesRouter from './routes/sales.js';
import meetingsRouter from './routes/meetings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api/organization', orgRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/daily-reports', dailyReportsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/content-calendar', contentCalendarRouter);
app.use('/api/creatives', creativesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/client-requests', clientRequestsRouter);
app.use('/api/daily-updates', dailyUpdatesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/files', filesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/search', searchRouter);
app.use('/api/sales', salesRouter);
app.use('/api/meetings', meetingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Zentra Digital Agency ERP' });
});

// Centralized Error Handling (Section 63 - Never show raw SQL/stack traces to client)
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred. Please verify your request or contact system administrator.'
  });
});

// Attach WebSocket Server
initWebSocketServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Zentra Server] Running on http://localhost:${PORT}`);
  console.log(`[Zentra WebSocket] Active on ws://localhost:${PORT}/ws`);
});
