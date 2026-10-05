import jwt from 'jsonwebtoken';

const JWT_SECRET = 'zentra-enterprise-jwt-secret-key-2026';
const BASE_URL = 'http://localhost:5000/api';

const adminToken = jwt.sign({ id: 1, role: 'admin', user_type: 'admin', username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const editorToken = jwt.sign({ id: 203, role: 'editor', user_type: 'employee', username: 'aman' }, JWT_SECRET, { expiresIn: '1h' });

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

async function run() {
  console.log('--- TESTING STATIC POST ISOLATION FROM RAW VIDEO WORKFLOW ---');

  // 1. Admin creates a Static Post
  const staticTaskTitle = `Static Brand Post Isolation Test ${Date.now()}`;
  const createTaskRes = await req('POST', '/media/static-task', {
    post_type: 'Static Post',
    task_title: staticTaskTitle,
    client_id: 1,
    due_date: '2026-10-15',
    priority: 'HIGH',
    description: 'Promotional static creative isolation verification'
  }, adminToken);

  console.log('1. Admin created Static Post:', createTaskRes.status, createTaskRes.data.task?.task_code);
  const createdTaskId = createTaskRes.data.task?.id;

  // 2. Video Editor queries tasks
  const editorFeed = await req('GET', '/media/all', null, editorToken);
  const editorItems = Array.isArray(editorFeed.data) ? editorFeed.data : [];
  const leakedToEditor = editorItems.find(t => t.id === createdTaskId || t.task_title === staticTaskTitle);

  console.log(`2. Video Editor tasks returned: ${editorItems.length}`);
  if (leakedToEditor) {
    console.error('❌ FAILURE: Static Post leaked into Video Editor tasks!', leakedToEditor);
    process.exit(1);
  } else {
    console.log('✓ PASS: Static Post is completely excluded from Video Editor feed!');
  }

  // 3. Query with explicit workflow_type=video (used by Video Editor Dashboard & Admin Pillar 1)
  const videoOnlyFeed = await req('GET', '/media/all?workflow_type=video', null, adminToken);
  const videoItems = Array.isArray(videoOnlyFeed.data) ? videoOnlyFeed.data : [];
  const leakedToVideoFeed = videoItems.find(t => t.id === createdTaskId || t.task_title === staticTaskTitle);

  if (leakedToVideoFeed) {
    console.error('❌ FAILURE: Static Post appeared in workflow_type=video query!', leakedToVideoFeed);
    process.exit(1);
  } else {
    console.log('✓ PASS: Static Post is strictly excluded from workflow_type=video query!');
  }

  // 4. Query with workflow_type=graphic (used by SMM Graphic Studio)
  const graphicFeed = await req('GET', '/media/all?workflow_type=graphic', null, adminToken);
  const graphicItems = Array.isArray(graphicFeed.data) ? graphicFeed.data : [];
  const foundInGraphic = graphicItems.find(t => t.id === createdTaskId || t.task_title === staticTaskTitle);

  if (!foundInGraphic) {
    console.error('❌ FAILURE: Static Post not found in graphic workflow feed!');
    process.exit(1);
  } else {
    console.log('✓ PASS: Static Post is correctly routed to Graphic Workflow (Stage: ' + foundInGraphic.workflow_stage + ')!');
  }

  console.log('\n🎉 ALL ISOLATION TESTS PASSED: Static Posts NEVER reflect into Raw Video Workflow!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
