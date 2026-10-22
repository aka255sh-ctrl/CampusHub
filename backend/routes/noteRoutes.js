const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const db = require("../config/db");

// 1. Cloudinary Credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "campushub_notes",
    resource_type: "auto",
    public_id: (req, file) => Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_"),
  },
});

const upload = multer({ storage: storage });

// GET: All notes fetch karna
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

// POST: Koi bhi file upload karke note save karna (Cloudinary link direct DB me jayega)
router.post("/upload", upload.single("pdfFile"), (req, res) => {
  const { title, subject, semester } = req.body;

  if (!title || !subject || !semester || !req.file) {
    return res.status(400).json({
      message: "Title, Subject, Semester, aur file sabhi required hain.",
    });
  }

  // Cloudinary direct permanent HTTPS URL deta hai
  const file_url = req.file.path || req.file.secure_url;

  const insertSql = `
    INSERT INTO notes (title, subject, semester, file_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(insertSql, [title.trim(), subject.trim(), semester, file_url], (err, result) => {
    if (err) {
      console.error("Error inserting note:", err);
      return res.status(500).json({ message: "Database insert error." });
    }

    return res.status(201).json({
      message: "File uploaded successfully!",
      noteId: result.insertId,
      file_url: file_url,
    });
  });
});

// DELETE: Delete a note by ID
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