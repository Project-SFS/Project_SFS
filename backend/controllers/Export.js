import ExcelJS from "exceljs";
import JSZip from "jszip";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { CRITERIA, MARKS_TOTAL, DECISION_LABELS } from "../utils/review.js";

// Excel exports for admins: submissions (with a per-problem breakdown), teams and SPOCs. Every export
// takes filters and a column choice; the same request with preview=true only returns how many rows match.

const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata";
const day = (value) => (value ? (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)) : null);
const asDate = (value) => (value ? new Date(value) : null);
const statusOf = (status) => (String(status || "PENDING").toUpperCase() === "ACCEPTED" ? "APPROVED" : String(status || "PENDING").toUpperCase());
const label = (status) => DECISION_LABELS[statusOf(status)] || status;
// Active, Graduated (archived after the last member's year) or Removed (archived when the SPOC removed it)
const teamStatusOf = (t) => (t.REMOVED_AT ? "Removed" : t.GRADUATED_AT ? "Graduated" : "Active");
const matchesTeamStatus = (t, status) => !status || status === "all" || teamStatusOf(t).toLowerCase() === status;
const list = (value) => (Array.isArray(value) ? value.map(String).filter(Boolean) : []);
const inList = (allowed, value) => allowed.length === 0 || allowed.includes(String(value ?? ""));

/* ---------------------------------------------------------------- data ---------------------------------------------------------------- */

const loadSubmissions = async () => {
    const [rows] = await connection.query(`
        SELECT s.ID, s.PROBLEM_ID, s.TEAM_EMAIL, s.SOL_TITLE, s.SOL_DESCRIPTION, s.SOL_LINK, s.FILES, s.SUB_DATE, s.STATUS,
               s.EVALUATION_COMMENT, s.EVALUATED_AT, s.EVALUATED_BY,
               s.EVAL_UNDERSTANDING, s.EVAL_SOLUTION, s.EVAL_TOOLS, s.EVAL_PRESENTATION, s.EVAL_ACCEPTANCE, s.EVAL_TOTAL,
               p.TITLE AS PROBLEM_TITLE, p.CATEGORY, p.DOMAIN, p.IS_CLOSED,
               t.ID AS TEAM_ID, t.NAME AS TEAM_NAME, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL, t.GRADUATED_AT, t.REMOVED_AT,
               COALESCE(t.GRADUATION_YEAR, (SELECT MAX(m.GRAD_YEAR) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID)) AS GRADUATION_YEAR,
               spoc.ID AS SPOC_ID, spoc.NAME AS SPOC_NAME, spoc.EMAIL AS SPOC_EMAIL, spoc.PHONE AS SPOC_PHONE, spoc.COLLEGE, spoc.COLLEGE_CODE,
               ev.EMAIL AS REVIEWER_EMAIL, ev.NAME AS REVIEWER_NAME,
               (SELECT COUNT(*) FROM SolveForSakthi_Submission_Reviews r WHERE r.SUBMISSION_ID = s.ID) AS REVIEW_COUNT,
               (SELECT COUNT(*) FROM SolveForSakthi_Submission_Files sf WHERE sf.SUBMISSION_ID = s.ID) AS FILE_COUNT
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        LEFT JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        LEFT JOIN SolveForSakthi_Users ev ON ev.ID = s.EVALUATED_BY
        ORDER BY s.PROBLEM_ID, s.ID`);
    return rows;
};

const loadTeams = async () => {
    const [teams] = await connection.query(`
        SELECT t.ID, t.NAME, t.LEAD_EMAIL, t.LEAD_PHONE, t.MENTOR_NAME, t.MENTOR_EMAIL, t.CREATED_AT, t.GRADUATED_AT, t.REMOVED_AT, t.SPOC_ID,
               COALESCE(t.GRADUATION_YEAR, (SELECT MAX(m.GRAD_YEAR) FROM SolveForSakthi_Team_Members_List m WHERE m.Team_ID = t.ID)) AS GRADUATION_YEAR,
               spoc.NAME AS SPOC_NAME, spoc.EMAIL AS SPOC_EMAIL, spoc.COLLEGE, spoc.COLLEGE_CODE
        FROM SolveForSakthi_Team_List t
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        ORDER BY t.ID`);
    const [members] = await connection.query("SELECT Team_ID, ROLE, NAME, EMAIL, PHONE, GENDER, GRAD_YEAR FROM SolveForSakthi_Team_Members_List ORDER BY Team_ID, ID");
    const [subs] = await connection.query(`
        SELECT s.TEAM_EMAIL, s.PROBLEM_ID, s.STATUS, s.EVAL_TOTAL, p.TITLE
        FROM SolveForSakthi_Submissions s LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID`);
    return teams.map((t) => {
        const lead = String(t.LEAD_EMAIL || "").toLowerCase();
        const teamSubs = subs.filter((s) => lead && String(s.TEAM_EMAIL || "").toLowerCase() === lead);
        const count = (st) => teamSubs.filter((s) => statusOf(s.STATUS) === st).length;
        const marks = teamSubs.map((s) => s.EVAL_TOTAL).filter((m) => m != null);
        return {
            ...t,
            members: members.filter((m) => m.Team_ID === t.ID),
            // the challenges the team submitted a solution to
            challenges: teamSubs.map((x) => ({ PROBLEM_ID: x.PROBLEM_ID, TITLE: x.TITLE })),
            SUBMISSIONS: teamSubs.length,
            AWAITING: count("PENDING"), CHANGES: count("CHANGES_REQUESTED"), APPROVED: count("APPROVED"), REJECTED: count("REJECTED"),
            BEST_MARKS: marks.length ? Math.max(...marks) : null,
        };
    });
};

const loadSpocs = async () => {
    const [rows] = await connection.query(`
        SELECT u.ID, u.NAME, u.EMAIL, u.PHONE, u.COLLEGE, u.COLLEGE_CODE, u.STATUS, u.DATE,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_List t WHERE t.SPOC_ID = u.ID AND t.GRADUATED_AT IS NULL) AS ACTIVE_TEAMS,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_List t WHERE t.SPOC_ID = u.ID AND t.GRADUATED_AT IS NOT NULL AND t.REMOVED_AT IS NULL) AS GRADUATED_TEAMS,
               (SELECT COUNT(*) FROM SolveForSakthi_Team_List t WHERE t.SPOC_ID = u.ID AND t.REMOVED_AT IS NOT NULL) AS REMOVED_TEAMS,
               (SELECT COUNT(*) FROM SolveForSakthi_Submissions s JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL WHERE t.SPOC_ID = u.ID) AS SUBMISSIONS,
               (SELECT COUNT(*) FROM SolveForSakthi_Submissions s JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL WHERE t.SPOC_ID = u.ID AND s.STATUS IN ('APPROVED', 'ACCEPTED')) AS APPROVED,
               (SELECT COUNT(*) FROM SolveForSakthi_Submissions s JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL WHERE t.SPOC_ID = u.ID AND s.STATUS = 'PENDING') AS AWAITING
        FROM SolveForSakthi_Users u
        WHERE u.ROLE = 'SPOC'
        ORDER BY u.ID`);
    return rows;
};

/* --------------------------------------------------------------- columns -------------------------------------------------------------- */
// key, header, group (for the column picker), width, value(row), type: date | number | text

const SUBMISSION_COLUMNS = [
    { key: "id", header: "Submission ID", group: "Submission", width: 13, type: "number", value: (r) => r.ID },
    { key: "solTitle", header: "Solution title", group: "Submission", width: 32, value: (r) => r.SOL_TITLE },
    { key: "solDescription", header: "Solution description", group: "Submission", width: 45, value: (r) => r.SOL_DESCRIPTION },
    { key: "solLink", header: "Solution link", group: "Submission", width: 32, value: (r) => r.SOL_LINK },
    { key: "file", header: "Files attached", group: "Submission", width: 12, type: "number", value: (r) => Number(r.FILE_COUNT) || 0 },
    { key: "submittedOn", header: "Submitted on", group: "Submission", width: 14, type: "date", value: (r) => asDate(day(r.SUB_DATE)) },
    { key: "status", header: "Status", group: "Submission", width: 17, value: (r) => label(r.STATUS) },
    { key: "problemId", header: "Challenge ID", group: "Challenge", width: 12, value: (r) => (r.PROBLEM_ID ? `SFS_${r.PROBLEM_ID}` : "") },
    { key: "problemTitle", header: "Challenge title", group: "Challenge", width: 36, value: (r) => r.PROBLEM_TITLE },
    { key: "category", header: "Category", group: "Challenge", width: 12, value: (r) => r.CATEGORY },
    { key: "domain", header: "Domain", group: "Challenge", width: 18, value: (r) => r.DOMAIN },
    { key: "challengeStatus", header: "Challenge status", group: "Challenge", width: 17, value: (r) => (r.PROBLEM_ID ? (r.IS_CLOSED ? "Concept Received" : "Open") : "") },
    { key: "teamId", header: "Team ID", group: "Team", width: 9, type: "number", value: (r) => r.TEAM_ID },
    { key: "teamName", header: "Team name", group: "Team", width: 22, value: (r) => r.TEAM_NAME },
    { key: "leadEmail", header: "Team lead email", group: "Team", width: 28, value: (r) => r.TEAM_EMAIL },
    { key: "leadPhone", header: "Team lead phone", group: "Team", width: 15, value: (r) => r.LEAD_PHONE },
    { key: "mentor", header: "Mentor", group: "Team", width: 28, value: (r) => [r.MENTOR_NAME, r.MENTOR_EMAIL].filter(Boolean).join(" · ") },
    { key: "graduationYear", header: "Graduation year", group: "Team", width: 14, type: "number", value: (r) => r.GRADUATION_YEAR },
    { key: "teamStatus", header: "Team status", group: "Team", width: 12, value: (r) => (r.TEAM_ID ? teamStatusOf(r) : "Deleted") },
    { key: "college", header: "College", group: "College & SPOC", width: 26, value: (r) => r.COLLEGE },
    { key: "collegeCode", header: "College code", group: "College & SPOC", width: 13, value: (r) => r.COLLEGE_CODE },
    { key: "spocName", header: "SPOC name", group: "College & SPOC", width: 20, value: (r) => r.SPOC_NAME },
    { key: "spocEmail", header: "SPOC email", group: "College & SPOC", width: 28, value: (r) => r.SPOC_EMAIL },
    { key: "spocPhone", header: "SPOC phone", group: "College & SPOC", width: 15, value: (r) => r.SPOC_PHONE },
    { key: "reviewedBy", header: "Reviewed by", group: "Review", width: 28, value: (r) => r.REVIEWER_EMAIL || r.REVIEWER_NAME },
    { key: "reviewedOn", header: "Reviewed on", group: "Review", width: 18, type: "datetime", value: (r) => asDate(r.EVALUATED_AT) },
    { key: "comment", header: "Latest comment", group: "Review", width: 45, value: (r) => r.EVALUATION_COMMENT },
    ...CRITERIA.map((c) => ({ key: `mark_${c.key}`, header: `${c.label} (/${c.max})`, group: "Marks", width: 16, type: "number", value: (r) => r[c.column] })),
    { key: "total", header: `Total marks (/${MARKS_TOTAL})`, group: "Marks", width: 14, type: "number", value: (r) => r.EVAL_TOTAL },
    { key: "reviewCount", header: "Number of reviews", group: "Review", width: 12, type: "number", value: (r) => r.REVIEW_COUNT },
];

const TEAM_COLUMNS = [
    { key: "id", header: "Team ID", group: "Team", width: 9, type: "number", value: (t) => t.ID },
    { key: "name", header: "Team name", group: "Team", width: 22, value: (t) => t.NAME },
    { key: "status", header: "Status", group: "Team", width: 12, value: (t) => teamStatusOf(t) },
    { key: "graduationYear", header: "Graduation year (last member)", group: "Team", width: 16, type: "number", value: (t) => t.GRADUATION_YEAR },
    { key: "registered", header: "Registered on", group: "Team", width: 14, type: "date", value: (t) => asDate(day(t.CREATED_AT)) },
    { key: "leadEmail", header: "Team lead email", group: "Team", width: 28, value: (t) => t.LEAD_EMAIL },
    { key: "leadPhone", header: "Team lead phone", group: "Team", width: 15, value: (t) => t.LEAD_PHONE },
    { key: "mentor", header: "Mentor", group: "Team", width: 28, value: (t) => [t.MENTOR_NAME, t.MENTOR_EMAIL].filter(Boolean).join(" · ") },
    { key: "memberCount", header: "Members", group: "Members", width: 10, type: "number", value: (t) => t.members.length },
    { key: "memberNames", header: "Member names", group: "Members", width: 40, value: (t) => t.members.map((m) => `${m.NAME}${m.GRAD_YEAR ? ` (${m.GRAD_YEAR})` : ""}`).join(", ") },
    { key: "memberEmails", header: "Member emails", group: "Members", width: 40, value: (t) => t.members.map((m) => m.EMAIL).filter(Boolean).join(", ") },
    { key: "college", header: "College", group: "College & SPOC", width: 26, value: (t) => t.COLLEGE },
    { key: "collegeCode", header: "College code", group: "College & SPOC", width: 13, value: (t) => t.COLLEGE_CODE },
    { key: "spocName", header: "SPOC name", group: "College & SPOC", width: 20, value: (t) => t.SPOC_NAME },
    { key: "spocEmail", header: "SPOC email", group: "College & SPOC", width: 28, value: (t) => t.SPOC_EMAIL },
    { key: "challenges", header: "Challenges submitted to", group: "Challenges & results", width: 40, value: (t) => t.challenges.map((a) => `SFS_${a.PROBLEM_ID} ${a.TITLE || ""}`.trim()).join("; ") },
    { key: "submissions", header: "Submissions", group: "Challenges & results", width: 12, type: "number", value: (t) => t.SUBMISSIONS },
    { key: "awaiting", header: "Awaiting review", group: "Challenges & results", width: 12, type: "number", value: (t) => t.AWAITING },
    { key: "changes", header: "Changes needed", group: "Challenges & results", width: 12, type: "number", value: (t) => t.CHANGES },
    { key: "approved", header: "Concept accepted", group: "Challenges & results", width: 14, type: "number", value: (t) => t.APPROVED },
    { key: "rejected", header: "Rejected", group: "Challenges & results", width: 11, type: "number", value: (t) => t.REJECTED },
    { key: "bestMarks", header: `Best marks (/${MARKS_TOTAL})`, group: "Challenges & results", width: 13, type: "number", value: (t) => t.BEST_MARKS },
];

const SPOC_COLUMNS = [
    { key: "id", header: "SPOC ID", group: "SPOC", width: 9, type: "number", value: (u) => u.ID },
    { key: "name", header: "Name", group: "SPOC", width: 22, value: (u) => u.NAME },
    { key: "email", header: "Email", group: "SPOC", width: 30, value: (u) => u.EMAIL },
    { key: "phone", header: "Phone", group: "SPOC", width: 15, value: (u) => u.PHONE },
    { key: "status", header: "Account status", group: "SPOC", width: 14, value: (u) => ({ ACTIVE: "Active", PENDING: "Awaiting approval", REJECTED: "Rejected" }[u.STATUS] || u.STATUS) },
    { key: "joined", header: "Registered on", group: "SPOC", width: 14, value: (u) => u.DATE },
    { key: "college", header: "College", group: "College", width: 28, value: (u) => u.COLLEGE },
    { key: "collegeCode", header: "College code", group: "College", width: 13, value: (u) => u.COLLEGE_CODE },
    { key: "activeTeams", header: "Active teams", group: "Activity", width: 12, type: "number", value: (u) => u.ACTIVE_TEAMS },
    { key: "graduatedTeams", header: "Graduated teams", group: "Activity", width: 14, type: "number", value: (u) => u.GRADUATED_TEAMS },
    { key: "removedTeams", header: "Removed teams", group: "Activity", width: 14, type: "number", value: (u) => u.REMOVED_TEAMS },
    { key: "submissions", header: "Submissions", group: "Activity", width: 12, type: "number", value: (u) => u.SUBMISSIONS },
    { key: "awaiting", header: "Awaiting review", group: "Activity", width: 13, type: "number", value: (u) => u.AWAITING },
    { key: "approved", header: "Approved", group: "Activity", width: 11, type: "number", value: (u) => u.APPROVED },
];

/* --------------------------------------------------------------- filters -------------------------------------------------------------- */

const filterSubmissions = (rows, f = {}) => {
    const q = String(f.search || "").trim().toLowerCase();
    const min = f.marksMin === "" || f.marksMin == null ? null : Number(f.marksMin);
    const max = f.marksMax === "" || f.marksMax == null ? null : Number(f.marksMax);
    return rows.filter((r) =>
        inList(list(f.problemIds), r.PROBLEM_ID)
        && inList(list(f.statuses), statusOf(r.STATUS))
        && inList(list(f.colleges), r.COLLEGE)
        && inList(list(f.reviewers), r.REVIEWER_EMAIL)
        && (!f.submittedFrom || (day(r.SUB_DATE) && day(r.SUB_DATE) >= f.submittedFrom))
        && (!f.submittedTo || (day(r.SUB_DATE) && day(r.SUB_DATE) <= f.submittedTo))
        && (!f.reviewedFrom || (r.EVALUATED_AT && day(r.EVALUATED_AT) >= f.reviewedFrom))
        && (!f.reviewedTo || (r.EVALUATED_AT && day(r.EVALUATED_AT) <= f.reviewedTo))
        && (min === null || (r.EVAL_TOTAL != null && r.EVAL_TOTAL >= min))
        && (max === null || (r.EVAL_TOTAL != null && r.EVAL_TOTAL <= max))
        && matchesTeamStatus(r, f.teamStatus)
        && (!q || [r.TEAM_NAME, r.TEAM_EMAIL, r.SOL_TITLE, r.PROBLEM_TITLE, r.COLLEGE].some((v) => String(v || "").toLowerCase().includes(q))));
};

// Members graduate in different years. A team's graduation year is its LAST member's year (the team closes
// after it). graduationMatch says how a year filter is read:
//   upto   - every member graduates by that year (team year <= year)   [default]
//   exact  - the team closes in exactly that year (last member graduates then)
//   member - at least one member graduates in that year
const GRADUATION_MATCH = { upto: "Every member graduates by", exact: "Team closes in (last member graduates)", member: "At least one member graduates in" };
const matchesGraduation = (t, f) => {
    if (!f.graduationYear) return true;
    const year = Number(f.graduationYear);
    const mode = GRADUATION_MATCH[f.graduationMatch] ? f.graduationMatch : "upto";
    if (mode === "member") return (t.members || []).some((m) => Number(m.GRAD_YEAR) === year);
    const teamYear = Number(t.GRADUATION_YEAR);
    if (!teamYear) return false;
    return mode === "exact" ? teamYear === year : teamYear <= year;
};

const filterTeams = (teams, f = {}) => {
    const q = String(f.search || "").trim().toLowerCase();
    return teams.filter((t) =>
        inList(list(f.colleges), t.COLLEGE)
        && matchesTeamStatus(t, f.teamStatus)
        && (!f.submissions || f.submissions === "all" || (f.submissions === "with" ? t.SUBMISSIONS > 0 : t.SUBMISSIONS === 0))
        && (list(f.problemIds).length === 0 || t.challenges.some((a) => list(f.problemIds).includes(String(a.PROBLEM_ID))))
        && matchesGraduation(t, f)
        && (!q || [t.NAME, t.LEAD_EMAIL, t.COLLEGE, t.SPOC_NAME].some((v) => String(v || "").toLowerCase().includes(q))));
};

const filterSpocs = (spocs, f = {}) => {
    const q = String(f.search || "").trim().toLowerCase();
    return spocs.filter((u) =>
        inList(list(f.spocStatuses), u.STATUS)
        && inList(list(f.colleges), u.COLLEGE)
        && (!f.hasTeams || f.hasTeams === "all" || (f.hasTeams === "with" ? u.ACTIVE_TEAMS + u.GRADUATED_TEAMS > 0 : u.ACTIVE_TEAMS + u.GRADUATED_TEAMS === 0))
        && (!q || [u.NAME, u.EMAIL, u.COLLEGE, u.COLLEGE_CODE].some((v) => String(v || "").toLowerCase().includes(q))));
};

/* ---------------------------------------------------------------- excel --------------------------------------------------------------- */

const ORANGE = "FFFC9300";
const styleHeader = (row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    row.alignment = { vertical: "middle", wrapText: true };
    row.height = 30;
};
const pickColumns = (all, keys) => {
    const chosen = list(keys);
    const cols = chosen.length ? all.filter((c) => chosen.includes(c.key)) : all;
    return cols.length ? cols : all;
};
const cellValue = (col, row) => {
    const v = col.value(row);
    return v === undefined || v === "" ? null : v;
};
const formatColumn = (sheetColumn, col) => {
    if (col.type === "date") sheetColumn.numFmt = "dd-mmm-yyyy";
    if (col.type === "datetime") sheetColumn.numFmt = "dd-mmm-yyyy hh:mm";
};

// A plain table sheet: header row, one row per item, frozen header, auto-filter
const addTableSheet = (workbook, name, columns, items) => {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 16 }));
    columns.forEach((c, i) => formatColumn(sheet.getColumn(i + 1), c));
    styleHeader(sheet.getRow(1));
    for (const item of items) sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, cellValue(c, item)])));
    sheet.eachRow((row, n) => { if (n > 1) row.alignment = { vertical: "top", wrapText: true }; });
    if (items.length) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    return sheet;
};

// "About this export": who, when, which filters, how many rows
const addInfoSheet = (workbook, { title, user, filters, counts }) => {
    const sheet = workbook.addWorksheet("About this export");
    sheet.columns = [{ width: 28 }, { width: 80 }];
    const add = (a, b, bold) => {
        const row = sheet.addRow([a, b]);
        row.alignment = { vertical: "top", wrapText: true };
        if (bold) row.font = { bold: true, size: 14 };
        else row.getCell(1).font = { bold: true };
    };
    add(title, "", true);
    add("Generated on", new Date().toLocaleString("en-IN", { timeZone, dateStyle: "medium", timeStyle: "short" }));
    add("Generated by", user?.EMAIL || "");
    for (const [k, v] of counts) add(k, String(v));
    sheet.addRow([]);
    add("Filters", filters.length ? "" : "None (everything)");
    for (const [k, v] of filters) add(`  ${k}`, v);
};

const describeFilters = (type, f = {}, lookups) => {
    const out = [];
    const names = (ids, map) => list(ids).map((id) => map.get(String(id)) || id).join(", ");
    if (list(f.problemIds).length) out.push(["Challenges", names(f.problemIds, lookups.problems)]);
    if (list(f.statuses).length) out.push(["Submission status", list(f.statuses).map((s) => DECISION_LABELS[s] || s).join(", ")]);
    if (list(f.colleges).length) out.push(["Colleges", list(f.colleges).join(", ")]);
    if (list(f.reviewers).length) out.push(["Reviewed by", list(f.reviewers).join(", ")]);
    if (f.submittedFrom || f.submittedTo) out.push(["Submitted between", `${f.submittedFrom || "start"} and ${f.submittedTo || "today"}`]);
    if (f.reviewedFrom || f.reviewedTo) out.push(["Reviewed between", `${f.reviewedFrom || "start"} and ${f.reviewedTo || "today"}`]);
    if (f.marksMin !== undefined && f.marksMin !== "" && f.marksMin !== null) out.push(["Total marks at least", String(f.marksMin)]);
    if (f.marksMax !== undefined && f.marksMax !== "" && f.marksMax !== null) out.push(["Total marks at most", String(f.marksMax)]);
    if (f.teamStatus && f.teamStatus !== "all") out.push(["Teams", { graduated: "Graduated only", removed: "Removed by SPOC only" }[f.teamStatus] || "Active only"]);
    if (f.submissions && f.submissions !== "all") out.push(["Teams", f.submissions === "with" ? "With submissions" : "Without submissions"]);
    if (f.graduationYear) out.push(["Graduation year", `${GRADUATION_MATCH[f.graduationMatch] || GRADUATION_MATCH.upto} ${f.graduationYear}`]);
    if (list(f.spocStatuses).length) out.push(["SPOC status", list(f.spocStatuses).join(", ")]);
    if (f.hasTeams && f.hasTeams !== "all") out.push(["SPOCs", f.hasTeams === "with" ? "With teams" : "Without teams"]);
    if (f.search) out.push(["Search", f.search]);
    return out;
};

// Submissions workbook: summary per problem, a sheet grouped by problem, the flat list and optional extras
const buildSubmissionsWorkbook = async (workbook, rows, columns, sheets, filters, user) => {
    const [problems] = await connection.query(`
        SELECT p.ID, p.TITLE, p.CATEGORY, p.DOMAIN, p.IS_CLOSED,
               (SELECT COUNT(DISTINCT s.TEAM_EMAIL) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS TEAM_COUNT
        FROM SolveForSakthi_Problems p ORDER BY p.ID`);
    const chosenProblems = list(filters.problemIds);
    const problemList = problems.filter((p) => chosenProblems.length === 0 || chosenProblems.includes(String(p.ID)));
    const byProblem = new Map(problemList.map((p) => [p.ID, []]));
    for (const r of rows) {
        if (!byProblem.has(r.PROBLEM_ID)) byProblem.set(r.PROBLEM_ID, []);
        byProblem.get(r.PROBLEM_ID).push(r);
    }
    const problemOf = new Map(problems.map((p) => [p.ID, p]));

    if (sheets.summary !== false) {
        const sheet = workbook.addWorksheet("Summary by challenge", { views: [{ state: "frozen", ySplit: 1 }] });
        const head = ["Challenge ID", "Challenge title", "Category", "Status", "Teams", "Submissions", "Awaiting review", "Changes needed", "Concept accepted", "Rejected", "Average marks", "Highest marks"];
        sheet.columns = head.map((h, i) => ({ header: h, width: [12, 40, 12, 17, 10, 13, 14, 14, 15, 11, 13, 13][i] }));
        styleHeader(sheet.getRow(1));
        const totals = Array(8).fill(0);
        for (const [id, subs] of byProblem) {
            const p = problemOf.get(id) || {};
            const count = (st) => subs.filter((s) => statusOf(s.STATUS) === st).length;
            const marks = subs.map((s) => s.EVAL_TOTAL).filter((m) => m != null);
            const values = [p.TEAM_COUNT ?? 0, subs.length, count("PENDING"), count("CHANGES_REQUESTED"), count("APPROVED"), count("REJECTED")];
            values.forEach((v, i) => { totals[i] += v; });
            sheet.addRow([id ? `SFS_${id}` : "", p.TITLE || "(deleted challenge)", p.CATEGORY || "", p.ID ? (p.IS_CLOSED ? "Concept Received" : "Open") : "", ...values,
                marks.length ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : null,
                marks.length ? Math.max(...marks) : null]);
        }
        const total = sheet.addRow(["", "Total", "", null, ...totals.slice(0, 6), null, null]);
        total.font = { bold: true };
        total.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } };
    }

    if (sheets.byProblem !== false) {
        // each problem as a band, followed by the teams that submitted to it
        const sheet = workbook.addWorksheet("By challenge");
        sheet.columns = columns.map((c) => ({ key: c.key, width: c.width || 16 }));
        columns.forEach((c, i) => formatColumn(sheet.getColumn(i + 1), c));
        for (const [id, subs] of byProblem) {
            if (subs.length === 0 && sheets.includeEmptyProblems === false) continue;
            const p = problemOf.get(id) || {};
            const band = sheet.addRow([`SFS_${id} · ${p.TITLE || "(deleted challenge)"}${p.CATEGORY ? ` · ${p.CATEGORY}` : ""}${p.IS_CLOSED ? " · Concept Received" : ""} — ${subs.length} submission${subs.length === 1 ? "" : "s"}`]);
            sheet.mergeCells(band.number, 1, band.number, Math.max(columns.length, 1));
            band.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
            band.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF494949" } };
            band.height = 22;
            if (subs.length === 0) {
                sheet.addRow(["No submissions"]).font = { italic: true, color: { argb: "FF888888" } };
            } else {
                styleHeader(sheet.addRow(columns.map((c) => c.header)));
                for (const s of subs) sheet.addRow(columns.map((c) => cellValue(c, s))).alignment = { vertical: "top", wrapText: true };
            }
            sheet.addRow([]);
        }
    }

    if (sheets.all !== false) addTableSheet(workbook, "All submissions", columns, rows);

    if (sheets.reviewHistory) {
        const ids = rows.map((r) => r.ID);
        const [reviews] = ids.length ? await connection.query(`
            SELECT r.SUBMISSION_ID, r.DECISION, r.COMMENT, r.REVIEWED_AT, u.EMAIL AS REVIEWER_EMAIL,
                   r.EVAL_UNDERSTANDING, r.EVAL_SOLUTION, r.EVAL_TOOLS, r.EVAL_PRESENTATION, r.EVAL_ACCEPTANCE, r.EVAL_TOTAL
            FROM SolveForSakthi_Submission_Reviews r LEFT JOIN SolveForSakthi_Users u ON u.ID = r.REVIEWED_BY
            ORDER BY r.SUBMISSION_ID, r.ID`) : [[]];
        const wanted = new Set(ids);
        const subOf = new Map(rows.map((r) => [r.ID, r]));
        addTableSheet(workbook, "Review history", [
            { key: "sub", header: "Submission ID", width: 13, value: (r) => r.SUBMISSION_ID },
            { key: "team", header: "Team", width: 22, value: (r) => subOf.get(r.SUBMISSION_ID)?.TEAM_NAME },
            { key: "problem", header: "Challenge", width: 32, value: (r) => { const s = subOf.get(r.SUBMISSION_ID); return s ? `SFS_${s.PROBLEM_ID} ${s.PROBLEM_TITLE || ""}` : ""; } },
            { key: "decision", header: "Decision", width: 16, value: (r) => label(r.DECISION) },
            { key: "by", header: "Reviewed by", width: 28, value: (r) => r.REVIEWER_EMAIL },
            { key: "at", header: "Reviewed on", width: 18, type: "datetime", value: (r) => asDate(r.REVIEWED_AT) },
            ...CRITERIA.map((c) => ({ key: c.key, header: `${c.label} (/${c.max})`, width: 15, value: (r) => r[c.column] })),
            { key: "total", header: `Total (/${MARKS_TOTAL})`, width: 11, value: (r) => r.EVAL_TOTAL },
            { key: "comment", header: "Comment", width: 50, value: (r) => r.COMMENT },
        ], reviews.filter((r) => wanted.has(r.SUBMISSION_ID)));
    }

    if (sheets.members) {
        const teamIds = [...new Set(rows.map((r) => r.TEAM_ID).filter(Boolean))];
        const [members] = teamIds.length ? await connection.query(
            `SELECT m.Team_ID, t.NAME AS TEAM_NAME, m.ROLE, m.NAME, m.EMAIL, m.PHONE, m.GENDER, m.GRAD_YEAR
             FROM SolveForSakthi_Team_Members_List m JOIN SolveForSakthi_Team_List t ON t.ID = m.Team_ID
             WHERE m.Team_ID IN (${teamIds.map(() => "?").join(", ")}) ORDER BY m.Team_ID, m.ID`, teamIds) : [[]];
        addTableSheet(workbook, "Team members", MEMBER_COLUMNS, members);
    }

    return { problemCount: byProblem.size };
};

const MEMBER_COLUMNS = [
    { key: "team", header: "Team", width: 22, value: (m) => m.TEAM_NAME },
    { key: "teamId", header: "Team ID", width: 9, value: (m) => m.Team_ID },
    { key: "role", header: "Role", width: 12, value: (m) => m.ROLE },
    { key: "name", header: "Name", width: 22, value: (m) => m.NAME },
    { key: "email", header: "Email", width: 30, value: (m) => m.EMAIL },
    { key: "phone", header: "Phone", width: 15, value: (m) => m.PHONE },
    { key: "gender", header: "Gender", width: 10, value: (m) => m.GENDER },
    { key: "gradYear", header: "Graduation year", width: 14, value: (m) => m.GRAD_YEAR },
];

/* --------------------------------------------------------------- routes --------------------------------------------------------------- */

const COLUMNS = { submissions: SUBMISSION_COLUMNS, teams: TEAM_COLUMNS, spocs: SPOC_COLUMNS };
const columnInfo = (cols) => cols.map(({ key, header, group }) => ({ key, header, group }));

// GET /admin/export/options: what the export screen can filter on and which columns exist
const Export_options = AsyncHandler(async (req, res) => {
    const [problems] = await connection.query("SELECT ID, TITLE FROM SolveForSakthi_Problems ORDER BY ID DESC");
    const [colleges] = await connection.query("SELECT DISTINCT COLLEGE FROM SolveForSakthi_Users WHERE ROLE = 'SPOC' AND COLLEGE IS NOT NULL ORDER BY COLLEGE");
    const [reviewers] = await connection.query("SELECT DISTINCT u.EMAIL FROM SolveForSakthi_Submissions s JOIN SolveForSakthi_Users u ON u.ID = s.EVALUATED_BY ORDER BY u.EMAIL");
    const [years] = await connection.query("SELECT DISTINCT GRAD_YEAR FROM SolveForSakthi_Team_Members_List WHERE GRAD_YEAR IS NOT NULL ORDER BY GRAD_YEAR");
    res.json({
        problems,
        colleges: colleges.map((c) => c.COLLEGE),
        reviewers: reviewers.map((r) => r.EMAIL),
        graduationYears: years.map((y) => y.GRAD_YEAR),
        columns: { submissions: columnInfo(SUBMISSION_COLUMNS), teams: columnInfo(TEAM_COLUMNS), spocs: columnInfo(SPOC_COLUMNS) },
    });
});

// POST /admin/export/:type  body { filters, columns, sheets, preview }
const Export_data = AsyncHandler(async (req, res) => {
    const type = String(req.params.type);
    if (!COLUMNS[type]) return res.status(400).json({ message: "Choose submissions, teams or SPOCs" });
    const { filters = {}, columns: keys = [], sheets = {}, preview = false } = req.body || {};

    let rows;
    if (type === "submissions") rows = filterSubmissions(await loadSubmissions(), filters);
    else if (type === "teams") rows = filterTeams(await loadTeams(), filters);
    else rows = filterSpocs(await loadSpocs(), filters);

    if (preview) {
        const extra = type === "submissions" ? { problems: new Set(rows.map((r) => r.PROBLEM_ID)).size, teams: new Set(rows.map((r) => r.TEAM_EMAIL)).size } : {};
        return res.json({ count: rows.length, ...extra });
    }

    const columns = pickColumns(COLUMNS[type], keys);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Solve For Sakthi";
    workbook.created = new Date();
    const [problems] = await connection.query("SELECT ID, TITLE FROM SolveForSakthi_Problems");
    const lookups = { problems: new Map(problems.map((p) => [String(p.ID), `SFS_${p.ID} ${p.TITLE}`])) };
    const titles = { submissions: "Submissions export", teams: "Teams export", spocs: "SPOC export" };

    // the info sheet goes first; ExcelJS keeps sheets in the order they are added
    const counts = [[type === "spocs" ? "SPOCs" : type === "teams" ? "Teams" : "Submissions", rows.length]];
    if (type === "submissions") counts.push(["Challenges with submissions", new Set(rows.map((r) => r.PROBLEM_ID)).size], ["Teams", new Set(rows.map((r) => r.TEAM_EMAIL)).size]);
    addInfoSheet(workbook, { title: `Solve For Sakthi · ${titles[type]}`, user: req.user, filters: describeFilters(type, filters, lookups), counts });

    if (type === "submissions") {
        await buildSubmissionsWorkbook(workbook, rows, columns, sheets, filters, req.user);
    } else if (type === "teams") {
        addTableSheet(workbook, "Teams", columns, rows);
        if (sheets.members) {
            const members = rows.flatMap((t) => t.members.map((m) => ({ ...m, TEAM_NAME: t.NAME })));
            addTableSheet(workbook, "Team members", MEMBER_COLUMNS, members);
        }
    } else {
        addTableSheet(workbook, "SPOCs", columns, rows);
    }

    const stamp = new Date().toLocaleDateString("en-CA", { timeZone });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="SolveForSakthi_${type}_${stamp}.xlsx"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    await workbook.xlsx.write(res);
    res.end();
});

// One challenge's report: problem details and counts on top, every submission below, and the
// review history on a second sheet
const buildProblemReport = (problem, subs, columns, reviews, user) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Solve For Sakthi";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Report");
    sheet.columns = columns.map((c) => ({ key: c.key, width: Math.max(c.width || 16, 14) }));
    columns.forEach((c, i) => formatColumn(sheet.getColumn(i + 1), c));
    const span = Math.max(columns.length, 4);

    const title = sheet.addRow([`SFS_${problem.ID} · ${problem.TITLE || "(deleted challenge)"}`]);
    sheet.mergeCells(title.number, 1, title.number, span);
    title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF494949" } };
    title.height = 26;

    const count = (st) => subs.filter((x) => statusOf(x.STATUS) === st).length;
    const marks = subs.map((x) => x.EVAL_TOTAL).filter((m) => m != null);
    const facts = [
        ["Category", problem.CATEGORY || "—"], ["Domain", problem.DOMAIN || "—"],
        ["Status", problem.IS_CLOSED ? "Concept Received" : "Open"], ["Teams", problem.TEAM_COUNT ?? 0],
        ["Submissions", subs.length], ["Awaiting review", count("PENDING")], ["Changes needed", count("CHANGES_REQUESTED")],
        ["Concept accepted", count("APPROVED")], ["Rejected", count("REJECTED")],
        ["Average marks", marks.length ? `${Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10} / ${MARKS_TOTAL}` : "—"],
        ["Highest marks", marks.length ? `${Math.max(...marks)} / ${MARKS_TOTAL}` : "—"],
        ["Generated", `${new Date().toLocaleString("en-IN", { timeZone, dateStyle: "medium", timeStyle: "short" })} by ${user?.EMAIL || ""}`],
    ];
    // two facts per row: label, value, label, value
    for (let i = 0; i < facts.length; i += 2) {
        const row = sheet.addRow([facts[i][0], facts[i][1], facts[i + 1]?.[0] ?? null, facts[i + 1]?.[1] ?? null]);
        [1, 3].forEach((c) => { row.getCell(c).font = { bold: true }; row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } }; });
    }
    sheet.addRow([]);

    if (subs.length === 0) {
        sheet.addRow(["No submissions for this challenge (with the selected filters)."]).font = { italic: true, color: { argb: "FF888888" } };
    } else {
        const head = sheet.addRow(columns.map((c) => c.header));
        styleHeader(head);
        for (const x of subs) sheet.addRow(columns.map((c) => cellValue(c, x))).alignment = { vertical: "top", wrapText: true };
        sheet.autoFilter = { from: { row: head.number, column: 1 }, to: { row: head.number, column: columns.length } };
        sheet.views = [{ state: "frozen", ySplit: head.number }];
    }

    if (reviews.length) {
        const subOf = new Map(subs.map((x) => [x.ID, x]));
        addTableSheet(workbook, "Review history", [
            { key: "sub", header: "Submission ID", width: 13, value: (r) => r.SUBMISSION_ID },
            { key: "team", header: "Team", width: 22, value: (r) => subOf.get(r.SUBMISSION_ID)?.TEAM_NAME },
            { key: "decision", header: "Decision", width: 16, value: (r) => label(r.DECISION) },
            { key: "by", header: "Reviewed by", width: 28, value: (r) => r.REVIEWER_EMAIL },
            { key: "at", header: "Reviewed on", width: 18, type: "datetime", value: (r) => asDate(r.REVIEWED_AT) },
            ...CRITERIA.map((c) => ({ key: c.key, header: `${c.label} (/${c.max})`, width: 15, value: (r) => r[c.column] })),
            { key: "total", header: `Total (/${MARKS_TOTAL})`, width: 11, value: (r) => r.EVAL_TOTAL },
            { key: "comment", header: "Comment", width: 50, value: (r) => r.COMMENT },
        ], reviews);
    }
    return workbook;
};

const safeName = (text) => String(text || "").replace(/[\\/:*?"<>|\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

// POST /admin/export/problem-reports  body { filters, columns, includeEmptyProblems }
// A ZIP with one Excel report per challenge, plus an overview workbook
const Export_problem_reports = AsyncHandler(async (req, res) => {
    const { filters = {}, columns: keys = [], includeEmptyProblems = true } = req.body || {};
    const rows = filterSubmissions(await loadSubmissions(), filters);
    // each report is about one problem, so the problem columns are left out unless chosen explicitly
    const columns = pickColumns(SUBMISSION_COLUMNS, keys).filter((c) => list(keys).length || !["problemId", "problemTitle", "category", "domain", "challengeStatus"].includes(c.key));
    const [problems] = await connection.query(`
        SELECT p.ID, p.TITLE, p.CATEGORY, p.DOMAIN, p.IS_CLOSED,
               (SELECT COUNT(DISTINCT s.TEAM_EMAIL) FROM SolveForSakthi_Submissions s WHERE s.PROBLEM_ID = p.ID) AS TEAM_COUNT
        FROM SolveForSakthi_Problems p ORDER BY p.ID`);
    const chosen = list(filters.problemIds);
    const included = problems.filter((p) => (chosen.length === 0 || chosen.includes(String(p.ID)))
        && (includeEmptyProblems || rows.some((r) => r.PROBLEM_ID === p.ID)));
    if (included.length === 0) return res.status(400).json({ message: "No challenges match these filters" });

    const ids = rows.map((r) => r.ID);
    const [reviews] = ids.length ? await connection.query(`
        SELECT r.SUBMISSION_ID, r.DECISION, r.COMMENT, r.REVIEWED_AT, u.EMAIL AS REVIEWER_EMAIL,
               r.EVAL_UNDERSTANDING, r.EVAL_SOLUTION, r.EVAL_TOOLS, r.EVAL_PRESENTATION, r.EVAL_ACCEPTANCE, r.EVAL_TOTAL
        FROM SolveForSakthi_Submission_Reviews r LEFT JOIN SolveForSakthi_Users u ON u.ID = r.REVIEWED_BY
        ORDER BY r.SUBMISSION_ID, r.ID`) : [[]];

    const zip = new JSZip();
    const folder = zip.folder("Challenge reports");
    for (const p of included) {
        const subs = rows.filter((r) => r.PROBLEM_ID === p.ID);
        const subIds = new Set(subs.map((x) => x.ID));
        const workbook = buildProblemReport(p, subs, columns, reviews.filter((r) => subIds.has(r.SUBMISSION_ID)), req.user);
        folder.file(`SFS_${p.ID} - ${safeName(p.TITLE) || "problem"}.xlsx`, await workbook.xlsx.writeBuffer());
    }

    // overview of every included problem
    const overview = new ExcelJS.Workbook();
    const lookups = { problems: new Map(problems.map((x) => [String(x.ID), `SFS_${x.ID} ${x.TITLE}`])) };
    addInfoSheet(overview, {
        title: "Solve For Sakthi · Challenge reports",
        user: req.user,
        filters: describeFilters("submissions", filters, lookups),
        counts: [["Challenges (one report each)", included.length], ["Submissions", rows.filter((r) => included.some((p) => p.ID === r.PROBLEM_ID)).length]],
    });
    await buildSubmissionsWorkbook(overview, rows.filter((r) => included.some((p) => p.ID === r.PROBLEM_ID)), columns,
        { summary: true, byProblem: false, all: false }, { ...filters, problemIds: included.map((p) => String(p.ID)) }, req.user);
    zip.file("All challenges - summary.xlsx", await overview.xlsx.writeBuffer());

    const stamp = new Date().toLocaleDateString("en-CA", { timeZone });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="SolveForSakthi_problem_reports_${stamp}.zip"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    zip.generateNodeStream({ type: "nodebuffer", streamFiles: true, compression: "DEFLATE" }).pipe(res);
});

// GET /admin/submissions/all: every submission for the admin Submissions page (evaluators), newest first.
// Only the fields the list needs, never the description or files.
const List_all_submissions = AsyncHandler(async (req, res) => {
    const rows = await loadSubmissions();
    const out = rows
        .map((r) => ({
            ID: r.ID, PROBLEM_ID: r.PROBLEM_ID, PROBLEM_TITLE: r.PROBLEM_TITLE, CATEGORY: r.CATEGORY, IS_CLOSED: Boolean(r.IS_CLOSED),
            SOL_TITLE: r.SOL_TITLE, SUB_DATE: day(r.SUB_DATE), STATUS: statusOf(r.STATUS),
            TEAM_ID: r.TEAM_ID, TEAM_NAME: r.TEAM_NAME, TEAM_EMAIL: r.TEAM_EMAIL, COLLEGE: r.COLLEGE,
            EVAL_TOTAL: r.EVAL_TOTAL, EVALUATED_AT: r.EVALUATED_AT, REVIEWER_EMAIL: r.REVIEWER_EMAIL, REVIEW_COUNT: Number(r.REVIEW_COUNT) || 0,
        }))
        .sort((a, b) => b.ID - a.ID);
    res.json({ submissions: out });
});

export { Export_options, Export_data, Export_problem_reports, List_all_submissions };
