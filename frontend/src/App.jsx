import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./Utils.js";

// --- LAYOUT IMPORTS ---
// Your existing AdminLayout (which does NOT have a Header/Footer)

// The new MainLayout we just created (which DOES have a Header/Footer)
import MainLayout from './components/layout/MainLayout.jsx';

// General Page Imports
import Login from "./components/Login";
import Register from "./components/Register";
import Homepage from "./pages/Home";
import About from "./pages/About";
import SubmitInterest from "./pages/SubmitInterest";
import FAQ from "./pages/FAQ";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProblemStatements from "./components/ProblemStatements.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";

// Student
import SdDashboard from "./pages/student/SdDashboard";
import Upload from "./pages/student/Upload";

// SPOC Imports
import SpocDashboard from "./pages/spoc/SpocDashboard";
// import Team_Members from "./pages/spoc/Team_Members.jsx";
import TeamList from "./pages/spoc/TeamList.jsx";
import SpocProfile from "./pages/spoc/SpocProfile.jsx";

// Admin
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import Approvals from "./pages/Admin/Approvals.jsx";
import Users from "./pages/Admin/Users.jsx";
import CreateUser from "./pages/Admin/CreateUser.jsx";
import ProblemStatementsList from "./pages/Admin/ProblemStatementsList.jsx";
import ProblemStatementCreate from "./pages/Admin/ProblemStatementCreate.jsx";
import ProblemImport from "./pages/Admin/ProblemImport.jsx";
import Exports from "./pages/Admin/Exports.jsx";
import { RequirePermission } from "./components/admin/adminAccess.jsx";
import ProblemStatementEdit from "./pages/Admin/ProblemStatementEdit.jsx";
import ProblemStatementDetail from "./pages/Admin/ProblemStatementDetail.jsx";
import SubmissionDetail from "./pages/Admin/SubmissionDetail.jsx";
import TeamDetails from "./pages/student/TeamDetails.jsx";
import Team_Members from "./pages/spoc/Team_Members.jsx";
// import TeamList from "./pages/spoc/TeamList.jsx";

function App() {
  const showToast = (message) => {
    const id = "app-toast";
    if (document.getElementById(id)) return;
    const el = document.createElement("div");
    el.id = id;
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: "6px",
      zIndex: 9999,
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    });
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 300ms";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, 2500);
  };

  function ProtectedRoute({ children, allowedRoles }) {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchAuth = async () => {
        try {
          const res = await auth();
          if (!res || !res.role) {
            showToast("Please login to your account");
          } else {
            setRole(res.role);
          }
        } catch (err) {
          console.error(err);
          showToast("Please login to your account");
        } finally {
          setLoading(false);
        }
      };
      fetchAuth();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!role) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(role)) {
      showToast("Unauthorized access");
      return <Navigate to="/" replace />;
    }

    return children;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* The Header and Footer are now REMOVED from here */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problemstatements" element={<ProblemStatements />} />
        <Route path="/interest" element={<SubmitInterest />} />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SdDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submit-solution"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/team-details"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <TeamDetails />
            </ProtectedRoute>
          }
        />

        {/* SPOC Routes */}
        <Route
          path="/spoc"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <SpocDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spoc/team"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <TeamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spoc/profile"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <SpocProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spoc/team_details"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <Team_Members />
            </ProtectedRoute>
          }
        />

        {/* The evaluator role was removed (admins evaluate); old links go to the home page */}
        <Route path="/evaluator/*" element={<Navigate to="/" replace />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="approvals" element={<RequirePermission permission="USERS"><Approvals /></RequirePermission>} />
          <Route path="exports" element={<Exports />} />
          <Route path="spoc-approvals" element={<Navigate to="/admin/approvals" replace />} />
          <Route path="problems/:id/details" element={<ProblemStatementDetail />} />
          <Route path="submissions/:id/details" element={<SubmissionDetail />} />

          {/* Problem Statement Management (CRUD) */}
          <Route path="problems" element={<ProblemStatementsList />} />
          <Route path="problems/create" element={<RequirePermission permission="PROBLEMS"><ProblemStatementCreate /></RequirePermission>} />
          <Route path="problems/import" element={<RequirePermission permission="PROBLEMS"><ProblemImport /></RequirePermission>} />
          <Route path="problems/edit/:id" element={<RequirePermission permission="PROBLEMS"><ProblemStatementEdit /></RequirePermission>} />
          <Route path="users" element={<RequirePermission permission="USERS"><Users /></RequirePermission>} />
          <Route path="users/create" element={<RequirePermission permission="USERS"><CreateUser /></RequirePermission>} />
          <Route path="evaluators/*" element={<Navigate to="/admin/users" replace />} />
        </Route>

        {/* <Route path="*" element={<FallBack/>}/> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
