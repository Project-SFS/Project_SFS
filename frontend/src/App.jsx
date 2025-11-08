import React from "react"; // It's good practice to import React
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// --- LAYOUT IMPORTS ---
// Your existing AdminLayout (which does NOT have a Header/Footer)

// The new MainLayout we just created (which DOES have a Header/Footer)
import MainLayout from './components/layout/MainLayout.jsx';

// General Page Imports
import Login from "./components/Login";
import Register from "./components/Register";
import Homepage from "./pages/Homepage";
import About from "./pages/About";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Student Imports
import SdDashboard from "./pages/student/SdDashboard";
import Upload from "./pages/student/Upload";
                                                    
// SPOC Imports
import SpocDashboard from "./pages/spoc/SpocDashboard";
import SPOCProfile from "./pages/spoc/SPOCProfile";

// Evaluator Imports
import EvaluatorLayout from "./pages/evaluator/EvaluatorLayout.jsx";

// Admin Imports
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
import TeamList from "./pages/spoc/TeamList.jsx";
import AssignedProblem from "./pages/evaluator/AssignedProblem.jsx";
import SubmissionList from "./pages/evaluator/SubmissionList.jsx";
import SubmissionDetail from "./pages/evaluator/SubmissionDetail.jsx";

function App() {
  const isAuthenticated = true;

  return (
    <BrowserRouter>
      {/* The Header and Footer are now REMOVED from here */}
      <Routes>
        <Route path="/" element={<Homepage />} />

        <Route path="/about" element={<About />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<SdDashboard />} />

        <Route path="/spoc" element={<SpocDashboard />} />

        <Route path="/spoc/profile" element={<SPOCProfile />} />

        <Route path="/student/submit-solution" element={<Upload />} />

        <Route path="/spoc/team_details/:id" element={<Team_Members />} />

        <Route path="/spoc/team" element={<TeamList />} />

        <Route path="/evaluator" element={<EvaluatorLayout />}>
          <Route index element={<AssignedProblem />} />

          <Route path="submissions" element={<SubmissionList />} />

          <Route path="submission/:teamId" element={<SubmissionDetail />} />
        </Route>

        {/* --- COMPLETE ADMIN ROUTING BLOCK --- */}

        <Route
          path="/admin"
          element={
            isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />
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
          {/* Evaluator Management (CRUD & Assignment) */}
          <Route path="evaluators" element={<EvaluatorsList />} />
          <Route path="evaluators/create" element={<EvaluatorManage />} />{" "}
          {/* For creation */}
          <Route
            path="evaluators/manage/:id"
            element={<EvaluatorManage />}
          />{" "}
          {/* For assignment/editing */}
        </Route>

        {/* --- END ADMIN ROUTING BLOCK --- */}

        {/* ssss */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
