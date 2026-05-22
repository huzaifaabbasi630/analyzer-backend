const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { extractText, calculateATSScore } = require('../utils/resumeHelper');

// @desc    Upload resume and analyze ATS score
// @route   POST /api/resume/upload
// @access  Private
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file (PDF or DOCX)',
      });
    }

    // Extract text
    const extractedText = await extractText(req.file);

    // Calculate ATS Score
    const atsScore = calculateATSScore(extractedText);

    // Save to Database
    const resume = await Resume.create({
      userId: req.user.id,
      resumeFile: req.file.originalname || 'uploaded-file',
      extractedText,
      atsScore,
    });

    res.status(201).json({
      success: true,
      data: resume,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all resumes for logged in user
// @route   GET /api/resume/history
// @access  Private
exports.getResumeHistory = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resume by ID
// @route   GET /api/resume/:id
// @access  Private
exports.getResume = async (req, res, next) => {
  try {
    let id = req.params.id;
    if (id === 'latest') {
      const latestResume = await Resume.findOne({ userId: req.user.id }).sort('-createdAt');
      if (!latestResume) {
        return res.status(404).json({
          success: false,
          message: 'No resumes found. Please upload or build a resume first.',
        });
      }
      id = latestResume._id;
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Save a resume built manually or via AI on the website
// @route   POST /api/resume/save-built
// @access  Private
exports.saveBuiltResume = async (req, res, next) => {
  try {
    const { title, extractedText } = req.body;
    if (!extractedText) {
      return res.status(400).json({ success: false, message: 'Extracted text is required' });
    }

    const { calculateATSScore } = require('../utils/resumeHelper');
    const atsScore = calculateATSScore(extractedText);

    // Save to Database
    const resume = await Resume.create({
      userId: req.user.id,
      resumeFile: 'built-on-platform', // placeholder
      extractedText,
      atsScore,
    });

    res.status(201).json({
      success: true,
      data: resume,
    });
  } catch (err) {
    next(err);
  }
};
