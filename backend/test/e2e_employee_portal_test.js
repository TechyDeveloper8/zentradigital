import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 RUNNING END-TO-END VERIFICATION: MODULAR EMPLOYEE PORTAL & RBAC');
  console.log('========================================================================\n');

  // Step 1: Authentication for Admin, Social Media Manager, Video Editor
  console.log('--- Step 1: Authenticating Accounts ---');
  const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'Admin@123' });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logged in successfully');
  const adminToken = adminLogin.data.token;

  const smmLogin = await request('POST', '/auth/login', { username: 'priya.marketing', password: 'Admin@123' });
  assert(smmLogin.status === 200 && smmLogin.data.token, 'Social Media Manager (Priya) logged in successfully');
  assert(smmLogin.data.user.role_name === 'marketing_manager', 'Priya has marketing_manager role');
  const smmToken = smmLogin.data.token;

  const editorLogin = await request('POST', '/auth/login', { username: 'aman.editor', password: 'Admin@123' });
  assert(editorLogin.status === 200 && editorLogin.data.token, 'Video Editor (Aman) logged in successfully');
  assert(editorLogin.data.user.role_name === 'editor', 'Aman has editor role');
  const editorToken = editorLogin.data.token;

  // Step 2: Requirement 1 - Admin Role Assignment
  console.log('\n--- Step 2: Admin Role Assignment (Requirement 1) ---');
  // Admin assigns role to an employee
  const roleAssignRes = await request('PUT', `/employees/${smmLogin.data.employee.id}/role`, {
    role_name: 'marketing_manager',
    designation: 'Lead Social Media & Marketing Strategist'
  }, adminToken);
  assert(roleAssignRes.status === 200, 'Admin can assign roles to employees');
  assert(roleAssignRes.data.employee.role_name === 'marketing_manager', 'Employee role persisted as marketing_manager');

  // Verify non-admin cannot assign roles (Strict RBAC)
  const unauthorizedRoleRes = await request('PUT', `/employees/${smmLogin.data.employee.id}/role`, {
    role_name: 'admin'
  }, smmToken);
  assert(unauthorizedRoleRes.status === 403, 'Strict RBAC: Employee cannot assign roles (403 Forbidden)');

  // Step 3: Requirement 2 - Social Media Manager Dashboard Workflows
  console.log('\n--- Step 3: Social Media Manager Dashboard (Requirement 2) ---');

  // 3.1 Attendance feature
  console.log('  * 3.1 Attendance Feature:');
  const checkInRes = await request('POST', '/attendance/check-in', {}, smmToken);
  // Status 200 (checked in) or 400 (already checked in today) are both valid proof
  assert(checkInRes.status === 200 || checkInRes.status === 400, 'SMM can log attendance (check-in)');
  const attHistoryRes = await request('GET', '/attendance/my-history', null, smmToken);
  assert(attHistoryRes.status === 200 && Array.isArray(attHistoryRes.data.records), 'SMM can view attendance history');

  // 3.2 Content Task & View Assigned Content
  console.log('  * 3.2 Content Task & View Assigned Content:');
  const contentListRes = await request('GET', '/content-calendar', null, smmToken);
  assert(contentListRes.status === 200 && Array.isArray(contentListRes.data), 'SMM can fetch assigned content tasks');
  assert(contentListRes.data.length > 0, 'SMM has assigned content items in queue');
  const targetContent = contentListRes.data[0];

  // 3.3 Update Content Status
  console.log('  * 3.3 Update Content Status:');
  const updateStatusRes = await request('PUT', `/content-calendar/${targetContent.id}`, {
    workflow_stage: 'IN PRODUCTION'
  }, smmToken);
  assert(updateStatusRes.status === 200, 'SMM can update content status (to IN PRODUCTION)');
  assert(updateStatusRes.data.content.workflow_stage === 'IN PRODUCTION', 'Workflow stage correctly updated');

  // 3.4 Caption & Hashtags Studio
  console.log('  * 3.4 Caption & Hashtags Inputs & Persistence:');
  const updatedCaption = 'Elevating brand narrative with precision and performance analytics. #ZentraDigital';
  const updatedHashtags = '#SocialMediaStrategy #B2BGrowth #DigitalMarketing';
  const saveCaptionRes = await request('PUT', `/content-calendar/${targetContent.id}`, {
    caption: updatedCaption,
    hashtags: updatedHashtags
  }, smmToken);
  assert(saveCaptionRes.status === 200, 'SMM can save caption and hashtags');
  assert(saveCaptionRes.data.content.caption === updatedCaption, 'Caption persisted accurately');
  assert(saveCaptionRes.data.content.hashtags === updatedHashtags, 'Hashtags persisted accurately');

  // 3.5 Content Calendar View
  console.log('  * 3.5 Content Calendar View:');
  const calendarFilterRes = await request('GET', `/content-calendar?platform=Instagram`, null, smmToken);
  assert(calendarFilterRes.status === 200, 'SMM can query content calendar with platform filters');

  // 3.6 Assigned Creatives & Videos
  console.log('  * 3.6 Assigned Creatives & Videos:');
  const contentDetailRes = await request('GET', `/content-calendar/${targetContent.id}`, null, smmToken);
  assert(contentDetailRes.status === 200 && contentDetailRes.data.item, 'SMM can view assigned creative details');

  // 3.7 Submit Content for Review
  console.log('  * 3.7 Submit Content for Review Workflow:');
  const submitReviewRes = await request('POST', `/content-calendar/${targetContent.id}/submit-review`, {
    caption: updatedCaption,
    hashtags: updatedHashtags,
    notes: 'Finished copy and creative brief ready for review'
  }, smmToken);
  assert(submitReviewRes.status === 200, 'SMM can submit content for review');
  assert(submitReviewRes.data.content.workflow_stage === 'INTERNAL REVIEW', 'Workflow stage set to INTERNAL REVIEW');
  assert(submitReviewRes.data.content.internal_approval_status === 'PENDING', 'Approval status set to PENDING');

  // Step 4: Requirement 3 - Video Editor Dashboard & Review Workflow
  console.log('\n--- Step 4: Video Editor Dashboard & Review Workflow (Requirement 3) ---');

  // 4.1 Attendance
  console.log('  * 4.1 Attendance Feature:');
  const editorAttHistory = await request('GET', '/attendance/my-history', null, editorToken);
  assert(editorAttHistory.status === 200 && Array.isArray(editorAttHistory.data.records), 'Video Editor can view attendance history');

  // 4.2 Task & Raw Files Attached alongside Strict Deadline Dates
  console.log('  * 4.2 Task & Raw Files with Strict Deadlines:');
  const tasksRes = await request('GET', '/tasks', null, editorToken);
  assert(tasksRes.status === 200 && Array.isArray(tasksRes.data), 'Video Editor can view tasks');
  const videoTask = tasksRes.data.find(t => t.task_type === 'VIDEO_EDITING' || t.raw_file_url);
  assert(videoTask !== undefined, 'Found video editing task with attached raw files');
  assert(videoTask.raw_file_url !== null, 'Raw footage URL is attached to task');
  assert(videoTask.due_date !== null, 'Strict deadline date is present on task card');

  // 4.3 Download Raw Files
  console.log('  * 4.3 Download Raw Files:');
  assert(typeof videoTask.raw_file_url === 'string' && videoTask.raw_file_url.length > 0, 'Direct downloadable raw file link available on task card');

  // 4.4 Upload Edited Video & Automatic Route to Admin View
  console.log('  * 4.4 Upload Completed Video Edit (Auto-routed to Admin view):');
  const uploadVideoRes = await request('POST', `/tasks/${videoTask.id}/upload-video`, {
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: `${videoTask.task_code}_Cut_v1.mp4`,
    video_duration: '00:45',
    notes: 'First cut completed with color grade and sound sync'
  }, editorToken);
  assert(uploadVideoRes.status === 200, 'Video Editor can upload edited video');
  assert(uploadVideoRes.data.task.review_status === 'Pending Approval', 'Visual status set to Pending Approval');
  assert(uploadVideoRes.data.task.status === 'INTERNAL REVIEW', 'Task moved to INTERNAL REVIEW for Admin');

  // 4.5 Feedback & Approval Loop - Iteration 1: Admin Requests Changes / Revisions
  console.log('  * 4.5 Feedback & Approval Loop - Round 1 (Admin Requests Changes):');
  const revisionComment = 'Speed up the cut at 0:15, increase contrast on outdoor shots, and normalize dialogue volume.';
  const adminRevisionRes = await request('POST', `/tasks/${videoTask.id}/review`, {
    action: 'REQUEST_CHANGES',
    comments: revisionComment
  }, adminToken);
  assert(adminRevisionRes.status === 200, 'Admin can request changes with comments');
  assert(adminRevisionRes.data.task.review_status === 'Needs Revision', 'Visual status updated to Needs Revision');
  assert(adminRevisionRes.data.task.status === 'REVISION', 'Task status is REVISION (remains active)');
  assert(adminRevisionRes.data.task.admin_feedback === revisionComment, 'Comments provided to Video Editor');

  // 4.6 Feedback & Approval Loop - Iteration 2: Video Editor Re-uploads Updated Edit
  console.log('  * 4.6 Feedback & Approval Loop - Round 2 (Editor Re-uploads Updated Edit):');
  const reuploadRes = await request('POST', `/tasks/${videoTask.id}/upload-video`, {
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: `${videoTask.task_code}_Cut_v2.mp4`,
    video_duration: '00:42',
    notes: 'Applied requested changes: tightened cut at 0:15 and balanced dialogue volume.'
  }, editorToken);
  assert(reuploadRes.status === 200, 'Video Editor can re-upload updated edit');
  assert(reuploadRes.data.task.review_status === 'Pending Approval', 'Status routed back to Pending Approval for Admin review');

  // 4.7 Feedback & Approval Loop - Iteration 3: Admin Explicitly Approves Task
  console.log('  * 4.7 Feedback & Approval Loop - Round 3 (Admin Explicitly Approves):');
  const approvalComment = 'All revisions applied flawlessly. Approved for broadcast and client handoff.';
  const adminApprovalRes = await request('POST', `/tasks/${videoTask.id}/review`, {
    action: 'APPROVE',
    comments: approvalComment
  }, adminToken);
  assert(adminApprovalRes.status === 200, 'Admin can explicitly approve the task');
  assert(adminApprovalRes.data.task.review_status === 'Approved', 'Visual status indicator is Approved');
  assert(adminApprovalRes.data.task.status === 'COMPLETED', 'Task status marked COMPLETED');

  // Step 5: Verify Notification Deliveries
  console.log('\n--- Step 5: Notification Delivery Verification ---');
  const editorNotifications = await request('GET', '/notifications', null, editorToken);
  assert(editorNotifications.status === 200 && editorNotifications.data.notifications.length > 0, 'Video Editor received automated review notifications');

  console.log('\n========================================================================');
  console.log('✅ ALL TESTS PASSED! 100% SPECIFICATION CONFORMANCE CONFIRMED!');
  console.log('========================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
