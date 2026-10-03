import { Router } from "express";

// Controller Imports
import { Add_Team_Members, Update_team, Check_team_members } from "../controllers/Team_members.js";
import { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email, Admin_list_teams, Admin_get_team, Admin_team_history } from "../controllers/Spoc_Teams.js";
import { login, logout, signup, GetAllUsers, verifyEmail, UpdateUser, Admin_create_user, Admin_delete_user, Admin_set_password, Set_team_password, Get_profile, Update_profile, Change_own_password, Admin_set_permissions, Admin_permission_list } from "../controllers/User_details.js";
import { Verify_OTP, Verify_OTP_Check } from "../controllers/Verify_OTP.js";
// import Verify_OTP_Check from "../controllers/Verify_OTP_Check.js";
import { requireAuth, optionalAuth, requireRole, requirePermission, requireSuperAdmin } from "../middleware/auth.js";
import { Post_problem, Get_problems, Get_problem_by_id, Delete_problem, Update_problem } from "../controllers/Problems.js";
import { Get_cookies } from "../controllers/Cookie.js";
import { Get_public_stats, Submit_interest } from "../controllers/PublicStats.js";
import { Reset_summary, Reset_send_otp, Reset_confirm } from "../controllers/Reset.js";
import { Import_problems, Problem_import_template, memoryUpload } from "../controllers/ProblemImport.js";
import { Export_options, Export_data, Export_problem_reports, List_all_submissions } from "../controllers/Export.js";
import { Share_submission_file, Delete_submission, Get_all_submissions, SubmitSolution, Get_submission_by_id, Get_submission_by_prob_id, fetch_submissions_by_email, Review_submission, check_status_submission } from "../controllers/Submission.js";
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
router.route("/public/stats").get(Get_public_stats); // home page hero numbers (totals only)
router.route("/public/interest").post(Submit_interest); // "Submit your Interest" form -> Sakthi Auto inbox + confirmation

// --- Admin Routes ---
// Protected admin/SPOC routes
router.route("/addproblems").post(requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), Post_problem);
router.route("/admin/create_user").post(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_create_user); // Platform admin creates admin / SPOC accounts
router.route("/admin/problems/import").post(requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), memoryUpload, Import_problems); // Excel import (dryRun=true previews)
router.route("/admin/problems/import/template").get(requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), Problem_import_template); // empty Excel template
router.route("/admin/teams/:id/history").get(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_team_history); // members, submissions + reviews, mails
router.route("/admin/teams/:id").get(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_get_team); // one team for the details dialog
router.route("/admin/teams").get(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_list_teams); // Every registered team, for the admin Users page
router.route("/profile").get(requireAuth, Get_profile).put(requireAuth, requireRole(['SPOC', 'ADMIN']), Update_profile); // own profile
router.route("/profile/password").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Change_own_password); // own password
router.route("/admin/set_password").post(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_set_password); // new password for any account
router.route("/team_password").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Set_team_password); // new password for a team login
router.route("/admin/submissions/all").get(requireAuth, requireRole(['ADMIN']), requirePermission('EVALUATE'), List_all_submissions); // admin Submissions page (evaluators)
router.route("/admin/export/options").get(requireAuth, requireRole(['ADMIN']), Export_options); // filters + columns for the export screen
router.route("/admin/export/problem-reports").post(requireAuth, requireRole(['ADMIN']), Export_problem_reports); // ZIP: one report per problem
router.route("/admin/export/:type").post(requireAuth, requireRole(['ADMIN']), Export_data); // Excel export (preview=true -> count)
// portal reset: main admin only, confirmed with an emailed code
router.route("/admin/reset/summary").get(requireAuth, requireRole(['ADMIN']), requireSuperAdmin, Reset_summary);
router.route("/admin/reset/send-otp").post(requireAuth, requireRole(['ADMIN']), requireSuperAdmin, Reset_send_otp);
router.route("/admin/reset/confirm").post(requireAuth, requireRole(['ADMIN']), requireSuperAdmin, Reset_confirm);
router.route("/admin/set_permissions").post(requireAuth, requireRole(['ADMIN']), requireSuperAdmin, Admin_set_permissions); // main admin only
router.route("/admin/permissions").get(requireAuth, requireRole(['ADMIN']), Admin_permission_list);
router.route("/admin/delete_user").post(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Admin_delete_user); // Platform admin deletes an admin / SPOC account
router.route("/spoc_users").get(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), Spoc_approve); // Get pending SPOC approvals
router.route("/handlespoc").post(requireAuth, requireRole(['ADMIN']), requirePermission('USERS'), handleSpocApprove); // Approve or reject a SPOC
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
router.route("/check_team_members").post(requireAuth, requireRole(['SPOC', 'ADMIN']), Check_team_members); // email checks before saving a team
router.route("/delete_team").post(requireAuth, Delete_team);
router.route("/send_mail_to_spoc").post(requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), sendMailToSpoc);
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
router.route("/get_problems").get(optionalAuth, Get_problems);
router.route("/problems/:id").get(optionalAuth, Get_problem_by_id).put(requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), Update_problem);


// Delete Problem Statement

// Update User Profile
router.put("/update-user", requireAuth, UpdateUser);

router.post("/delete_problem", requireAuth, requireRole(['ADMIN']), requirePermission('PROBLEMS'), Delete_problem);

router.route("/upload_files").post(requireAuth, upload.any(), uploadFiles)
router.route("/submission_files/:id/share").post(requireAuth, Share_submission_file); // signed link to one solution file
router.route("/delete_submission").post(requireAuth, requireRole(['ADMIN', 'STUDENT']), Delete_submission)
router.route("/review_submission").post(requireAuth, requireRole(['ADMIN']), requirePermission('EVALUATE'), Review_submission) // Changes needed / Approve / Reject + comment

export default router;
