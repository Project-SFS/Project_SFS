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
import SPOCProfile from "./pages/spoc/SPOCProfile";
// import Team_Members from "./pages/spoc/Team_Members.jsx";
import TeamList from "./pages/spoc/TeamList.jsx";

// Evaluator
import EvaluatorLayout from "./pages/evaluator/EvaluatorLayout.jsx";
import AssignedProblem from "./pages/evaluator/AssignedProblem.jsx";
import SubmissionList from "./pages/evaluator/SubmissionList.jsx";
import SubmissionDetail from "./pages/evaluator/SubmissionDetail.jsx";
import AddProblemStatement from "./pages/evaluator/AddProblemStatement.jsx";
import EvaluatorProblemDetail from "./pages/evaluator/EvaluatorProblemDetail.jsx";
import EvaluatorProfile from "./pages/evaluator/EvaluatorProfile.jsx";

// Admin
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import SpocApprovals from "./pages/Admin/SpocApprovals.jsx";
import EvaluatorsList from "./pages/Admin/EvaluatorsList.jsx";
import EvaluatorManage from "./pages/Admin/EvaluatorManage.jsx";
import ProblemStatementsList from "./pages/Admin/ProblemStatementsList.jsx";
import ProblemStatementCreate from "./pages/Admin/ProblemStatementCreate.jsx";
import ProblemStatementEdit from "./pages/Admin/ProblemStatementEdit.jsx";
import ProblemStatementDetail from "./pages/Admin/ProblemStatementDetail.jsx";
import SubmissionDetail2 from "./pages/Admin/SubmissionDetail.jsx";
import TeamDetails from "./pages/student/TeamDetails.jsx";
import Team_Members from "./pages/spoc/Team_Members.jsx";
// import TeamList from "./pages/spoc/TeamList.jsx";
// import AssignedProblem from "./pages/evaluator/AssignedProblem.jsx";
// import SubmissionList from "./pages/evaluator/SubmissionList.jsx";
// import SubmissionDetail from "./pages/evaluator/SubmissionDetail.jsx";

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
          path="/spoc/profile"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <SPOCProfile />
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
          path="/spoc/team_details"
          element={
            <ProtectedRoute allowedRoles={["SPOC"]}>
              <Team_Members />
            </ProtectedRoute>
          }
        />

        {/* Evaluator Routes */}
        <Route
          path="/evaluator"
          element={
            <ProtectedRoute allowedRoles={["EVALUATOR"]}>
              <EvaluatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AssignedProblem />} />
          <Route path="submissions" element={<SubmissionList />} />
          <Route path="submission/:id" element={<SubmissionDetail />} />
          <Route path="AddProblemStatement" element={<ProblemStatementCreate />} />
          <Route path="problem/:id" element={<EvaluatorProblemDetail />} />
          <Route path="profile" element={<EvaluatorProfile />} />
        </Route>

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
          <Route path="spoc-approvals" element={<SpocApprovals />} />
          <Route path="problems/:id/details" element={<ProblemStatementDetail />} />
          <Route path="submissions/:id/details" element={<SubmissionDetail2 />} />

          {/* Problem Statement Management (CRUD) */}
          <Route path="problems" element={<ProblemStatementsList />} />
          <Route path="problems/create" element={<ProblemStatementCreate />} />
          <Route path="problems/edit/:id" element={<ProblemStatementEdit />} />
          <Route path="evaluators" element={<EvaluatorsList />} />
          <Route path="evaluators/create" element={<EvaluatorManage />} />
          <Route path="evaluators/manage/:id" element={<EvaluatorManage />} />
        </Route>

        {/* <Route path="*" element={<FallBack/>}/> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
