import connection from "../database/db.js"
import { sendMail, trackMailWork } from "./mailer.js"
import { CRITERIA, MARKS_TOTAL } from "./review.js"
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
        .then((info) => console.log(`Mail sent (${label}) to ${message.to}:`, info.response, info.messageId))
        .catch((err) => console.error(`Mail failed (${label}):`, err.message))
}

// Runs the lookup + send in the background and swallows any error
const background = (label, task) => {
    trackMailWork(Promise.resolve().then(task).catch((err) => console.error(`Notification failed (${label}):`, err.message)))
}

// Submission with everything the mails need: problem, team, lead, SPOC and college
const loadSubmission = async (submissionId) => {
    const [rows] = await connection.query(`
        SELECT s.ID, s.SOL_TITLE, s.SUB_DATE, s.STATUS, s.EVALUATION_COMMENT,
               s.EVAL_UNDERSTANDING, s.EVAL_SOLUTION, s.EVAL_TOOLS, s.EVAL_PRESENTATION, s.EVAL_ACCEPTANCE, s.EVAL_TOTAL,
               s.TEAM_EMAIL, p.ID AS PROBLEM_ID, p.TITLE AS PROBLEM_TITLE,
               t.NAME AS TEAM_NAME, spoc.EMAIL AS SPOC_EMAIL, spoc.COLLEGE AS COLLEGE
        FROM SolveForSakthi_Submissions s
        LEFT JOIN SolveForSakthi_Problems p ON p.ID = s.PROBLEM_ID
        LEFT JOIN SolveForSakthi_Team_List t ON t.LEAD_EMAIL = s.TEAM_EMAIL
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE s.ID = ?`, [submissionId])
    return rows[0]
}

// Admin approved or rejected a SPOC account
const notifyAccountDecision = (userId, approved) => background("account decision", async () => {
    const [rows] = await connection.query("SELECT EMAIL, NAME, ROLE FROM SolveForSakthi_Users WHERE ID = ?", [userId])
    const user = rows[0]
    if (!user) return
    const role = "SPOC"
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

// A team submitted (or replaced) a solution: tell the platform admins (they evaluate), and confirm to the team lead
const notifySubmission = (submissionId, replaced) => background("submission", async () => {
    const s = await loadSubmission(submissionId)
    if (!s) return
    const college = s.COLLEGE || "a college"
    const rows = [["Problem", s.PROBLEM_TITLE], ["Team", s.TEAM_NAME || s.TEAM_EMAIL], ["College", college], ["Solution title", s.SOL_TITLE || "—"], ["Submitted on", formatDate(s.SUB_DATE)]]

    const [admins] = await connection.query("SELECT EMAIL FROM SolveForSakthi_Users WHERE ROLE = 'ADMIN' AND STATUS = 'ACTIVE'")
    // one email per admin, so no admin sees the others' addresses
    for (const admin of admins) {
        deliver("submission -> admin", {
            to: admin.EMAIL,
            subject: `${replaced ? "Updated solution" : "New solution"} from ${college}: ${s.PROBLEM_TITLE}`,
            html: layout({
                heading: replaced ? "A team updated its solution" : "A team submitted a solution",
                intro: `A team from <b>${escapeHtml(college)}</b> ${replaced ? "updated its" : "submitted a"} solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>. It is waiting for your evaluation.`,
                rows,
                linkPath: `/admin/submissions/${s.ID}/details`, linkLabel: "Evaluate submission",
            }),
        })
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

// An admin reviewed a submission: decision, marks and comment to the team lead, and the same to the
// team's SPOC in a separate email (never cc)
const REVIEW_MAIL = {
    CHANGES_REQUESTED: { subject: "Changes needed", heading: "Changes needed for your solution", color: "#c05621",
        intro: "The Solve For Sakthi panel reviewed your solution and needs some changes before it can be approved. Please read the comment below, update your solution and upload it again." },
    APPROVED: { subject: "Approved", heading: "Your solution is approved", color: "#2f855a",
        intro: "Congratulations! The Solve For Sakthi panel reviewed your solution and approved it." },
    REJECTED: { subject: "Rejected", heading: "Your solution was not approved", color: "#c53030",
        intro: "The Solve For Sakthi panel reviewed your solution and could not approve it." },
}
const notifyReviewed = (submissionId) => background("reviewed", async () => {
    const s = await loadSubmission(submissionId)
    const mail = s && REVIEW_MAIL[s.STATUS]
    if (!mail) return
    const changes = s.STATUS === "CHANGES_REQUESTED"
    const score = s.EVAL_TOTAL != null ? ` (${s.EVAL_TOTAL}/${MARKS_TOTAL})` : ""
    const details = {
            rows: [
                ["Status", mail.subject],
                ["Problem", s.PROBLEM_TITLE],
                ["Your solution", s.SOL_TITLE || "—"],
                // the evaluation marks, when they were given with this review
                ...(s.EVAL_TOTAL != null
                    ? [...CRITERIA.map((c) => [c.label, `${s[c.column] ?? 0} / ${c.max}`]), ["Total", `${s.EVAL_TOTAL} / ${MARKS_TOTAL}`]]
                    : []),
            ],
            // the comment keeps its line breaks; it is escaped like every other value
            outro: s.EVALUATION_COMMENT
                ? `<div style="border-left:4px solid ${mail.color};background:#f7f8fc;padding:12px 16px;"><div style="font-weight:bold;margin-bottom:6px;">Comment from the evaluator</div>${escapeHtml(s.EVALUATION_COMMENT).replace(/\n/g, "<br>")}</div>`
                : "",
    }
    deliver("reviewed -> team", {
        to: s.TEAM_EMAIL,
        subject: `${mail.subject}${score}: your solution for ${s.PROBLEM_TITLE}`,
        html: layout({
            heading: mail.heading,
            intro: `Team <b>${escapeHtml(s.TEAM_NAME || s.TEAM_EMAIL)}</b>, solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>.<br>${mail.intro}`,
            ...details,
            linkPath: changes ? `/student/submit-solution?problemId=${s.PROBLEM_ID}` : "/student",
            linkLabel: changes ? "Upload revised solution" : "View my submissions",
        }),
    })
    if (s.SPOC_EMAIL) {
        deliver("reviewed -> SPOC", {
            to: s.SPOC_EMAIL,
            subject: `${mail.subject}${score}: team ${s.TEAM_NAME || s.TEAM_EMAIL}'s solution for ${s.PROBLEM_TITLE}`,
            html: layout({
                heading: `Your team's solution: ${mail.subject}`,
                intro: `The Solve For Sakthi panel reviewed team <b>${escapeHtml(s.TEAM_NAME || s.TEAM_EMAIL)}</b>'s solution for <b>${escapeHtml(s.PROBLEM_TITLE)}</b>. The team lead has been emailed the same result.`,
                ...details,
                linkPath: "/spoc", linkLabel: "Open Team Progress",
            }),
        })
    }
})

// A platform admin created an account for someone (login details included, since there is no other way to get them)
const notifyAccountCreated = ({ email, name, role, password }) => background("account created", async () => {
    const roleName = { ADMIN: "platform admin", SPOC: "SPOC" }[role] || role
    deliver("account created", {
        sensitive: true,
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

// Problem statements were imported from Excel: one mail per SPOC listing them (instead of one mail per problem)
const notifyProblemsPublished = (titles) => background("problems published", async () => {
    const [spocs] = await connection.query("SELECT EMAIL, NAME FROM SolveForSakthi_Users WHERE ROLE = 'SPOC' AND STATUS = 'ACTIVE'")
    const shown = titles.slice(0, 25)
    const more = titles.length - shown.length
    for (const spoc of spocs) {
        deliver("problems published", {
            to: spoc.EMAIL,
            subject: titles.length === 1 ? `New problem statement: ${titles[0]}` : `${titles.length} new problem statements on Solve For Sakthi`,
            html: layout({
                heading: titles.length === 1 ? "A new problem statement is available" : `${titles.length} new problem statements are available`,
                intro: `Hello ${escapeHtml(spoc.NAME || "")}, new problem statements have been published for Solve For Sakthi ${new Date().getFullYear()}. Your teams can request them from their team portal, or you can assign them under Team Progress.`,
                rows: shown.map((title, i) => [`${i + 1}`, title]).concat(more > 0 ? [["…", `and ${more} more`]] : []),
                linkPath: "/spoc", linkLabel: "Open SPOC portal",
            }),
        })
    }
})

// A team's final graduation year has ended: tell every member, and the SPOC that the team left their list
const notifyTeamGraduated = (teamId) => background("team graduated", async () => {
    const [rows] = await connection.query(`
        SELECT t.NAME, t.GRADUATION_YEAR, spoc.EMAIL AS SPOC_EMAIL, spoc.NAME AS SPOC_NAME, spoc.COLLEGE
        FROM SolveForSakthi_Team_List t
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE t.ID = ?`, [teamId])
    const team = rows[0]
    if (!team) return
    const [members] = await connection.query("SELECT NAME, EMAIL, ROLE, GRAD_YEAR FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [teamId])
    const memberRows = members.map((m) => [m.ROLE || "Member", `${m.NAME || "—"}${m.GRAD_YEAR ? ` (${m.GRAD_YEAR})` : ""}`])

    for (const m of members.filter((x) => x.EMAIL)) {
        deliver("team graduated -> member", {
            to: m.EMAIL,
            subject: `Congratulations on graduating! Team ${team.NAME} is now closed on Solve For Sakthi`,
            html: layout({
                heading: "Congratulations on your graduation!",
                intro: `Hello ${escapeHtml(m.NAME || "")}, every member of team <b>${escapeHtml(team.NAME)}</b> has now graduated (final graduation year ${escapeHtml(team.GRADUATION_YEAR)}). Your team has been removed from your SPOC's list and its login is closed. The organisers keep your team's submissions and results on record.`,
                rows: [["Team", team.NAME], ["College", team.COLLEGE || "—"], ...memberRows],
                outro: "Thank you for taking part in Solve For Sakthi, and all the best for what comes next!",
            }),
        })
    }
    if (team.SPOC_EMAIL) {
        deliver("team graduated -> SPOC", {
            to: team.SPOC_EMAIL,
            subject: `Team ${team.NAME} has graduated and was removed from your list`,
            html: layout({
                heading: "A team has graduated",
                intro: `Hello ${escapeHtml(team.SPOC_NAME || "")}, all members of team <b>${escapeHtml(team.NAME)}</b> have graduated (final graduation year ${escapeHtml(team.GRADUATION_YEAR)}). The team has been removed from your team list and its login is closed. Its submissions and results stay on record with the platform admins.`,
                rows: [["Team", team.NAME], ...memberRows],
                linkPath: "/spoc", linkLabel: "Open SPOC portal",
            }),
        })
    }
})

// An admin or SPOC set a new password; the email carries it (logged without its text)
const notifyPasswordChanged = ({ email, name, role, password, changedBy }) => background("password changed", async () => {
    deliver("password changed", {
        sensitive: true,
        to: email,
        subject: "Your Solve For Sakthi password was changed",
        html: layout({
            heading: "Your password was changed",
            intro: `Hello ${escapeHtml(name || "")}, ${escapeHtml(changedBy)} set a new password for your ${role === "STUDENT" ? "team" : "Solve For Sakthi"} login. Use it the next time you log in; you have been logged out everywhere else.`,
            rows: [["Login email", email], ["New password", password]],
            outro: "Please keep these details private. If you did not expect this change, contact the organisers.",
            linkPath: "/login", linkLabel: "Log in",
        }),
    })
})

const dayText = (value) => (value ? formatDate(value) : "not set")

// An admin moved a problem's deadline: each assigned team lead, and each of their SPOCs in a separate email
// (one per SPOC, listing their teams; never cc)
const notifyDeadlineChanged = (problemId, oldDeadline, newDeadline) => background("deadline changed", async () => {
    const [teams] = await connection.query(`
        SELECT t.NAME AS TEAM_NAME, t.LEAD_EMAIL, p.TITLE, spoc.EMAIL AS SPOC_EMAIL
        FROM SolveForSakthi_Team_Problems tp
        JOIN SolveForSakthi_Team_List t ON t.ID = tp.TEAM_ID
        JOIN SolveForSakthi_Problems p ON p.ID = tp.PROBLEM_ID
        LEFT JOIN SolveForSakthi_Users spoc ON spoc.ID = t.SPOC_ID
        WHERE tp.PROBLEM_ID = ? AND tp.STATUS = 'ASSIGNED' AND t.GRADUATED_AT IS NULL`, [problemId])
    const extended = !oldDeadline || newDeadline > oldDeadline
    const spocs = new Map() // SPOC email -> their team names
    for (const team of teams) {
        if (team.SPOC_EMAIL) spocs.set(team.SPOC_EMAIL, [...(spocs.get(team.SPOC_EMAIL) || []), team.TEAM_NAME])
        deliver("deadline changed -> team", {
            to: team.LEAD_EMAIL,
            subject: `Deadline ${extended ? "extended" : "changed"}: ${team.TITLE} (now ${dayText(newDeadline)})`,
            html: layout({
                heading: extended ? "The deadline has been extended" : "The deadline has changed",
                intro: `The submission deadline for <b>${escapeHtml(team.TITLE)}</b>, assigned to team <b>${escapeHtml(team.TEAM_NAME)}</b>, ${extended ? "has been extended" : "has been changed"}.`,
                rows: [["Problem", team.TITLE], ["Team", team.TEAM_NAME], ["Previous deadline", dayText(oldDeadline)], ["New deadline", dayText(newDeadline)]],
                linkPath: "/student", linkLabel: "Open team portal",
            }),
        })
    }
    const title = teams[0]?.TITLE
    for (const [spocEmail, teamNames] of spocs) {
        deliver("deadline changed -> SPOC", {
            to: spocEmail,
            subject: `Deadline ${extended ? "extended" : "changed"}: ${title} (now ${dayText(newDeadline)})`,
            html: layout({
                heading: extended ? "A deadline for your teams has been extended" : "A deadline for your teams has changed",
                intro: `The submission deadline for <b>${escapeHtml(title)}</b> ${extended ? "has been extended" : "has been changed"}. Your team${teamNames.length === 1 ? "" : "s"} below ${teamNames.length === 1 ? "has" : "have"} been emailed.`,
                rows: [["Problem", title], ["Previous deadline", dayText(oldDeadline)], ["New deadline", dayText(newDeadline)], ...teamNames.map((name, i) => [i === 0 ? "Your teams" : "", name])],
                linkPath: "/spoc", linkLabel: "Open Team Progress",
            }),
        })
    }
})

// Two days (or less) before a deadline: remind a team lead (once per team, problem and deadline)
const notifyDeadlineReminder = ({ teamName, leadEmail, problemId, title, deadline, daysLeft, submissionStatus }) => background("deadline reminder", async () => {
    const when = daysLeft <= 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`
    const state = !submissionStatus ? "You have not submitted a solution yet."
        : submissionStatus === "CHANGES_REQUESTED" ? "The evaluator asked for changes to your solution; please upload your revised solution."
        : "You have already submitted a solution. You can still replace it until it is reviewed or the deadline passes."
    deliver("deadline reminder", {
        to: leadEmail,
        subject: `Reminder: ${title} is due ${when} (${dayText(deadline)})`,
        html: layout({
            heading: daysLeft <= 0 ? "Today is the last day to submit" : `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to submit`,
            intro: `Team <b>${escapeHtml(teamName)}</b>, the submission deadline for <b>${escapeHtml(title)}</b> is <b>${escapeHtml(dayText(deadline))}</b>. ${escapeHtml(state)}`,
            rows: [["Problem", title], ["Deadline", dayText(deadline)]],
            linkPath: `/student/submit-solution?problemId=${problemId}`, linkLabel: submissionStatus ? "Open my submission" : "Submit solution",
        }),
    })
})

// The user changed their own password: a security notice (the password itself is never emailed here)
const notifyOwnPasswordChanged = ({ email, name }) => background("own password changed", async () => {
    deliver("own password changed", {
        to: email,
        subject: "Your Solve For Sakthi password was changed",
        html: layout({
            heading: "Your password was changed",
            intro: `Hello ${escapeHtml(name || "")}, the password of your Solve For Sakthi account was just changed from your profile. Other devices that were logged in have been logged out.`,
            outro: "If you did not make this change, contact the platform admin straight away.",
            linkPath: "/login", linkLabel: "Log in",
        }),
    })
})

export { deliver, background, notifyOwnPasswordChanged, notifyDeadlineChanged, notifyDeadlineReminder, notifyPasswordChanged, notifyTeamGraduated, notifyProblemsPublished, layout, escapeHtml, loadSubmission, notifyAccountCreated, notifySubmissionRemoved, notifyAccountDecision, notifyTeamAssigned, notifyProblemRequested, notifyRequestRejected, notifySubmission, notifyReviewed }
