const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const db = require("../config/db");

// 1. Cloudinary Credentials (Render environment se load honge)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Memory storage (Direct RAM buffer to Cloudinary stream)
const upload = multer({ storage: multer.memoryStorage() });

// 3. Upload Helper Function
const uploadToCloudinary = (buffer, originalname, folder = "campushub_notes") => {
  return new Promise((resolve, reject) => {
    const cleanName = Date.now() + "-" + originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
        type: "upload",
        public_id: cleanName,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// GET: Sabhi Notes Fetch karna
router.get("/", (req, res) => {
  const { semester, subject } = req.query;
  let sql = "SELECT * FROM notes WHERE 1=1";
  const params = [];

  if (semester) {
    sql += " AND semester = ?";
    params.push(semester);
  }

  if (subject) {
    sql += " AND subject LIKE ?";
    params.push(`%${subject}%`);
  }

  sql += " ORDER BY created_at DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching notes:", err);
      return res.status(500).json({ message: "Failed to load notes." });
    }
    return res.json({ notes: results });
  });
});

// POST: Note File Upload Route
router.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const { title, subject, semester } = req.body;

    if (!title || !subject || !semester || !req.file) {
      return res.status(400).json({
        message: "Title, Subject, Semester, aur file sabhi required hain.",
      });
    }

    // Helper call karke permanent link generate karein
    const file_url = await uploadToCloudinary(req.file.buffer, req.file.originalname, "campushub_notes");

    const insertSql = `
      INSERT INTO notes (title, subject, semester, file_url)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertSql, [title.trim(), subject.trim(), semester, file_url], (err, result) => {
      if (err) {
        console.error("Database insert error:", err);
        return res.status(500).json({ message: "Database insert error." });
      }

      return res.status(201).json({
        message: "File uploaded successfully!",
        noteId: result.insertId,
        file_url: file_url,
      });
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return res.status(500).json({ message: "File upload failed on cloud storage." });
  }
});

// DELETE: Note Delete Route
router.delete("/:id", (req, res) => {
  const noteId = req.params.id;

  db.query("DELETE FROM notes WHERE id = ?", [noteId], (err, result) => {
    if (err) {
      console.error("Error deleting note:", err);
      return res.status(500).json({ message: "Failed to delete note." });
    }
    return res.json({ message: "Note deleted successfully!" });
  });
});

module.exports = router;