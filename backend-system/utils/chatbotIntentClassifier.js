/**
 * Robust Intent Classifier for JobIFY Chatbot
 * Handles keyword-based + LLM fallback for intent detection
 */

export const intentPatterns = {
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'welcome', 'start'],
    confidence: 0.95
  },
  job_search: {
    keywords: ['find', 'search', 'looking for', 'job', 'position', 'opening', 'role', 'vacancy', 'hiring', 'recruitment', 'apply', 'available positions'],
    confidence: 0.9
  },
  salary_info: {
    keywords: ['salary', 'pay', 'wage', 'compensation', 'earning', 'cost', 'price', 'rate', 'payment', 'financial', 'money'],
    confidence: 0.85
  },
  best_salary: {
    keywords: ['highest', 'best', 'top', 'highest paying', 'most paid', 'richest'],
    confidence: 0.9
  },
  most_paying_field: {
    keywords: ['highest paying', 'most paying', 'which fields', 'which industries', 'most paid', 'pay the most', 'highest salary', 'top paying'],
    confidence: 0.95
  },
  how_to_get_job: {
    keywords: ['how to get a job', 'how do i get a job', 'get a job', 'landing a job', 'how can i get hired', 'steps to get a job', 'apply and get hired'],
    confidence: 0.9
  },
  remote_work: {
    keywords: ['remote', 'work from home', 'wfh', 'distributed', 'online', 'hybrid'],
    confidence: 0.95
  },
  companies: {
    keywords: ['company', 'companies', 'employer', 'organization', 'who is hiring', 'employer profiles'],
    confidence: 0.9
  },
  career_guidance: {
    keywords: ['career', 'growth', 'development', 'advance', 'promotion', 'path', 'switch', 'change careers'],
    confidence: 0.85
  },
  interview_prep: {
    keywords: ['interview', 'prepare', 'interview questions', 'interview tips', 'ace the interview', 'get hired'],
    confidence: 0.95
  },
  profile_completion: {
    keywords: ['profile', 'resume', 'cv', 'complete', 'update', 'improve', 'add skills'],
    confidence: 0.9
  },
  about_platform: {
    keywords: ['about', 'jobify', 'platform', 'who', 'what', 'how', 'mission', 'founded'],
    confidence: 0.85
  },
  help: {
    keywords: ['help', 'support', 'assist', 'guide', 'how do i', 'how can', 'what can you do'],
    confidence: 0.8
  }
};

/**
 * Classify user message intent using keyword matching + pattern scoring
 * Guaranteed to return { intent, confidence }
 */
export function classifyIntentKeyword(message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { intent: 'generic', confidence: 0.3 };
  }

  const lowerMsg = message.toLowerCase();
  const scores = {};

  // Score each intent based on keyword matches
  for (const [intent, { keywords, confidence }] of Object.entries(intentPatterns)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) {
        matches++;
      }
    }
    if (matches > 0) {
      scores[intent] = (matches / keywords.length) * confidence;
    }
  }

  // Return highest-scoring intent or generic
  if (Object.keys(scores).length === 0) {
    return { intent: 'generic', confidence: 0.5 };
  }

  const topIntent = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  return { intent: topIntent[0], confidence: Math.min(topIntent[1], 0.99) };
}

/**
 * Parse JSON safely from LLM response (handles partial/malformed JSON)
 */
export function safeParseJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  // Try to extract JSON from response
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('Failed to parse JSON:', e.message);
    return null;
  }
}

/**
 * Use LLM to classify intent with keyword-based fallback
 */
export async function classifyIntentWithLLM(message, huggingfaceService) {
  if (!huggingfaceService || typeof huggingfaceService.classifyIntent !== 'function') {
    // Fallback to keyword-only
    return classifyIntentKeyword(message);
  }

  try {
    const llmResult = await huggingfaceService.classifyIntent(message);
    if (llmResult && llmResult.intent) {
      return llmResult;
    }
  } catch (e) {
    console.warn('LLM classification failed, falling back to keywords:', e.message);
  }

  // Fallback to keyword-based
  return classifyIntentKeyword(message);
}

export default {
  classifyIntentKeyword,
  classifyIntentWithLLM,
  safeParseJSON,
  intentPatterns
};
