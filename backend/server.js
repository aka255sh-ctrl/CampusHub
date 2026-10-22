require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const questionPaperRoutes = require("./routes/questionPaperRoutes");

const app = express();
// Purani line:
// const PORT = 5000;

// Is line se replace karein:
const PORT = process.env.PORT || 5000;

// Purani line:
// const fileUrl = req.file ? `https://campushub-backend-6rtk.onrender.com/uploads/${req.file.filename}` : null;

// Nayi line (Cloudinary ka permanent secure URL direct milta hai):
const fileUrl = req.file ? (req.file.path || req.file.secure_url) : null;

app.use(cors());
app.use(express.json());

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// 1. Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "campushub_docs",
    resource_type: "auto",
    public_id: (req, file) => Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_"),
  },
});
const upload = multer({ storage: storage });

// Uploads directory serve karein static files ke liye
app.use("/uploads", express.static(uploadsDir));

// Route handlers
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/question-papers", questionPaperRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "CampusHub backend is running 🚀" });
});

// ======================================
// NOTICES ROUTES
// ======================================
app.get("/api/notices", (req, res) => {
  db.query("SELECT * FROM notices ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching notices" });
    res.json({ notices: results });
  });
});

app.post("/api/notices", (req, res) => {
  const { title, sender, tag, description } = req.body;
  if (!title || !sender || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "INSERT INTO notices (title, sender, tag, description) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, sender, tag || "Academic", description], (err, result) => {
    if (err) return res.status(500).json({ message: "Error adding notice" });
    res.status(201).json({ message: "Notice published successfully!" });
  });
});

app.delete("/api/notices/:id", (req, res) => {
  const noticeId = req.params.id;
  db.query("DELETE FROM notices WHERE id = ?", [noticeId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting notice" });
    res.json({ message: "Notice deleted successfully" });
  });
});

// ======================================
// TEACHER: REGISTERED STUDENTS LIST
// ======================================
app.get("/api/admin/students", (req, res) => {
  const sql = "SELECT id, name, email, course, semester, created_at FROM users WHERE role != 'teacher' OR role IS NULL ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching users " });
    res.json({ students: results });
  });
});

// ======================================
// STUDENT ASSIGNMENT SUBMISSION (With File Upload)
// ======================================
app.post("/api/submissions", upload.single("submissionFile"), (req, res) => {
  const { student_id, student_name, assignment_title } = req.body;
  const fileUrl = req.file ? `https://campushub-backend-6rtk.onrender.com/uploads/${req.file.filename}` : null;

  if (!student_id || !assignment_title) {
    return res.status(400).json({ message: "Student ID and title required" });
  }

  const sql = `
    INSERT INTO student_submissions 
    (student_id, student_name, assignment_title, file_url, status) 
    VALUES (?, ?, ?, ?, 'Submitted')
  `;

  db.query(sql, [student_id, student_name || "Student", assignment_title, fileUrl], (err, result) => {
    if (err) {
      console.error("Submission DB error:", err);
      return res.status(500).json({ message: "Submission failed in database" });
    }
    return res.json({ 
      message: "Assignment submitted successfully!", 
      submissionId: result.insertId,
      file_url: fileUrl 
    });
  });
});

// ======================================
// TEACHER: GET ALL SUBMISSIONS
// ======================================
app.get("/api/admin/submissions", (req, res) => {
  const sql = "SELECT * FROM student_submissions ORDER BY submitted_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Error loading submissions" });
    return res.json({ submissions: results });
  });
});

// ======================================
// TEACHER: UPDATE SUBMISSION STATUS / APPROVE
// ======================================
app.put("/api/admin/submissions/:id", (req, res) => {
  const submissionId = req.params.id;
  const { status } = req.body;

  const sql = "UPDATE student_submissions SET status = ? WHERE id = ?";
  db.query(sql, [status || "Verified & Approved", submissionId], (err, result) => {
    if (err) {
      console.error("Error updating submission status:", err);
      return res.status(500).json({ message: "Failed to update status." });
    }
    return res.json({ message: "Submission status updated successfully!" });
  });
});

// ======================================
// TEACHER: PROMOTE / DEMOTE USER ROLE
// ======================================
app.put("/api/admin/users/:id/role", (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body; // 'teacher' ya 'student'

  if (!["teacher", "student"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  const sql = "UPDATE users SET role = ? WHERE id = ?";
  db.query(sql, [role, targetUserId], (err, result) => {
    if (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ message: "Database error updating role." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: `User has been successfully granted ${role === "teacher" ? "Faculty Teacher" : "Student"} privileges! ✅`,
      role: role,
    });
  });
});

// ======================================
// TEACHER: PROMOTE / DEMOTE USER ROLE
// ======================================
app.put("/api/admin/users/:id/role", (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body; // 'teacher' ya 'student'

  if (!["teacher", "student"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  const sql = "UPDATE users SET role = ? WHERE id = ?";
  db.query(sql, [role, targetUserId], (err, result) => {
    if (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ message: "Database error updating role." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: `User has been successfully granted ${role === "teacher" ? "Faculty Teacher" : "Student"} privileges! ✅`,
      role: role,
    });
  });
}); 

// ======================================
// USER PROFILE: CHANGE PASSWORD & SYNC
// ======================================
app.put("/api/auth/change-password", (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Find user
  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];

    // Check old password (Direct comparison or bcrypt match)
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Update password
    db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId], (upErr) => {
      if (upErr) {
        return res.status(500).json({ message: "Failed to update password." });
      }
      return res.json({ message: "Password updated successfully! 🔒" });
    });
  });
});

// App listen sabse aakhir me
app.listen(PORT, () => {
  console.log(`CampusHub server running on http://localhost:${PORT}`);
});