import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'zentra.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign key constraints
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Seed default roles and permissions
function seedDefaults() {
  const defaultRoles = [
    { name: 'admin', display_name: 'Administrator', description: 'Full administrative and operational access', is_system: 1 },
    { name: 'sales', display_name: 'Sales Executive', description: 'Lead generation, follow-ups, and sales proposals', is_system: 1 },
    { name: 'marketing_manager', display_name: 'Marketing & Social Media Manager', description: 'Client strategy, content calendar, and campaign approvals', is_system: 1 },
    { name: 'editor', display_name: 'Editor / Creative Team', description: 'Creative production, video editing, and version uploads', is_system: 1 },
    { name: 'client', display_name: 'Client', description: 'Client portal access for reviews, approvals, and requests', is_system: 1 }
  ];

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (name, display_name, description, is_system)
    VALUES (@name, @display_name, @description, @is_system)
  `);

  for (const role of defaultRoles) {
    insertRole.run(role);
  }

  // Seed default workflow
  const defaultWorkflowCount = db.prepare('SELECT COUNT(*) as count FROM workflows').get();
  if (defaultWorkflowCount.count === 0) {
    const insertWorkflow = db.prepare('INSERT INTO workflows (name, description, is_default) VALUES (?, ?, 1)');
    const info = insertWorkflow.run('Standard Digital Marketing Agency Workflow', 'Default production and client review lifecycle');
    const wfId = info.lastInsertRowid;

    const stages = [
      { key: 'INBOX', label: 'Inbox / Idea', order: 1, color: '#94A3B8', client: 0 },
      { key: 'PLANNING', label: 'Planning', order: 2, color: '#64748B', client: 0 },
      { key: 'CONTENT_CREATED', label: 'In Production', order: 3, color: '#3B82F6', client: 0 },
      { key: 'INTERNAL_REVIEW', label: 'Internal Review', order: 4, color: '#F59E0B', client: 0 },
      { key: 'CLIENT_REVIEW', label: 'Client Review', order: 5, color: '#8B5CF6', client: 1 },
      { key: 'REVISION', label: 'Revision', order: 6, color: '#EC4899', client: 1 },
      { key: 'APPROVED', label: 'Approved', order: 7, color: '#10B981', client: 1 },
      { key: 'SCHEDULED', label: 'Scheduled', order: 8, color: '#06B6D4', client: 1 },
      { key: 'PUBLISHED', label: 'Published', order: 9, color: '#059669', client: 1 },
      { key: 'COMPLETED', label: 'Completed', order: 10, color: '#10B981', client: 1 }
    ];

    const insertStage = db.prepare(`
      INSERT INTO workflow_stages (workflow_id, stage_key, stage_label, order_index, color, client_visible)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const s of stages) {
      insertStage.run(wfId, s.key, s.label, s.order, s.color, s.client);
    }
  }

  // Seed default departments
  const defaultDepts = [
    { name: 'Management', description: 'Executive and agency leadership' },
    { name: 'Sales & Growth', description: 'Lead acquisition and client onboarding' },
    { name: 'Digital Strategy', description: 'Marketing strategy, campaigns, and account management' },
    { name: 'Creative & Video Production', description: 'Graphic design, video editing, and motion graphics' },
    { name: 'Finance & Operations', description: 'Billing, invoicing, and agency operations' }
  ];

  const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)');
  for (const d of defaultDepts) {
    const exists = db.prepare('SELECT id FROM departments WHERE name = ?').get(d.name);
    if (!exists) {
      insertDept.run(d.name, d.description);
    }
  }

  // Check if admin user exists; if not, create initial system admin
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@123', salt);

    const insertOrg = db.prepare(`
      INSERT INTO organizations (name, legal_name, email, phone, website, city, state, country)
      VALUES ('Zentra Digital Agency', 'Zentra Digital Private Limited', 'contact@zentradigital.com', '+91 9876543210', 'https://zentradigital.com', 'Mumbai', 'Maharashtra', 'India')
    `);
    const orgInfo = insertOrg.run();
    const orgId = orgInfo.lastInsertRowid;

    db.prepare(`
      INSERT INTO system_settings (org_id) VALUES (?)
    `).run(orgId);

    const insertUser = db.prepare(`
      INSERT INTO users (org_id, username, email, password_hash, role_id, user_type, is_active)
      VALUES (?, 'admin', 'admin@zentradigital.com', ?, ?, 'admin', 1)
    `);
    const adminUserInfo = insertUser.run(orgId, hash, adminRole.id);
    const adminUserId = adminUserInfo.lastInsertRowid;

    const mgmtDept = db.prepare('SELECT id FROM departments WHERE name = ?').get('Management');

    db.prepare(`
      INSERT INTO employees (
        user_id, org_id, employee_code, first_name, last_name, phone, department_id,
        designation, employee_type, date_of_joining, employment_status
      ) VALUES (
        ?, ?, 'EMP-001', 'Agency', 'Administrator', '+91 9876543210', ?,
        'Managing Director', 'Management', DATE('now'), 'Active'
      )
    `).run(adminUserId, orgId, mgmtDept ? mgmtDept.id : null);
  }

  // Seed default persona accounts if not already present
  const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  const orgId = org ? org.id : 1;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('Admin@123', salt);

  const personaAccounts = [
    { username: 'rahul.sales', email: 'rahul@zentradigital.com', role: 'sales', type: 'employee', first: 'Rahul', last: 'Sharma', code: 'EMP-002', dept: 'Sales & Growth', desig: 'Senior Sales Executive' },
    { username: 'priya.marketing', email: 'priya@zentradigital.com', role: 'marketing_manager', type: 'employee', first: 'Priya', last: 'Verma', code: 'EMP-003', dept: 'Digital Strategy', desig: 'Lead Marketing Strategist' },
    { username: 'aman.editor', email: 'aman@zentradigital.com', role: 'editor', type: 'employee', first: 'Aman', last: 'Kapoor', code: 'EMP-004', dept: 'Creative & Video Production', desig: 'Senior Video Editor' },
    { username: 'client_demo', email: 'client@zenithbrand.com', role: 'client', type: 'client', first: 'Vikram', last: 'Malhotra', code: 'CL-DEMO-01', clientCompany: 'Zenith Luxury Brand' }
  ];

  for (const p of personaAccounts) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(p.username);
    if (!existing) {
      const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(p.role);
      if (roleRow) {
        const uInfo = db.prepare(`
          INSERT INTO users (org_id, username, email, password_hash, role_id, user_type, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(orgId, p.username, p.email, hash, roleRow.id, p.type);
        const uId = uInfo.lastInsertRowid;

        if (p.type === 'employee') {
          const dRow = db.prepare('SELECT id FROM departments WHERE name = ?').get(p.dept);
          db.prepare(`
            INSERT INTO employees (
              user_id, org_id, employee_code, first_name, last_name, phone, department_id,
              designation, employee_type, date_of_joining, employment_status
            ) VALUES (
              ?, ?, ?, ?, ?, '+91 9876543211', ?,
              ?, ?, DATE('now'), 'Active'
            )
          `).run(uId, orgId, p.code, p.first, p.last, dRow ? dRow.id : null, p.desig, p.role);
        } else if (p.type === 'client') {
          db.prepare(`
            INSERT INTO clients (
              user_id, client_code, company_name, primary_contact_name, primary_contact_phone, primary_contact_email, status, start_date
            ) VALUES (
              ?, ?, ?, ?, '+91 9988776655', ?, 'ACTIVE', DATE('now')
            )
          `).run(uId, p.code, p.clientCompany, `${p.first} ${p.last}`, p.email);
        }
      }
    }
  }
}

seedDefaults();

// Sales CRM Schema Migration & Enhancement
function migrateSalesSchema() {
  // Ensure tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      performed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      meeting_date DATE NOT NULL,
      meeting_time TEXT NOT NULL,
      meeting_type TEXT NOT NULL CHECK(meeting_type IN ('Phone', 'Video Call', 'Office Meeting', 'Client Location', 'Other')),
      meeting_link TEXT,
      location TEXT,
      participants TEXT,
      agenda TEXT,
      notes TEXT,
      reminder INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO SHOW')),
      assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_handovers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      sales_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      marketing_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      account_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      client_requirements TEXT,
      services_sold TEXT,
      pricing_terms TEXT,
      commitments TEXT,
      campaign_requirements TEXT,
      target_audience TEXT,
      important_dates TEXT,
      special_instructions TEXT,
      communication_preferences TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_REVIEW', 'ACCEPTED', 'COMPLETED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe ALTER TABLE for leads
  const leadCols = db.prepare('PRAGMA table_info(leads)').all().map(c => c.name);
  const leadAddCols = [
    { name: 'country', def: "TEXT DEFAULT 'India'" },
    { name: 'deal_value', def: 'REAL DEFAULT 0' },
    { name: 'lead_score', def: 'INTEGER DEFAULT 0' },
    { name: 'company_size', def: 'TEXT' },
    { name: 'product_service', def: 'TEXT' },
    { name: 'target_market', def: 'TEXT' },
    { name: 'target_location', def: 'TEXT' },
    { name: 'competitors', def: 'TEXT' },
    { name: 'current_marketing_method', def: 'TEXT' },
    { name: 'services_required', def: 'TEXT' },
    { name: 'main_business_problem', def: 'TEXT' },
    { name: 'desired_outcome', def: 'TEXT' },
    { name: 'existing_agency', def: 'TEXT' },
    { name: 'urgency', def: "TEXT DEFAULT 'Medium'" },
    { name: 'billing_type', def: "TEXT DEFAULT 'Monthly'" },
    { name: 'expected_contract_duration', def: 'TEXT' },
    { name: 'decision_maker', def: 'TEXT' },
    { name: 'purchase_timeline', def: 'TEXT' },
    { name: 'pricing_sensitivity', def: 'TEXT' },
    { name: 'qualification_status', def: "TEXT DEFAULT 'Pending'" },
    { name: 'qualification_data', def: 'TEXT' },
    { name: 'first_follow_up_date', def: 'DATE' },
    { name: 'stage_updated_at', def: 'DATETIME' }
  ];

  for (const col of leadAddCols) {
    if (!leadCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
        console.warn(`Column migration note for leads.${col.name}:`, e.message);
      }
    }
  }

  // Safe ALTER TABLE for proposals
  const propCols = db.prepare('PRAGMA table_info(proposals)').all().map(c => c.name);
  const propAddCols = [
    { name: 'proposal_title', def: 'TEXT' },
    { name: 'payment_terms', def: 'TEXT' },
    { name: 'contract_duration', def: 'TEXT' },
    { name: 'items_detail', def: 'TEXT' }
  ];

  for (const col of propAddCols) {
    if (!propCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE proposals ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
        console.warn(`Column migration note for proposals.${col.name}:`, e.message);
      }
    }
  }
}

migrateSalesSchema();

// Seed initial rich sales pipeline data if needed
function seedSalesPipeline() {
  const salesRep = db.prepare(`
    SELECT e.id, e.first_name, e.last_name, u.id as user_id
    FROM employees e
    JOIN users u ON e.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'sales'
    LIMIT 1
  `).get();

  const salesRepId = salesRep ? salesRep.id : 201;
  const adminUserId = 1;

  const currentCount = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  if (currentCount <= 2) {
    const sampleLeads = [
      {
        code: 'LEAD-2026-0101',
        company: 'Aura Aesthetics Clinic',
        contact: 'Dr. Radhika Sen',
        desig: 'Founder & Head Dermatologist',
        phone: '+91 98201 44552',
        whatsapp: '+91 98201 44552',
        email: 'dr.radhika@auraclinic.in',
        website: 'https://auraclinic.in',
        city: 'Mumbai',
        state: 'Maharashtra',
        source: 'Instagram',
        industry: 'Healthcare & Wellness',
        deal_value: 125000,
        lead_score: 85,
        priority: 'HIGH',
        status: 'QUALIFIED',
        urgency: 'High',
        services: JSON.stringify(['Social Media Management', 'Reels', 'Paid Advertising', 'SEO']),
        requirement: 'High-converting Instagram reels, Meta ads for bridal skincare packages, and local SEO ranking.',
        main_problem: 'Current in-house staff lacks creative direction and Meta ad ROAS is sub-1.8x.',
        budget_range: '₹1,00,000 - ₹1,50,000 / month',
        qualification_status: 'Qualified',
        qualification_data: JSON.stringify({ need: 'Patient acquisition & authority branding', budget_confirmed: true, authority: 'Yes, sole decision maker', timeline: 'Immediate' })
      },
      {
        code: 'LEAD-2026-0102',
        company: 'Kaviar Gourmet Coffee Co.',
        contact: 'Rohan Mehra',
        desig: 'Co-Founder & CMO',
        phone: '+91 98112 33441',
        whatsapp: '+91 98112 33441',
        email: 'rohan@kaviarcoffee.com',
        website: 'https://kaviarcoffee.com',
        city: 'Bengaluru',
        state: 'Karnataka',
        source: 'Website',
        industry: 'F&B E-commerce',
        deal_value: 220000,
        lead_score: 92,
        priority: 'URGENT',
        status: 'PROPOSAL',
        urgency: 'Immediate',
        services: JSON.stringify(['Content Creation', 'Paid Advertising', 'Video Editing', 'Website Management']),
        requirement: 'Scaling monthly Shopify D2C coffee bean orders from 4,000 units to 12,000 units.',
        main_problem: 'CAC is trending upwards on Meta; needs UGC creative lab and Google Shopping optimization.',
        budget_range: '₹2,00,000 - ₹2,50,000 / month',
        qualification_status: 'Qualified',
        qualification_data: JSON.stringify({ need: 'D2C scale & creative fatigue solution', budget_confirmed: true, authority: 'Both partners agree', timeline: 'Within 30 days' })
      },
      {
        code: 'LEAD-2026-0103',
        company: 'UrbanNest Modular Living',
        contact: 'Sunil Chhabra',
        desig: 'Managing Director',
        phone: '+91 98710 99881',
        whatsapp: '+91 98710 99881',
        email: 'sunil@urbannestindia.com',
        website: 'https://urbannestindia.com',
        city: 'Gurugram',
        state: 'Haryana',
        source: 'Google',
        industry: 'Real Estate & Interior Design',
        deal_value: 180000,
        lead_score: 78,
        priority: 'HIGH',
        status: 'MEETING',
        urgency: 'High',
        services: JSON.stringify(['Paid Advertising', 'Website Development', 'SEO']),
        requirement: 'Qualified interior design consultation leads in Delhi NCR with ticket sizes > ₹8 Lakhs.',
        main_problem: 'Getting low quality clicks through existing Google Ads campaigns.',
        budget_range: '₹1,50,000 - ₹2,00,000 / month',
        qualification_status: 'Qualified',
        qualification_data: JSON.stringify({ need: 'High-ticket HNWI leads', budget_confirmed: true, authority: 'MD + Sales Head', timeline: 'Immediate' })
      },
      {
        code: 'LEAD-2026-0104',
        company: 'Verve Activewear Labs',
        contact: 'Natasha Poonawalla',
        desig: 'Brand Lead',
        phone: '+91 99203 11882',
        whatsapp: '+91 99203 11882',
        email: 'natasha@verveactive.in',
        website: 'https://verveactive.in',
        city: 'Pune',
        state: 'Maharashtra',
        source: 'Instagram',
        industry: 'D2C Apparel & Athleisure',
        deal_value: 95000,
        lead_score: 68,
        priority: 'MEDIUM',
        status: 'CONTACTED',
        urgency: 'Medium',
        services: JSON.stringify(['Social Media Management', 'Reels', 'Graphic Design']),
        requirement: 'Complete Instagram aesthetic transformation and workout influencer collaborations.',
        main_problem: 'Inconsistent posting schedule and zero reel engagement.',
        budget_range: '₹80,000 - ₹1,20,000 / month',
        qualification_status: 'Nurture',
        qualification_data: JSON.stringify({ need: 'Organic social reach', budget_confirmed: true, authority: 'Founder approval needed', timeline: '1-3 months' })
      },
      {
        code: 'LEAD-2026-0105',
        company: 'CloudMatrix SaaS Solutions',
        contact: 'Arvind Swamy',
        desig: 'VP Sales & Growth',
        phone: '+91 97401 55667',
        whatsapp: '+91 97401 55667',
        email: 'arvind@cloudmatrix.ai',
        website: 'https://cloudmatrix.ai',
        city: 'Hyderabad',
        state: 'Telangana',
        source: 'LinkedIn',
        industry: 'B2B Enterprise SaaS',
        deal_value: 350000,
        lead_score: 95,
        priority: 'URGENT',
        status: 'NEGOTIATION',
        urgency: 'Immediate',
        services: JSON.stringify(['Paid Advertising', 'SEO', 'Content Creation', 'Marketing Consultation']),
        requirement: 'B2B LinkedIn ABM ads targeting CTOs and product managers in US & APAC regions.',
        main_problem: 'Need qualified sales demo pipeline for $30k ACV enterprise software.',
        budget_range: '₹3,00,000 - ₹4,00,000 / month',
        qualification_status: 'Qualified',
        qualification_data: JSON.stringify({ need: 'Enterprise ABM demo generation', budget_confirmed: true, authority: 'VP Growth & CEO', timeline: 'Immediate' })
      },
      {
        code: 'LEAD-2026-0106',
        company: 'Nectar Botanicals Organic',
        contact: 'Meera Deshmukh',
        desig: 'Co-Founder',
        phone: '+91 98334 77221',
        whatsapp: '+91 98334 77221',
        email: 'meera@nectarbotanicals.com',
        website: 'https://nectarbotanicals.com',
        city: 'Jaipur',
        state: 'Rajasthan',
        source: 'Referral',
        industry: 'Clean Beauty & Cosmetics',
        deal_value: 140000,
        lead_score: 80,
        priority: 'MEDIUM',
        status: 'NEW',
        urgency: 'High',
        services: JSON.stringify(['Social Media Management', 'Paid Advertising', 'Graphic Design']),
        requirement: 'Product launch campaign for 6 new ayurvedic serums with Meta ads and influencer seeding.',
        main_problem: 'New brand entering crowded market without clear USP communication.',
        budget_range: '₹1,20,000 - ₹1,60,000 / month',
        qualification_status: 'Pending',
        qualification_data: null
      },
      {
        code: 'LEAD-2026-0107',
        company: 'Saffron Leaf Luxury Stays',
        contact: 'Kabir Oberoi',
        desig: 'Chief Hospitality Officer',
        phone: '+91 99100 88223',
        whatsapp: '+91 99100 88223',
        email: 'kabir@saffronleafresorts.com',
        website: 'https://saffronleafresorts.com',
        city: 'Dehradun',
        state: 'Uttarakhand',
        source: 'Facebook',
        industry: 'Hospitality & Luxury Resorts',
        deal_value: 160000,
        lead_score: 88,
        priority: 'HIGH',
        status: 'MEETING',
        urgency: 'High',
        services: JSON.stringify(['Reels', 'Video Editing', 'Paid Advertising', 'Website Management']),
        requirement: 'Weekend booking velocity and destination wedding lead generation.',
        main_problem: 'High OTA commissions eating 22% of revenues; wants direct booking engine growth.',
        budget_range: '₹1,50,000 - ₹2,00,000 / month',
        qualification_status: 'Qualified',
        qualification_data: JSON.stringify({ need: 'Direct bookings growth', budget_confirmed: true, authority: 'Family office board', timeline: 'Within 30 days' })
      },
      {
        code: 'LEAD-2026-0108',
        company: 'FinTrack Wealth Advisory',
        contact: 'Deepak Singhania',
        desig: 'Partner',
        phone: '+91 98210 33994',
        whatsapp: '+91 98210 33994',
        email: 'deepak@fintrackwealth.com',
        website: 'https://fintrackwealth.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        source: 'Cold Call',
        industry: 'Financial Services',
        deal_value: 75000,
        lead_score: 45,
        priority: 'LOW',
        status: 'LOST',
        urgency: 'Low',
        services: JSON.stringify(['Content Creation', 'SEO']),
        requirement: 'Thought leadership articles and financial planning guides.',
        main_problem: 'Decided to use internal compliance team to draft content due to SEBI restrictions.',
        budget_range: '₹50,000 - ₹80,000 / month',
        qualification_status: 'Unqualified',
        qualification_data: JSON.stringify({ need: 'Content creation', budget_confirmed: false, authority: 'Strict SEBI compliance block', timeline: '3+ months' })
      }
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    const insertLead = db.prepare(`
      INSERT INTO leads (
        lead_code, lead_date, company_name, contact_person, designation, phone, whatsapp,
        email, website, city, state, country, source, industry, deal_value, lead_score,
        priority, status, urgency, services_required, requirement, main_business_problem,
        budget_range, qualification_status, qualification_data, assigned_sales_employee_id,
        created_by, created_at, updated_at
      ) VALUES (
        @code, @today, @company, @contact, @desig, @phone, @whatsapp,
        @email, @website, @city, @state, 'India', @source, @industry, @deal_value, @lead_score,
        @priority, @status, @urgency, @services, @requirement, @main_problem,
        @budget_range, @qualification_status, @qualification_data, @salesRepId,
        @adminUserId, DATETIME('now', '-2 days'), CURRENT_TIMESTAMP
      )
    `);

    for (const item of sampleLeads) {
      const info = insertLead.run({
        ...item,
        today: todayStr,
        salesRepId,
        adminUserId
      });
      const leadId = info.lastInsertRowid;

      // Seed initial activity
      db.prepare(`
        INSERT INTO lead_activities (lead_id, activity_type, title, description, performed_by, created_at)
        VALUES (?, 'LEAD_CREATED', 'Lead Created', 'Lead captured via ' || ?, ?, DATETIME('now', '-2 days'))
      `).run(leadId, item.source, salesRepId);

      // Seed specific stage activities & related records
      if (item.status === 'CONTACTED' || item.status === 'QUALIFIED' || item.status === 'MEETING' || item.status === 'PROPOSAL' || item.status === 'NEGOTIATION') {
        db.prepare(`
          INSERT INTO lead_activities (lead_id, activity_type, title, description, performed_by, created_at)
          VALUES (?, 'CALL_MADE', 'Discovery Call Completed', 'Spoke with ' || ? || '. Confirmed business goals and timeline.', ?, DATETIME('now', '-1 day'))
        `).run(leadId, item.contact, salesRepId);
      }

      if (item.status === 'QUALIFIED' || item.status === 'MEETING' || item.status === 'PROPOSAL' || item.status === 'NEGOTIATION') {
        db.prepare(`
          INSERT INTO lead_activities (lead_id, activity_type, title, description, performed_by, created_at)
          VALUES (?, 'QUALIFICATION_UPDATED', 'Lead Qualified', 'BANT qualification verified. Lead score rated ' || ?, ?, DATETIME('now', '-1 day'))
        `).run(leadId, item.lead_score, salesRepId);
      }
    }

    // Seed follow-ups (including today and overdue!)
    const allLeads = db.prepare('SELECT id, company_name, contact_person FROM leads').all();
    if (allLeads.length > 0) {
      // 1. Today's follow-up 1
      db.prepare(`
        INSERT INTO lead_follow_ups (
          lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
          client_requirement, next_action, priority, status, assigned_employee_id
        ) VALUES (
          ?, DATE('now'), '11:30', 'Phone', 'Follow-up on revised Meta ads scope and deliverables breakdown.',
          'Review 3 video creative formats', 'Confirm agreement and send formal retainer schedule', 'HIGH', 'PENDING', ?
        )
      `).run(allLeads[0].id, salesRepId);

      // 2. Today's follow-up 2
      db.prepare(`
        INSERT INTO lead_follow_ups (
          lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
          client_requirement, next_action, priority, status, assigned_employee_id
        ) VALUES (
          ?, DATE('now'), '15:00', 'WhatsApp', 'Share case study results of 4.2x ROAS in similar D2C vertical.',
          'Client requested metrics proof', 'Schedule Zoom review call with technical team', 'MEDIUM', 'PENDING', ?
        )
      `).run(allLeads[1].id, salesRepId);

      // 3. Overdue follow-up 1 (1 day overdue)
      db.prepare(`
        INSERT INTO lead_follow_ups (
          lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
          client_requirement, next_action, priority, status, assigned_employee_id
        ) VALUES (
          ?, DATE('now', '-1 day'), '16:00', 'Phone', 'Second follow-up call to review preliminary proposal deck.',
          'Decision maker review pending', 'Call executive office for confirmation', 'URGENT', 'PENDING', ?
        )
      `).run(allLeads[2].id, salesRepId);

      // 4. Overdue follow-up 2 (2 days overdue)
      db.prepare(`
        INSERT INTO lead_follow_ups (
          lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
          client_requirement, next_action, priority, status, assigned_employee_id
        ) VALUES (
          ?, DATE('now', '-2 days'), '10:00', 'Email', 'Sent onboarding contract terms draft for review.',
          'Legal team review', 'Follow-up on WhatsApp to ensure email received', 'HIGH', 'PENDING', ?
        )
      `).run(allLeads[3].id, salesRepId);

      // Seed meetings
      db.prepare(`
        INSERT INTO meetings (
          lead_id, title, meeting_date, meeting_time, meeting_type, meeting_link,
          participants, agenda, notes, status, assigned_employee_id, created_by
        ) VALUES (
          ?, 'Creative Strategy & Scope Pitch', DATE('now'), '16:30', 'Video Call',
          'https://meet.google.com/zen-stra-crm', 'Rahul Sharma, Dr. Radhika Sen',
          'Walkthrough of visual reels strategy and quarterly revenue targets',
          'Client confirmed attendance via WhatsApp', 'SCHEDULED', ?, ?
        )
      `).run(allLeads[0].id, salesRepId, adminUserId);

      db.prepare(`
        INSERT INTO meetings (
          lead_id, title, meeting_date, meeting_time, meeting_type, meeting_link,
          participants, agenda, notes, status, assigned_employee_id, created_by
        ) VALUES (
          ?, 'Contract Terms & Pricing Alignment', DATE('now', '+1 day'), '14:00', 'Video Call',
          'https://meet.google.com/zen-kav-coffee', 'Rahul Sharma, Rohan Mehra, Lead Strategist',
          'Final commercial terms negotiation and campaign kickoff timeline',
          'Send agenda 2 hours prior', 'SCHEDULED', ?, ?
        )
      `).run(allLeads[1].id, salesRepId, adminUserId);

      // Seed active proposals
      db.prepare(`
        INSERT INTO proposals (
          proposal_number, lead_id, company_name, proposal_title, services_summary,
          package_name, quantity, price, discount, tax, total, payment_terms,
          contract_duration, proposal_valid_until, terms, status, prepared_by
        ) VALUES (
          'PROP-2026-0041', ?, 'Kaviar Gourmet Coffee Co.',
          'Full-Funnel Growth & D2C Scaling Engagement',
          'Performance Marketing + 16 Monthly Reels + UGC Ad Lab + Shopify CRO',
          'Growth Accelerator Retainer', 1, 220000, 15000, 36900, 241900,
          '100% upfront on 1st of month', '6 Months', DATE('now', '+14 days'),
          'Net 7 billing terms. 30 days termination notice post 3-month lock-in.',
          'NEGOTIATION', ?
        )
      `).run(allLeads[1].id, salesRepId);
    }
  }
}

seedSalesPipeline();

// Helper: Log audit trail
export function logAudit({ userId, action, entity, entityId, oldValue, newValue, ip }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId || null,
      action,
      entity,
      entityId || null,
      typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue || null,
      typeof newValue === 'object' ? JSON.stringify(newValue) : newValue || null,
      ip || null
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Helper: Log Lead Activity
export function logLeadActivity({ leadId, activityType, title, description, performedBy, metadata }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO lead_activities (lead_id, activity_type, title, description, performed_by, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      leadId,
      activityType,
      title,
      description || null,
      performedBy || null,
      metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : null
    );
  } catch (err) {
    console.error('Failed to log lead activity:', err);
  }
}

// Helper: Create notification
export function createNotification({ userId, type, title, message, relatedEntity, relatedEntityId }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_entity, related_entity_id, is_read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    const res = stmt.run(userId, type, title, message, relatedEntity || null, relatedEntityId || null);
    return res.lastInsertRowid;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

// Helper: Record workflow transition
export function recordWorkflowHistory({ entityType, entityId, previousStage, newStage, changedBy, remarks }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO workflow_history (entity_type, entity_id, previous_stage, new_stage, changed_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(entityType, entityId, previousStage || null, newStage, changedBy || null, remarks || null);
  } catch (err) {
    console.error('Failed to record workflow history:', err);
  }
}

export default db;
