const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const db = require("../config/db");

// Cloudinary configuration (uses your existing .env keys)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage: file local disk par nahi, seedha Cloudinary par stream hogi
const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const cleanName = Date.now() + "-" + originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "campushub_question_papers",
        resource_type: "auto",
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

// GET: All question papers
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

// POST: Upload paper directly to Cloudinary
router.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const { title, subject, semester, year, userId } = req.body;

    if (!title || !subject || !semester || !year || !req.file) {
      return res.status(400).json({
        message: "Title, Subject, Semester, Year, and File are required.",
      });
    }

    // Direct cloud stream upload
    const file_url = await uploadToCloudinary(req.file.buffer, req.file.originalname);

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
  } catch (error) {
    console.error("Cloudinary paper upload error:", error);
    return res.status(500).json({ message: "Failed to upload question paper to cloud." });
  }
});

// DELETE: Delete question paper by ID
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