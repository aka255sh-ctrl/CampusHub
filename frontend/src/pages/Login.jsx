import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Standard Email + Password Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://campushub-backend-6rtk.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token || "session_token_ok");
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful! 🎉");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Official Google OAuth JWT Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        alert("Google login failed.");
        return;
      }

      const response = await fetch(
        "https://campushub-backend-6rtk.onrender.com/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Google login failed.");
        return;
      }

      localStorage.setItem("token", data.token || "google_token_ok");
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Google login successful! 🎉");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      alert("Unable to connect to the server. Make sure the backend is running.");
    }
  };

  const handleGoogleError = () => {
    alert("Google login failed. Please try again or use direct Gmail login below.");
  };

  // Direct Gmail Fallback (If Google OAuth Client ID is not configured)
  const handleDirectGmailLogin = async () => {
    const gmail = prompt("Enter your Gmail address to login directly:", "student@gmail.com");
    if (!gmail || !gmail.trim()) return;

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gmail.trim(),
          name: gmail.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gmail login failed");

      localStorage.setItem("token", "gmail_session_ok");
      localStorage.setItem("user", JSON.stringify(data.user));
      alert(`Welcome ${data.user.name}! Connected via Gmail 🎉`);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "Gmail connection failed.");
    }
  };

  return (
    <div className="auth-page">
      {/* Left Section (Branding) */}
      <div className="auth-left">
        <div className="auth-brand">
          <h1>CampusHub</h1>
          <p>Your complete student platform</p>
        </div>

        <div className="auth-message">
          <h2>Welcome back! 👋</h2>
          <p>
            Access your study materials, question papers,
            academic bulletins and virtual classes — all in one place.
          </p>
        </div>
      </div>

      {/* Right Section (Form) */}
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-header">
            <h2>Login to CampusHub</h2>
            <p>Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
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

            {/* Password */}
            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-options">
              <label>
                <input type="checkbox" defaultChecked />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => alert("Please contact Department Faculty to reset your password.")}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login to Portal →"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            <span style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          </div>

          {/* Google Login Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
              />
            </div>

            {/* Direct 1-Click Gmail Connect */}
            <button
              type="button"
              onClick={handleDirectGmailLogin}
              style={{
                width: "100%",
                padding: "9px 14px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                color: "#334155",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.27-2.09 3.64-5.17 3.64-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.9H1.3v3.15C3.32 21.36 7.37 24 12 24z" />
                <path fill="#FBBC05" d="M5.32 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.55H1.3C.47 8.19 0 10.04 0 12s.47 3.81 1.3 5.45l4.02-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.32 2.64 1.3 6.55l4.02 3.15c.94-2.81 3.58-4.9 6.68-4.9z" />
              </svg>
              Direct 1-Click Gmail Connect
            </button>
          </div>

          {/* Footer Link */}
          <div className="auth-footer" style={{ marginTop: "18px" }}>
            <p>
              New Student?{" "}
              <Link to="/signup" style={{ fontWeight: "700", color: "#2563eb" }}>
                Register Your Account Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;