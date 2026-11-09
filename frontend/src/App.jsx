import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Papers from "./pages/Papers";
import Profile from "./pages/Profile";
import "./App.css";

// Auth Guard: Agar user logged in nahi hai toh Login page par bhejo
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = localStorage.getItem("user");

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Auth pages (Login / Signup) bina sidebar ke render honge
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <h1 className="logo">CampusHub</h1>

          <nav>
            <Link to="/dashboard">🏠 Dashboard</Link>
            <Link to="/notes">📚 Notes</Link>
            <Link to="/papers">📝 Question Papers</Link>
            <Link to="/profile">👤 Profile</Link>
          </nav>

          <button className="logout" onClick={handleLogout}>
            Logout 🚪
          </button>
        </aside>

        {/* Main Content */}
        <main className="main">
          <Routes>
            {/* Root: Agar login hai toh Dashboard, warna Signup (Registration First) */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/signup" replace />
                )
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}