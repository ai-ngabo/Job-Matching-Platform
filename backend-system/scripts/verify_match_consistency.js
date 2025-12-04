/*
  Run this script from the backend root to compare AI scores between company and jobseeker endpoints.
  Usage (PowerShell):
    $env:API_BASE='http://localhost:5000/api'; $env:COMPANY_TOKEN='Bearer ...'; $env:SEEKER_TOKEN='Bearer ...'; node scripts/verify_match_consistency.js --jobId=<JOB_ID> --appId=<APPLICATION_ID>

  The script requires:
   - API_BASE (default http://localhost:5000/api)
   - COMPANY_TOKEN (full bearer token without 'Bearer ' prefix is okay)
   - SEEKER_TOKEN
*/

import axios from 'axios';
import process from 'process';

const argv = require('yargs').argv;
const apiBase = process.env.API_BASE || 'http://localhost:5000/api';
const companyToken = process.env.COMPANY_TOKEN || '';
const seekerToken = process.env.SEEKER_TOKEN || '';
  import yargs from 'yargs/yargs';
  import { hideBin } from 'yargs/helpers';
  const argv = yargs(hideBin(process.argv)).argv;
const jobId = argv.jobId || argv.j;
const appId = argv.appId || argv.a || argv.appId;

if (!jobId || !appId) {
  console.error('Please provide --jobId and --appId');
  process.exit(1);
}

(async () => {
  try {
    console.log('API Base:', apiBase);
    // Job seeker match score
    const seekerRes = await axios.get(`${apiBase}/ai/match-score/${jobId}`, {
      headers: { Authorization: `Bearer ${seekerToken}` }
    });

    console.log('Jobseeker match-score response:');
    console.log(seekerRes.data);

    // Company qualification score for application
    const companyRes = await axios.get(`${apiBase}/ai/qualification-score/${appId}`, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });

    console.log('Company qualification-score response:');
    console.log(companyRes.data);

    const seekerScore = seekerRes.data.matchScore;
    const companyScore = companyRes.data.qualificationScore;

    console.log(`\nComparison:\n  Jobseeker score: ${seekerScore}\n  Company score:   ${companyScore}`);

    if (Math.abs(seekerScore - companyScore) <= 1) {
      console.log('✅ Scores match (within 1 point)');
    } else {
      console.warn('⚠️ Scores differ — investigate input data consistency (applicant profile used vs application applicant).');
    }
  } catch (err) {
    console.error('Error during verification:', err.response?.data || err.message);
    process.exit(1);
  }
})();
