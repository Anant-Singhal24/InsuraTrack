const multer = require("multer");

// File filter to allow only PDFs
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

// Configure multer to store files in memory for MongoDB storage
const uploadPolicyDocument = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffer objects
  fileFilter: pdfFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

module.exports = {
  uploadPolicyDocument,
};
