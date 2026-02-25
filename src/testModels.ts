
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testModel(modelName: string) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Minimal prompt to just check existence
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`SUCCESS: ${modelName} is valid.`);
        return true;
    } catch (error: any) {
        console.log(`FAILED: ${modelName} - ${error.message.split('\n')[0]}`); // Log only first line
        return false;
    }
}

async function run() {
    const modelsToTest = [
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash', // Retesting just in case
        'gemini-pro',
        'gemini-1.5-pro-001'
    ];

    for (const model of modelsToTest) {
        await testModel(model);
    }
}

run();
