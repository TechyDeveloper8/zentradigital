-- ==============================================================================
-- Zentra Digital Marketing Agency ERP + CRM + PM + Collaboration Database Schema
-- Normalized relational schema for SQLite (WAL mode, Foreign Keys Enforced)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Organizations & Settings
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    legal_name TEXT,
    logo TEXT,
    brand_logo_light TEXT,
    brand_logo_dark TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pin_code TEXT,
    gst_number TEXT,
    pan TEXT,
    cin TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    currency TEXT DEFAULT 'INR',
    financial_year_start TEXT DEFAULT '04-01',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    default_language TEXT DEFAULT 'en',
    owner_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    default_working_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]',
    office_start_time TEXT DEFAULT '09:30',
    office_end_time TEXT DEFAULT '18:30',
    grace_period_minutes INTEGER DEFAULT 15,
    attendance_rules TEXT,
    leave_rules TEXT,
    task_priority_rules TEXT,
    default_approval_rules TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. RBAC & Departments
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    module TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users & Employees
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    user_type TEXT NOT NULL CHECK(user_type IN ('admin', 'employee', 'client')),
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    profile_photo TEXT,
    dob DATE,
    gender TEXT,
    phone TEXT,
    alternate_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    employee_type TEXT NOT NULL, -- e.g. Sales Executive, Marketing & Social Media Manager, Editor / Creative Team
    date_of_joining DATE NOT NULL,
    reporting_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    employment_status TEXT NOT NULL DEFAULT 'Active' CHECK(employment_status IN ('Active', 'Probation', 'Notice Period', 'Inactive', 'Terminated')),
    work_location TEXT DEFAULT 'Headquarters',
    working_hours TEXT DEFAULT '09:30 - 18:30',
    employment_mode TEXT DEFAULT 'Full-time',
    working_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]',
    shift_start TEXT DEFAULT '09:30',
    shift_end TEXT DEFAULT '18:30',
    check_in_required INTEGER DEFAULT 1,
    check_out_required INTEGER DEFAULT 1,
    leave_allocation INTEGER DEFAULT 18,
    daily_report_required INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Leads & Sales Pipeline
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_code TEXT UNIQUE NOT NULL,
    lead_date DATE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    designation TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    social_media_links TEXT,
    industry TEXT,
    business_type TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    source TEXT NOT NULL, -- Website, Instagram, Facebook, LinkedIn, Google, Referral, Cold Call, WhatsApp, Email, Walk-in, Advertisement, Other
    lead_type TEXT,
    requirement TEXT,
    budget_range TEXT,
    deal_value REAL DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    company_size TEXT,
    product_service TEXT,
    target_market TEXT,
    target_location TEXT,
    competitors TEXT,
    current_marketing_method TEXT,
    services_required TEXT, -- JSON array of selected agency services
    main_business_problem TEXT,
    desired_outcome TEXT,
    expected_start_date DATE,
    existing_agency TEXT,
    urgency TEXT DEFAULT 'Medium',
    billing_type TEXT DEFAULT 'Monthly',
    expected_contract_duration TEXT,
    decision_maker TEXT,
    purchase_timeline TEXT,
    pricing_sensitivity TEXT,
    qualification_status TEXT DEFAULT 'Pending', -- Qualified, Unqualified, Nurture, On Hold, Pending
    qualification_data TEXT, -- JSON containing structured qualification responses
    first_follow_up_date DATE,
    assigned_sales_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON HOLD')),
    stage_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    converted_client_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- LEAD_CREATED, CALL_MADE, WHATSAPP_SENT, EMAIL_SENT, FOLLOW_UP_SCHEDULED, FOLLOW_UP_COMPLETED, MEETING_SCHEDULED, MEETING_COMPLETED, QUALIFICATION_UPDATED, PROPOSAL_CREATED, PROPOSAL_SENT, PROPOSAL_ACCEPTED, STAGE_CHANGED, DEAL_WON, DEAL_LOST, HANDOVER_SUBMITTED, NOTE_ADDED
    title TEXT NOT NULL,
    description TEXT,
    performed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    follow_up_date DATE NOT NULL,
    follow_up_time TEXT,
    contact_method TEXT NOT NULL CHECK(contact_method IN ('Phone', 'WhatsApp', 'Email', 'Meeting', 'Video Call', 'Other')),
    discussion_summary TEXT NOT NULL,
    client_requirement TEXT,
    next_action TEXT,
    next_follow_up_date DATE,
    assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'MEDIUM',
    reminder INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
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

CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_number TEXT UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    client_id INTEGER,
    company_name TEXT NOT NULL,
    proposal_title TEXT,
    services_summary TEXT NOT NULL,
    package_name TEXT,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL NOT NULL,
    payment_terms TEXT,
    contract_duration TEXT,
    items_detail TEXT, -- JSON array of items
    proposal_valid_until DATE,
    terms TEXT,
    notes TEXT,
    prepared_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SENT', 'VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
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
    services_sold TEXT, -- JSON
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

-- 5. Clients & Onboarding
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    legal_name TEXT,
    business_type TEXT,
    industry TEXT,
    website TEXT,
    logo TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pin_code TEXT,
    gst_number TEXT,
    pan TEXT,
    primary_contact_name TEXT NOT NULL,
    primary_contact_designation TEXT,
    primary_contact_phone TEXT NOT NULL,
    primary_contact_whatsapp TEXT,
    primary_contact_email TEXT NOT NULL,
    account_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    assigned_marketing_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    assigned_sales_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ONBOARDING' CHECK(status IN ('ACTIVE', 'ONBOARDING', 'PAUSED', 'TERMINATED')),
    start_date DATE NOT NULL,
    contract_start DATE,
    contract_end DATE,
    billing_cycle TEXT DEFAULT 'Monthly',
    payment_terms TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    notes TEXT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    designation TEXT,
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    preferred_contact_method TEXT DEFAULT 'Email',
    can_approve_content INTEGER DEFAULT 0,
    can_create_requests INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_onboarding_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    notes TEXT,
    completed_at DATETIME,
    completed_by INTEGER REFERENCES users(id),
    UNIQUE(client_id, item_key)
);

-- 6. Services, Contracts & Employee Assignments
CREATE TABLE IF NOT EXISTS client_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    package_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_quantity INTEGER DEFAULT 1,
    assigned_team_summary TEXT,
    sla TEXT,
    monthly_deliverables TEXT,
    price REAL NOT NULL,
    billing_cycle TEXT DEFAULT 'Monthly',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_role TEXT NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'PRIMARY' CHECK(assignment_type IN ('PRIMARY', 'SECONDARY')),
    start_date DATE NOT NULL,
    end_date DATE,
    responsibilities TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Projects & Workflows
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES client_services(id) ON DELETE SET NULL,
    description TEXT,
    objective TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    project_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    budget REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PLANNING' CHECK(status IN ('PLANNING', 'ACTIVE', 'ON HOLD', 'CLIENT REVIEW', 'COMPLETED', 'CANCELLED')),
    internal_notes TEXT,
    client_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, employee_id)
);

CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    stage_key TEXT NOT NULL,
    stage_label TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    client_visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS workflow_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- task, content, request
    entity_id INTEGER NOT NULL,
    previous_stage TEXT,
    new_stage TEXT NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

-- 8. Tasks & Comments
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_code TEXT UNIQUE NOT NULL,
    task_title TEXT NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES client_services(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL,
    description TEXT,
    assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id),
    reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    start_date DATE,
    due_date DATE NOT NULL,
    estimated_hours REAL DEFAULT 0,
    actual_hours REAL DEFAULT 0,
    dependencies TEXT,
    client_visible INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO', 'IN PROGRESS', 'WAITING', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'COMPLETED')),
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Content Calendar, Creative Management, Versions & Reviews
CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_name TEXT NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    objective TEXT,
    platform TEXT,
    start_date DATE,
    end_date DATE,
    budget REAL DEFAULT 0,
    spent REAL DEFAULT 0,
    target_audience TEXT,
    location TEXT,
    age_range TEXT,
    gender TEXT,
    creative_requirements TEXT,
    landing_page TEXT,
    assigned_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_code TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- Instagram, Facebook, LinkedIn, YouTube, X, Pinterest, Website, Other
    content_type TEXT NOT NULL, -- Static Post, Carousel, Reel, Story, Video, Ad Creative, Blog, Article, Promotional Creative, Festival Creative, Announcement, Other
    topic TEXT NOT NULL,
    caption TEXT,
    hashtags TEXT,
    cta TEXT,
    reference_url TEXT,
    assigned_marketing_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    assigned_editor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    publish_date DATE,
    publish_time TEXT,
    workflow_stage TEXT NOT NULL DEFAULT 'IDEA' CHECK(workflow_stage IN ('IDEA', 'PLANNED', 'ASSIGNED', 'IN PRODUCTION', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED')),
    client_approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(client_approval_status IN ('PENDING', 'APPROVED', 'REVISION_REQUESTED')),
    internal_approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(internal_approval_status IN ('PENDING', 'APPROVED', 'REVISION_REQUESTED')),
    publishing_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(publishing_status IN ('DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'FAILED')),
    current_version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT,
    preview_url TEXT,
    file_name TEXT,
    caption_snapshot TEXT,
    notes TEXT,
    submitted_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, version_number)
);

CREATE TABLE IF NOT EXISTS content_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    reviewer_user_id INTEGER NOT NULL REFERENCES users(id),
    reviewer_type TEXT NOT NULL CHECK(reviewer_type IN ('INTERNAL', 'CLIENT')),
    action TEXT NOT NULL CHECK(action IN ('APPROVE', 'REQUEST_CHANGES')),
    reason TEXT,
    comment TEXT,
    specific_change TEXT,
    attachment_url TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    recorded_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Client Request Center
CREATE TABLE IF NOT EXISTS client_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_code TEXT UNIQUE NOT NULL, -- e.g. REQ-2026-00001
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    request_title TEXT NOT NULL,
    category TEXT NOT NULL, -- New Creative, Design Change, Video, Reel, Social Media, Content, Advertisement, Website, Technical, Urgent Requirement, Other
    description TEXT NOT NULL,
    requested_date DATE NOT NULL,
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    reference_file_url TEXT,
    preferred_platform TEXT,
    assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'ASSIGNED', 'IN PROGRESS', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'COMPLETED', 'CLOSED')),
    resolution_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL REFERENCES client_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    attachment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Daily Work Reports & Daily Client Updates
CREATE TABLE IF NOT EXISTS daily_work_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_hours REAL DEFAULT 0,
    remarks TEXT,
    challenges TEXT,
    tomorrows_plan TEXT,
    status TEXT DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'REVIEWED')),
    reviewed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, report_date)
);

CREATE TABLE IF NOT EXISTS daily_work_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES daily_work_reports(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    work_category TEXT NOT NULL,
    work_description TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    hours_worked REAL NOT NULL,
    deliverable_output TEXT,
    proof_file_url TEXT,
    client_visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS daily_client_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    update_date DATE NOT NULL,
    completed_text TEXT NOT NULL,
    in_progress_text TEXT,
    pending_client_text TEXT,
    approved_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Attendance Records & Adjustments
CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    total_working_hours REAL DEFAULT 0,
    break_duration_minutes INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT', 'LATE', 'HALF DAY', 'ABSENT', 'LEAVE', 'HOLIDAY', 'WEEK OFF')),
    ip_address TEXT,
    device_info TEXT,
    is_manual_adjusted INTEGER DEFAULT 0,
    adjustment_reason TEXT,
    approved_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- 13. Real-Time Chat & Messages (Dual Boundary)
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_type TEXT NOT NULL CHECK(chat_type IN ('INTERNAL_ONE_TO_ONE', 'INTERNAL_GROUP', 'INTERNAL_PROJECT', 'CLIENT_COMMUNICATION')),
    name TEXT,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    request_id INTEGER REFERENCES client_requests(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_members (
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME,
    PRIMARY KEY(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_id INTEGER,
    attachment_url TEXT,
    reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_converted_to_request INTEGER DEFAULT 0,
    converted_request_id INTEGER REFERENCES client_requests(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications & File Assets
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity TEXT,
    related_entity_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by_user_id INTEGER REFERENCES users(id),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    content_id INTEGER REFERENCES content_items(id) ON DELETE SET NULL,
    version_number INTEGER DEFAULT 1,
    visibility TEXT NOT NULL DEFAULT 'INTERNAL' CHECK(visibility IN ('INTERNAL', 'CLIENT_VISIBLE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Billing, Contracts, Invoices & Payments
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_code TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    services_json TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_amount REAL NOT NULL,
    billing_cycle TEXT DEFAULT 'Monthly',
    deliverables_summary TEXT,
    renewal_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'EXPIRING', 'RENEWED', 'EXPIRED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL NOT NULL,
    due_date DATE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')),
    paid_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    rate REAL NOT NULL,
    amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL, -- Bank Transfer, UPI, Credit Card, Cheque, Other
    reference_number TEXT,
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Client Reports & Global Audit Logs
CREATE TABLE IF NOT EXISTS client_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    report_month INTEGER NOT NULL,
    report_year INTEGER NOT NULL,
    title TEXT NOT NULL,
    work_completed TEXT,
    content_published_count INTEGER DEFAULT 0,
    reach_total INTEGER DEFAULT 0,
    engagement_total INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    best_content_summary TEXT,
    recommendations TEXT,
    upcoming_plan TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'FINALIZED')),
    finalized_by INTEGER REFERENCES users(id),
    finalized_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- CREATED, UPDATED, DELETED, ASSIGNED, STATUS_CHANGED, APPROVED, REVISION_REQUESTED, ATTENDANCE_CORRECTED, LOGIN, LOGOUT
    entity TEXT NOT NULL,
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DATABASE INDEXES FOR OPTIMAL QUERY PERFORMANCE (Section 60)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_sales_employee_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_content_client ON content_items(client_id);
CREATE INDEX IF NOT EXISTS idx_content_publish_date ON content_items(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_workflow_stage ON content_items(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_requests_client ON client_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned ON client_requests(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
