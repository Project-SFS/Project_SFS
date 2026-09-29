import connection from "../database/db.js"
import { sendMail } from "./mailer.js"
import { currentOrigin } from "./requestContext.js"

// Transactional emails. Every function is fire-and-forget: it never throws into the request
// that triggered it, so a mail outage cannot break submitting, scoring or approving.

// APP_URL: the portal address used for the buttons in emails. When people reach the platform through
// different addresses (public IP, VPN IP, host name), list them all, comma separated, optionally labelled:
//   APP_URL=Public|http://203.0.113.10:9021,VPN|http://10.8.0.5:9021
// The first one is the main button; the others are listed under it.
const appUrls = (process.env.APP_URL || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
        const [label, url] = entry.includes("|") ? entry.split("|", 2) : ["", entry]
        return { label: label.trim(), url: url.trim().replace(/\/+$/, "") }
    })
    .filter(({ url }) => /^https?:\/\//i.test(url))

const portalLinks = (linkPath, linkLabel) => {
    // APP_URL empty: use the address (IP:port or host name) the person who triggered the mail was on
    const origin = currentOrigin()
    const urls = appUrls.length ? appUrls : origin ? [{ label: "", url: origin.replace(/\/+$/, "") }] : []
    if (!urls.length || !linkPath) return ""
    const [main, ...others] = urls
    const button = `<p style="margin:0 0 8px;"><a href="${escapeHtml(main.url + linkPath)}" style="display:inline-block;background:#fc9300;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">${escapeHtml(linkLabel || "Open portal")}</a></p>`
    if (!others.length) return button
    const alternatives = [main, ...others]
        .map(({ label, url }, i) => `${escapeHtml(label || `Address ${i + 1}`)}: <a href="${escapeHtml(url + linkPath)}" style="color:#fc9300;">${escapeHtml(url + linkPath)}</a>`)
        .join("<br>")
    return `${button}<p style="margin:8px 0 0;font-size:13px;color:#718096;">If the button does not open, use the address that works on your network:<br>${alternatives}</p>`
}

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")

const formatDate = (value) => {
    if (!value) return "—"
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10)
}

// rows: [[label, value], ...] rendered as a small key/value table (values are escaped)
const layout = ({ heading, intro, rows = [], outro = "", linkPath, linkLabel }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#494949;padding:18px 24px;">
      <span style="color:#fc9300;font-size:20px;font-weight:bold;">Solve For Sakthi</span>
    </div>
    <div style="padding:24px;color:#333333;font-size:15px;line-height:1.5;">
      <h2 style="margin:0 0 12px;color:#2f3640;font-size:20px;">${escapeHtml(heading)}</h2>
      <p style="margin:0 0 16px;">${intro}</p>
      ${rows.length ? `<table style="border-collapse:collapse;width:100%;margin:0 0 16px;">
        ${rows.map(([label, value]) => `<tr>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;background:#f7f8fc;font-weight:bold;width:40%;">${escapeHtml(label)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;">${escapeHtml(value)}</td>
        </tr>`).join("")}
      </table>` : ""}
      ${outro ? `<p style="margin:0 0 16px;">${outro}</p>` : ""}
      ${portalLinks(linkPath, linkLabel)}
    </div>
    <div style="padding:12px 24px;background:#f7f8fc;color:#718096;font-size:12px;">
      This is an automated message from Solve For Sakthi. Please do not reply.
    </div>
  </div>
</body>
</html>`

const deliver = (label, message) => {
    if (!message.to) return
    sendMail({ fromName: "Solve For Sakthi", ...message })
        .then((info) => console.log(`Mail sent (${label}):`, info.messageId))
        .catch((err) => console.error(`Mail failed (${label}):`, err.message))
}

// Runs the lookup + send in the background and swallows any error
const background = (label, task) => {
    Promise.resolve().then(task).catch((err) => console.error(`Notification failed (${label}):`, err.message))
}

// Submission with everything the mails need: problem, evaluator, team, lead, SPOC and college
const loadSubmission = async (submissionId) => {
    const [rows] = await connection.query(`
        SELECT s.ID, s.SOL_TITLE, s.SUB_DATE, s.STATUS, s.MARK, s.CP_MARK, s.PS_MARK, s.BV_MARK, s.FP_MARK, s.IN_MARK,
               s.TEAM_EMAIL, p.ID AS PROBLEM_ID, p.TITLE AS PROBLEM_TITLE,
               ev.EMAIL AS EVALUATOR_EMAIL, ev.NAME AS EVALUATOR_NAME,
               t.NAME AS TEAM_NAME, spoc.EMAIL AS SPOC_EMAIL, spoc.COLLEGE AS COLLEGE
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        LEFT JOIN SolveForSakthi_Users ev ON ev.ID = p.Evaluator_ID
        LEFT JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE s.ID = ?`, [submissionId])
    return rows[0]
}

// Admin/evaluator created a problem and assigned an evaluator to it
const notifyEvaluatorAssigned = (problemId) => background("evaluator assigned", async () => {
    const [rows] = await connection.query(`
        SELECT p.TITLE, p.CATEGORY, p.SUB_DEADLINE, u.EMAIL, u.NAME
        FROM SolveForSakthi_Problems p JOIN SolveForSakthi_Users u ON u.ID = p.Evaluator_ID
        WHERE p.ID = ?`, [problemId])
    const row = rows[0]
    if (!row) return
    deliver("evaluator assigned", {
        to: row.EMAIL,
        subject: `Problem statement assigned to you: ${row.TITLE}`,
        html: layout({
            heading: "A problem statement has been assigned to you",
            intro: `Hello ${escapeHtml(row.NAME || "Evaluator")}, you are the evaluator for the problem statement below. You will get an email whenever a team submits a solution for it.`,
            rows: [["Problem", row.TITLE], ["Problem ID", `SFS_${problemId}`], ["Category", row.CATEGORY || "—"], ["Submission deadline", formatDate(row.SUB_DEADLINE)]],
            linkPath: "/evaluator", linkLabel: "Open evaluator portal",
        }),
    })
})

// Admin approved or rejected a SPOC / evaluator account
const notifyAccountDecision = (userId, approved) => background("account decision", async () => {
    const [rows] = await connection.query("SELECT EMAIL, NAME, ROLE FROM SolveForSakthi_Users WHERE ID = ?", [userId])
    const user = rows[0]
    if (!user) return
    const role = user.ROLE === "EVALUATOR" ? "evaluator" : "SPOC"
    deliver("account decision", {
        to: user.EMAIL,
        subject: approved ? "Your Solve For Sakthi account is approved" : "Your Solve For Sakthi registration was not approved",
        html: layout({
            heading: approved ? "Account approved" : "Registration not approved",
            intro: approved
                ? `Hello ${escapeHtml(user.NAME || "")}, your ${role} account has been approved. You can now log in.`
                : `Hello ${escapeHtml(user.NAME || "")}, your ${role} registration was not approved. Please contact the organisers if you think this is a mistake.`,
            linkPath: approved ? "/login" : undefined, linkLabel: "Log in",
        }),
    })
})

// SPOC assigned a problem statement to one of their teams (directly, or by approving the team's request)
const notifyTeamAssigned = (teamId, problemId, approvedRequest = false) => background("team assigned", async () => {
    const [rows] = await connection.query(`
        SELECT t.NAME AS TEAM_NAME, t.LEAD_EMAIL, p.TITLE, p.CATEGORY, p.SUB_DEADLINE
        FROM SolveForSakthi_Team_List t, SolveForSakthi_Problems p
        WHERE t.ID = ? AND p.ID = ?`, [teamId, problemId])
    const row = rows[0]
    if (!row) return
    deliver("team assigned", {
        to: row.LEAD_EMAIL,
        subject: approvedRequest ? `Request approved: ${row.TITLE}` : `New problem statement for your team: ${row.TITLE}`,
        html: layout({
            heading: approvedRequest ? "Your SPOC approved your request" : "Your SPOC assigned a problem statement to your team",
            intro: `Team <b>${escapeHtml(row.TEAM_NAME)}</b> can now submit a solution for this problem statement.`,
            rows: [["Problem", row.TITLE], ["Category", row.CATEGORY || "—"], ["Submission deadline", formatDate(row.SUB_DEADLINE)]],
            linkPath: "/student", linkLabel: "Open team portal",
        }),
    })
})

// Team + problem + the team's SPOC, for request mails
const loadTeamProblem = async (teamId, problemId) => {
    const [rows] = await connection.query(`
        SELECT t.NAME AS TEAM_NAME, t.LEAD_EMAIL, p.TITLE, p.CATEGORY, p.SUB_DEADLINE,
               spoc.EMAIL AS SPOC_EMAIL, spoc.NAME AS SPOC_NAME, spoc.COLLEGE
        FROM SolveForSakthi_Team_List t
        JOIN SolveForSakthi_Problems p ON p.ID = ?
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE t.ID = ?`, [problemId, teamId])
    return rows[0]
}

// A team asked its SPOC for a problem statement
const notifyProblemRequested = (teamId, problemId) => background("problem requested", async () => {
    const row = await loadTeamProblem(teamId, problemId)
    if (!row) return
    deliver("problem requested", {
        to: row.SPOC_EMAIL,
        subject: `Team ${row.TEAM_NAME} requested a problem statement: ${row.TITLE}`,
        html: layout({
            heading: "A team requested a problem statement",
            intro: `Hello ${escapeHtml(row.SPOC_NAME || "")}, team <b>${escapeHtml(row.TEAM_NAME)}</b> would like to work on the problem statement below. Approve or reject the request under Team Progress.`,
            rows: [["Team", row.TEAM_NAME], ["Team lead", row.LEAD_EMAIL], ["Problem", row.TITLE], ["Submission deadline", formatDate(row.SUB_DEADLINE)]],
            linkPath: "/spoc", linkLabel: "Review request",
        }),
    })
})

// SPOC declined a team's request
const notifyRequestRejected = (teamId, problemId) => background("request rejected", async () => {
    const row = await loadTeamProblem(teamId, problemId)
    if (!row) return
    deliver("request rejected", {
        to: row.LEAD_EMAIL,
        subject: `Request not approved: ${row.TITLE}`,
        html: layout({
            heading: "Your SPOC did not approve your request",
            intro: `Your SPOC did not approve team <b>${escapeHtml(row.TEAM_NAME)}</b>'s request for <b>${escapeHtml(row.TITLE)}</b>. Please talk to your SPOC, or request another problem statement.`,
            linkPath: "/student", linkLabel: "Open team portal",
        }),
    })
})

// A team submitted (or replaced) a solution: tell the evaluator, and confirm to the team lead
const notifySubmission = (submissionId, replaced) => background("submission", async () => {
    const s = await loadSubmission(submissionId)
    if (!s) return
    const college = s.COLLEGE || "a college"
    const rows = [["Problem", s.PROBLEM_TITLE], ["Team", s.TEAM_NAME || s.TEAM_EMAIL], ["College", college], ["Solution title", s.SOL_TITLE || "—"], ["Submitted on", formatDate(s.SUB_DATE)]]

    if (s.EVALUATOR_EMAIL) {
        deliver("submission -> evaluator", {
            to: s.EVALUATOR_EMAIL,
            subject: `${replaced ? "Updated solution" : "New solution"} from ${college}: ${s.PROBLEM_TITLE}`,
            html: layout({
                heading: replaced ? "A team updated its solution" : "A team submitted a solution",
                intro: `A team from <b>${escapeHtml(college)}</b> ${replaced ? "updated its" : "submitted a"} solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>. It is waiting for your evaluation.`,
                rows,
                linkPath: `/evaluator/submission/${s.ID}`, linkLabel: "Evaluate submission",
            }),
        })
    } else {
        console.warn(`Submission ${s.ID}: problem ${s.PROBLEM_ID} has no evaluator, nobody to notify`)
    }

    deliver("submission -> team", {
        to: s.TEAM_EMAIL,
        subject: `We received your solution for ${s.PROBLEM_TITLE}`,
        html: layout({
            heading: replaced ? "Your solution was updated" : "Your solution was received",
            intro: `Thanks! Your ${replaced ? "updated " : ""}solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b> has been received and is waiting for evaluation. You can still replace it until it is evaluated or the deadline passes.`,
            rows,
            linkPath: "/student", linkLabel: "View my submissions",
        }),
    })
})

// Evaluator scored a submission: send the result to the team lead, with the SPOC in copy
const notifyEvaluated = (submissionId) => background("evaluated", async () => {
    const s = await loadSubmission(submissionId)
    if (!s) return
    const accepted = s.STATUS === "ACCEPTED"
    deliver("evaluated", {
        to: s.TEAM_EMAIL,
        cc: s.SPOC_EMAIL || undefined,
        subject: `Your solution for ${s.PROBLEM_TITLE} has been evaluated: ${s.MARK}/100`,
        html: layout({
            heading: "Your solution has been evaluated",
            intro: `The evaluator reviewed team <b>${escapeHtml(s.TEAM_NAME || s.TEAM_EMAIL)}</b>'s solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>. You scored <b>${escapeHtml(s.MARK)}/100</b> and the solution is <b style="color:${accepted ? "#2f855a" : "#c53030"};">${accepted ? "ACCEPTED" : "REJECTED"}</b>.`,
            rows: [
                ["Client problem understanding & context", `${s.CP_MARK ?? 0} / 20`],
                ["Proposed solution strategy", `${s.PS_MARK ?? 0} / 40`],
                ["Business value & impact", `${s.BV_MARK ?? 0} / 20`],
                ["Feasibility & practical implementation", `${s.FP_MARK ?? 0} / 10`],
                ["Innovation", `${s.IN_MARK ?? 0} / 10`],
                ["Total", `${s.MARK ?? 0} / 100`],
            ],
            linkPath: "/student", linkLabel: "View my submissions",
        }),
    })
})

// A platform admin created an account for someone (login details included, since there is no other way to get them)
const notifyAccountCreated = ({ email, name, role, password }) => background("account created", async () => {
    const roleName = { ADMIN: "platform admin", SPOC: "SPOC", EVALUATOR: "evaluator" }[role] || role
    deliver("account created", {
        to: email,
        subject: "Your Solve For Sakthi account",
        html: layout({
            heading: "Your account is ready",
            intro: `Hello ${escapeHtml(name || "")}, a platform admin created a <b>${escapeHtml(roleName)}</b> account for you on Solve For Sakthi. Log in with the details below.`,
            rows: [["Role", roleName], ["Login email", email], ["Password", password]],
            outro: "Please keep these details private.",
            linkPath: "/login", linkLabel: "Log in",
        }),
    })
})

// Staff removed a team's submission (s is the submission loaded before it was deleted)
const notifySubmissionRemoved = (s) => background("submission removed", async () => {
    if (!s?.TEAM_EMAIL) return
    deliver("submission removed", {
        to: s.TEAM_EMAIL,
        subject: `Your submission for ${s.PROBLEM_TITLE} was removed`,
        html: layout({
            heading: "Your submission was removed",
            intro: `The organisers removed team <b>${escapeHtml(s.TEAM_NAME || s.TEAM_EMAIL)}</b>'s submission for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>. The problem statement is still assigned to your team, so please submit your solution again before the deadline.`,
            rows: [["Problem", s.PROBLEM_TITLE], ["Removed solution", s.SOL_TITLE || "—"], ["Originally submitted", formatDate(s.SUB_DATE)]],
            linkPath: "/student", linkLabel: "Submit again",
        }),
    })
})

export { layout, escapeHtml, loadSubmission, notifyAccountCreated, notifySubmissionRemoved, notifyEvaluatorAssigned, notifyAccountDecision, notifyTeamAssigned, notifyProblemRequested, notifyRequestRejected, notifySubmission, notifyEvaluated }
