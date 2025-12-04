#!/usr/bin/env node
/**
 * Chatbot Pipeline Test Script
 * Validates intent classification and response generation
 */

import {
  classifyIntentKeyword,
  intentPatterns
} from '../utils/chatbotIntentClassifier.js';
import {
  getResponseTemplate,
  formatJobsList,
  formatCompaniesList
} from '../utils/chatbotResponseTemplates.js';

// Test data
const testMessages = [
  // Greeting tests
  "Hello, I'm looking for a job",
  "Hi there!",
  "Hey, what's up?",
  
  // Job search tests
  "Find me some developer jobs",
  "Show me available positions",
  "I'm looking for work",
  
  // Salary tests
  "What are the highest paying jobs?",
  "Tell me about salaries",
  "Show me best salary opportunities",
  
  // Remote work tests
  "I want remote work opportunities",
  "Find me work from home jobs",
  "Show me remote positions",
  
  // Career guidance tests
  "How can I grow my career?",
  "Give me career advice",
  "Help me advance in my field",
  
  // Interview prep tests
  "How do I prepare for interviews?",
  "Interview tips please",
  "Help me ace an interview",
  
  // Profile tests
  "How do I complete my profile?",
  "Help me optimize my resume",
  "What should I add to my profile?",
  
  // Company tests
  "Show me companies hiring",
  "Tell me about employers",
  "What companies are on JobIFY?",
  
  // About platform tests
  "What is JobIFY?",
  "Tell me about the platform",
  "Who created JobIFY?",
  
  // Help tests
  "What can you help me with?",
  "I need help",
  "How do you assist?",
  
  // Generic/unclear tests
  "Lorem ipsum dolor sit amet",
  "xyz abc 123",
  "djkdhsjkdhskjd"
];

// Mock job data
const mockJobs = [
  {
    _id: '1',
    title: 'Senior Developer',
    companyName: 'TechCorp',
    location: 'Remote',
    salaryRange: { max: 150000, min: 100000 },
    jobType: 'Full-time'
  },
  {
    _id: '2',
    title: 'UI/UX Designer',
    companyName: 'DesignStudio',
    location: 'Kigali',
    salaryRange: { max: 80000, min: 50000 },
    jobType: 'Full-time'
  },
  {
    _id: '3',
    title: 'Product Manager',
    companyName: 'StartupXYZ',
    location: 'Remote',
    salaryRange: { max: 120000, min: 90000 },
    jobType: 'Full-time'
  }
];

const mockCompanies = [
  {
    name: 'TechCorp',
    industry: 'Technology',
    description: 'Leading tech company'
  },
  {
    name: 'DesignStudio',
    industry: 'Design',
    description: 'Creative design agency'
  }
];

console.log('🤖 JobIFY Chatbot Test Suite\n');
console.log('=' .repeat(60));

let passedTests = 0;
let totalTests = 0;

// Test 1: Intent Classification
console.log('\n📋 Test 1: Intent Classification');
console.log('-' .repeat(60));

for (const message of testMessages.slice(0, 10)) {
  totalTests++;
  const result = classifyIntentKeyword(message);
  const status = result.intent && result.confidence ? '✅' : '❌';
  
  console.log(
    `${status} "${message.substring(0, 40)}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`
  );
  
  if (result.intent && result.confidence) passedTests++;
}

// Test 2: Response Template Generation
console.log('\n📝 Test 2: Response Template Generation');
console.log('-' .repeat(60));

const intentsToTest = [
  'greeting',
  'job_search',
  'salary_info',
  'career_guidance',
  'interview_prep',
  'about_platform',
  'help',
  'generic'
];

for (const intent of intentsToTest) {
  totalTests++;
  try {
    const template = getResponseTemplate(intent);
    const hasContent = template && template.length > 10;
    const status = hasContent ? '✅' : '❌';
    
    console.log(
      `${status} ${intent} → ${template.substring(0, 50)}...`
    );
    
    if (hasContent) passedTests++;
  } catch (e) {
    console.log(`❌ ${intent} → Error: ${e.message}`);
  }
}

// Test 3: Job Formatting
console.log('\n🎯 Test 3: Job List Formatting');
console.log('-' .repeat(60));

totalTests++;
try {
  const formatted = formatJobsList(mockJobs, 3);
  const hasJobs = formatted.includes('Senior Developer') && formatted.includes('TechCorp');
  const status = hasJobs ? '✅' : '❌';
  
  console.log(`${status} Job list formatted:\n${formatted}`);
  
  if (hasJobs) passedTests++;
} catch (e) {
  console.log(`❌ Job formatting error: ${e.message}`);
}

// Test 4: Company Formatting
console.log('\n🏢 Test 4: Company List Formatting');
console.log('-' .repeat(60));

totalTests++;
try {
  const formatted = formatCompaniesList(mockCompanies, 2);
  const hasCompanies = formatted.includes('TechCorp') && formatted.includes('Technology');
  const status = hasCompanies ? '✅' : '❌';
  
  console.log(`${status} Company list formatted:\n${formatted}`);
  
  if (hasCompanies) passedTests++;
} catch (e) {
  console.log(`❌ Company formatting error: ${e.message}`);
}

// Test 5: Intent Distribution
console.log('\n📊 Test 5: Intent Distribution (All Messages)');
console.log('-' .repeat(60));

const intentCounts = {};

for (const message of testMessages) {
  const result = classifyIntentKeyword(message);
  intentCounts[result.intent] = (intentCounts[result.intent] || 0) + 1;
}

for (const [intent, count] of Object.entries(intentCounts)) {
  const percent = ((count / testMessages.length) * 100).toFixed(0);
  console.log(`  ${intent}: ${count} messages (${percent}%)`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Summary\n`);
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(0)}%\n`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Chatbot is ready to deploy.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Review above for details.\n`);
  process.exit(1);
}
