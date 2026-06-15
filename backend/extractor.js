const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateWithRetry(model, args, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await model.generateContent(args);
        } catch (error) {
            const isRetryable = error.message.includes('503') || error.message.includes('429') || error.message.includes('fetch failed');
            if (isRetryable && attempt < maxRetries) {
                console.warn(`[Gemini API] Attempt ${attempt} failed due to high demand (503/429). Retrying in ${attempt * 3} seconds...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 3000));
            } else {
                throw error;
            }
        }
    }
}
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

    const result = await generateWithRetry(model, [
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

// Extracts Syllabus and Exam Dates based on Document Type
async function extractDocument(fileBuffer, mimeType, docType) {
    let prompt = `
    Analyze this document carefully. You must extract structured information and output ONLY a valid JSON object. 
    Do not include any conversational text or markdown code blocks (\`\`\`json) outside the JSON.
    
    You are extracting data for: ${docType.toUpperCase()}.
    
    JSON STRUCTURE REQUIREMENTS:
    {
    `;

    if (docType === 'syllabus' || docType === 'both') {
        prompt += `
      "syllabus": {
        // The key MUST be the exact subject code (e.g., "CTBT-BSC-101")
        "SUBJECT_CODE": {
          "semester": "sem-1", // MUST be 'sem-1', 'sem-2', etc. Determine which semester this subject belongs to based on the document context.
          "name": "Full subject name",
          "credits": 4, // Number
          "teacherName": "Full name of the teacher (if found)",
          "type": "Core", // or Lab, Minor, Major, etc.
          "units": [
             {
               "unitNumber": "I", // Roman numeral
               "title": "Title of the unit",
               "topics": ["topic 1", "topic 2"]
             }
          ]
        }
      },
        `;
    }

    if (docType === 'exams' || docType === 'both') {
        prompt += `
      "exams": {
        // The key MUST be the exact subject code
        "SUBJECT_CODE": {
          "semester": "sem-1", // MUST be 'sem-1', 'sem-2', etc. Determine which semester this exam belongs to.
          "subjectName": "Full subject name",
          "date": "YYYY-MM-DD",
          "time": "10:00 AM - 01:00 PM",
          "type": "Mid Semester" // or End Semester
        }
      }
        `;
    }

    prompt += `
    }
    
    CRITICAL RULES:
    1. If a field is missing in the document, use null or "N/A".
    2. Escape quotes inside strings correctly.
    3. Make sure it is a single valid JSON object.
    `;

    const result = await generateWithRetry(model, [
        prompt,
        { 
            inlineData: { 
                data: fileBuffer.toString("base64"), 
                mimeType: mimeType 
            } 
        }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("Gemini did not return a recognizable JSON object.");
    }

    return JSON.parse(jsonMatch[0]);
}

module.exports = { extractQuestions, extractDocument };