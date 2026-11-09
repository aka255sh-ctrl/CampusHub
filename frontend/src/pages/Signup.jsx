import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [semester, setSemester] = useState("5th Semester");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://campushub-backend-6rtk.onrender.com/api/auth/register-student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            branch,
            semester,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      alert("Account registered successfully! Details submitted to Faculty. Please Login. 🎓");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Unable to connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>CampusHub</h1>
          <p>Your complete student platform</p>
        </div>

        <div className="auth-message">
          <h2>Join CampusHub 🚀</h2>
          <p>
            Create your verified student account with branch and semester.
            All registrations are linked to the Department Faculty desk.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-header">
            <h2>Student Registration</h2>
            <p>Enter your academic details to get started.</p>
          </div>

          <form onSubmit={handleSignup}>
            <div className="auth-form-group">
              <label>Full Official Name</label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label>Department / Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div className="auth-form-group">
              <label>Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
              </select>
            </div>

            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter your college or personal email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              style={{
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Registering Account..." : "Create Account & Send to Faculty →"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already registered? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;