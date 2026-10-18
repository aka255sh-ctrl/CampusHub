const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const db = require("../config/db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "campushub-development-secret";
// Purani line:
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

// Is line se replace karein:
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  "194527743131-ismov6cnqmcgq7ppisn3so4pruafa37d.apps.googleusercontent.com";
  
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, course, semester, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    db.query("SELECT id FROM users WHERE email = ?", [normalizedEmail], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error." });
      if (results.length > 0) return res.status(409).json({ message: "Email already registered." });

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertSql = `
          INSERT INTO users (name, email, password, course, semester, college)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            normalizedName,
            normalizedEmail,
            hashedPassword,
            course || "Diploma in Computer Science",
            semester || "5th Semester",
            college || "Government Polytechnic",
          ],
          (insertErr, result) => {
            if (insertErr) return res.status(500).json({ message: "Failed to create account." });
            return res.status(201).json({
              message: "Account created successfully!",
              userId: result.insertId,
            });
          }
        );
      } catch (hashError) {
        return res.status(500).json({ message: "Failed to create account." });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const sql = "SELECT id, name, email, password, course, semester, college FROM users WHERE email = ?";

  db.query(sql, [normalizedEmail], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (results.length === 0) return res.status(401).json({ message: "Invalid email or password." });

    const user = results[0];
    if (!user.password) {
      return res.status(401).json({ message: "This account uses Google login. Please continue with Google." });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password." });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
      delete user.password;

      return res.json({ message: "Login successful!", token, user });
    } catch (error) {
      return res.status(500).json({ message: "Login failed." });
    }
  });
});

// GOOGLE LOGIN
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential is required." });

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google Client ID is not configured on the server." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: "Invalid Google account." });

    const googleId = payload.sub;
    const googleEmail = payload.email;
    const googleName = payload.name || "Google User";

    const findUserSql = `
      SELECT id, name, email, password, google_id, course, semester, college
      FROM users
      WHERE google_id = ? OR email = ?
      LIMIT 1
    `;

    db.query(findUserSql, [googleId, googleEmail], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error." });

      if (results.length > 0) {
        const user = results[0];
        const updateGoogleId = "UPDATE users SET google_id = ? WHERE id = ?";

        db.query(updateGoogleId, [googleId, user.id], (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Failed to update Google account." });

          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
          delete user.password;

          return res.json({
            message: "Google login successful!",
            token,
            user: { ...user, google_id: googleId },
          });
        });
        return;
      }

      const insertSql = `
        INSERT INTO users (name, email, password, google_id, course, semester, college)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [googleName, googleEmail, null, googleId, "Diploma in Computer Science", "5th Semester", "Government Polytechnic"],
        (insertErr, result) => {
          if (insertErr) return res.status(500).json({ message: "Failed to create Google account." });

          const newUser = {
            id: result.insertId,
            name: googleName,
            email: googleEmail,
            google_id: googleId,
            course: "Diploma in Computer Science",
            semester: "5th Semester",
            college: "Government Polytechnic",
          };

          const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "1d" });
          return res.status(201).json({ message: "Google account created successfully!", token, user: newUser });
        }
      );
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed." });
  }
});

// GET PROFILE
router.get("/profile", authenticateToken, (req, res) => {
  const sql = "SELECT id, name, email, course, semester, college FROM users WHERE id = ? LIMIT 1";
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to load profile." });
    if (results.length === 0) return res.status(404).json({ message: "Student account not found." });
    return res.json({ message: "Profile loaded successfully.", user: results[0] });
  });
});

// UPDATE PROFILE BY ID (Used by Profile.jsx)
router.put("/profile/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, course, semester, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required." });
  }

  try {
    let sql = "UPDATE users SET name = ?, course = ?, semester = ?";
    let params = [name.trim(), course ? course.trim() : "", semester || "5th Semester"];

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ message: "Failed to update profile." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found." });
      }

      return res.json({
        message: "Profile updated successfully!",
        user: {
          id: userId,
          name: name.trim(),
          course: course ? course.trim() : "",
          semester: semester || "5th Semester",
        },
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error processing update." });
  }
});

module.exports = router;