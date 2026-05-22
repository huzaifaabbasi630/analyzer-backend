const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  questions: [{
    type: { type: String, enum: ['Technical', 'Behavioral'] },
    question: String,
    suggestedAnswer: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InterviewQuestions', interviewQuestionSchema);
