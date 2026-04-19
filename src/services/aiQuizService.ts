import { GoogleGenAI, Type } from "@google/genai";
import { Monument, City, QuizQuestion, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface QuizGenBatchRequest {
  difficulty: Difficulty;
  count: number;
  lang: "ar" | "en";
  categories: { category: string; weight: number }[];
  contextData: {
    monuments: Monument[];
    cities: City[];
  };
  excludeIds: string[];
}

export class AIQuizService {
  private static questionCache: Map<string, QuizQuestion[]> = new Map();
  private static sessionUsedIds: Set<string> = new Set();

  static async generateQuestions(request: QuizGenBatchRequest): Promise<QuizQuestion[]> {
    const cacheKey = `${request.lang}_${request.difficulty}`;
    
    // Check if we have enough cached questions
    const cached = this.questionCache.get(cacheKey) || [];
    const filteredCached = cached.filter(q => !this.sessionUsedIds.has(q.id));
    
    if (filteredCached.length >= request.count) {
      const selected = filteredCached.slice(0, request.count);
      selected.forEach(q => this.sessionUsedIds.add(q.id));
      return selected;
    }

    // Otherwise, generate a new batch
    const newQuestions = await this.callGeminiBatch(request);
    
    // Store in cache
    const existing = this.questionCache.get(cacheKey) || [];
    this.questionCache.set(cacheKey, [...existing, ...newQuestions]);

    const selected = newQuestions.slice(0, request.count);
    selected.forEach(q => this.sessionUsedIds.add(q.id));
    return selected;
  }

  private static async callGeminiBatch(request: QuizGenBatchRequest): Promise<QuizQuestion[]> {
    const { lang, difficulty, count, categories, contextData } = request;
    
    const categoryInstruction = categories
      .map(c => `- ${c.category}: ${c.weight * 100}%`)
      .join("\n");

    const systemInstruction = `
      You are an expert cultural and historical guide of Morocco.
      Your task is to generate a batch of ${count * 2} unique quiz questions about Morocco.
      
      CRITICAL INSTRUCTIONS:
      1. Language: ${lang === "ar" ? "Modern Standard Arabic (MARC)" : "English"}. Ensure perfect grammar.
      2. Difficulty: ${difficulty.toUpperCase()}.
      3. Categories weighting:
         ${categoryInstruction}
      4. Diversity: Cover different regions (North, Atlas, Sahara, Coastal).
      5. Context: Use the provided structured data about monuments and cities as primary source, but you can also include general knowledge about Moroccan culture and history.
      6. Format: Return a JSON array of objects following the QuizQuestion schema.
      7. Validation: Each question must have 4 options, exactly one correct answer, and a concise explanation.
      8. ID: Generate a unique hash for each question's ID.
      9. Confidence: Assign a confidence_score based on factual verifyability.
      10. Randomness: Vary question styles (multiple choice, true/false but as 4 options, identifying a photo - described in text).
    `;

    const userPrompt = `
      Generate ${count * 2} questions. 
      Context Data (use these for specific questions):
      Monuments: ${JSON.stringify(contextData.monuments.map(m => ({ name: m.name, city: m.city_en, description: m.description, history: m.history })))}
      Cities: ${JSON.stringify(contextData.cities.map(c => ({ name: c.name, description: c.description })))}
      Excluded IDs (Do NOT repeat): ${JSON.stringify(request.excludeIds)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                confidence_score: { type: Type.NUMBER },
                source: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "question", "options", "answer", "explanation"]
            }
          }
        }
      });

      const questions = JSON.parse(response.text || "[]") as QuizQuestion[];
      
      // Perform rule-based validation
      return questions.filter(q => {
        const hasCorrectOption = q.options.includes(q.answer);
        const hasHighConfidence = (q.confidence_score || 0) > 0.7;
        const isUnique = !request.excludeIds.includes(q.id);
        return hasCorrectOption && hasHighConfidence && isUnique;
      }).map(q => ({
        ...q,
        source: "AI" as const,
        id: q.id || Math.random().toString(36).substring(7)
      }));

    } catch (error) {
      console.error("AI Question Generation Failed:", error);
      return [];
    }
  }

  static resetSession() {
    this.sessionUsedIds.clear();
  }
}
