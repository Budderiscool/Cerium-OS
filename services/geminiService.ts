
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is not configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGemini = async (prompt: string, context?: string) => {
  try {
    const ai = getAI();
    const systemInstruction = `You are the core AI of CeriumOS, a highly customizable and futuristic web-based operating system. 
    You are helpful, concise, and professional. 
    You can help users with code, writing, or OS-related questions.
    The current context is: ${context || 'None'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, but I encountered an error while processing your request. Please check your connection.";
  }
};
