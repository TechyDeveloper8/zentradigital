import assert from 'assert';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'zentra-enterprise-jwt-secret-key-2026';
const BASE_URL = 'http://localhost:5000/api';

const adminToken = jwt.sign({ id: 1, role: 'admin', user_type: 'admin', username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const editorToken = jwt.sign({ id: 203, role: 'editor', user_type: 'employee', username: 'aman' }, JWT_SECRET, { expiresIn: '1h' });
const smmToken = jwt.sign({ id: 202, role: 'marketing_manager', user_type: 'employee', username: 'priya' }, JWT_SECRET, { expiresIn: '1h' });
const clientToken = jwt.sign({ id: 207, role: 'client', user_type: 'client', username: 'lara_client' }, JWT_SECRET, { expiresIn: '1h' });
const salesToken = jwt.sign({ id: 201, role: 'sales', user_type: 'employee', username: 'rahul' }, JWT_SECRET, { expiresIn: '1h' });

async function req(method, path, body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('=====================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE DUAL-WORKFLOW & RBAC VERIFICATION SUITE');
  console.log('=====================================================================\n');

  // =========================================================================
  // TEST SECTION 1: WORKFLOW 1 - VIDEO PRODUCTION (4-STEP MULTI-APPROVAL)
  // =========================================================================
  console.log('--- TEST SECTION 1: Video Production Workflow ---');

  // Step 1: Admin uploads raw video
  console.log('1.1 Admin Uploads Raw Video Task...');
  const uploadRawRes = await req('POST', '/media/raw-upload', {
    task_title: 'Automated E2E Master Video Campaign',
    client_id: 1,
    assigned_employee_id: 203, // Aman (Editor)
    due_date: '2026-10-15',
    priority: 'HIGH',
    raw_footage_notes: '4K raw footage captured on Sony FX3 with S-Log3 profile.',
    client_visible: true,
    raw_file_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-41154.mp4',
    raw_file_name: 'FX3_Raw_Take_01.mp4',
    raw_file_size: 54000000
  }, adminToken);

  const task = uploadRawRes.data.task || uploadRawRes.data;
  const videoTaskId = task.id || uploadRawRes.data.task_id;
  assert.strictEqual(task.workflow_stage, 'RAW_UPLOADED');
  console.log(`   ✓ Raw task created (ID: ${videoTaskId}, Stage: ${task.workflow_stage})`);

  // Step 2a: Video Editor downloads and uploads cut v1
  console.log('1.2 Video Editor uploads Cut v1...');
  const editorSubmitRes = await req('POST', `/media/${videoTaskId}/editor-submit`, {
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: 'Cut_v1_RoughDraft.mp4',
    video_duration: '00:45',
    editor_notes: 'First rough cut completed with background score and lower thirds.'
  }, editorToken);
  assert.strictEqual(editorSubmitRes.ok, true);
  assert.strictEqual(editorSubmitRes.data.workflow_stage, 'IN_ADMIN_REVIEW_EDITOR');
  console.log(`   ✓ Cut v1 submitted (Stage: ${editorSubmitRes.data.workflow_stage})`);

  // Step 2b: Admin Review 1 - DISAPPROVES with revision notes
  console.log('1.3 Admin Review 1: DISAPPROVES Cut v1 (loops to Editor)...');
  const adminDisapproveCutRes = await req('POST', `/media/${videoTaskId}/admin-editor-review`, {
    decision: 'DISAPPROVE',
    notes: 'Color grading is too dark in second scene, please boost shadow exposure and adjust audio ducking.'
  }, adminToken);
  assert.strictEqual(adminDisapproveCutRes.ok, true);
  assert.strictEqual(adminDisapproveCutRes.data.workflow_stage, 'NEEDS_REVISION_VIDEO');
  console.log(`   ✓ Looped back to Editor (Stage: ${adminDisapproveCutRes.data.workflow_stage})`);

  // Step 2c: Video Editor uploads Cut v2
  console.log('1.4 Video Editor uploads Cut v2 (Re-edit)...');
  const editorReSubmitRes = await req('POST', `/media/${videoTaskId}/editor-submit`, {
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: 'Cut_v2_ColorGradedMaster.mp4',
    video_duration: '00:45',
    editor_notes: 'Shadow exposure boosted +2 stops in Scene 2, audio ducking smoothed.'
  }, editorToken);
  assert.strictEqual(editorReSubmitRes.ok, true);
  assert.strictEqual(editorReSubmitRes.data.workflow_stage, 'IN_ADMIN_REVIEW_EDITOR');
  console.log(`   ✓ Cut v2 re-submitted (Stage: ${editorReSubmitRes.data.workflow_stage})`);

  // Step 2d: Admin Review 1 - APPROVES Cut v2 (Advances to SMM)
  console.log('1.5 Admin Review 1: APPROVES Cut v2 (Advances to SMM)...');
  const adminApproveCutRes = await req('POST', `/media/${videoTaskId}/admin-editor-review`, {
    decision: 'APPROVE',
    notes: 'Cut v2 looks clean, vibrant, and well-balanced. Advanced to SMM for copy.'
  }, adminToken);
  assert.strictEqual(adminApproveCutRes.ok, true);
  assert.strictEqual(adminApproveCutRes.data.workflow_stage, 'SMM_CAPTIONING');
  console.log(`   ✓ Cut v2 approved, advanced to SMM (Stage: ${adminApproveCutRes.data.workflow_stage})`);

  // Step 3a: SMM adds captions & hashtags and submits
  console.log('1.6 SMM adds captions, hashtags, and submits full post...');
  const smmSubmitRes = await req('POST', `/media/${videoTaskId}/smm-submit`, {
    caption: 'Elevate your aesthetic with timeless elegance. ✨ Crafted to perfection.',
    hashtags: '#LuxuryJewelry #Elegance #ZentraCraft #HighFashion',
    post_notes: 'Drafted targeting luxury fashion enthusiasts on Instagram Reels & TikTok.',
    target_platforms: 'Instagram Reels, TikTok, YouTube Shorts',
    schedule_publish_date: '2026-10-18'
  }, smmToken);
  assert.strictEqual(smmSubmitRes.ok, true);
  assert.strictEqual(smmSubmitRes.data.workflow_stage, 'IN_ADMIN_REVIEW_SMM');
  console.log(`   ✓ SMM submitted complete post (Stage: ${smmSubmitRes.data.workflow_stage})`);

  // Step 3b: Admin Review 2 - APPROVES SMM post (Publishes to Client)
  console.log('1.7 Admin Review 2: APPROVES SMM post (Publishes to Client Dashboard)...');
  const adminApprovePostRes = await req('POST', `/media/${videoTaskId}/admin-smm-review`, {
    decision: 'APPROVE',
    notes: 'Captions and hashtags are compelling and on-brand. Published for client sign-off.'
  }, adminToken);
  assert.strictEqual(adminApprovePostRes.ok, true);
  assert.strictEqual(adminApprovePostRes.data.workflow_stage, 'IN_CLIENT_REVIEW');
  console.log(`   ✓ Post published to Client Dashboard (Stage: ${adminApprovePostRes.data.workflow_stage})`);

  // Step 4a: Client Review - Path A (Video Issue Rejection)
  console.log('1.8 Client Review: DISAPPROVES with Path A (Video Issue -> Loops to Video Editor)...');
  const clientRejectPathARes = await req('POST', `/media/${videoTaskId}/client-decision`, {
    decision: 'DISAPPROVE',
    feedback_type: 'VIDEO_ISSUE',
    notes: 'Please shorten the intro by 2 seconds to hook viewers faster.'
  }, clientToken);
  assert.strictEqual(clientRejectPathARes.ok, true);
  assert.strictEqual(clientRejectPathARes.data.workflow_stage, 'NEEDS_REVISION_VIDEO');
  console.log(`   ✓ Looped back to Video Editor via Path A (Stage: ${clientRejectPathARes.data.workflow_stage})`);

  // Fast forward Path A re-edit & re-approvals
  await req('POST', `/media/${videoTaskId}/editor-submit`, {
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: 'Cut_v3_ShortHook.mp4',
    editor_notes: 'Intro shortened by 2.2 seconds as requested by client.'
  }, editorToken);
  await req('POST', `/media/${videoTaskId}/admin-editor-review`, { decision: 'APPROVE' }, adminToken);
  await req('POST', `/media/${videoTaskId}/smm-submit`, { caption: 'Updated luxury reel.' }, smmToken);
  await req('POST', `/media/${videoTaskId}/admin-smm-review`, { decision: 'APPROVE' }, adminToken);

  // Step 4b: Client Review - Path B (Content / Caption Issue Rejection)
  console.log('1.9 Client Review: DISAPPROVES with Path B (Content Issue -> Loops to SMM)...');
  const clientRejectPathBRes = await req('POST', `/media/${videoTaskId}/client-decision`, {
    decision: 'DISAPPROVE',
    feedback_type: 'CONTENT_ISSUE',
    notes: 'Please mention 20% off festival discount code LUXE20 in the caption.'
  }, clientToken);
  assert.strictEqual(clientRejectPathBRes.ok, true);
  assert.strictEqual(clientRejectPathBRes.data.workflow_stage, 'NEEDS_REVISION_CAPTION');
  console.log(`   ✓ Looped directly to SMM via Path B (Stage: ${clientRejectPathBRes.data.workflow_stage})`);

  // Fast forward Path B re-edit: SMM -> Admin -> Client
  await req('POST', `/media/${videoTaskId}/smm-submit`, {
    caption: 'Elevate your aesthetic with timeless elegance. Use code LUXE20 for 20% off festival special! ✨',
    hashtags: '#LUXE20 #FestivalSale #LuxuryJewelry'
  }, smmToken);
  await req('POST', `/media/${videoTaskId}/admin-smm-review`, { decision: 'APPROVE' }, adminToken);

  // Step 4c: Client Review - Final APPROVE
  console.log('1.10 Client Review: APPROVES Post (Fully Approved / Published)...');
  const clientFinalApproveRes = await req('POST', `/media/${videoTaskId}/client-decision`, {
    decision: 'APPROVE',
    notes: 'Flawless work from both the video editor and copywriter! Fully approved.'
  }, clientToken);
  assert.strictEqual(clientFinalApproveRes.ok, true);
  assert.strictEqual(clientFinalApproveRes.data.workflow_stage, 'APPROVED');
  console.log(`   ✓ Video Post FULLY APPROVED & PUBLISHED! (Stage: ${clientFinalApproveRes.data.workflow_stage})\n`);

  // =========================================================================
  // TEST SECTION 2: WORKFLOW 2 - STATIC, CAROUSEL, FLYER & POSTER
  // =========================================================================
  console.log('--- TEST SECTION 2: Static / Carousel / Flyer / Poster Workflow ---');

  // Step 1: Admin creates Carousel task
  console.log('2.1 Admin creates dedicated Carousel task...');
  const createGraphicRes = await req('POST', '/media/static-task', {
    post_type: 'Carousel',
    task_title: 'Autumn Gemstone Collection 5-Slide Carousel',
    client_id: 1,
    assigned_smm_id: 202, // Priya (SMM)
    due_date: '2026-10-20',
    priority: 'HIGH',
    description: 'Design 5 minimal carousel slides showcasing ruby and emerald collection.',
    target_platforms: 'Instagram, LinkedIn'
  }, adminToken);
  assert.strictEqual(createGraphicRes.status, 201);
  const graphicTaskId = createGraphicRes.data.task.id;
  assert.strictEqual(createGraphicRes.data.task.workflow_stage, 'SMM_DRAFTING');
  console.log(`   ✓ Graphic task created (ID: ${graphicTaskId}, Stage: ${createGraphicRes.data.task.workflow_stage})`);

  // Step 2: SMM uploads 3 slides + drafts copy and submits
  console.log('2.2 SMM uploads carousel slides and copy, submits to Admin...');
  const smmGraphicSubmitRes = await req('POST', `/media/${graphicTaskId}/smm-submit-graphic`, {
    caption: 'Discover the brilliance of genuine rubies & emeralds in our Autumn Gemstone showcase. Swipe & indulge. 💎',
    hashtags: '#Gemstones #FineJewelry #Emeralds #Rubies #AutumnCollection',
    post_notes: 'Curated 5 slides with swipe markers and clear price tags.',
    carousel_slides: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080', name: 'Slide 1 - Ruby Pendant', order: 1 },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080', name: 'Slide 2 - Emerald Ring', order: 2 },
      { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1080', name: 'Slide 3 - Gemstone Choker', order: 3 }
    ])
  }, smmToken);
  assert.strictEqual(smmGraphicSubmitRes.ok, true);
  assert.strictEqual(smmGraphicSubmitRes.data.workflow_stage, 'IN_ADMIN_GRAPHIC_REVIEW');
  console.log(`   ✓ SMM submitted Carousel draft (Stage: ${smmGraphicSubmitRes.data.workflow_stage})`);

  // Step 3a: Admin Review - DISAPPROVES with feedback
  console.log('2.3 Admin Graphic Review: DISAPPROVES (loops back to SMM)...');
  const adminDisapproveGraphicRes = await req('POST', `/media/${graphicTaskId}/admin-graphic-review`, {
    decision: 'DISAPPROVE',
    notes: 'Slide 2 contrast is low on mobile screens, adjust background brightness and make font bolder.'
  }, adminToken);
  assert.strictEqual(adminDisapproveGraphicRes.ok, true);
  assert.strictEqual(adminDisapproveGraphicRes.data.workflow_stage, 'NEEDS_REVISION_SMM');
  console.log(`   ✓ Looped back to SMM (Stage: ${adminDisapproveGraphicRes.data.workflow_stage})`);

  // Step 3b: SMM re-submits updated draft
  console.log('2.4 SMM re-submits updated Carousel draft...');
  const smmGraphicReSubmitRes = await req('POST', `/media/${graphicTaskId}/smm-submit-graphic`, {
    caption: 'Discover the brilliance of genuine rubies & emeralds in our Autumn Gemstone showcase. Swipe & indulge. 💎',
    hashtags: '#Gemstones #FineJewelry #Emeralds #Rubies #AutumnCollection',
    post_notes: 'Contrast boosted by 30% and fonts made bold as instructed.'
  }, smmToken);
  assert.strictEqual(smmGraphicReSubmitRes.ok, true);
  assert.strictEqual(smmGraphicReSubmitRes.data.workflow_stage, 'IN_ADMIN_GRAPHIC_REVIEW');
  console.log(`   ✓ SMM re-submitted updated draft (Stage: ${smmGraphicReSubmitRes.data.workflow_stage})`);

  // Step 3c: Admin Review - APPROVES (publishes to Client)
  console.log('2.5 Admin Graphic Review: APPROVES (publishes to Client)...');
  const adminApproveGraphicRes = await req('POST', `/media/${graphicTaskId}/admin-graphic-review`, {
    decision: 'APPROVE',
    notes: 'Slides look high-impact and typography is readable. Approved for client review.'
  }, adminToken);
  assert.strictEqual(adminApproveGraphicRes.ok, true);
  assert.strictEqual(adminApproveGraphicRes.data.workflow_stage, 'IN_CLIENT_REVIEW');
  console.log(`   ✓ Published to Client Dashboard (Stage: ${adminApproveGraphicRes.data.workflow_stage})`);

  // Step 4a: Client Review - DISAPPROVES with notes (loops to SMM)
  console.log('2.6 Client Review: DISAPPROVES Carousel (loops to SMM)...');
  const clientDisapproveGraphicRes = await req('POST', `/media/${graphicTaskId}/client-graphic-review`, {
    decision: 'DISAPPROVE',
    notes: 'Please add our website URL lara-jewels.com on the last slide.'
  }, clientToken);
  assert.strictEqual(clientDisapproveGraphicRes.ok, true);
  assert.strictEqual(clientDisapproveGraphicRes.data.workflow_stage, 'NEEDS_REVISION_SMM');
  console.log(`   ✓ Looped back to SMM (Stage: ${clientDisapproveGraphicRes.data.workflow_stage})`);

  // Fast forward SMM re-submission and Admin approval
  await req('POST', `/media/${graphicTaskId}/smm-submit-graphic`, {
    caption: 'Discover the brilliance of genuine rubies & emeralds. Visit lara-jewels.com to shop the collection.',
    hashtags: '#LaraJewels #Gemstones #FineJewelry'
  }, smmToken);
  await req('POST', `/media/${graphicTaskId}/admin-graphic-review`, { decision: 'APPROVE' }, adminToken);

  // Step 4b: Client Review - APPROVES (Fully Approved / Published)
  console.log('2.7 Client Review: APPROVES Carousel (Fully Approved / Published)...');
  const clientApproveGraphicRes = await req('POST', `/media/${graphicTaskId}/client-graphic-review`, {
    decision: 'APPROVE',
    notes: 'Looks splendid! Approved to post on Saturday 6 PM.'
  }, clientToken);
  assert.strictEqual(clientApproveGraphicRes.ok, true);
  assert.strictEqual(clientApproveGraphicRes.data.workflow_stage, 'APPROVED');
  console.log(`   ✓ Carousel Post FULLY APPROVED & PUBLISHED! (Stage: ${clientApproveGraphicRes.data.workflow_stage})\n`);

  // =========================================================================
  // TEST SECTION 3: ATTENDANCE TRACKER STRICT RBAC ENFORCEMENT
  // =========================================================================
  console.log('--- TEST SECTION 3: Universal Attendance Tracker RBAC ---');

  // Employee checks own status
  console.log('3.1 Employee (Sales) checks own attendance status (/my-today)...');
  const salesTodayRes = await req('GET', '/attendance/my-today', null, salesToken);
  assert.strictEqual(salesTodayRes.ok, true);
  assert.strictEqual(salesTodayRes.data.employee_id, 201);
  console.log(`   ✓ Isolated to Rahul Sharma (Employee ID: ${salesTodayRes.data.employee_id})`);

  // Employee checks own history (/my-history)
  console.log('3.2 Employee fetches own historical logs (/my-history)...');
  const salesHistoryRes = await req('GET', '/attendance/my-history', null, salesToken);
  assert.strictEqual(salesHistoryRes.ok, true);
  assert.strictEqual(salesHistoryRes.data.employee.id, 201);
  console.log(`   ✓ Isolated to personal logs: ${salesHistoryRes.data.records.length} records returned`);

  // Non-Admin is BLOCKED from accessing master attendance records (/records)
  console.log('3.3 Non-Admin (SMM) attempts to access Admin Master Attendance (/records)...');
  const smmBlockedRes = await req('GET', '/attendance/records', null, smmToken);
  assert.strictEqual(smmBlockedRes.status, 403, `Expected 403 Forbidden, got ${smmBlockedRes.status}`);
  console.log(`   ✓ Correctly blocked with 403 Forbidden!`);

  // Admin accesses master records with search & filter
  console.log('3.4 Admin accesses Master Attendance (/records)...');
  const adminRecordsRes = await req('GET', '/attendance/records?search=Priya', null, adminToken);
  assert.strictEqual(adminRecordsRes.ok, true);
  console.log(`   ✓ Admin accessed master records (${adminRecordsRes.data.records.length} matching entries)`);

  // Admin performs manual adjustment with mandatory justification
  console.log('3.5 Admin performs manual adjustment override with audit justification...');
  const todayDate = new Date().toISOString().split('T')[0];
  const adminAdjustRes = await req('POST', '/attendance/adjust', {
    employee_id: 202, // Priya
    date: todayDate,
    status: 'PRESENT',
    check_in_time: '09:30',
    check_out_time: '18:30',
    total_working_hours: 9.0,
    adjustment_reason: 'System punch missed due to offsite client brand shoot; confirmed by management.'
  }, adminToken);
  assert.strictEqual(adminAdjustRes.ok, true);
  assert.strictEqual(adminAdjustRes.data.record.is_manual_adjusted, 1);
  console.log(`   ✓ Audit-trailed manual adjustment completed (is_manual_adjusted: 1)`);

  // Adjustment fails without reason
  console.log('3.6 Admin adjustment rejected when reason is missing...');
  const adminAdjustNoReasonRes = await req('POST', '/attendance/adjust', {
    employee_id: 202,
    date: todayDate,
    status: 'PRESENT',
    adjustment_reason: ''
  }, adminToken);
  assert.strictEqual(adminAdjustNoReasonRes.status, 400);
  console.log(`   ✓ Mandatory reason strictly enforced (HTTP 400)\n`);

  // =========================================================================
  // TEST SECTION 4: ROLE SPECIFIC MODULES (SALES & CLIENT)
  // =========================================================================
  console.log('--- TEST SECTION 4: Role-Specific Modules ---');

  // Sales Executive Lead Management
  console.log('4.1 Sales Executive creates and tracks lead...');
  const createLeadRes = await req('POST', '/leads', {
    company_name: 'Aurum Luxury Jewels',
    contact_person: 'Vikram Mehta',
    designation: 'Managing Director',
    phone: '+91 98765 43210',
    email: 'vikram.mehta@aurum.in',
    source: 'Website Form',
    status: 'NEW',
    priority: 'HIGH',
    deal_value: 250000
  }, salesToken);
  assert.strictEqual(createLeadRes.status, 201);
  const leadId = createLeadRes.data.lead?.id || createLeadRes.data.id;
  console.log(`   ✓ Lead created (ID: ${leadId}, Code: ${createLeadRes.data.lead?.lead_code || leadId})`);

  // Sales Executive advances pipeline stage
  console.log('4.2 Sales Executive advances deal stage in pipeline...');
  const advancePipelineRes = await req('PUT', `/leads/${leadId}/stage`, {
    stage: 'QUALIFIED'
  }, salesToken);
  assert.strictEqual(advancePipelineRes.ok, true);
  console.log(`   ✓ Pipeline stage progressed to QUALIFIED`);

  // Client fetches visible media items
  console.log('4.3 Client fetches published/in-review deliverables (/media/all)...');
  const clientMediaRes = await req('GET', '/media/all', null, clientToken);
  assert.strictEqual(clientMediaRes.ok, true);
  console.log(`   ✓ Client retrieved ${clientMediaRes.data.length} scoped media items\n`);

  console.log('=====================================================================');
  console.log('✨ ALL 17 E2E INTEGRATION ASSERTIONS PASSED WITH 100% SUCCESS!');
  console.log('=====================================================================');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
