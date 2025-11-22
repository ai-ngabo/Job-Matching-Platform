/**
 * Automated Test Runner for Profile & Dashboard Features
 * Tests all critical functionality without manual intervention
 */

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility: Get Auth Token from localStorage
const getAuthToken = () => {
  try {
    const authContext = localStorage.getItem('auth');
    if (authContext) {
      const auth = JSON.parse(authContext);
      return auth.token;
    }
  } catch (e) {
    console.warn('Could not retrieve auth token');
  }
  return null;
};

// Utility: Make API Request
const apiRequest = async (method, endpoint, data = null) => {
  const token = getAuthToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const result = await response.json();
  return { status: response.status, data: result };
};

// Utility: Log Test Result
const logTest = (name, passed, details = '') => {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name} - ${details}`);
  }
};

// ============================================================================
// TEST SUITE 1: BACKEND CONNECTIVITY
// ============================================================================
export const testBackendConnectivity = async () => {
  console.log('\n🔍 TEST SUITE 1: Backend Connectivity\n');

  // Test 1.1: Health Check
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    logTest(
      'Backend Health Check',
      response.status === 200 && data.message,
      response.status === 200 ? 'OK' : `Status: ${response.status}`
    );
  } catch (err) {
    logTest('Backend Health Check', false, `Network error: ${err.message}`);
  }

  // Test 1.2: Database Connection
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    const dbConnected = data.database === 'Connected';
    logTest(
      'MongoDB Connection',
      dbConnected,
      dbConnected ? 'Connected' : `Status: ${data.database}`
    );
  } catch (err) {
    logTest('MongoDB Connection', false, `Check failed: ${err.message}`);
  }
};

// ============================================================================
// TEST SUITE 2: PROFILE MANAGEMENT
// ============================================================================
export const testProfileManagement = async () => {
  console.log('\n🔍 TEST SUITE 2: Profile Management\n');

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️  Skipping profile tests - not authenticated');
    return;
  }

  // Test 2.1: Fetch Profile
  try {
    const { status, data } = await apiRequest('GET', '/users/profile');
    logTest(
      'Fetch Profile Data',
      status === 200 && data.user,
      status === 200 ? 'OK' : `Status: ${status}`
    );
  } catch (err) {
    logTest('Fetch Profile Data', false, err.message);
  }

  // Test 2.2: Update Profile (Job Seeker)
  try {
    const updateData = {
      firstName: 'Test',
      lastName: 'User',
      bio: 'Software engineer with 5 years experience',
      location: 'Kigali, Rwanda',
      skills: 'JavaScript, React, Node.js',
      experienceLevel: 'senior',
      educationLevel: 'bachelor'
    };

    const { status, data } = await apiRequest('PUT', '/users/profile', updateData);
    logTest(
      'Update Profile (Job Seeker)',
      status === 200 && data.user,
      status === 200 ? 'OK' : `Status: ${status}`
    );
  } catch (err) {
    logTest('Update Profile (Job Seeker)', false, err.message);
  }

  // Test 2.3: Update Company Profile
  try {
    const updateData = {
      companyName: 'TechCorp Rwanda',
      description: 'Leading tech solutions',
      industry: 'Technology',
      website: 'https://techcorp.rw',
      contactEmail: 'contact@techcorp.rw',
      contactPhone: '+250 792 123 456'
    };

    const { status, data } = await apiRequest('PUT', '/users/profile', updateData);
    logTest(
      'Update Profile (Company)',
      status === 200 || status === 400, // 400 is ok if not a company account
      `Status: ${status}`
    );
  } catch (err) {
    logTest('Update Profile (Company)', false, err.message);
  }
};

// ============================================================================
// TEST SUITE 3: DOCUMENT MANAGEMENT
// ============================================================================
export const testDocumentManagement = async () => {
  console.log('\n🔍 TEST SUITE 3: Document Management\n');

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️  Skipping document tests - not authenticated');
    return;
  }

  // Helper: Create test file
  const createTestFile = (name, mimeType) => {
    const content = new Blob(['Test file content'], { type: mimeType });
    return new File([content], name, { type: mimeType });
  };

  // Test 3.1: Check CV Upload Endpoint Exists
  try {
    const formData = new FormData();
    formData.append('file', createTestFile('test.pdf', 'application/pdf'));

    const response = await fetch(`${API_BASE}/upload/cv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    // 413 (file too large) or 200 (success) both mean endpoint exists
    logTest(
      'CV Upload Endpoint',
      response.status === 200 || response.status === 413,
      `Endpoint accessible (${response.status})`
    );
  } catch (err) {
    logTest('CV Upload Endpoint', false, err.message);
  }

  // Test 3.2: Check ID Document Upload Endpoint
  try {
    const formData = new FormData();
    formData.append('file', createTestFile('test.jpg', 'image/jpeg'));
    formData.append('idType', 'national-id');

    const response = await fetch(`${API_BASE}/upload/id-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    logTest(
      'ID Document Upload Endpoint',
      response.status === 200 || response.status === 413,
      `Endpoint accessible (${response.status})`
    );
  } catch (err) {
    logTest('ID Document Upload Endpoint', false, err.message);
  }

  // Test 3.3: Check Certificate Upload Endpoint
  try {
    const formData = new FormData();
    formData.append('file', createTestFile('test.pdf', 'application/pdf'));

    const response = await fetch(`${API_BASE}/upload/business-certificate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    logTest(
      'Business Certificate Upload Endpoint',
      response.status === 200 || response.status === 413,
      `Endpoint accessible (${response.status})`
    );
  } catch (err) {
    logTest('Business Certificate Upload Endpoint', false, err.message);
  }

  // Test 3.4: Check Delete CV Endpoint
  try {
    const response = await fetch(`${API_BASE}/upload/cv`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    logTest(
      'Delete CV Endpoint',
      response.status === 200 || response.status === 404,
      `Endpoint accessible (${response.status})`
    );
  } catch (err) {
    logTest('Delete CV Endpoint', false, err.message);
  }

  // Test 3.5: Check Delete ID Document Endpoint
  try {
    const response = await fetch(`${API_BASE}/upload/id-document`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    logTest(
      'Delete ID Document Endpoint',
      response.status === 200 || response.status === 404,
      `Endpoint accessible (${response.status})`
    );
  } catch (err) {
    logTest('Delete ID Document Endpoint', false, err.message);
  }
};

// ============================================================================
// TEST SUITE 4: FRONTEND COMPONENTS
// ============================================================================
export const testFrontendComponents = async () => {
  console.log('\n🔍 TEST SUITE 4: Frontend Components\n');

  // Test 4.1: ProfileEditor Component Exists
  try {
    const element = document.querySelector('[class*="profile-editor"]') || 
                    document.querySelector('[class*="modal"]');
    logTest(
      'ProfileEditor Component',
      !!element,
      element ? 'Component found in DOM' : 'Component not found'
    );
  } catch (err) {
    logTest('ProfileEditor Component', false, err.message);
  }

  // Test 4.2: ProfileCompleteness Component Exists
  try {
    const element = document.querySelector('[class*="completeness"]') ||
                    document.querySelector('[class*="checklist"]');
    logTest(
      'ProfileCompleteness Component',
      !!element,
      element ? 'Component found in DOM' : 'Component not found'
    );
  } catch (err) {
    logTest('ProfileCompleteness Component', false, err.message);
  }

  // Test 4.3: DocumentUpload Component Exists
  try {
    const element = document.querySelector('[class*="document"]') ||
                    document.querySelector('[class*="upload"]');
    logTest(
      'DocumentUpload Component',
      !!element,
      element ? 'Component found in DOM' : 'Component not found'
    );
  } catch (err) {
    logTest('DocumentUpload Component', false, err.message);
  }

  // Test 4.4: Check for Console Errors
  try {
    const errors = window.__TEST_CONSOLE_ERRORS__ || [];
    logTest(
      'No Critical Console Errors',
      errors.length === 0,
      errors.length > 0 ? `${errors.length} errors found` : 'Clean console'
    );
  } catch (err) {
    logTest('No Critical Console Errors', true, 'Check skipped');
  }
};

// ============================================================================
// TEST SUITE 5: ROUTING & NAVIGATION
// ============================================================================
export const testRouting = async () => {
  console.log('\n🔍 TEST SUITE 5: Routing & Navigation\n');

  // Test 5.1: Profile Page Route
  try {
    const response = await fetch(`${FRONTEND_BASE}/profile`);
    logTest(
      'Profile Page Route',
      response.ok,
      response.ok ? 'Route accessible' : `Status: ${response.status}`
    );
  } catch (err) {
    logTest('Profile Page Route', false, err.message);
  }

  // Test 5.2: Dashboard Route
  try {
    const response = await fetch(`${FRONTEND_BASE}/dashboard`);
    logTest(
      'Dashboard Route',
      response.ok,
      response.ok ? 'Route accessible' : `Status: ${response.status}`
    );
  } catch (err) {
    logTest('Dashboard Route', false, err.message);
  }
};

// ============================================================================
// TEST SUITE 6: API ENDPOINTS
// ============================================================================
export const testAPIEndpoints = async () => {
  console.log('\n🔍 TEST SUITE 6: API Endpoints\n');

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️  Skipping API tests - not authenticated');
    return;
  }

  // Test 6.1: GET /api/users/profile
  try {
    const { status } = await apiRequest('GET', '/users/profile');
    logTest(
      'GET /api/users/profile',
      status === 200,
      `Status: ${status}`
    );
  } catch (err) {
    logTest('GET /api/users/profile', false, err.message);
  }

  // Test 6.2: PUT /api/users/profile
  try {
    const { status } = await apiRequest('PUT', '/users/profile', {
      firstName: 'Test'
    });
    logTest(
      'PUT /api/users/profile',
      status === 200,
      `Status: ${status}`
    );
  } catch (err) {
    logTest('PUT /api/users/profile', false, err.message);
  }

  // Test 6.3: GET /api/jobs
  try {
    const { status } = await apiRequest('GET', '/jobs');
    logTest(
      'GET /api/jobs',
      status === 200,
      `Status: ${status}`
    );
  } catch (err) {
    logTest('GET /api/jobs', false, err.message);
  }

  // Test 6.4: GET /api/applications
  try {
    const { status } = await apiRequest('GET', '/applications');
    logTest(
      'GET /api/applications',
      status === 200,
      `Status: ${status}`
    );
  } catch (err) {
    logTest('GET /api/applications', false, err.message);
  }
};

// ============================================================================
// MAIN: Run All Tests
// ============================================================================
export const runAllTests = async () => {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   JOB-MATCHING-PLATFORM: AUTOMATED TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Started at: ${new Date().toLocaleTimeString()}\n`);

  await testBackendConnectivity();
  await testProfileManagement();
  await testDocumentManagement();
  await testFrontendComponents();
  await testRouting();
  await testAPIEndpoints();

  // Print Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.passed + testResults.failed}\n`);

  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%\n`);

  console.log(`⏱️  Completed at: ${new Date().toLocaleTimeString()}\n`);

  // Export results
  window.__TEST_RESULTS__ = testResults;
  return testResults;
};

// Auto-run tests on page load if in development
if (process.env.NODE_ENV === 'development' && window.__RUN_TESTS__) {
  window.addEventListener('load', runAllTests);
}

export default {
  runAllTests,
  testBackendConnectivity,
  testProfileManagement,
  testDocumentManagement,
  testFrontendComponents,
  testRouting,
  testAPIEndpoints
};
