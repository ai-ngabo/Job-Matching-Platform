// backend-system/utils/huggingfaceService.js
import { InferenceClient } from "@huggingface/inference";

class HuggingFaceService {
  constructor() {
    this.client = new InferenceClient(process.env.HF_API_KEY);
    console.log("🔑 HuggingFace initialized. API Key present:", !!process.env.HF_API_KEY);
  }

  async generateResponse(prompt) {
    try {
      console.log("🤖 HuggingFace prompt:", prompt);

      const response = await this.client.chatCompletion({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      });

      console.log("✅ HuggingFace response:", response);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("❌ HuggingFace API Error:", error);
      return "⚠️ AI mode is offline. I can still show you jobs and companies!";
    }
  }

  async classifyIntent(prompt) {
    try {
      console.log("🧠 classifyIntent prompt:", prompt);

      const response = await this.client.chatCompletion({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages: [
          {
            role: "system",
            content: `Classify the user query into one of these intents:
greeting, job_search, salary, companies, interview, remote, profile, apply, best_salary, generic.
Return ONLY valid JSON: {"intent": "string", "confidence": number}`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
      });

      console.log("✅ classifyIntent raw:", response);
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("❌ classifyIntent error:", error);
      return { intent: "generic", confidence: 0.5 };
    }
  }
}

// ✅ Export the instance, not the class
export default new HuggingFaceService();