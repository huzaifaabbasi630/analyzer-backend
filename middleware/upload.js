const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine to memory so it works on serverless/Vercel (no file system writes)
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /pdf|docx/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Resumes Only (PDF or DOCX)!');
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

module.exports = upload;
