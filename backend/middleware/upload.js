import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standardize uploads directory to backend/uploads regardless of where node process starts
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize extension and filename
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|jpg|jpeg|png|txt/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File format not supported. Allowed formats: PDF, JPG, PNG, TXT."), false);
  }
};

export const uploadEvidenceFiles = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5, // Maximum 5 files per submission
  },
  fileFilter,
});
