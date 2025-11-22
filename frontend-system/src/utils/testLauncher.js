import testRunnerModule from '../utils/testRunner.js';

/**
 * Test Launcher Component
 * Add this to your App.jsx to enable automated testing
 * 
 * Usage in browser console:
 *   window.runTests()  // Run all tests
 *   window.runTests.backend()  // Run specific suite
 */

export const attachTestRunner = () => {
  // Attach to window for console access
  window.runTests = testRunnerModule.runAllTests;
  window.runTests.backend = testRunnerModule.testBackendConnectivity;
  window.runTests.profile = testRunnerModule.testProfileManagement;
  window.runTests.documents = testRunnerModule.testDocumentManagement;
  window.runTests.components = testRunnerModule.testFrontendComponents;
  window.runTests.routing = testRunnerModule.testRouting;
  window.runTests.api = testRunnerModule.testAPIEndpoints;
  window.runTests.getResults = () => window.__TEST_RESULTS__;

  console.log('✅ Test Runner attached to window');
  console.log('📝 Available commands:');
  console.log('   • window.runTests()           - Run all tests');
  console.log('   • window.runTests.backend()   - Test backend connectivity');
  console.log('   • window.runTests.profile()   - Test profile management');
  console.log('   • window.runTests.documents() - Test document management');
  console.log('   • window.runTests.components()- Test frontend components');
  console.log('   • window.runTests.routing()   - Test routing');
  console.log('   • window.runTests.api()       - Test API endpoints');
  console.log('   • window.runTests.getResults()- Get test results\n');
};

// Auto-attach on import if in development
if (process.env.NODE_ENV === 'development') {
  attachTestRunner();
}

export default attachTestRunner;
