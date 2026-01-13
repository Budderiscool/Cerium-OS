import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  // Fix: Directly use process.env.API_KEY as per SDK guidelines.
  // The key is assumed to be pre-configured in the environment.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGemini = async (prompt: string, context?: string) => {
  try {
    const ai = getAI();
    const systemInstruction = `You are the core AI of CeriumOS, a highly customizable and futuristic web-based operating system. 
    You are helpful, concise, and professional. 
    You can help users with code, writing, or OS-related questions.
    The current context is: ${context || 'None'}.`;

    // Fix: Upgrade to gemini-3-pro-preview for advanced reasoning and coding assistance.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Fix: Access the .text property directly (not a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, but I encountered an error while processing your request. Please check your connection.";
  }
};
