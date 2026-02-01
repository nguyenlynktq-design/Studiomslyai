
import { GoogleGenAI } from "@google/genai";
import { GenerationOptions, GeneratedResult } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants/prompts";

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
        reader.onerror = reject;
    });
};

export const generateImageWithNanoBanana = async (
    imageBase64: string,
    mimeType: string,
    options: GenerationOptions,
    secondImage?: { base64: string; mimeType: string } | null
): Promise<GeneratedResult> => {
    // Luôn khởi tạo instance mới để lấy Key từ session hiện tại
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        TASK: Transform input subject into a young, trendy and fashionable version.
        THEME: ${options.theme}
        CONCEPT: ${options.concept}
        AESTHETICS: Modern Gen Z style, young energy, high-end streetwear.
        REQUIREMENT: Maintain facial features 100%. No midriff exposure. High quality photorealistic.
    `;

    try {
        const parts: any[] = [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt }
        ];

        if (secondImage) {
            parts.splice(1, 0, { inlineData: { mimeType: secondImage.mimeType, data: secondImage.base64 } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                imageConfig: { aspectRatio: options.aspectRatio }
            }
        });

        let resultBase64 = null;
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) resultBase64 = part.inlineData.data;
        }

        if (!resultBase64) throw new Error("AI không trả về ảnh.");

        return { image: resultBase64, prompt };
    } catch (error) {
        throw error;
    }
};
