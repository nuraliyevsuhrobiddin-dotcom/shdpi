
// @google/genai guidelines followed:
// - Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// - Use 'gemini-3-pro-preview' for complex STEM tasks like scientific protocol analysis.
// - Use response.text directly as a property.
// - Import {GoogleGenAI} from "@google/genai".

import { GoogleGenAI, Type } from "@google/genai";
import { Subject, LabError, RiskLevel, AiMode } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROTOCOL_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    protocolTitle: { type: Type.STRING },
    overallSafetyRating: { 
      type: Type.STRING, 
      description: "Quyidagilardan biri bo'lishi kerak: Low, Medium, High" 
    },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "masalan, Mantiqiy, Nisbat, Xavfsizlik, Uskunalar" },
          problem: { type: Type.STRING },
          explanation: { type: Type.STRING },
          correction: { type: Type.STRING },
          riskLevel: { type: Type.STRING, description: "Quyidagilardan biri bo'lishi kerak: Low, Medium, High" }
        },
        required: ["type", "problem", "explanation", "correction", "riskLevel"]
      }
    }
  },
  required: ["protocolTitle", "overallSafetyRating", "errors"]
};

export async function analyzeProtocol(
  protocolText: string, 
  subject: Subject,
  customInstruction?: string,
  aiMode: AiMode = AiMode.NORMAL
): Promise<{ protocolTitle: string, overallSafetyRating: RiskLevel, errors: LabError[] }> {
  try {
    const modeInstruction = aiMode === AiMode.STRICT 
      ? "STRICT MODE: Har qanday kichik terminologik noaniqlik va formatlash xatolariga ham e'tibor bering. Stoxiometrik hisob-kitoblarni o'ta qattiq tekshiring."
      : "NORMAL MODE: Asosiy mantiqiy xatolar va jiddiy xavfsizlik qoidabuzarliklariga e'tibor qarating.";

    const defaultInstruction = "Siz kimyo, biologiya va farmatsevtika laboratoriya standartlari bo'yicha chuqur bilimga ega bo'lgan professional ilmiy laboratoriya nazoratchisisiz. Berilgan protokolni diqqat bilan tahlil qiling. Mantiqiy xatolar, reagentlarning noto'g'ri nisbatlari, xavfsizlik qoidalarini buzish va ilmiy talqin xatolarini aniqlang. Barcha javoblarni O'ZBEK tilida bering. Tuzilmaviy tahlil taqdim eting.";
    
    const finalSystemInstruction = `${customInstruction || defaultInstruction}\n\n${modeInstruction}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Fan: ${subject}\n\nProtokol matni:\n${protocolText}`,
      config: {
        systemInstruction: finalSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: PROTOCOL_ANALYSIS_SCHEMA,
        temperature: aiMode === AiMode.STRICT ? 0.1 : 0.3,
      },
    });

    const text = response.text?.trim() || "{}";
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error("Tahlil xatosi:", error);
    throw new Error("Protokolni tahlil qilib bo'lmadi. Iltimos, qaytadan urinib ko'ring.");
  }
}
