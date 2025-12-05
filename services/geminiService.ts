import { GoogleGenAI } from "@google/genai";
import { Battery } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeBatteryHealth = async (battery: Battery): Promise<string> => {
  try {
    const prompt = `
      Analyze the health and safety of this Li-ion EV battery data.
      Keep the response short, under 50 words. Focus on safety and longevity.
      
      Data:
      - Type: ${battery.type}
      - Charge Cycles: ${battery.cycles}
      - Current Voltage: ${battery.voltage}V
      - Temperature: ${battery.temperature}°C
      - Health Score: ${battery.health}%
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to analyze battery health at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI analysis unavailable. Please check physical indicators.";
  }
};

export const generateSystemInsight = async (systemData: any): Promise<string> => {
  try {
    const prompt = `
      You are an AI System Analyst for 'VoltVault', an EV battery swapping network. 
      Analyze the provided JSON system snapshot and generate a professional "Daily Situation Report" for the Admin.
      
      Format with Markdown. Include:
      1. 🚨 Critical Alerts (if any)
      2. 📊 Efficiency Summary (Revenue/Uptime)
      3. 🔮 Predictive Maintenance (Predict which slots/batteries might fail based on health/status)
      4. 💡 Strategic Recommendation

      System Data:
      ${JSON.stringify(systemData)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "System analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate system report.";
  }
};
