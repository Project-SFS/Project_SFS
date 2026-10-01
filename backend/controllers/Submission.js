import fs from "fs";
import AsyncHandler from "../utils/AsyncHandler.js";
import connection from "../database/db.js";
import { today, checkProblemOpen } from "../utils/deadline.js";
import { notifySubmission, notifyReviewed, loadSubmission, notifySubmissionRemoved } from "../utils/notifications.js";
import { DECISIONS, CHANGES_REQUESTED, REJECTED, CRITERIA, parseMarks, canTeamEdit, lockedMessage, uploadClosedReason } from "../utils/review.js";
import { isAssignedToTeamOf } from "./TeamProblems.js";
import { canViewTeamOfLead } from "../utils/teamAccess.js";

const SubmitSolution = AsyncHandler(async (req, res) => {
    const { problemId, teamId, SOL_LINK, SOL_TITLE = null, SOL_DESCRIPTION = null } = req.body;
    if (!problemId || !teamId || !SOL_LINK) {
        return res.status(400).json({ message: "problemId, teamId and SOL_LINK are required" });
    }

    const [teams] = await connection.query('SELECT ID, LEAD_EMAIL FROM SolveForSakthi_Team_List WHERE ID = ?', [teamId]);
    const team = teams[0];
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    // a student may only submit for the team they lead
    if (req.user.ROLE === "STUDENT" && String(team.LEAD_EMAIL || "").toLowerCase() !== String(req.user.EMAIL).toLowerCase()) {
        return res.status(403).json({ message: "You can only submit for your own team" });
    }

    // same rule as file uploads: one submission per team per problem, replaceable while awaiting review
    // or when changes were requested
    const [existing] = await connection.query("SELECT TOP 1 ID, STATUS FROM SolveForSakthi_Submissions WHERE TEAM_EMAIL = ? AND PROBLEM_ID = ? ORDER BY ID DESC", [team.LEAD_EMAIL, problemId]);
    const previous = existing[0];

    const closedReason = uploadClosedReason(await checkProblemOpen(problemId), previous);
    if (closedReason) {
        return res.status(400).json({ message: closedReason });
    }

    if (req.user.ROLE === "STUDENT" && !(await isAssignedToTeamOf(team.LEAD_EMAIL, problemId))) {
        return res.status(400).json({ message: "This problem statement is not assigned to your team. Request it from your SPOC first." });
    }

    const SUB_DATE = today();

    if (previous && !canTeamEdit(previous.STATUS)) {
        return res.status(400).json({ message: lockedMessage(previous.STATUS) });
    }
    if (previous) {
        await connection.query("UPDATE SolveForSakthi_Submissions SET TEAM_ID = ?, SOL_TITLE = ?, SOL_DESCRIPTION = ?, SUB_DATE = ?, SOL_LINK = ?, STATUS = 'PENDING' WHERE ID = ?", [team.ID, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, SOL_LINK, previous.ID]);
        notifySubmission(previous.ID, true);
        return res.status(200).json({ message: "Solution updated successfully", submissionId: previous.ID, replaced: true });
    }

    const query = `INSERT INTO SolveForSakthi_Submissions (PROBLEM_ID, TEAM_ID, TEAM_EMAIL, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, STATUS, SOL_LINK) VALUES (?,?,?,?,?,?,'PENDING',?)`;
    const values = [problemId, team.ID, team.LEAD_EMAIL, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, SOL_LINK];

    const [result] = await connection.query(query, values);
    notifySubmission(result.insertId, false);

    res.status(201).json({ message: "Solution submitted successfully", submissionId: result.insertId, replaced: false });
});


const Get_solution = AsyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const [result] = await connection.query(`SELECT * FROM SolveForSakthi_Submissions WHERE TEAM_ID = ?`, [teamId]);
    res.status(200).json(result);
});

const Get_all_submissions = AsyncHandler(async (req, res) => {
    const { problemId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    let query = `
        select * from SolveForSakthi_Submissions
    `;
    const params = [];

    if (problemId) {
        query += ` WHERE PROBLEM_ID = ?`;
        params.push(problemId);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const [totalResult] = await connection.query(countQuery, params);
    const total = totalResult[0].total;

    // Add pagination to the main query
    query += ` ORDER BY SUB_DATE DESC, ID DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
    params.push(offset, limit);

    const [result] = await connection.query(query, params);

    res.status(200).json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        submissions: result
    });
});

const Get_submission_by_prob_id = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const [data] = await connection.query(
        `
  SELECT
      s.ID AS submission_id,
      s.PROBLEM_ID,
      s.SOL_TITLE,
      s.SOL_DESCRIPTION,
      s.SUB_DATE,
      s.STATUS,
      s.SOL_LINK,
      s.FILES,
      s.EVALUATION_COMMENT,
      s.EVAL_TOTAL,
      s.EVALUATED_AT,
      ev.NAME AS evaluated_by_name,
      ev.EMAIL AS evaluated_by_email,

      t.ID AS team_id,
      t.NAME AS team_name,
      t.SPOC_ID,
      t.LEAD_EMAIL,
      t.LEAD_PHONE,
      t.MENTOR_NAME,
      t.MENTOR_EMAIL,

      u.NAME AS spoc_name,
      u.COLLEGE AS college_name

  FROM SolveForSakthi_Submissions s
  LEFT JOIN SolveForSakthi_Team_List t
      ON s.TEAM_EMAIL = t.LEAD_EMAIL
  LEFT JOIN SolveForSakthi_Users u
      ON t.LEAD_EMAIL = u.EMAIL
  LEFT JOIN SolveForSakthi_Users ev
      ON ev.ID = s.EVALUATED_BY
  WHERE s.PROBLEM_ID = ?
  ORDER BY s.ID DESC
  `,
        [id]
    );
    




    
    res.send(data)
})

const Get_submission_by_id = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const query = `
SELECT
    s.ID AS submission_id,
    p.TITLE AS problem_title,
    s.SOL_TITLE AS submission_title,
    s.SOL_DESCRIPTION AS description,
    t.NAME AS team_name,
    t.ID AS team_id,
    t.SPOC_ID AS spoc_id,
    s.SUB_DATE AS submitted_date,
    s.FILES AS solution_document,
    s.SOL_LINK AS sol_link,
    s.STATUS AS status,
    s.PROBLEM_ID AS problem_id,
    u.COLLEGE AS college_name,

    -- the latest review: comment, who, when
    s.EVALUATION_COMMENT AS evaluation_comment,
    s.EVAL_UNDERSTANDING, s.EVAL_SOLUTION, s.EVAL_TOOLS, s.EVAL_PRESENTATION, s.EVAL_ACCEPTANCE, s.EVAL_TOTAL,
    s.EVALUATED_AT AS evaluated_at,
    ev.NAME    AS evaluated_by_name,
    ev.EMAIL   AS evaluated_by_email

FROM SolveForSakthi_Submissions s
JOIN SolveForSakthi_Problems p ON s.PROBLEM_ID = p.ID
LEFT JOIN SolveForSakthi_Team_List t ON s.TEAM_EMAIL = t.LEAD_EMAIL
LEFT JOIN SolveForSakthi_Users u ON t.LEAD_EMAIL = u.EMAIL
LEFT JOIN SolveForSakthi_Users ev ON ev.ID = s.EVALUATED_BY
WHERE s.ID = ?;
`;

    const [result] = await connection.query(query, [id]);

    if (result.length === 0) {
        return res.status(404).json({ message: "Submission not found" });
    }
    // every decision on this submission, newest first
    const [reviews] = await connection.query(`
        SELECT r.ID, r.DECISION, r.COMMENT, r.REVIEWED_AT, u.NAME AS REVIEWER_NAME, u.EMAIL AS REVIEWER_EMAIL,
               r.EVAL_UNDERSTANDING, r.EVAL_SOLUTION, r.EVAL_TOOLS, r.EVAL_PRESENTATION, r.EVAL_ACCEPTANCE, r.EVAL_TOTAL
        FROM SolveForSakthi_Submission_Reviews r
        LEFT JOIN SolveForSakthi_Users u ON u.ID = r.REVIEWED_BY
        WHERE r.SUBMISSION_ID = ?
        ORDER BY r.ID DESC`, [id]);
    res.status(200).json({ ...result[0], reviews });
});

// Admin reviews a submission: Changes needed / Approved / Rejected, with a comment and the evaluation marks
// (5 criteria x 20), emailed to the team lead and, separately, to their SPOC. Marks are required to approve or reject
// and optional when asking for changes. Changes needed lets the team upload a revised solution.
const COMMENT_MAX = 5000;
const Review_submission = AsyncHandler(async (req, res) => {
    const subid = parseInt(req.body.subid, 10);
    const decision = String(req.body.decision || "").toUpperCase();
    const comment = String(req.body.comment ?? "").trim();
    if (Number.isNaN(subid)) {
        return res.status(400).json({ message: "Submission id is required" });
    }
    if (!DECISIONS.includes(decision)) {
        return res.status(400).json({ message: "Choose Changes needed, Approve or Reject" });
    }
    if (!comment && (decision === CHANGES_REQUESTED || decision === REJECTED)) {
        return res.status(400).json({ message: decision === CHANGES_REQUESTED ? "Write what the team needs to change" : "Write why the solution is rejected" });
    }
    if (comment.length > COMMENT_MAX) {
        return res.status(400).json({ message: `The comment can be at most ${COMMENT_MAX} characters` });
    }
    const { marks, error: marksError } = parseMarks(req.body.marks);
    if (marksError) return res.status(400).json({ message: marksError });
    if (!marks && decision !== CHANGES_REQUESTED) {
        return res.status(400).json({ message: "Give marks for all five criteria to approve or reject" });
    }

    // the latest review's marks replace the previous ones (none given -> cleared)
    const markColumns = [...CRITERIA.map((c) => c.column), "EVAL_TOTAL"];
    const markValues = markColumns.map((col) => (marks ? marks[col] : null));
    const [data] = await connection.query(
        `UPDATE SolveForSakthi_Submissions
         SET STATUS = ?, EVALUATION_COMMENT = ?, EVALUATED_BY = ?, EVALUATED_AT = SYSUTCDATETIME(),
             ${markColumns.map((col) => `${col} = ?`).join(", ")}
         WHERE ID = ?`,
        [decision, comment || null, req.user.ID, ...markValues, subid]
    );
    if (data.affectedRows === 0) {
        return res.status(404).json({ message: "Submission not found" });
    }
    await connection.query(
        `INSERT INTO SolveForSakthi_Submission_Reviews (SUBMISSION_ID, DECISION, COMMENT, REVIEWED_BY, REVIEWED_AT, ${markColumns.join(", ")})
         VALUES (?, ?, ?, ?, SYSUTCDATETIME(), ${markColumns.map(() => "?").join(", ")})`,
        [subid, decision, comment || null, req.user.ID, ...markValues]
    );
    notifyReviewed(subid);
    res.status(200).json({
        message: "Review saved and emailed to the team",
        status: decision,
        comment: comment || null,
        marks,
        evaluatedBy: { name: req.user.NAME, email: req.user.EMAIL },
        evaluatedAt: new Date().toISOString(),
    });
})

const fetch_submissions_by_email = AsyncHandler(async (req, res) => {
    // students only ever see their own team's submissions
    const userEmail = req.user.ROLE === "STUDENT" ? req.user.EMAIL : req.body.userEmail;
    if (!(await canViewTeamOfLead(req, userEmail))) {
        return res.status(403).json({ message: "You do not have access to this team" });
    }
    const [data, extra] = await connection.query("select s.*, p.TITLE AS PROBLEM_TITLE, p.SUB_DEADLINE from SolveForSakthi_Submissions s left join SolveForSakthi_Problems p on p.ID = s.PROBLEM_ID where s.TEAM_EMAIL = ? order by s.ID desc", [userEmail]);
    

    

    res.send(data);
})

const check_status_submission = AsyncHandler(async (req, res) => {
    const { problemId } = req.body;
    const teamEmail = req.user.ROLE === "STUDENT" ? req.user.EMAIL : req.body.teamEmail;
    if (!(await canViewTeamOfLead(req, teamEmail))) {
        return res.status(403).json({ message: "You do not have access to this team" });
    }

    const [data] = await connection.query("select TOP 1 STATUS from SolveForSakthi_Submissions where TEAM_EMAIL = ? and PROBLEM_ID = ? order by ID desc", [teamEmail, problemId]);
    
    if (data.length === 0) {
        return res.status(200).json({ status: "NO_SUBMISSION" });
    }
    
    res.status(200).json({ status: data[0].STATUS });
});

// Delete one submission and its PDF. Nothing else references a submission, so the team keeps its
// problem assignment and can simply submit again.
//   ADMIN      - any submission
//   STUDENT    - their own team's submission while it is still PENDING (withdraw)
// Its review history goes with it.
const Delete_submission = AsyncHandler(async (req, res) => {
    const id = parseInt(req.body.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Submission id is required" });
    }

    const [rows] = await connection.query(`
        SELECT s.ID, s.TEAM_EMAIL, s.STATUS, s.FILES
        FROM SolveForSakthi_Submissions s
        WHERE s.ID = ?`, [id]);
    const submission = rows[0];
    if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
    }

    const role = req.user.ROLE;
    const isOwner = String(submission.TEAM_EMAIL || "").toLowerCase() === String(req.user.EMAIL || "").toLowerCase();
    if (role === "STUDENT") {
        if (!isOwner) return res.status(403).json({ message: "You can only withdraw your own team's submission" });
        if (submission.STATUS !== "PENDING") return res.status(400).json({ message: "A reviewed submission can no longer be withdrawn" });
    } else if (role !== "ADMIN") {
        return res.status(403).json({ message: "You cannot delete submissions" });
    } else if (!req.user.IS_SUPER_ADMIN && !req.user.PERMISSIONS?.includes("EVALUATE")) {
        return res.status(403).json({ message: 'You need the "Evaluate submissions" permission to delete submissions' });
    }

    // load the mail details before the row is gone
    const snapshot = role === "STUDENT" ? null : await loadSubmission(id);
    await connection.query("DELETE FROM SolveForSakthi_Submission_Reviews WHERE SUBMISSION_ID = ?", [id]);
    await connection.query("DELETE FROM SolveForSakthi_Submissions WHERE ID = ?", [id]);
    if (submission.FILES) fs.unlink(submission.FILES, () => {});
    if (snapshot) notifySubmissionRemoved(snapshot);

    res.json({ message: role === "STUDENT" ? "Submission withdrawn" : "Submission deleted" });
});

export { Delete_submission, SubmitSolution, check_status_submission, Get_solution, Get_all_submissions, Get_submission_by_id, Review_submission, Get_submission_by_prob_id, fetch_submissions_by_email };