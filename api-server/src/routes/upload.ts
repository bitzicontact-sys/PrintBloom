import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* Accept all common design + image + document formats */
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/postscript",           /* .ai / .eps */
  "application/illustrator",
  "image/vnd.adobe.photoshop",        /* .psd */
  "application/x-photoshop",
  "application/photoshop",
  "application/octet-stream",         /* fallback for .ai / .psd / .eps */
  "application/zip",                  /* .zip bundles */
  "application/x-zip-compressed",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ALLOWED_EXT = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".ai", ".eps", ".psd",
  ".zip", ".rar",
  ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.originalname}`));
  }
}

/* Single file upload (existing — kept for compatibility) */
const uploadSingle = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter });

/* Multiple file upload — up to 10 files, 20 MB each */
const uploadMultiple = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter });

/* POST /api/upload — single file */
router.post("/upload", uploadSingle.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    url: `/api/files/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

/* POST /api/upload/multiple — multiple files */
router.post("/upload/multiple", uploadMultiple.array("files", 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
  res.json(files.map(f => ({
    url: `/api/files/${f.filename}`,
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    mimeType: f.mimetype,
  })));
});

/* GET /api/files/:filename — serve uploaded file */
router.get("/files/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filepath);
});

export default router;
