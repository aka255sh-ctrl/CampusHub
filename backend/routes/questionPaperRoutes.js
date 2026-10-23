const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// GET: All question papers with Uploader name
router.get("/", (req, res) => {
  const { semester, subject, year } = req.query;

  let sql = `
    SELECT 
      question_papers.*, 
      users.name AS uploader_name 
    FROM question_papers 
    LEFT JOIN users ON question_papers.user_id = users.id 
    WHERE 1=1
  `;
  const params = [];

  if (semester) {
    sql += " AND question_papers.semester = ?";
    params.push(semester);
  }

  if (subject) {
    sql += " AND question_papers.subject LIKE ?";
    params.push(`%${subject}%`);
  }

  if (year) {
    sql += " AND question_papers.year = ?";
    params.push(year);
  }

  sql += " ORDER BY question_papers.year DESC, question_papers.created_at DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching question papers:", err);
      return res.status(500).json({ message: "Failed to load question papers." });
    }
    return res.json({ questionPapers: results });
  });
});

// POST: Upload paper file with user_id
router.post("/upload", upload.single("pdfFile"), (req, res) => {
  const { title, subject, semester, year, userId } = req.body;

  if (!title || !subject || !semester || !year || !req.file) {
    return res.status(400).json({
      message: "Title, Subject, Semester, Year, and File are required.",
    });
  }

  const file_url = `https://campushub-backend-6rtk.onrender.com/uploads/${req.file.filename}`;

  const insertSql = `
    INSERT INTO question_papers (title, subject, semester, year, user_id, file_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertSql,
    [title.trim(), subject.trim(), semester, year.trim(), userId || null, file_url],
    (err, result) => {
      if (err) {
        console.error("Error inserting paper:", err);
        return res.status(500).json({ message: "Database insert error." });
      }

      return res.status(201).json({
        message: "Question Paper uploaded successfully!",
        paperId: result.insertId,
        file_url: file_url,
      });
    }
  );
});

// DELETE: Delete a question paper by ID
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const deleteSql = "DELETE FROM question_papers WHERE id = ?";

  db.query(deleteSql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting question paper:", err);
      return res.status(500).json({ message: "Database delete failed." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Question paper not found." });
    }

    return res.json({ message: "Question paper deleted successfully!" });
  });
});

module.exports = router;