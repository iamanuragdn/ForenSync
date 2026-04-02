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
    - Escape any double quotes inside the question text using a backslash.
    - Each object must have exactly these keys:
      - "question_text": The full question string.
      - "program_name": The exact database ID. MUST BE EXACTLY "btech-mtech-cybersecurity" or "bsc-msc-forensic". Guess based on context. Do not use full readable names.
      - "semester": The exact semester ID format. MUST BE EXACTLY "sem-1", "sem-2", "sem-3", up to "sem-10". Convert any Roman numerals (I, II, IV) to numbers (sem-1, sem-2, sem-4). Do not output "Semester 1" or "Semester - I".
      - "subject_name": The readable subject name (e.g., Operating Systems).
      - "subject_code": The official university subject code (e.g., CS401). If missing, output "UNKNOWN".
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