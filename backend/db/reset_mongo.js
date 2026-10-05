import 'dotenv/config';
import { connectDB } from './mongodb.js';
import { initSystemRoles } from './init_roles.js';
import {
  AttendanceRecord,
  Lead,
  Proposal,
  Meeting,
  SalesTask,
  ClientHandover,
  Project,
  Task,
  FileMetadata,
  ContentItem,
  ContentReview,
  ContentPerformance,
  ClientRequest,
  DailyWorkReport,
  DailyClientUpdate,
  Chat,
  ChatMessage,
  Notification,
  Contract,
  Invoice,
  Payment,
  WorkflowHistory,
  AuditLog,
  Client,
  ClientService,
  ClientReport,
  Campaign,
  User,
  Employee
} from '../models/index.js';

async function resetToFresh() {
  try {
    await connectDB();
    console.log('🧹 Purging operational and seed data from MongoDB collections...');

    await Promise.all([
      AttendanceRecord.deleteMany({}),
      Lead.deleteMany({}),
      Proposal.deleteMany({}),
      Meeting.deleteMany({}),
      SalesTask.deleteMany({}),
      ClientHandover.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      FileMetadata.deleteMany({}),
      ContentItem.deleteMany({}),
      ContentReview.deleteMany({}),
      ContentPerformance.deleteMany({}),
      ClientRequest.deleteMany({}),
      DailyWorkReport.deleteMany({}),
      DailyClientUpdate.deleteMany({}),
      Chat.deleteMany({}),
      ChatMessage.deleteMany({}),
      Notification.deleteMany({}),
      Contract.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      WorkflowHistory.deleteMany({}),
      AuditLog.deleteMany({}),
      Client.deleteMany({}),
      ClientService.deleteMany({}),
      ClientReport.deleteMany({}),
      Campaign.deleteMany({}),
      Employee.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('✨ All dummy and operational data purged.');
    console.log('🌱 Initializing clean RBAC system roles...');
    await initSystemRoles();
    console.log('✅ MongoDB database is completely clean and ready for real-time operations!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetToFresh();
