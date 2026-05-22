const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const InterviewQuestions = require('../models/InterviewQuestions');
const { getAIResponse } = require('../utils/aiHelper');

// Helper to resolve resume ID, handling 'latest'
const resolveResumeId = async (resumeId, userId) => {
  if (resumeId === 'latest') {
    const latestResume = await Resume.findOne({ userId }).sort('-createdAt');
    if (!latestResume) {
      throw new Error('No resumes found. Please upload or build one first.');
    }
    return latestResume._id;
  }
  return resumeId;
};

// @desc    Analyze resume for suggestions
// @route   POST /api/ai/analyze-resume
// @access  Private
exports.analyzeResume = async (req, res, next) => {
  try {
    const { resumeId } = req.body;
    let targetResumeId;
    try {
      targetResumeId = await resolveResumeId(resumeId, req.user.id);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    // Check cache
    let analysis = await ResumeAnalysis.findOne({ resumeId: targetResumeId });
    if (analysis && analysis.suggestions && analysis.suggestions.length > 0) {
      return res.status(200).json({
        success: true,
        data: analysis
      });
    }

    const resume = await Resume.findById(targetResumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const prompt = `
      Analyze this resume text and provide:
      1. Bullet point suggestions for improvement.
      2. Measurable achievement tips.
      3. Keyword optimization keywords.
      
      Format the response strictly as a JSON object with keys: "suggestions" (array of strings), "achievements" (array of strings), "keywords" (array of strings). Do NOT wrap in markdown \`\`\`json. Output ONLY valid JSON.
      
      Resume text: ${resume.extractedText.substring(0, 4000)}
    `;

    const aiResponse = await getAIResponse(prompt);
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: aiResponse };
    } catch (e) {
      parsedData = { raw: aiResponse };
    }
    
    const suggestionList = Array.isArray(parsedData.suggestions) 
      ? parsedData.suggestions 
      : [aiResponse];

    if (analysis) {
      analysis.suggestions = suggestionList;
      await analysis.save();
    } else {
      analysis = await ResumeAnalysis.create({
        resumeId: targetResumeId,
        userId: req.user.id,
        suggestions: suggestionList
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Analyze skill gaps
// @route   POST /api/ai/skill-gap
// @access  Private
exports.analyzeSkillGap = async (req, res, next) => {
  try {
    const { resumeId, targetRole } = req.body;
    let targetResumeId;
    try {
      targetResumeId = await resolveResumeId(resumeId, req.user.id);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    // Check cache
    let analysis = await ResumeAnalysis.findOne({ resumeId: targetResumeId });
    if (analysis && analysis.skillGaps && analysis.skillGaps.length > 0) {
      return res.status(200).json({
        success: true,
        data: analysis
      });
    }

    const resume = await Resume.findById(targetResumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const prompt = `
      Compare these resume skills with current market requirements for a "${targetRole || 'Software Engineer'}" role.
      List the missing skills.
      
      Format the response strictly as a JSON object with a key "missingSkills" which is an array of strings. Do NOT wrap in markdown \`\`\`json. Output ONLY valid JSON.
      
      Resume text: ${resume.extractedText.substring(0, 4000)}
    `;

    const aiResponse = await getAIResponse(prompt);
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { missingSkills: [] };
    } catch (e) {
      parsedData = { missingSkills: [] };
    }

    const skillGaps = parsedData.missingSkills || [];

    if (analysis) {
      analysis.skillGaps = skillGaps;
      await analysis.save();
    } else {
      analysis = await ResumeAnalysis.create({
        resumeId: targetResumeId,
        userId: req.user.id,
        skillGaps
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Match resume to job roles
// @route   POST /api/ai/job-match
// @access  Private
exports.jobMatch = async (req, res, next) => {
  try {
    const { resumeId } = req.body;
    let targetResumeId;
    try {
      targetResumeId = await resolveResumeId(resumeId, req.user.id);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    // Check cache
    let analysis = await ResumeAnalysis.findOne({ resumeId: targetResumeId });
    if (analysis && analysis.jobMatches && analysis.jobMatches.length > 0) {
      return res.status(200).json({
        success: true,
        data: analysis
      });
    }

    const resume = await Resume.findById(targetResumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const prompt = `
      Analyze this resume and return the top 3 best matching job roles.
      
      Format the response strictly as a JSON object with a key "matches" which is an array of strings. Do NOT wrap in markdown \`\`\`json. Output ONLY valid JSON.
      
      Resume text: ${resume.extractedText.substring(0, 4000)}
    `;

    const aiResponse = await getAIResponse(prompt);
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { matches: [] };
    } catch (e) {
      parsedData = { matches: [] };
    }

    const jobMatches = parsedData.matches || [];

    if (analysis) {
      analysis.jobMatches = jobMatches;
      await analysis.save();
    } else {
      analysis = await ResumeAnalysis.create({
        resumeId: targetResumeId,
        userId: req.user.id,
        jobMatches
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate interview questions
// @route   POST /api/ai/interview-questions
// @access  Private
exports.generateQuestions = async (req, res, next) => {
  try {
    const { resumeId } = req.body;
    let targetResumeId;
    try {
      targetResumeId = await resolveResumeId(resumeId, req.user.id);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }

    // Check cache
    const existingQuestions = await InterviewQuestions.findOne({ resumeId: targetResumeId });
    if (existingQuestions && existingQuestions.questions && existingQuestions.questions.length > 0) {
      return res.status(200).json({
        success: true,
        data: existingQuestions
      });
    }

    const resume = await Resume.findById(targetResumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const prompt = `
      Based on this resume, generate 3 technical and 2 behavioral interview questions.
      Include a suggested answer tip for each.
      
      Format the response strictly as a JSON object with a key "questions" which is an array of objects.
      Each object should have: "type" (Technical or Behavioral), "question", "suggestedAnswer". Do NOT wrap in markdown \`\`\`json. Output ONLY valid JSON.
      
      Resume text: ${resume.extractedText.substring(0, 4000)}
    `;

    const aiResponse = await getAIResponse(prompt);
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
    } catch (e) {
      parsedData = { questions: [] };
    }

    const interviewQuestions = await InterviewQuestions.create({
      userId: req.user.id,
      resumeId: targetResumeId,
      questions: parsedData.questions || []
    });

    res.status(201).json({
      success: true,
      data: interviewQuestions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate resume from raw details using Puter AI
// @route   POST /api/ai/generate-resume
// @access  Private
exports.generateResumeFromAI = async (req, res, next) => {
  try {
    const { jobTitle, experience, education, skills } = req.body;
    if (!jobTitle) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }

    const prompt = `
      Rewrite the following raw resume details into a highly professional, ATS-optimized format.
      For experience bullet points, rewrite them to use action verbs and quantitative metrics.
      
      Raw Details:
      Job Title: ${jobTitle}
      Experience: ${experience || 'None'}
      Education: ${education || 'None'}
      Skills: ${skills || 'None'}
      
      Format the response strictly as a JSON object with keys:
      "name": "${req.user.name}",
      "email": "${req.user.email}",
      "phone": "",
      "github": "",
      "jobTitle": "${jobTitle}",
      "experience": (array of objects, each with "role", "company", "duration", and "bullets" which is an array of strings),
      "education": (array of objects, each with "degree", "school", "duration"),
      "skills": (array of strings).
      
      Do NOT wrap the response in markdown \`\`\`json. Output ONLY valid, parseable JSON.
    `;

    const aiResponse = await getAIResponse(prompt);
    
    let parsedData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: aiResponse };
    } catch (e) {
      parsedData = { raw: aiResponse };
    }

    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (err) {
    next(err);
  }
};