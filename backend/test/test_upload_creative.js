import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = 'zentra-enterprise-jwt-secret-key-2026';
const smmToken = jwt.sign({ id: 202, role: 'marketing_manager', user_type: 'employee', username: 'priya' }, JWT_SECRET, { expiresIn: '1h' });

async function testUpload() {
  console.log('--- TESTING SMM CREATIVE IMAGE UPLOAD ---');

  // Create dummy image buffer (1x1 PNG)
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const tempImagePath = path.join(process.cwd(), 'temp_test_image.png');
  fs.writeFileSync(tempImagePath, png1x1);

  try {
    const blob = new Blob([png1x1], { type: 'image/png' });
    const formData = new FormData();
    formData.append('images', blob, 'brand_flyer_creative.png');

    const res = await fetch('http://localhost:5000/api/media/upload-creative', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smmToken}`
      },
      body: formData
    });

    const data = await res.json();
    console.log('Upload response status:', res.status, data);

    if (res.ok && data.success && data.file && data.file.url) {
      console.log('✓ PASS: Image uploaded successfully to URL:', data.file.url);
      console.log('✓ File name:', data.file.name);
    } else {
      console.error('❌ FAIL: Upload failed or invalid response format', data);
      process.exit(1);
    }

    // Verify uploaded file is accessible via GET
    const fileRes = await fetch(`http://localhost:5000${data.file.url}`);
    console.log('Static file fetch status:', fileRes.status);
    if (fileRes.status === 200) {
      console.log('✓ PASS: Uploaded image is statically served and accessible for live preview!');
    } else {
      console.error('❌ FAIL: Uploaded image could not be fetched statically');
      process.exit(1);
    }
  } finally {
    if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
  }

  console.log('\n🎉 ALL SMM CREATIVE IMAGE UPLOAD TESTS PASSED!');
}

testUpload().catch(err => {
  console.error(err);
  process.exit(1);
});
