const axios = require('axios');

async function testPipeline() {
  console.log('[Test 1] Logging in as researcher...');
  const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
    email: 'researcher@geovision.ai',
    password: 'Researcher@12345',
  });
  console.log('Login success:', loginRes.data.success, 'Token received.');
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('\n[Test 2] Seeding demo Sentinel-2 10m scene with UTM coordinates...');
  const seedRes = await axios.post('http://127.0.0.1:5000/api/demo/seed', {}, { headers });
  console.log('Seeded scene:', seedRes.data.image.originalFilename, 'ID:', seedRes.data.image._id);
  console.log('Geospatial CRS:', seedRes.data.image.crs, 'Resolution:', seedRes.data.image.sourceResolution + 'm');
  const imageId = seedRes.data.image._id;

  console.log('\n[Test 3] Starting 4x Super-Resolution Mapping Job...');
  const startRes = await axios.post('http://127.0.0.1:5000/api/processing/start', {
    imageId: imageId,
    scaleFactor: 4,
  }, { headers });
  console.log('Job Started:', startRes.data.jobId, 'Target Spacing:', startRes.data.targetPixelSpacingEstimate);
  const jobId = startRes.data.jobId;

  console.log('\n[Test 4] Polling job execution status...');
  let completed = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const statusRes = await axios.get(`http://127.0.0.1:5000/api/processing/jobs/${jobId}/status`, { headers });
    console.log(`Poll [${i+1}] - Status: ${statusRes.data.status} | Progress: ${statusRes.data.progress}%`);
    if (statusRes.data.status === 'completed') {
      completed = true;
      break;
    }
    if (statusRes.data.status === 'failed') {
      console.error('Job failed:', statusRes.data.errorMessage);
      break;
    }
  }

  if (completed) {
    console.log('\n[Test 5] Fetching final validation report & output metadata...');
    const resultRes = await axios.get(`http://127.0.0.1:5000/api/results/${jobId}`, { headers });
    console.log('Enhanced Dimensions:', resultRes.data.job.outputWidth + 'x' + resultRes.data.job.outputHeight);
    console.log('Validation status:', resultRes.data.validation.statusMessage);
    console.log('Uncertainty Advisory:', resultRes.data.validation.uncertaintyNotes);
    console.log('Output GeoTIFF URL:', resultRes.data.job.outputGeoTiffUrl);
    console.log('\n>>> PIPELINE TEST PASSED 100% SUCCESFULLY! <<<');
  }
}

testPipeline().catch(console.error);
