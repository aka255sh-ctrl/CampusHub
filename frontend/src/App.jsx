import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Papers from "./pages/Papers";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./ProtectedRoute";

import "./App.css";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  if (isAuthPage) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <div className="app">

        {/* Sidebar */}
        <aside className="sidebar">

          <h1 className="logo">
            CampusHub
          </h1>

          <nav>

            <Link to="/">
              🏠 Dashboard
            </Link>

            <Link to="/notes">
              📚 Notes
            </Link>

            <Link to="/papers">
              📝 Question Papers
            </Link>

            <Link to="/profile">
              👤 Profile
            </Link>

          </nav>

          <button
            className="logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </aside>

        {/* Main Content */}
        <main className="main">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/notes"
              element={<Notes />}
            />

            <Route
              path="/papers"
              element={<Papers />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

          </Routes>

        </main>

      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;