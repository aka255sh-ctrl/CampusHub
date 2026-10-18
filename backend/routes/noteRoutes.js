const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Unique file name generate karein original extension ke sath
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Bina kisi restriction ke multer setup (Sabhi file types allowed)
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

// POST: Koi bhi file upload karke note save karna
router.post("/upload", upload.single("pdfFile"), (req, res) => {
  const { title, subject, semester } = req.body;

  if (!title || !subject || !semester || !req.file) {
    return res.status(400).json({
      message: "Title, Subject, Semester, aur file sabhi required hain.",
    });
  }

  const file_url = `https://campushub-backend-6rtk.onrender.com/uploads/${req.file.filename}`;

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