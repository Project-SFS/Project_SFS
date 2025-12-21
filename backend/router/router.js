import { Router } from "express";

// Controller Imports
import { Add_Team_Members, Update_team } from "../controllers/Team_members.js";
import { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email } from "../controllers/Spoc_Teams.js";
import { login, logout, signup, GetAllUsers, GetAllEvaluators, verifyEmail, UpdateUser } from "../controllers/User_details.js";
import { Verify_OTP } from "../controllers/Verify_OTP.js";
// import Verify_OTP_Check from "../controllers/Verify_OTP_Check.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Post_problem, Get_problems, Get_problem_by_id, Delete_problem, Get_assigned_problems } from "../controllers/Problems.js";
import { Get_cookies } from "../controllers/Cookie.js";
import { Get_all_submissions, SubmitSolution, Get_submission_by_id, Get_submission_by_prob_id } from "../controllers/Submission.js";
import { handleSpocApprove, Spoc_approve } from "../controllers/Spoc.js";
import { sendMailToSpoc } from "../controllers/SendMail.js";
import { upload, uploadFiles } from "../controllers/Upload.js";

const router = Router();

// --- Public / Authentication Routes ---
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/register").post(signup);
// router.route("/register/:email/:password/:role/:manufacture/:college_code/:name/:date").post(signup);

router.route("/verify_email/:email").post(Verify_OTP);

router.route("/checkifemailexist").post(verifyEmail)
// router.route("/verify_otp").post(Verify_OTP_Check);
router.route("/cookie").get(Get_cookies); // Checks user authentication status

// --- Admin Routes ---
// Protected admin/SPOC routes
router.route("/addproblems").post(requireAuth, requireRole(['ADMIN', 'EVALUATOR']), Post_problem);
router.route("/spoc_users").get(requireAuth, requireRole(['ADMIN']), Spoc_approve); // Get pending SPOC approvals
router.route("/handlespoc").post(requireAuth, requireRole(['ADMIN']), handleSpocApprove); // Approve or reject a SPOC
router.route("/get_all_users").get(requireAuth, requireRole(['ADMIN', 'EVALUATOR']), GetAllUsers); // Get all users
router.route("/submissions").get(Get_all_submissions);
router.route("/submissions_by_id").post(Get_submission_by_prob_id); // Get all submissions from all teams
// Get all submissions from all teams
router.route("/submissions/:id").get(Get_submission_by_id); // Get single submission by ID

// --- SPOC Routes ---
router.route("/fetch_teams/:id").post(Fetch_Teams);
router.route("/fetch_team_members").post(Fetch_Team_Members);
router.route("/add_members/:id").post(Add_Team_Members);
router.route("/update_team").post(Update_team);
router.route("/delete_team").post(Delete_team);
router.route("/send_mail_to_spoc").post(sendMailToSpoc);
router.route("/fetch_team_for_students").post(Fetch_Team_For_Students); 
router.route("/fetch_team_id_email").post(fetch_team_id_email);



// --- Student Routes ---
router.route("/submit_solution").post(SubmitSolution);


// --- Common/Shared Routes ---
router.route("/get_problems").get(Get_problems);
router.route("/problems/:id").get(Get_problem_by_id);

router.route("/evaluators").get(GetAllEvaluators);

// Delete Problem Statement
router.get("/problems/evaluator/:evaluatorId", Get_assigned_problems); // Assigned problems for an evaluator

// Update User Profile
router.put("/update-user", requireAuth, UpdateUser);

router.post("/delete_problem", requireAuth, requireRole(['ADMIN']), Delete_problem);

router.route("/upload_files").post(upload.any(), uploadFiles )

export default router;
