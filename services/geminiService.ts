
import { GoogleGenAI } from "@google/genai";
import { GenerationOptions, GeneratedResult } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants/prompts";

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const generateImageWithNanoBanana = async (
    imageBase64: string,
    mimeType: string,
    options: GenerationOptions,
    secondImage?: { base64: string; mimeType: string } | null
): Promise<GeneratedResult> => {
    // Luôn tạo instance mới để đảm bảo lấy được API Key mới nhất từ window.aistudio
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const isCouple = !!secondImage;
    const isCustom = options.theme === 'custom';

    let prompt = "";

    if (isCustom) {
        prompt = `Transform this input image into a premium photorealistic image based on the following user description:
        
        User Description: ${options.customPrompt}
        
        Subject Aesthetics:
        - Maintain the identity and facial features of the subject in the input image.
        - Ensure the result is a realistic photograph, not an illustration.
        `;
    } else if (isCouple) {
        prompt = `Transform these TWO input images into a premium photorealistic COUPLE portrait with the following style:
    
    Theme: ${options.theme.toUpperCase().replace('_', ' ')}
    Concept: ${options.concept}
    ${options.customPrompt ? `Additional Instructions: ${options.customPrompt}` : ''}
    
    Subject Aesthetics:
    - The image must feature TWO people corresponding to the two input images.
    - Posing: Natural and fashionable. Interactions should be genuine.
    - Clothing Value: Ultra-luxury, high-end fabrics, detailed textures.
    `;
    } else {
        prompt = `Transform this image into a premium photorealistic portrait with the following style:
    
    Theme: ${options.theme.toUpperCase().replace('_', ' ')}
    Concept: ${options.concept}
    ${options.customPrompt ? `Additional Instructions: ${options.customPrompt}` : ''}
    
    Subject Aesthetics:
    - Maintain subject identity.
    - Posing: Dynamic, elegant, and confident supermodel pose.
    - Outfit: Ultra-luxury, Billionaire style. NO exposed midriff.
    `;
    }

    prompt += `
    Style Details:
    - Lighting: Cinematic, professional studio lighting.
    - Camera: High-end DSLR, 85mm lens, sharp focus on eyes.
    - Quality: 8k resolution, highly detailed, HDR.
    `;

    if (options.faceConsistency) {
        prompt += `
    CRITICAL INSTRUCTION: Maintain the exact facial features and identity of the subject from the source image.`;
    }

    try {
        const parts: any[] = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            }
        ];

        if (secondImage) {
            parts.push({
                inlineData: {
                    mimeType: secondImage.mimeType,
                    data: secondImage.base64
                }
            });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                imageConfig: {
                    aspectRatio: options.aspectRatio
                }
            }
        });

        let generatedImageBase64 = null;
        if (response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            if (content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        generatedImageBase64 = part.inlineData.data;
                        break;
                    }
                }
            }
        }

        if (!generatedImageBase64) {
             const textPart = response.text;
             if (textPart) throw new Error(`AI Refusal: ${textPart}`);
             throw new Error("No image generated.");
        }

        return {
            image: generatedImageBase64,
            prompt: prompt
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
