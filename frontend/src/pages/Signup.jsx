import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
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
        "https://campushub-backend-6rtk.onrender.com/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            course: "Diploma in Computer Science",
            semester: "5th Semester",
            college: "Government Polytechnic",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed.");
        return;
      }

      alert("Account created successfully! 🎉");

      navigate("/login");

    } catch (error) {
      console.error("Signup error:", error);

      alert(
        "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left Section */}
      <div className="auth-left">

        <div className="auth-brand">
          <h1>CampusHub</h1>
          <p>Your complete student platform</p>
        </div>

        <div className="auth-message">
          <h2>Join CampusHub 🚀</h2>

          <p>
            Create your student account and manage your
            studies, notes, question papers and academic
            information in one place.
          </p>
        </div>

      </div>

      {/* Right Section */}
      <div className="auth-right">

        <div className="auth-box">

          <div className="auth-header">
            <h2>Create your account</h2>

            <p>
              Enter your details to get started.
            </p>
          </div>

          <form onSubmit={handleSignup}>

            {/* Name */}
            <div className="auth-form-group">

              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

            </div>

            {/* Email */}
            <div className="auth-form-group">

              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

            </div>

            {/* Password */}
            <div className="auth-form-group">

              <label>Password</label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">

              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />

            </div>

            {/* Signup */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <div className="auth-footer">

            <p>
              Already have an account?{" "}
              <Link to="/login">
                Login
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;