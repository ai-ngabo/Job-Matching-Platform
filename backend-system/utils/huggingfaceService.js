// backend-system/utils/huggingfaceService.js
import { InferenceClient } from "@huggingface/inference";

class HuggingFaceService {
  constructor() {
    this.client = new InferenceClient(process.env.HF_API_KEY);
    console.log("🔑 HuggingFace initialized. API Key present:", !!process.env.HF_API_KEY);
  }

  /**
   * Generate a natural, helpful English response using Hugging Face chat models.
   * Supports optional conversation history and structured job/company context
   * so the model can answer intelligently about your platform data.
   *
   * @param {string} prompt - Latest user question/message
   * @param {Object} options
   * @param {Array<{ type: 'user'|'bot', text: string }>} [options.history] - Prior messages
   * @param {Object} [options.context] - Structured data (jobs, companies, stats, etc.)
   * @param {string} [options.intent] - Detected intent (e.g. 'job_search', 'salary_info')
   */
  async generateResponse(prompt, options = {}) {
    const { history = [], context = {}, intent } = options;

    try {
      console.log("🤖 HuggingFace prompt:", prompt);

      const systemPrompt = `You are JobIFY's AI Assistant.
- Always respond in clear, friendly, professional **English**, even if the user writes in another language.
- You help users find jobs, understand salaries and compensation in Rwanda and globally, learn about companies, and get career or interview advice.
- When structured job or company data is provided in the context, rely on that data for specific facts (titles, locations, salaries, categories, companies, requirements).
- If the user asks about "recent jobs" or "latest jobs", highlight the most recent roles from the provided job list.
- If they ask about "highest paying" or "best salary", use the jobs with the highest salaryRange.max values from the context.
- If information is not available in the context or you are not sure, say that clearly and give general guidance instead of making up fake facts.
- Be concise but helpful, and format your answer with short paragraphs and bullet points where useful.`;

      const mappedHistory = Array.isArray(history)
        ? history
            .filter(m => m && typeof m.text === "string" && m.text.trim().length > 0)
            .map(m => ({
              role: m.type === "user" ? "user" : "assistant",
              content: m.text,
            }))
        : [];

      // Prepare a compact JSON summary of context to keep prompts small
      const serializeJobs = (jobs = []) =>
        jobs.slice(0, 8).map(job => ({
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          jobType: job.jobType,
          category: job.category,
          experienceLevel: job.experienceLevel,
          salaryRange: job.salaryRange,
          applicationDeadline: job.applicationDeadline,
        }));

      const serializeCompanies = (companies = []) =>
        companies.slice(0, 8).map(company => ({
          name: company.name || company.company?.name,
          industry: company.industry || company.company?.industry,
          description: company.description || company.company?.description,
        }));

      const contextSummary = {
        intent: intent || undefined,
        jobs: context.jobs ? serializeJobs(context.jobs) : undefined,
        topJobs: context.topJobs ? serializeJobs(context.topJobs) : undefined,
        recentJobs: context.recentJobs ? serializeJobs(context.recentJobs) : undefined,
        companies: context.companies ? serializeCompanies(context.companies) : undefined,
        stats: context.stats || undefined,
        platformInfo: context.platformInfo || undefined,
      };

      const contextText =
        JSON.stringify(contextSummary, (key, value) => {
          if (value === undefined || value === null) return undefined;
          return value;
        });

      const messages = [
        { role: "system", content: systemPrompt },
        ...mappedHistory,
        {
          role: "user",
          content: `User message: "${prompt}".\n\nHere is relevant structured context from JobIFY (jobs, salaries, companies, stats):\n${contextText}\n\nUse this context to answer the question in English. If some specific information is not in the context, say so and answer in a general but helpful way.`,
        },
      ];

      const response = await this.client.chatCompletion({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages,
        max_tokens: 500,
      });

      console.log("✅ HuggingFace response:", response);
      return response.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";
    } catch (error) {
      console.error("❌ HuggingFace API Error:", error);
      return "⚠️ My AI brain is currently unavailable. I can still help you browse jobs, companies, and basic information on JobIFY.";
    }
  }

  /**
   * Use the Llama-3 chat model to classify a free-text query into a high-level intent.
   * Always returns a JSON object: { intent: string, confidence: number }
   */
  async classifyIntent(prompt) {
    try {
      console.log("🧠 classifyIntent prompt:", prompt);

      const response = await this.client.chatCompletion({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages: [
          {
            role: "system",
            content: `You are an intent classification assistant for the JobIFY job platform.
User messages may be written in any language. Infer the meaning and classify it into ONE primary intent from this list:
- "greeting"         → greetings, welcome, hello, hi, hey
- "about_platform"   → questions about what JobIFY is, who created it, mission, how it works
- "job_search"       → finding jobs, openings, positions, opportunities, internships, freelance, part-time, full-time
- "salary_info"      → salaries, pay, wages, compensation, benefits, market rates, highest paying jobs
- "best_salary"      → explicitly asking for highest paying jobs, best paying roles
- "companies"        → companies, employers, organizations on JobIFY, who is hiring
- "location"         → remote, hybrid, work from home, specific cities or countries
- "skills"           → skills, qualifications, requirements for jobs
- "experience_level" → junior, entry-level, mid-level, senior, years of experience
- "career"           → career growth, career path, promotions, switching careers
- "application"      → how to apply, application process, tracking applications
- "profile"          → resume, CV, profile completion, how to improve profile
- "interview"        → interview tips, common questions, how to prepare
- "help"             → general help, what can you do, need assistance
- "generic"          → anything else not clearly covered above

Return ONLY valid JSON with this shape (no extra text):
{"intent": "one_of_the_intents_above", "confidence": 0.0-1.0}
If you're unsure, use intent "generic" with a low confidence (e.g. 0.5).`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
      });

      console.log("✅ classifyIntent raw:", response);
      const content = response.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed.intent === "string") {
          return {
            intent: parsed.intent,
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
          };
        }
      } catch (e) {
        console.error("❌ Failed to parse classifyIntent JSON:", e, "content:", content);
      }

      return { intent: "generic", confidence: 0.5 };
    } catch (error) {
      console.error("❌ classifyIntent error:", error);
      return { intent: "generic", confidence: 0.5 };
    }
  }
}

// ✅ Export the instance, not the class
export default new HuggingFaceService();