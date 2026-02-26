const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//Extracts questions from a PDF using Gemini 2.5 Flash
async function extractQuestions(fileBuffer, mimeType) {
    const prompt = `
    Analyze this exam paper. Extract all questions and also add 5 more related questions as per the difficulty.
    Output ONLY a valid JSON array. Do not include any conversational text.
    
    CRITICAL INSTRUCTIONS FOR JSON:
    - Escape any double quotes inside the question text using a backslash (e.g., "What is \\"Virtual Memory\\"").
    - Each object must have exactly these keys:
      - "question_text": The full question string.
      - "subject": The subject name (e.g., Operating Systems, Cyber Security).
      - "marks": Marks allocated (if visible, otherwise "N/A").
      - "type": "MCQ" or "Descriptive".
  `;

    const result = await model.generateContent([
        prompt,
        { 
            inlineData: { 
                data: fileBuffer.toString("base64"), 
                mimeType: mimeType 
            } 
        }
    ]);

    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
        throw new Error("Gemini did not return a recognizable JSON array.");
    }

    const cleanJson = jsonMatch[0];
    return JSON.parse(cleanJson);
}

module.exports = { extractQuestions };