import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Login successful! 🎉");

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

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

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Google login successful! 🎉");

      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);

      alert(
        "Unable to connect to the server. Make sure the backend is running."
      );
    }
  };

  const handleGoogleError = () => {
    alert("Google login failed. Please try again.");
  };

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="auth-brand">
          <h1>CampusHub</h1>
          <p>Your complete student platform</p>
        </div>

        <div className="auth-message">
          <h2>Welcome back! 👋</h2>

          <p>
            Access your study materials, question papers,
            academic information and more — all in one place.
          </p>
        </div>

      </div>

      <div className="auth-right">

        <div className="auth-box">

          <div className="auth-header">
            <h2>Login to CampusHub</h2>

            <p>
              Enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <div className="auth-form-group">

              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

            </div>

            <div className="auth-form-group">

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

            </div>

            <div className="auth-options">

              <label>
                <input type="checkbox" />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  alert("Password reset will be added later.")
                }
              >
                Forgot Password?
              </button>

            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "22px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "#e5e7eb",
              }}
            />

            <span
              style={{
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              OR
            </span>

            <div
              style={{
                flex: 1,
                height: "1px",
                background: "#e5e7eb",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
            />
          </div>

          <div className="auth-footer">

            <p>
              Don't have an account?{" "}
              <Link to="/signup">
                Create Account
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;