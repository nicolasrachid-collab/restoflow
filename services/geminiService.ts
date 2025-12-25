import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize, GeminiResponse } from "../types";

// Initialize Gemini Client
// IMPORTANT: VITE_API_KEY is injected by Vite from .env file
// No Vite, variáveis de ambiente devem começar com VITE_ para serem expostas ao cliente
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey || apiKey === 'your-google-gemini-api-key-here') {
    console.warn('⚠️ VITE_API_KEY não configurada. Funcionalidades de IA não estarão disponíveis.');
    throw new Error('API Key do Google Gemini não configurada. Configure VITE_API_KEY no arquivo .env');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate text content with generic model (Flash)
 */
export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("Error generating text:", error);
    return "Erro ao comunicar com a IA.";
  }
};

/**
 * Market Research using Google Search Grounding
 */
export const searchMarketTrends = async (query: string): Promise<GeminiResponse> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata as any,
    };
  } catch (error) {
    console.error("Error searching trends:", error);
    throw error;
  }
};

/**
 * Location Analysis using Google Maps Grounding
 */
export const analyzeLocation = async (query: string, lat?: number, lng?: number): Promise<GeminiResponse> => {
  try {
    const ai = getAiClient();
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (lat && lng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: config,
    });

    return {
      text: response.text || "",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata as any,
    };
  } catch (error) {
    console.error("Error analyzing location:", error);
    throw error;
  }
};

/**
 * Generate Image using Gemini 3 Pro Image (Nano Banana Pro)
 * Supports 1K, 2K, 4K sizing
 */
export const generateMenuImage = async (prompt: string, size: ImageSize = ImageSize.SIZE_1K): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size, 
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

/**
 * Edit Image using Gemini 2.5 Flash Image (Nano Banana)
 */
export const editMenuImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    // Strip prefix if present for API
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    return null;
  }
};
