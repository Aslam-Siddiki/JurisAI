import express from "express";
import { createSubmission, getMySubmission } from "../controllers/submissionController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadEvidenceFiles } from "../middleware/upload.js";
import { handleUploadErrors } from "../middleware/security.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth);

router.post(
  "/",
  (req, res, next) => {
    // If multipart/form-data, handle with multer; otherwise continue with json
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      return uploadEvidenceFiles.array("files", 5)(req, res, (err) => {
        if (err) {
          return handleUploadErrors(err, req, res, next);
        }
        next();
      });
    }
    next();
  },
  createSubmission
);

router.get("/", getMySubmission);

export default router;
