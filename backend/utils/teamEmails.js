import connection from "../database/db.js";

// Rules for the email addresses in a team form (create or edit):
//  - every member needs a valid email, and no email may appear twice in the same team
//  - a person can be in at most MAX_TEAMS active (not graduated) teams
//  - the team lead's email is the team's login, so it cannot be a SPOC / admin account and cannot
//    already lead another team
// Returns a list of { index, role, email, message } - empty when everything is fine.
// (email comparisons rely on the database's case-insensitive collation, so they can use the indexes)
export const MAX_TEAMS = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (email) => String(email || "").trim().toLowerCase();

export const checkTeamEmails = async (members, excludeTeamId = null) => {
    const list = (Array.isArray(members) ? members : []).map((m, index) => ({ index, role: m?.role || `Member ${index}`, email: norm(m?.email) }));
    const issues = [];
    const flagged = new Set();
    const add = (m, message) => {
        if (flagged.has(m.index)) return;
        flagged.add(m.index);
        issues.push({ index: m.index, role: m.role, email: m.email, message });
    };

    for (const m of list) if (!EMAIL_RE.test(m.email)) add(m, "Enter a valid email address");

    const seen = new Map();
    for (const m of list) {
        if (flagged.has(m.index)) continue;
        if (seen.has(m.email)) {
            add(m, `Same email as the ${seen.get(m.email).role}. Each member needs their own email`);
            add(seen.get(m.email), `Same email as the ${m.role}. Each member needs their own email`);
        } else seen.set(m.email, m);
    }

    const toCheck = list.filter((m) => !flagged.has(m.index));
    if (!toCheck.length) return issues.sort((a, b) => a.index - b.index);
    const exclude = excludeTeamId == null ? -1 : Number(excludeTeamId);
    const placeholders = toCheck.map(() => "?").join(", ");
    const emails = toCheck.map((m) => m.email);

    // active teams each email is already in (excluding the team being edited)
    const [memberships] = await connection.query(
        `SELECT DISTINCT LOWER(LTRIM(RTRIM(m.EMAIL))) AS EMAIL, t.ID, t.NAME
         FROM SolveForSakthi_Team_Members_List m
         JOIN SolveForSakthi_Team_List t ON t.ID = m.TEAM_ID
         WHERE m.EMAIL IN (${placeholders}) AND t.GRADUATED_AT IS NULL AND t.ID <> ?`,
        [...emails, exclude]
    );
    const teamsOf = new Map();
    for (const r of memberships) {
        if (!teamsOf.has(r.EMAIL)) teamsOf.set(r.EMAIL, new Map());
        teamsOf.get(r.EMAIL).set(r.ID, r.NAME);
    }

    const lead = toCheck.find((m) => m.role === "Team Lead");
    let leadAccount = null, leadOf = null;
    if (lead) {
        const [users] = await connection.query("SELECT TOP 1 ROLE FROM SolveForSakthi_Users WHERE EMAIL = ?", [lead.email]);
        leadAccount = users[0];
        const [led] = await connection.query("SELECT TOP 1 NAME, GRADUATED_AT, REMOVED_AT FROM SolveForSakthi_Team_List WHERE LEAD_EMAIL = ? AND ID <> ?", [lead.email, exclude]);
        leadOf = led[0];
    }

    for (const m of toCheck) {
        if (m === lead && leadAccount && leadAccount.ROLE !== "STUDENT") {
            add(m, `This email already belongs to a ${leadAccount.ROLE === "SPOC" ? "SPOC" : "platform admin"} account. The team lead needs a different email`);
            continue;
        }
        if (m === lead && leadOf) {
            // an archived team keeps its lead email, because its submissions are filed under it
            add(m, leadOf.GRADUATED_AT
                ? `This email was the team lead of "${leadOf.NAME}" (${leadOf.REMOVED_AT ? "removed" : "graduated"}), whose records are kept under it. Use a different email for the new team lead`
                : `This email is already the team lead of "${leadOf.NAME}". A person can lead only one team`);
            continue;
        }
        const teams = teamsOf.get(m.email);
        if (teams && teams.size >= MAX_TEAMS) {
            add(m, `This email is already in ${teams.size} teams (${[...teams.values()].join(", ")}). A person can join at most ${MAX_TEAMS} teams`);
        }
    }
    return issues.sort((a, b) => a.index - b.index);
};

// One line for a toast / error response listing every problem email
export const issuesMessage = (issues) =>
    `Fix these emails first: ${issues.map((i) => `${i.email || "(empty)"} (${i.role})`).join(", ")}`;
