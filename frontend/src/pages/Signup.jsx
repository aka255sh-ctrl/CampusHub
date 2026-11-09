import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  // Registration Fields
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [semester, setSemester] = useState("5th Semester");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Phone Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [loading, setLoading] = useState(false);

  // Send OTP Function
  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number!");
      return;
    }
    setOtpSent(true);
    alert(`Verification code 1234 sent to +91 ${phone} (Test OTP: 1234)`);
  };

  // Verify OTP Function
  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === "1234") {
      setIsPhoneVerified(true);
      alert("Mobile number verified successfully! ✅");
    } else {
      alert("Invalid OTP! For testing, please enter: 1234");
    }
  };

  // Form Submit Handler
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    if (!isPhoneVerified) {
      alert("Please verify your phone number with OTP first!");
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
            phone,
            branch,
            semester,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed.");
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
      {/* Left Section (Branding) */}
      <div className="auth-left">
        <div className="auth-brand">
          <h1>CampusHub</h1>
          <p>Your complete student platform</p>
        </div>

        <div className="auth-message">
          <h2>Join CampusHub 🚀</h2>
          <p>
            Create your verified student account with branch, semester, and mobile verification. 
            All registrations are linked to the Department Faculty desk.
          </p>
        </div>
      </div>

      {/* Right Section (Form) */}
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-header">
            <h2>Student Registration</h2>
            <p>Enter your academic & contact details to get started.</p>
          </div>

          <form onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="auth-form-group">
              <label>Full Official Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Branch / Department */}
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

            {/* Semester */}
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

            {/* Mobile Phone Number with OTP Verification */}
            <div className="auth-form-group">
              <label>Mobile Number (For Verification)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="10-digit number"
                  disabled={isPhoneVerified}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  style={{ flex: 1 }}
                />
                {!isPhoneVerified ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{
                      backgroundColor: "#0284c7",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                ) : (
                  <span
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* OTP Input Row */}
              {otpSent && !isPhoneVerified && (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="Enter 4-digit OTP (1234)"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    style={{ flex: 1, padding: "8px" }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
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
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !isPhoneVerified}
              style={{
                cursor: loading || !isPhoneVerified ? "not-allowed" : "pointer",
                opacity: !isPhoneVerified ? 0.7 : 1,
              }}
            >
              {loading
                ? "Registering Account..."
                : isPhoneVerified
                ? "Create Account & Send to Faculty →"
                : "Verify Phone First"}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              Already registered?{" "}
              <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;