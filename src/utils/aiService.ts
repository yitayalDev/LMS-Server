import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

/**
 * AI Service for LMSUOG
 */
export const aiService = {
    /**
     * Helper to generate content with fallback
     */
    async generateWithFallback(prompt: string, isJson: boolean = false) {
        const generationConfig = isJson ? { responseMimeType: 'application/json' } : undefined;

        try {
            // Primary Attempt: Gemini 2.0 Flash
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Primary Model Error (2.0-flash):', error.message);

            // Check if error is related to quota or overload
            if (error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('overloaded')) {
                console.log('Falling back to Gemini 1.5 Flash...');
                try {
                    // Fallback Attempt: Gemini 1.5 Flash (often has better free tier availability)
                    // Using specific version 'gemini-1.5-flash-001' to avoid 404 on generic name
                    const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001', generationConfig });
                    const fallbackResult = await fallbackModel.generateContent(prompt);
                    const fallbackResponse = await fallbackResult.response;
                    return fallbackResponse.text();
                } catch (fallbackError: any) {
                    console.error('Fallback Model Error (1.5-flash):', fallbackError.message);
                    throw fallbackError; // If both fail, throw the error
                }
            } else {
                throw error; // If it's another error (e.g. bad request), throw it immediately
            }
        }
    },

    /**
     * Generate a tutor-style response for a student query
     */
    async generateTutorResponse(courseContext: string, userQuery: string) {
        // Quick greeting guard to save API quota and provide instant response
        const greetings = ['hi', 'hello', 'hey', 'greetings', 'hola', 'hi there', 'hello there'];
        const normalizedQuery = userQuery.toLowerCase().trim().replace(/[?!.]$/g, '');

        if (greetings.includes(normalizedQuery)) {
            return `Hello! I'm your dedicated AI tutor for "${courseContext}". How can I help you with the course material today?`;
        }

        const cacheKey = `tutor_${courseContext}_${normalizedQuery}`;
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
            console.log('Serving AI response from cache');
            return cachedResponse as string;
        }

        const prompt = `
            You are an intelligent AI tutor inside a Learning Management System (LMS) for the course: "${courseContext}".

            Your role:
            * Help students understand concepts clearly.
            * Answer any academic or educational question related to the course.
            * Explain step-by-step when needed.
            * Use simple language first, then detailed explanation if requested.

            Rules:
            * Always be accurate and educational.
            * If unsure, say you are not certain instead of guessing.
            * Never generate harmful, illegal, or inappropriate content.
            * Stay focused on learning and knowledge.
            * Encourage critical thinking instead of giving only final answers.
            * Be supportive and polite.

            Response style:
            * Clear and structured (use Markdown).
            * Beginner-friendly, yet professional.
            * Always act as a patient teacher.

            Student Question: ${userQuery}
        `;

        const responseText = await this.generateWithFallback(prompt);

        cache.set(cacheKey, responseText);
        return responseText;
    },

    /**
     * Generate quiz questions based on provided course content
     */
    async generateQuizQuestions(content: string, count: number = 5) {
        const prompt = `
            Based on the following course content, generate ${count} multiple-choice quiz questions.
            Return the result as a JSON array of objects with the following structure:
            {
                "questionText": "string",
                "options": ["string", "string", "string", "string"],
                "correctAnswer": 0 (index of the correct option),
                "type": "multiple-choice",
                "points": 1
            }

            Content: ${content}
        `;

        const responseText = await this.generateWithFallback(prompt, true);
        return JSON.parse(responseText);
    },

    /**
     * Get course recommendations based on student profile and browsing history
     */
    async getRecommendations(studentInfo: any, availableCourses: any[]) {
        const prompt = `
            Given a student with these interests: ${studentInfo.interests} and completed courses: ${studentInfo.completedCourses},
            recommend the top 3 courses from this list: ${JSON.stringify(availableCourses)}.
            Return as a JSON array of course IDs.
        `;

        const responseText = await this.generateWithFallback(prompt, true);
        return JSON.parse(responseText);
    }
};
