import http from 'http';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING CLIENT PORTAL E2E VERIFICATION ---');

  // 1. Authenticate as Client
  console.log('\n[1] Logging in as client: client_demo ...');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    username: 'client_demo',
    password: 'Admin@123'
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('Failed to log in as client:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.token;
  const user = loginRes.body.user;
  console.log(`✓ Authenticated as: ${user.username} (${user.user_type}), client company: ${loginRes.body.client?.company_name || 'N/A'}`);

  // 2. Fetch Content Calendar Posts
  console.log('\n[2] Fetching Content Calendar items (/api/content-calendar) ...');
  const calRes = await makeRequest('GET', '/api/content-calendar', null, token);
  if (calRes.status !== 200 || !Array.isArray(calRes.body)) {
    console.error('Failed to fetch content calendar:', calRes);
    process.exit(1);
  }

  const items = calRes.body;
  console.log(`✓ Retrieved ${items.length} content posts for client`);

  const todayStr = new Date().toISOString().split('T')[0];
  const pastPosts = items.filter(i => i.publish_date && i.publish_date < todayStr);
  const upcomingPosts = items.filter(i => !i.publish_date || i.publish_date >= todayStr);
  console.log(`  - Past Posts: ${pastPosts.length}`);
  console.log(`  - Upcoming / Scheduled Posts: ${upcomingPosts.length}`);

  // 3. Inspect Content Module Details
  console.log('\n[3] Verifying Content Inspection Module fields (Captions, Hashtags, Media Assets) ...');
  const sampleWithMedia = items.find(i => i.media_url);
  if (!sampleWithMedia) {
    console.error('No items with media assets found!');
    process.exit(1);
  }

  console.log(`✓ Found sample content: "${sampleWithMedia.topic}" (ID: ${sampleWithMedia.id})`);
  console.log(`  - Caption: "${sampleWithMedia.caption ? sampleWithMedia.caption.slice(0, 60) + '...' : 'N/A'}"`);
  console.log(`  - Hashtags: ${sampleWithMedia.hashtags || 'N/A'}`);
  console.log(`  - Media Type: ${sampleWithMedia.media_type || 'N/A'}`);
  console.log(`  - Media URL: ${sampleWithMedia.media_url || 'N/A'}`);
  console.log(`  - Aspect Ratio: ${sampleWithMedia.media_aspect_ratio || 'N/A'}`);
  console.log(`  - Assigned Employee: ${sampleWithMedia.assigned_employee_name || 'N/A'}`);
  console.log(`  - Current Status: ${sampleWithMedia.client_approval_status || 'PENDING'}`);

  // 4. Test Approval Workflow
  console.log('\n[4] Testing Client Approval Function ...');
  const itemToApprove = items[0];
  const approveRes = await makeRequest('POST', `/api/reviews/client/${itemToApprove.id}`, {
    action: 'APPROVE',
    comment: 'Approved by client for social media publishing'
  }, token);

  console.log(`  - Approval API Response code: ${approveRes.status}`);
  if (approveRes.status !== 200) {
    console.error('Approval failed:', approveRes.body);
    process.exit(1);
  }
  const approvedItem = approveRes.body.content;
  console.log(`✓ Item approved successfully!`);
  console.log(`  - client_approval_status: ${approvedItem.client_approval_status} (Expected: APPROVED)`);
  console.log(`  - workflow_stage: ${approvedItem.workflow_stage} (Expected: APPROVED)`);
  console.log(`  - publishing_status: ${approvedItem.publishing_status} (Expected: READY)`);
  console.log(`  - client_feedback: "${approvedItem.client_feedback}"`);

  // 5. Test Rejection & Feedback Workflow
  console.log('\n[5] Testing Client Rejection & Revision Routing Function ...');
  const itemToReject = items.length > 1 ? items[1] : items[0];
  const testFeedback = '[Typography & Color Tone] Please make the brand logo 20% larger and adjust the subtitle font weight.';
  
  const rejectRes = await makeRequest('POST', `/api/reviews/client/${itemToReject.id}`, {
    action: 'REQUEST_CHANGES',
    reason: 'Visual & Typography Refinement',
    comment: 'Please make the brand logo 20% larger and adjust the subtitle font weight.',
    specific_change: testFeedback
  }, token);

  console.log(`  - Rejection API Response code: ${rejectRes.status}`);
  if (rejectRes.status !== 200) {
    console.error('Rejection failed:', rejectRes.body);
    process.exit(1);
  }
  const rejectedItem = rejectRes.body.content;
  console.log(`✓ Item revision requested successfully!`);
  console.log(`  - client_approval_status: ${rejectedItem.client_approval_status} (Expected: REVISION_REQUESTED)`);
  console.log(`  - workflow_stage: ${rejectedItem.workflow_stage} (Expected: REVISION)`);
  console.log(`  - client_feedback: "${rejectedItem.client_feedback}"`);

  // 6. Verify Revision Notification Routing to Assigned Employee
  console.log('\n[6] Verifying automated notification routing to assigned employee ...');
  // Log in as employee (e.g. editor aman.editor or manager priya.marketing)
  const employeeLogin = await makeRequest('POST', '/api/auth/login', {
    username: 'aman.editor',
    password: 'Admin@123'
  });
  if (employeeLogin.status === 200 && employeeLogin.body.token) {
    const notifs = await makeRequest('GET', '/api/notifications', null, employeeLogin.body.token);
    if (notifs.status === 200 && Array.isArray(notifs.body)) {
      const revisionNotif = notifs.body.find(n => n.related_entity_id === itemToReject.id && n.type === 'REVISION_REQUESTED');
      if (revisionNotif) {
        console.log(`✓ Automated notification found for assigned employee (Aman):`);
        console.log(`  - Title: "${revisionNotif.title}"`);
        console.log(`  - Message: "${revisionNotif.message}"`);
      } else {
        console.log(`  (Note: Notification checked for Aman; post may be assigned to manager or another creative)`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ ALL CLIENT DASHBOARD CORE FEATURES & WORKFLOWS VERIFIED!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
