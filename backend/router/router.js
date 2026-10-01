import { Router } from "express";

// Controller Imports
import { Add_Team_Members, Update_team } from "../controllers/Team_members.js";
import { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email } from "../controllers/Spoc_Teams.js";
import { login, logout, signup, GetAllUsers, verifyEmail, UpdateUser, Admin_create_user, Admin_delete_user } from "../controllers/User_details.js";
import { Verify_OTP, Verify_OTP_Check } from "../controllers/Verify_OTP.js";
// import Verify_OTP_Check from "../controllers/Verify_OTP_Check.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.js";
import { Post_problem, Get_problems, Get_problem_by_id, Delete_problem } from "../controllers/Problems.js";
import { Get_cookies } from "../controllers/Cookie.js";
import { Delete_submission, Get_all_submissions, SubmitSolution, Get_submission_by_id, Get_submission_by_prob_id, fetch_submissions_by_email, AddMarkToSolution, check_status_submission } from "../controllers/Submission.js";
// import { Get_all_submissions, SubmitSolution, Get_submission_by_id, Get_submission_by_prob_id, fetch_submissions_by_email,check_status_submission } from "../controllers/Submission.js";
import { handleSpocApprove, Spoc_approve } from "../controllers/Spoc.js";
import { sendMailToSpoc } from "../controllers/SendMail.js";
import { upload, uploadFiles } from "../controllers/Upload.js";
import { Get_spoc_progress, Assign_problem, Reject_request, Unassign_problem, Get_student_overview, Request_problem, Cancel_request } from "../controllers/TeamProblems.js";

const router = Router();

// --- Public / Authentication Routes ---
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/register").post(optionalAuth, signup);
// router.route("/register/:email/:password/:role/:manufacture/:college_code/:name/:date").post(signup);

router.route("/verify_email/:email").post(Verify_OTP);

router.route("/checkifemailexist").post(verifyEmail)
router.route("/verify_otp").post(Verify_OTP_Check);
router.route("/cookie").get(Get_cookies); // Checks user authentication status

// --- Admin Routes ---
// Protected admin/SPOC routes
router.route("/addproblems").post(requireAuth, requireRole(['ADMIN']), Post_problem);
router.route("/admin/create_user").post(requireAuth, requireRole(['ADMIN']), Admin_create_user); // Platform admin creates admin / SPOC accounts
router.route("/admin/delete_user").post(requireAuth, requireRole(['ADMIN']), Admin_delete_user); // Platform admin deletes an admin / SPOC account
router.route("/spoc_users").get(requireAuth, requireRole(['ADMIN']), Spoc_approve); // Get pending SPOC approvals
router.route("/handlespoc").post(requireAuth, requireRole(['ADMIN']), handleSpocApprove); // Approve or reject a SPOC
router.route("/get_all_users").get(requireAuth, requireRole(['ADMIN']), GetAllUsers); // Get all users
router.route("/submissions").get(requireAuth, requireRole(['ADMIN']), Get_all_submissions);
router.route("/submissions_by_id").post(requireAuth, requireRole(['ADMIN']), Get_submission_by_prob_id); // Get all submissions from all teams
// Get all submissions from all teams
router.route("/submissions/:id").get(requireAuth, requireRole(['ADMIN']), Get_submission_by_id); // Get single submission by ID

// --- SPOC Routes ---
router.route("/fetch_teams/:id").post(requireAuth, Fetch_Teams);
router.route("/fetch_team_members").post(requireAuth, Fetch_Team_Members);
router.route("/add_members/:id").post(requireAuth, Add_Team_Members);
router.route("/update_team").post(requireAuth, Update_team);
router.route("/delete_team").post(requireAuth, Delete_team);
router.route("/send_mail_to_spoc").post(requireAuth, requireRole(['ADMIN']), sendMailToSpoc);
// SPOC assigns problem statements to their teams and tracks their progress
router.route("/spoc/progress").get(requireAuth, requireRole(['SPOC', 'ADMIN']), Get_spoc_progress);
router.route("/spoc/assign_problem").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Assign_problem);
router.route("/spoc/unassign_problem").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Unassign_problem);
router.route("/spoc/reject_request").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Reject_request);
router.route("/student/overview").get(requireAuth, requireRole(['STUDENT']), Get_student_overview);
router.route("/student/request_problem").post(requireAuth, requireRole(['STUDENT']), Request_problem);
router.route("/student/cancel_request").post(requireAuth, requireRole(['STUDENT']), Cancel_request);
router.route("/fetch_team_for_students").post(requireAuth, Fetch_Team_For_Students); 
router.route("/fetch_team_id_email").post(requireAuth, fetch_team_id_email);
router.route("/get_submissions_by_email").post(requireAuth, fetch_submissions_by_email)
router.route("/check_submission_status").post(requireAuth, check_status_submission)


// --- Student Routes ---
router.route("/submit_solution").post(requireAuth, SubmitSolution);


// --- Common/Shared Routes ---
router.route("/get_problems").get(Get_problems);
router.route("/problems/:id").get(Get_problem_by_id);


// Delete Problem Statement

// Update User Profile
router.put("/update-user", requireAuth, UpdateUser);

router.post("/delete_problem", requireAuth, requireRole(['ADMIN']), Delete_problem);

router.route("/upload_files").post(requireAuth, upload.any(), uploadFiles)
router.route("/delete_submission").post(requireAuth, requireRole(['ADMIN', 'STUDENT']), Delete_submission)
router.route("/mark_entry").post(requireAuth, requireRole(['ADMIN']), AddMarkToSolution)

export default router;
