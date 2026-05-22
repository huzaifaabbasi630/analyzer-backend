const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

/**
 * Extracts text from PDF or DOCX file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
const extractText = async (file) => {
  const filePath = file.path;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();

  try {
    if (fileExtension === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (fileExtension === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else {
      throw new Error('Unsupported file format. Please upload PDF or DOCX.');
    }
  } catch (err) {
    console.error('Text Extraction Error:', err);
    throw err;
  }
};

/**
 * Basic ATS Scoring Algorithm
 * @param {string} text - Resume text
 * @returns {number} - ATS Score (0-100)
 */
const calculateATSScore = (text) => {
  if (!text) return 0;
  
  let score = 0;
  const normalizedText = text.toLowerCase();

  // 1. Keyword Relevance (Presence of key job-related terms)
  const keywords = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications'];
  keywords.forEach(word => {
    if (normalizedText.includes(word)) score += 5;
  });

  // 2. Skills Section Presence
  if (normalizedText.includes('skills') || normalizedText.includes('technical expertise')) {
    score += 15;
  }

  // 3. Experience Section Presence
  if (normalizedText.includes('experience') || normalizedText.includes('work history')) {
    score += 20;
  }

  // 4. Education Section Presence
  if (normalizedText.includes('education') || normalizedText.includes('academic')) {
    score += 10;
  }

  // 5. Formatting/Length Check (Basic) - Aiming for balanced density
  const wordCount = normalizedText.split(/\s+/).length;
  if (wordCount > 200 && wordCount < 1000) {
    score += 15;
  } else if (wordCount >= 1000) {
    score += 5; // Too long might be filtered
  }

  // 6. Action Verbs (Indicators of achievement)
  const actionVerbs = ['developed', 'managed', 'led', 'implemented', 'created', 'designed', 'optimized', 'increased'];
  actionVerbs.forEach(verb => {
    if (normalizedText.includes(verb)) score += 2;
  });

  // Cap score at 100
  return Math.min(score + 10, 100); // Base 10 points for having content
};

module.exports = { extractText, calculateATSScore };
