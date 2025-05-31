import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface PharmacyAssistantRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface PharmacyAssistantResponse {
  response: string;
  timestamp: Date;
  conversationId?: string;
}

export class PharmacyAssistantService {
  private systemPrompt = `You are an expert pharmacy assistant AI designed to help pharmacy staff with professional queries. You have extensive knowledge of:

- Pharmaceutical medicines, their properties, and uses
- Drug interactions and contraindications
- Dosage guidelines and administration routes
- Side effects and adverse reactions
- Storage requirements and stability
- Generic alternatives and therapeutic equivalents
- Pharmaceutical calculations and compounding
- Zimbabwe-specific medicine regulations and guidelines
- Medical aid scheme requirements
- Prescription verification and validation

Guidelines for responses:
1. Always prioritize patient safety in your recommendations
2. Remind users to verify critical information with official sources
3. Suggest consulting prescribing physicians for clinical decisions
4. Provide accurate, evidence-based information
5. Include relevant warnings and precautions
6. Be concise but comprehensive
7. Format responses clearly for quick reading
8. If uncertain, recommend consulting official drug references

Remember: You are assisting pharmacy professionals, not providing direct patient care advice.`;

  async processQuery(request: PharmacyAssistantRequest): Promise<PharmacyAssistantResponse> {
    try {
      // Build conversation history
      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history if provided
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        messages.push(...request.conversationHistory.slice(-10)); // Keep last 10 messages for context
      }

      // Add current user message
      messages.push({ role: 'user', content: request.message });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const assistantResponse = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

      return {
        response: assistantResponse,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Pharmacy Assistant error:", error);
      throw new Error("Failed to process pharmacy assistant query");
    }
  }

  async getQuickResponses(): Promise<string[]> {
    return [
      "What are the storage requirements for insulin?",
      "Check drug interactions for warfarin",
      "Dosage calculation for pediatric patients",
      "Generic alternatives for brand medicines",
      "Side effects of common antibiotics",
      "How to handle controlled substances",
      "Medicine expiry date guidelines",
      "Pregnancy and breastfeeding drug safety"
    ];
  }

  async validatePrescription(prescriptionText: string): Promise<{
    isValid: boolean;
    issues?: string[];
    suggestions?: string[];
  }> {
    try {
      const validationPrompt = `As a pharmacy assistant, analyze this prescription for potential issues:

Prescription: ${prescriptionText}

Check for:
1. Completeness of prescription information
2. Dosage appropriateness
3. Potential drug interactions
4. Contraindications
5. Legal requirements compliance

Respond in JSON format with:
{
  "isValid": boolean,
  "issues": ["list of issues found"],
  "suggestions": ["list of suggestions for improvement"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: validationPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"isValid": false, "issues": ["Failed to analyze prescription"]}');
      
      return {
        isValid: result.isValid || false,
        issues: result.issues || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error("Prescription validation error:", error);
      return {
        isValid: false,
        issues: ["Unable to validate prescription due to technical error"],
        suggestions: ["Please manually review the prescription"]
      };
    }
  }
}

export const pharmacyAssistant = new PharmacyAssistantService();