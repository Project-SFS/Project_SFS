import ExcelJS from "exceljs";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { hasPermission, PERMISSIONS } from "../utils/permissions.js";
import { gradYearRange } from "../utils/graduation.js";
import { checkTeamEmails, MAX_TEAMS } from "../utils/teamEmails.js";
import { readMembers, createTeam, MIN_TEAM_SIZE, MAX_TEAM_SIZE } from "./Team_members.js";
import { parseInterests, interestLabels } from "../utils/categories.js";

// Excel import of teams. One row per person; rows with the same Team Name form one team:
//   Team Name | Role | Member Name | Email | Phone | Gender | Graduation Year | Interests | Mentor Name | Mentor Email
// Interests: the challenge categories the team wants to hear about (Software, Hardware, Combined; several
// separated by commas), filled on any row of the team.
// Role is "Team Lead" (exactly one per team, its email becomes the team login) or "Member".
// Every team is checked with the same rules as the team form before anything is saved (dryRun), and the
// file is checked as a whole too (an email in several teams of the file counts towards the team limit).
// Teams with problems are skipped; the others are created exactly like the form does (login + emails).

export const TEAM_TEMPLATE_COLUMNS = [
    { key: "team", header: "Team Name", width: 24 },
    { key: "role", header: "Role", width: 13 },
    { key: "name", header: "Member Name", width: 24 },
    { key: "email", header: "Email", width: 30 },
    { key: "phone", header: "Phone", width: 15 },
    { key: "gender", header: "Gender", width: 10 },
    { key: "gradYear", header: "Graduation Year", width: 15 },
    { key: "interests", header: "Interests", width: 26 },
    { key: "mentorName", header: "Mentor Name", width: 22 },
    { key: "mentorEmail", header: "Mentor Email", width: 28 },
];
const MAX_ROWS = 1000;
const GENDERS = ["Male", "Female", "Other"];

const norm = (text) => String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const headerKey = (text) => {
    const h = norm(text);
    if (!h) return null;
    if (h.includes("team") && h.includes("name")) return "team";
    if (h === "team") return "team";
    if (h.includes("mentor") && h.includes("email")) return "mentorEmail";
    if (h.includes("mentor")) return "mentorName";
    if (h.includes("role")) return "role";
    if (h.includes("interest") || h.includes("preference")) return "interests";
    if (h.includes("email") || h === "mail") return "email";
    if (h.includes("phone") || h.includes("mobile") || h.includes("contact")) return "phone";
    if (h.includes("gender") || h === "sex") return "gender";
    if (h.includes("graduation") || h.includes("gradyear") || h.includes("passout") || h === "year") return "gradYear";
    if (h.includes("name")) return "name";
    return null;
};

const cellText = (value) => {
    if (value == null) return "";
    if (value instanceof Date) return String(value.getFullYear());
    if (typeof value === "object") {
        if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
        if (value.text != null) return cellText(value.text);
        if (value.result != null) return cellText(value.result);
        if (value.hyperlink) return String(value.hyperlink).replace(/^mailto:/i, "");
        return "";
    }
    return String(value);
};
const clean = (text) => String(text).replace(/\s+/g, " ").trim();
const genderOf = (text) => GENDERS.find((g) => g.toLowerCase() === String(text || "").trim().toLowerCase()
    || g[0].toLowerCase() === String(text || "").trim().toLowerCase()) || String(text || "").trim();
const isLeadRole = (text) => /lead|leader|captain/i.test(String(text || ""));

// Reads the workbook into { rows } (one per person) or { error }
const readSheet = async (buffer) => {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(buffer);
    } catch {
        return { error: "This file could not be read. Upload the template as an Excel .xlsx file (File → Save As → Excel Workbook)." };
    }
    for (const sheet of workbook.worksheets) {
        for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
            const columns = {};
            sheet.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
                const key = headerKey(cellText(cell.value));
                if (key && !columns[key]) columns[key] = col;
            });
            if (!columns.team || !columns.email || !columns.name) continue;
            const rows = [];
            for (let i = r + 1; i <= sheet.rowCount; i++) {
                const row = sheet.getRow(i);
                const entry = { row: i };
                for (const { key } of TEAM_TEMPLATE_COLUMNS) entry[key] = columns[key] ? clean(cellText(row.getCell(columns[key]).value)) : "";
                if (TEAM_TEMPLATE_COLUMNS.some(({ key }) => entry[key])) rows.push(entry);
            }
            return { rows };
        }
    }
    return { error: `No template header row found. The first row must be: ${TEAM_TEMPLATE_COLUMNS.map((c) => c.header).join(", ")}.` };
};

// Groups the rows into teams and checks each one. Returns teams with status ready | error and messages.
const validateTeams = async (rows) => {
    const groups = new Map();
    const orphanRows = [];
    for (const r of rows) {
        if (!r.team) { orphanRows.push(r.row); continue; }
        const key = r.team.toLowerCase();
        if (!groups.has(key)) groups.set(key, { name: r.team, rows: [] });
        groups.get(key).rows.push(r);
    }
    const { min, max } = gradYearRange();
    const [existingTeams] = await connection.query("SELECT LOWER(NAME) AS NAME FROM SolveForSakthi_Team_List WHERE GRADUATED_AT IS NULL");
    const takenNames = new Set(existingTeams.map((t) => t.NAME));

    // across the whole file: how many teams each email is in, and who leads which team
    const fileTeamsOf = new Map();
    for (const g of groups.values()) {
        for (const email of new Set(g.rows.map((r) => r.email.toLowerCase()).filter(Boolean))) {
            fileTeamsOf.set(email, [...(fileTeamsOf.get(email) || []), g.name]);
        }
    }
    const fileLeads = new Map();
    // active teams each email is already in (database), to combine with the file
    const allEmails = [...fileTeamsOf.keys()];
    const dbCount = new Map();
    if (allEmails.length) {
        const [rows] = await connection.query(
            `SELECT LOWER(LTRIM(RTRIM(m.EMAIL))) AS EMAIL, COUNT(DISTINCT t.ID) AS N
             FROM SolveForSakthi_Team_Members_List m JOIN SolveForSakthi_Team_List t ON t.ID = m.TEAM_ID
             WHERE m.EMAIL IN (${allEmails.map(() => "?").join(", ")}) AND t.GRADUATED_AT IS NULL
             GROUP BY LOWER(LTRIM(RTRIM(m.EMAIL)))`, allEmails);
        rows.forEach((r) => dbCount.set(r.EMAIL, Number(r.N) || 0));
    }

    const teams = [];
    for (const g of groups.values()) {
        const messages = [];
        const leads = g.rows.filter((r) => isLeadRole(r.role));
        if (leads.length !== 1) messages.push(leads.length === 0 ? "No row has the Role \"Team Lead\"" : `${leads.length} rows have the Role "Team Lead"; a team has exactly one`);
        if (g.rows.length < MIN_TEAM_SIZE || g.rows.length > MAX_TEAM_SIZE) messages.push(`Has ${g.rows.length} people; a team needs ${MIN_TEAM_SIZE} to ${MAX_TEAM_SIZE} including the team lead`);
        if (g.name.length > 50) messages.push("Team Name is longer than 50 characters");
        if (takenNames.has(g.name.toLowerCase())) messages.push("A team with this name already exists");

        // lead first, then the members in file order
        const ordered = leads.length ? [leads[0], ...g.rows.filter((r) => r !== leads[0])] : g.rows;
        for (const r of ordered) {
            const who = `row ${r.row} (${r.name || r.email || "no name"})`;
            if (!r.name) messages.push(`${who}: Member Name is empty`);
            if (!r.phone) messages.push(`${who}: Phone is empty`);
            if (!GENDERS.includes(genderOf(r.gender))) messages.push(`${who}: Gender must be Male, Female or Other`);
            const year = Number(r.gradYear);
            if (!Number.isInteger(year) || year < min || year > max) messages.push(`${who}: Graduation Year must be between ${min} and ${max}`);
        }
        const mentor = g.rows.find((r) => r.mentorName || r.mentorEmail) || {};
        // interests: from any row of the team (all of them combined)
        const interestText = g.rows.map((r) => r.interests).filter(Boolean).join(",");
        const interests = parseInterests(interestText);
        if (!interestText) messages.push("Interests is empty: give at least one of Software, Hardware, Combined");
        else if (!interests.length) messages.push(`Interests "${interestText}" is not valid: use Software, Hardware and/or Combined`);
        if (mentor.mentorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentor.mentorEmail)) messages.push("Mentor Email is not a valid email address");

        const members = ordered.map((r) => ({ name: r.name, email: r.email, phone: r.phone, gender: genderOf(r.gender), gradYear: r.gradYear }));
        let checked = null;
        if (!messages.length) {
            const read = readMembers(members);
            if (read.error) messages.push(read.error);
            else checked = read.members;
        }
        if (checked) {
            // the same email rules as the team form, against the database...
            const issues = await checkTeamEmails(checked, null);
            issues.forEach((i) => messages.push(`${i.email || "(empty)"} (${i.role}): ${i.message}`));
            // ...and against the rest of the file
            const lead = checked[0].email;
            if (fileLeads.has(lead)) messages.push(`${lead} is also the team lead of "${fileLeads.get(lead)}" in this file. A person can lead only one team`);
            else fileLeads.set(lead, g.name);
            for (const m of checked) {
                const inFile = fileTeamsOf.get(m.email) || [];
                const already = dbCount.get(m.email) || 0;
                if (already + inFile.length > MAX_TEAMS) {
                    messages.push(`${m.email} would be in ${already + inFile.length} teams (${already ? `${already} already, ` : ""}${inFile.length} in this file: ${inFile.join(", ")}). A person can join at most ${MAX_TEAMS} teams`);
                }
            }
        }
        teams.push({
            name: g.name,
            rows: g.rows.map((r) => r.row),
            mentorName: mentor.mentorName || "",
            mentorEmail: mentor.mentorEmail || "",
            interests,
            interestLabel: interestLabels(interests.join(",")),
            members: (checked || members).map((m, i) => ({ role: checked ? m.role : (i === 0 && leads.length ? "Team Lead" : "Member"), name: m.name, email: m.email })),
            status: messages.length ? "error" : "ready",
            messages: [...new Set(messages)],
            _members: checked,
        });
    }
    return { teams, orphanRows };
};

// The SPOC the teams belong to: a SPOC imports for themselves; an admin with "Manage users" chooses one
const targetSpoc = async (req) => {
    if (req.user.ROLE === "SPOC") return { id: req.user.ID };
    if (!hasPermission(req.user, "USERS")) return { error: `You need the "${PERMISSIONS.USERS}" permission for this`, status: 403 };
    const spocId = parseInt(req.body?.spocId, 10);
    if (Number.isNaN(spocId)) return { error: "Choose the SPOC (college) the teams belong to" };
    const [rows] = await connection.query("SELECT ID FROM SolveForSakthi_Users WHERE ID = ? AND ROLE = 'SPOC' AND STATUS = 'ACTIVE'", [spocId]);
    if (!rows[0]) return { error: "That SPOC does not exist or is not approved" };
    return { id: spocId };
};

// POST /teams/import (multipart: file, dryRun, spocId for admins)
const Import_teams = AsyncHandler(async (req, res) => {
    const spoc = await targetSpoc(req);
    if (spoc.error) return res.status(spoc.status || 400).json({ message: spoc.error });
    if (!req.file) return res.status(400).json({ message: "Choose the filled-in Excel template (.xlsx) to import" });
    const dryRun = String(req.body.dryRun) !== "false";

    const parsed = await readSheet(req.file.buffer);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (parsed.rows.length === 0) return res.status(400).json({ message: "The file has the template headers but no people below them" });
    if (parsed.rows.length > MAX_ROWS) return res.status(400).json({ message: `The file has ${parsed.rows.length} rows; import at most ${MAX_ROWS} at a time` });

    const { teams, orphanRows } = await validateTeams(parsed.rows);
    const ready = teams.filter((t) => t.status === "ready");
    const summary = { teams: teams.length, people: parsed.rows.length, ready: ready.length, errors: teams.length - ready.length, rowsWithoutTeam: orphanRows.length };
    const publicTeams = teams.map(({ _members, ...t }) => t);
    if (dryRun) return res.json({ dryRun: true, summary, teams: publicTeams, orphanRows });

    const created = [];
    const failed = [];
    for (const t of ready) {
        try {
            const id = await createTeam({ spocId: spoc.id, teamName: t.name, members: t._members, mentorName: t.mentorName, mentorEmail: t.mentorEmail, interests: t.interests });
            created.push({ id, name: t.name });
        } catch {
            failed.push(t.name);
        }
    }
    res.status(201).json({ dryRun: false, summary: { ...summary, imported: created.length, failed: failed.length }, created, failed, teams: publicTeams, orphanRows });
});

// GET /teams/import/template: the empty template with dropdowns and an instructions sheet
const Team_import_template = AsyncHandler(async (req, res) => {
    const { min, max } = gradYearRange();
    const years = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Solve For Sakthi";
    const sheet = workbook.addWorksheet("Teams", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = TEAM_TEMPLATE_COLUMNS.map(({ key, header, width }) => ({ key, header, width }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFC9300" } };
    header.alignment = { vertical: "middle", wrapText: true };
    header.height = 28;
    const col = (key) => TEAM_TEMPLATE_COLUMNS.findIndex((c) => c.key === key) + 1;
    const list = (values, title) => ({ type: "list", allowBlank: false, formulae: [`"${values.join(",")}"`], showErrorMessage: true, errorStyle: "warning", errorTitle: title, error: `Choose: ${values.join(", ")}` });
    for (let r = 2; r <= 1001; r++) {
        sheet.getCell(r, col("role")).dataValidation = list(["Team Lead", "Member"], "Role");
        sheet.getCell(r, col("gender")).dataValidation = list(GENDERS, "Gender");
        sheet.getCell(r, col("gradYear")).dataValidation = list(years, "Graduation Year");
        sheet.getCell(r, col("phone")).numFmt = "@";
    }

    const help = workbook.addWorksheet("Instructions");
    help.columns = [{ width: 26 }, { width: 95 }];
    [
        ["How to fill this template", ""],
        ["", "One row per person in the \"Teams\" sheet. Rows with the same Team Name form one team. Keep the header row unchanged."],
        ["Team Name", `Required. The same name on every row of the team (at most 50 characters). A team has ${MIN_TEAM_SIZE} to ${MAX_TEAM_SIZE} people.`],
        ["Role", "Required. \"Team Lead\" for exactly one person per team (their email becomes the team login), \"Member\" for the others."],
        ["Member Name", "Required."],
        ["Email", `Required. Each person once per team. A person can be in at most ${MAX_TEAMS} teams and lead only one.`],
        ["Phone", "Required."],
        ["Gender", "Required. Male, Female or Other."],
        ["Graduation Year", `Required. ${min} to ${max}. The team closes after its last member graduates.`],
        ["Interests", "Required. The challenge categories the team is interested in: Software, Hardware and/or Combined, separated by commas (e.g. \"Hardware, Combined\"). Fill it on any one row of the team. The team is emailed only about new challenges in these categories."],
        ["Mentor Name / Email", "Optional. Fill them on any one row of the team (usually the team lead's)."],
        ["", ""],
        ["What happens", "The file is checked first and nothing is saved until you confirm. Teams with a problem are skipped and listed with the reason. For every created team the lead gets the login by email and every member a welcome email."],
        ["Example", "Team Alpha | Team Lead | Priya S | priya@college.edu | 9876543210 | Female | 2027 | Hardware, Combined | Dr. Kumar | kumar@college.edu"],
        ["", "Team Alpha | Member | Arun K | arun@college.edu | 9876501234 | Male | 2028 |  |  | "],
    ].forEach((row, i) => {
        const added = help.addRow(row);
        added.alignment = { vertical: "top", wrapText: true };
        if (i === 0) added.font = { bold: true, size: 14 };
        else added.getCell(1).font = { bold: true };
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="teams-template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
});

export { Import_teams, Team_import_template };
