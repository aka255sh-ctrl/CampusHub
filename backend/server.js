require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const questionPaperRoutes = require("./routes/questionPaperRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

// Static uploads folder fallback (fixes Cannot GET /uploads/...)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// 1. Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Memory storage
const upload = multer({ storage: multer.memoryStorage() });

// 3. Submissions ke liye Upload Helper (Stream Buffer Pipe)
const uploadToCloudinary = (buffer, originalname, folder = "campushub_submissions") => {
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
// REMOTE LEARNING / LIVE CLASS BROADCAST API
// ======================================
let activeLiveClass = null;

// GET: Current active live class
app.get("/api/live-class", (req, res) => {
  res.json({ liveClass: activeLiveClass });
});

// POST: Teacher launches or updates a live class
app.post("/api/live-class", (req, res) => {
  const { subject, teacherName, meetUrl, topic } = req.body;
  if (!meetUrl) {
    return res.status(400).json({ message: "Meeting URL is required." });
  }

  activeLiveClass = {
    subject: subject || "Online Lecture",
    teacherName: teacherName || "Faculty Coordinator",
    meetUrl: meetUrl.trim(),
    topic: topic || "Regular Syllabus Session",
    startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  res.json({ message: "Live Class broadcasted successfully!", liveClass: activeLiveClass });
});

// DELETE: Teacher ends the live class
app.delete("/api/live-class", (req, res) => {
  activeLiveClass = null;
  res.json({ message: "Live Class session ended." });
});

// ======================================
// TEACHER: REGISTERED USERS & DELEGATION LIST
// ======================================
app.get("/api/admin/students", (req, res) => {
  const sql = "SELECT id, name, email, role, course, semester, created_at FROM users ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users list:", err);
      return res.status(500).json({ message: "Error fetching users" });
    }
    res.json({ students: results });
  });
});

// ======================================
// STUDENT ASSIGNMENT SUBMISSION (With Direct Cloudinary Upload)
// ======================================
app.post(
  "/api/submissions",
  upload.fields([
    { name: "submissionFile", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { student_id, student_name, assignment_title } = req.body;

      if (!student_id || !assignment_title) {
        return res.status(400).json({ message: "Student ID and title required" });
      }

      const uploadedFile =
        (req.files && (req.files.submissionFile?.[0] || req.files.file?.[0])) || req.file;

      if (!uploadedFile || !uploadedFile.buffer || uploadedFile.buffer.length === 0) {
        return res.status(400).json({ message: "File missing or empty buffer" });
      }

      const fileUrl = await uploadToCloudinary(
        uploadedFile.buffer,
        uploadedFile.originalname,
        "campushub_submissions"
      );

      const sql = `
        INSERT INTO student_submissions 
        (student_id, student_name, assignment_title, file_url, status) 
        VALUES (?, ?, ?, ?, 'Submitted')
      `;

      db.query(
        sql,
        [student_id, student_name || "Student", assignment_title, fileUrl],
        (err, result) => {
          if (err) {
            console.error("Submission DB error:", err);
            return res.status(500).json({ message: "Submission failed in database" });
          }
          return res.json({
            message: "Assignment submitted successfully!",
            submissionId: result.insertId,
            file_url: fileUrl,
          });
        }
      );
    } catch (error) {
      console.error("Cloudinary submission error:", error);
      return res.status(500).json({ message: "File upload to cloud failed" });
    }
  }
);

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
// TEACHER: GRADE & APPROVE SUBMISSION
// ======================================
app.put("/api/admin/submissions/:id", (req, res) => {
  const subId = req.params.id;
  const { status, marks, feedback } = req.body;

  const sql = `
    UPDATE student_submissions 
    SET status = ?, marks = ?, feedback = ? 
    WHERE id = ?
  `;

  db.query(
    sql,
    [status || "Verified & Approved", marks || null, feedback || null, subId],
    (err, result) => {
      if (err) {
        console.error("Submission grade update error:", err);
        return res.status(500).json({ message: "Failed to grade submission." });
      }
      return res.json({ message: "Assignment graded and approved successfully!" });
    }
  );
});

// ======================================
// TEACHER: DELETE SUBMISSION RECORD
// ======================================
app.delete("/api/admin/submissions/:id", (req, res) => {
  const subId = req.params.id;
  const sql = "DELETE FROM student_submissions WHERE id = ?";
  db.query(sql, [subId], (err, result) => {
    if (err) {
      console.error("Error deleting submission:", err);
      return res.status(500).json({ message: "Failed to delete submission record" });
    }
    return res.json({ message: "Submission deleted successfully" });
  });
});

// ======================================
// TEACHER: PROMOTE / DEMOTE USER ROLE
// ======================================
app.put("/api/admin/users/:id/role", (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body;

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
// USER PROFILE: CHANGE PASSWORD
// ======================================
app.put("/api/auth/change-password", (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];

    if (user.password !== currentPassword) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId], (upErr) => {
      if (upErr) {
        return res.status(500).json({ message: "Failed to update password." });
      }
      return res.json({ message: "Password updated successfully! 🔒" });
    });
  });
});

// App listen
app.listen(PORT, () => {
  console.log(`CampusHub server running on port ${PORT}`);
});