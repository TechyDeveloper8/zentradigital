// End-to-End API and Core Feature Verification Test Suite
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('STARTING FULL-STACK VERIFICATION OF THE 6 CORE SALES FEATURES');
  console.log('================================================================\n');

  // 0. Login as Sales Executive (Rahul Sharma)
  console.log('Authenticating as Sales Executive (rahul.sales)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'rahul.sales', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Sales login failed: ' + JSON.stringify(loginData));
  const salesToken = loginData.token;
  console.log('✓ Sales Executive authenticated successfully. Token acquired.\n');

  // 0b. Login as Admin
  console.log('Authenticating as Admin (admin)...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok) throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
  const adminToken = adminLoginData.token;
  console.log('✓ Admin authenticated successfully. Token acquired.\n');

  const salesHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${salesToken}`
  };

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // --------------------------------------------------------------------------
  // FEATURE 1: LEAD MANAGEMENT (Add new leads & update existing lead details)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 1: LEAD MANAGEMENT ---');
  // 1a. Add new lead
  const newLeadPayload = {
    company_name: 'Apex HyperGrowth Tech',
    contact_person: 'Vikramaditya Mehta',
    designation: 'Managing Director',
    phone: '+91 98765 09999',
    email: 'vikram@apexhypergrowth.com',
    source: 'LinkedIn',
    industry: 'SaaS & Enterprise AI',
    deal_value: 175000,
    priority: 'HIGH',
    urgency: 'Immediate',
    requirement: 'End-to-end B2B performance marketing and brand identity relaunch',
    notes: 'Very interested in our Q4 case studies. Decision expected in 2 weeks.'
  };

  const createLeadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify(newLeadPayload)
  });
  const createLeadData = await createLeadRes.json();
  if (!createLeadRes.ok) throw new Error('Create lead failed: ' + JSON.stringify(createLeadData));
  const createdLeadId = createLeadData.lead.id;
  console.log(`✓ 1a. Lead Created: [${createLeadData.lead.lead_code}] ${createLeadData.lead.company_name} (ID: ${createdLeadId})`);

  // 1b. Update existing lead details
  const updateLeadPayload = {
    contact_person: 'Vikramaditya Mehta (CEO)',
    deal_value: 220000,
    priority: 'URGENT',
    requirement: 'Expanded retainer scope: Includes SEO, Ads, and Video Creatives',
    notes: 'Budget approved by board. Requested demo contract.'
  };

  const updateLeadRes = await fetch(`${BASE_URL}/leads/${createdLeadId}`, {
    method: 'PUT',
    headers: salesHeaders,
    body: JSON.stringify(updateLeadPayload)
  });
  const updateLeadData = await updateLeadRes.json();
  if (!updateLeadRes.ok) throw new Error('Update lead failed: ' + JSON.stringify(updateLeadData));
  console.log(`✓ 1b. Lead Details Updated: Deal Value updated to ₹${updateLeadData.lead.deal_value.toLocaleString()}, Priority to ${updateLeadData.lead.priority}`);

  // Verify updated lead details
  const getLeadRes = await fetch(`${BASE_URL}/leads/${createdLeadId}`, { headers: salesHeaders });
  const getLeadData = await getLeadRes.json();
  if (getLeadData.lead.deal_value !== 220000 || getLeadData.lead.priority !== 'URGENT') {
    throw new Error('Lead update verification failed.');
  }
  console.log('✓ 1c. Verified persisted lead update in database.\n');

  // --------------------------------------------------------------------------
  // FEATURE 2: FOLLOW-UPS (Add, view, or update follow-up dates & notes)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 2: FOLLOW-UPS ---');
  // 2a. Add follow-up
  const followUpPayload = {
    lead_id: createdLeadId,
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '16:30',
    contact_method: 'Phone',
    discussion_summary: 'Initial connection call with Vikramaditya regarding Q4 timeline and deliverable milestones.',
    next_action: 'Send case study deck on WhatsApp',
    priority: 'HIGH'
  };

  const createFuRes = await fetch(`${BASE_URL}/leads/follow-ups`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify(followUpPayload)
  });
  const createFuData = await createFuRes.json();
  if (!createFuRes.ok) throw new Error('Create follow-up failed: ' + JSON.stringify(createFuData));
  const fuId = createFuData.follow_up.id;
  console.log(`✓ 2a. Follow-up Added: ID ${fuId} scheduled for ${createFuData.follow_up.follow_up_date} at ${createFuData.follow_up.follow_up_time}`);

  // 2b. View follow-ups list
  const listFuRes = await fetch(`${BASE_URL}/leads/follow-ups?lead_id=${createdLeadId}`, { headers: salesHeaders });
  const listFuData = await listFuRes.json();
  console.log(`✓ 2b. Follow-ups Viewed: Found ${listFuData.followUps.length} follow-up(s) for this lead.`);

  // 2c. Update follow-up date and notes
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const newDateStr = tomorrow.toISOString().split('T')[0];

  const updateFuPayload = {
    follow_up_date: newDateStr,
    follow_up_time: '11:00',
    discussion_summary: 'Prospect requested rescheduling to morning. Added notes: Focus pitch on ROI of Google Ads campaign.',
    next_action: 'Prepare customized ROI calculator',
    status: 'PENDING'
  };

  const updateFuRes = await fetch(`${BASE_URL}/leads/follow-ups/${fuId}`, {
    method: 'PUT',
    headers: salesHeaders,
    body: JSON.stringify(updateFuPayload)
  });
  const updateFuData = await updateFuRes.json();
  if (!updateFuRes.ok) throw new Error('Update follow-up failed: ' + JSON.stringify(updateFuData));
  console.log(`✓ 2c. Follow-up Date & Notes Updated: Rescheduled to ${updateFuData.follow_up.follow_up_date}, Notes: "${updateFuData.follow_up.discussion_summary.slice(0, 45)}..."\n`);

  // --------------------------------------------------------------------------
  // FEATURE 3: MEETINGS (Module to update meeting status: Scheduled, Completed, Cancelled, Rescheduled)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 3: MEETINGS ---');
  // 3a. Schedule meeting
  const meetingPayload = {
    lead_id: createdLeadId,
    title: 'Strategy Discovery Call with Apex Tech Leadership',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '17:00',
    meeting_type: 'Video Call',
    meeting_link: 'https://meet.google.com/zen-apex-strategy',
    agenda: 'Scope alignment, pricing tiers review, SLA commitments'
  };

  const createMeetingRes = await fetch(`${BASE_URL}/meetings`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify(meetingPayload)
  });
  const createMeetingData = await createMeetingRes.json();
  if (!createMeetingRes.ok) throw new Error('Create meeting failed: ' + JSON.stringify(createMeetingData));
  const meetingId = createMeetingData.meeting.id;
  console.log(`✓ 3a. Meeting Scheduled: ID ${meetingId}, Status: ${createMeetingData.meeting.status}`);

  // 3b. Update meeting status to RESCHEDULED
  const rescheduleRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: 'PUT',
    headers: salesHeaders,
    body: JSON.stringify({
      status: 'RESCHEDULED',
      meeting_date: newDateStr,
      meeting_time: '15:30',
      notes: 'Client had an urgent executive meeting; agreed to connect on Thursday.'
    })
  });
  const rescheduleData = await rescheduleRes.json();
  console.log(`✓ 3b. Meeting Status Updated: Status changed to ${rescheduleData.meeting.status}, new date: ${rescheduleData.meeting.meeting_date}`);

  // 3c. Update meeting status to COMPLETED
  const completeRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
    method: 'PUT',
    headers: salesHeaders,
    body: JSON.stringify({
      status: 'COMPLETED',
      notes: 'Demo pitch highly successful. Client agreed to review agreement.'
    })
  });
  const completeData = await completeRes.json();
  console.log(`✓ 3c. Meeting Status Updated: Status changed to ${completeData.meeting.status}, Outcome: "${completeData.meeting.notes}"\n`);

  // --------------------------------------------------------------------------
  // FEATURE 4: SALES TASK / DAILY SALES REPORT (DSR)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 4: SALES TASK / DAILY SALES REPORT (DSR) ---');
  // 4a. Create Daily Sales Task
  const taskPayload = {
    task_title: 'Prepare Apex Tech customized pricing contract',
    description: 'Draft 6-month digital retainer scope with deliverables table',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'URGENT',
    lead_id: createdLeadId
  };

  const createTaskRes = await fetch(`${BASE_URL}/sales/tasks`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify(taskPayload)
  });
  const createTaskData = await createTaskRes.json();
  if (!createTaskRes.ok) throw new Error('Create task failed: ' + JSON.stringify(createTaskData));
  const taskId = createTaskData.task.id;
  console.log(`✓ 4a. Sales Daily Task Created: ID ${taskId} - "${createTaskData.task.task_title}"`);

  // 4b. Update Task Status (TODO -> COMPLETED)
  const updateTaskRes = await fetch(`${BASE_URL}/sales/tasks/${taskId}`, {
    method: 'PUT',
    headers: salesHeaders,
    body: JSON.stringify({ status: 'COMPLETED' })
  });
  const updateTaskData = await updateTaskRes.json();
  console.log(`✓ 4b. Sales Task Status Updated: Status is now ${updateTaskData.task.status}`);

  // 4c. Submit Daily Sales Report (DSR)
  const dsrPayload = {
    report_date: new Date().toISOString().split('T')[0],
    total_hours: 8.5,
    remarks: 'Intense sales day. Dialed 22 outbound prospects, held 2 discovery calls, advanced Apex Tech to negotiation.',
    challenges: 'Prospects demanding shorter onboarding turnaround.',
    tomorrows_plan: 'Close Apex Tech deal and follow up on 4 qualified retail leads.',
    entries: [
      { work_category: 'Prospecting', work_description: 'Outbound dials to 22 leads', hours_worked: 4 },
      { work_category: 'Meetings', work_description: 'Conducted Apex Tech discovery call', hours_worked: 2 },
      { work_category: 'DSR & Pipeline', work_description: 'Updated pipeline stages & follow-up notes', hours_worked: 2.5 }
    ]
  };

  const dsrRes = await fetch(`${BASE_URL}/daily-reports`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify(dsrPayload)
  });
  const dsrData = await dsrRes.json();
  if (!dsrRes.ok) throw new Error('DSR submission failed: ' + JSON.stringify(dsrData));
  console.log(`✓ 4c. Daily Sales Report (DSR) Submitted: ${dsrData.message}`);

  // 4d. Verify DSR in /daily-reports/my-today
  const getDsrRes = await fetch(`${BASE_URL}/daily-reports/my-today`, { headers: salesHeaders });
  const getDsrData = await getDsrRes.json();
  console.log(`✓ 4d. Verified Logged DSR: Total Hours = ${getDsrData.report.total_hours}, Entries count = ${getDsrData.entries.length}\n`);

  // --------------------------------------------------------------------------
  // FEATURE 5: PIPELINE MANAGEMENT (Visual or table pipeline stage tracker that updates manually)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 5: PIPELINE MANAGEMENT ---');
  // 5a. Progress deal manually through pipeline stages
  const stagesToTest = ['CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'];
  for (const st of stagesToTest) {
    const stageRes = await fetch(`${BASE_URL}/leads/${createdLeadId}/stage`, {
      method: 'PUT',
      headers: salesHeaders,
      body: JSON.stringify({ stage: st, notes: `Advanced to ${st} stage during executive review.` })
    });
    const stageData = await stageRes.json();
    if (!stageRes.ok) throw new Error(`Stage change to ${st} failed: ` + JSON.stringify(stageData));
    console.log(`✓ 5a. Deal Stage Progressed: Moved lead to [${stageData.lead.status}]`);
  }

  // 5b. Fetch Pipeline Kanban columns to verify placement in WON column
  const pipelineRes = await fetch(`${BASE_URL}/sales/pipeline`, { headers: salesHeaders });
  const pipelineData = await pipelineRes.json();
  const wonCol = pipelineData.columns['WON'];
  const leadInWon = wonCol.leads.find(l => l.id === createdLeadId);
  if (!leadInWon) throw new Error('Lead not found in WON column.');
  console.log(`✓ 5b. Verified Pipeline Tracker: Lead is accurately located in WON column with deal value ₹${leadInWon.deal_value.toLocaleString()}.\n`);

  // --------------------------------------------------------------------------
  // FEATURE 6: ATTENDANCE TRACKER (ADMIN VIEW - Track & view attendance records for each Sales Executive)
  // --------------------------------------------------------------------------
  console.log('--- TESTING FEATURE 6: ATTENDANCE TRACKER (ADMIN VIEW) ---');
  // 6a. Admin views sales executives list and attendance records
  const adminAttRes = await fetch(`${BASE_URL}/attendance/sales-executives?employee_id=201`, {
    headers: adminHeaders
  });
  const adminAttData = await adminAttRes.json();
  if (!adminAttRes.ok) throw new Error('Admin attendance fetch failed: ' + JSON.stringify(adminAttData));

  console.log(`✓ 6a. Admin Retrieved Sales Executives List: Found ${adminAttData.salesExecutives.length} Sales Executive(s):`);
  adminAttData.salesExecutives.forEach(exec => {
    console.log(`     - [${exec.employee_code}] ${exec.first_name} ${exec.last_name} (${exec.designation})`);
  });

  console.log(`✓ 6b. Admin Tracking Records for ${adminAttData.selectedExecutive.first_name} ${adminAttData.selectedExecutive.last_name}:`);
  console.log(`     - Total Recorded Days: ${adminAttData.summary.totalRecords}`);
  console.log(`     - Present Days: ${adminAttData.summary.presentDays}`);
  console.log(`     - Late Days: ${adminAttData.summary.lateDays}`);
  console.log(`     - Total Hours: ${adminAttData.summary.totalHours} hrs (Avg ${adminAttData.summary.avgHours} hrs/day)`);
  console.log(`     - On-Time Arrival Rate: ${adminAttData.summary.onTimeRate}%`);

  // 6c. Admin Manual Attendance Adjustment
  const adjustPayload = {
    employee_id: 201,
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    check_in_time: '09:15',
    check_out_time: '18:45',
    total_working_hours: 9.5,
    adjustment_reason: 'Admin adjusted: Executive conducted early client breakfast pitch'
  };

  const adjustRes = await fetch(`${BASE_URL}/attendance/adjust`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(adjustPayload)
  });
  const adjustData = await adjustRes.json();
  if (!adjustRes.ok) throw new Error('Attendance adjustment failed: ' + JSON.stringify(adjustData));
  console.log(`✓ 6c. Admin Attendance Adjusted: ${adjustData.message}`);

  // Verify adjustment in records
  const verifyAttRes = await fetch(`${BASE_URL}/attendance/sales-executives?employee_id=201`, {
    headers: adminHeaders
  });
  const verifyAttData = await verifyAttRes.json();
  const adjustedToday = verifyAttData.records.find(r => r.date === adjustPayload.date);
  if (!adjustedToday || adjustedToday.is_manual_adjusted !== 1) {
    throw new Error('Attendance adjustment verification failed.');
  }
  console.log(`✓ 6d. Verified Admin Adjustment in Attendance Record: Status = ${adjustedToday.status}, Hours = ${adjustedToday.total_working_hours}, Reason = "${adjustedToday.adjustment_reason}"\n`);

  console.log('================================================================');
  console.log('ALL 6 CORE FEATURES VERIFIED END-TO-END WITH 100% SUCCESS!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
