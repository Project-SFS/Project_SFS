import crypto from "crypto";
import { hashSync } from "bcrypt";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { loadTeamFor } from "../utils/teamAccess.js";
import { layout, escapeHtml, notifyTeamLogin, deliver, background } from "../utils/notifications.js";
import { gradYearRange } from "../utils/graduation.js";
import { checkTeamEmails, issuesMessage } from "../utils/teamEmails.js";

// A team is the team lead plus 1-4 members (2-5 people). The first person is always the team lead,
// whose email is the team's login.
export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 5;

// Team login password: random, readable, and it passes the platform password rule (letter, number, symbol)
const teamPassword = () => `Sfs@${crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "x")}${crypto.randomInt(10, 100)}`;

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

// Tidies the submitted members (roles by position: Team Lead, Member 1, Member 2, ...) and checks the
// non-email fields. Returns { members } or { error }.
export const readMembers = (input) => {
  const raw = Array.isArray(input) ? input : [];
  if (raw.length < MIN_TEAM_SIZE || raw.length > MAX_TEAM_SIZE) {
    return { error: `A team needs ${MIN_TEAM_SIZE} to ${MAX_TEAM_SIZE} people, including the team lead` };
  }
  const { min, max } = gradYearRange();
  const members = raw.map((m, i) => ({
    role: i === 0 ? "Team Lead" : `Member ${i}`,
    name: clean(m?.name, 50),
    email: clean(m?.email, 100).toLowerCase(),
    phone: clean(m?.phone, 20),
    gender: clean(m?.gender, 10),
    gradYear: Number(m?.gradYear),
  }));
  for (const m of members) {
    if (!m.name) return { error: `Enter the name of the ${m.role}` };
    if (!m.phone) return { error: `Enter the phone number of the ${m.role}` };
    if (!m.gender) return { error: `Choose the gender of the ${m.role}` };
    if (!Number.isInteger(m.gradYear) || m.gradYear < min || m.gradYear > max) {
      return { error: `Choose a graduation year between ${min} and ${max} for the ${m.role}` };
    }
  }
  return { members };
};

// Validates a team form; sends the 400 itself and returns null when something is wrong
const validateTeam = async (req, res, members, excludeTeamId) => {
  const read = readMembers(members);
  if (read.error) { res.status(400).json({ message: read.error }); return null; }
  const issues = await checkTeamEmails(read.members, excludeTeamId);
  if (issues.length) { res.status(400).json({ message: issuesMessage(issues), issues }); return null; }
  return read.members;
};

const insertMembers = async (teamId, spocId, members) => {
  for (const m of members) {
    await connection.query(
      "INSERT INTO SolveForSakthi_Team_Members_List (ROLE, NAME, EMAIL, PHONE, GENDER, GRAD_YEAR, SPOC_ID, TEAM_ID) VALUES (?,?,?,?,?,?,?,?)",
      [m.role, m.name, m.email, m.phone, m.gender, m.gradYear, spocId, teamId]
    );
  }
};

// "You are registered" mail for each (new) member, in the background, one email each
const welcomeMembers = (members, teamName, leadEmail) => background("team members", async () => {
  for (const m of members) {
    deliver("team member registered", {
      to: m.email,
      subject: "You are registered for Solve For Sakthi",
      html: layout({
        heading: "Registration successful",
        intro: `Hello ${escapeHtml(m.name || "Participant")}, you have been registered for Solve For Sakthi ${new Date().getFullYear()} in team <b>${escapeHtml(teamName)}</b>, led by ${escapeHtml(leadEmail)}. We wish you all the best!`,
        rows: [["Name", m.name], ["Role", m.role], ["Email", m.email], ["Phone", m.phone], ["Gender", m.gender], ["Graduation year", m.gradYear]],
      }),
    });
  }
});

// Creates the team login for the lead, or reuses a login left behind with no team. Returns the password.
const createLeadLogin = async ({ email, name, college, teamId }) => {
  const password = teamPassword();
  const [users] = await connection.query("SELECT TOP 1 ID FROM SolveForSakthi_Users WHERE EMAIL = ? AND ROLE = 'STUDENT'", [email]);
  const params = [email, hashSync(password, 10), college || null, `TEAM-${teamId}`, name, new Date().toString().split(" ").slice(0, 4).join(" ")];
  if (users[0]) {
    await connection.query(
      "UPDATE SolveForSakthi_Users SET EMAIL = ?, PASSWORD = ?, COLLEGE = ?, COLLEGE_CODE = ?, NAME = ?, DATE = ?, STATUS = 'ACTIVE', PASSWORD_CHANGED_AT = SYSUTCDATETIME() WHERE ID = ?",
      [...params, users[0].ID]
    );
  } else {
    await connection.query(
      "INSERT INTO SolveForSakthi_Users (EMAIL, PASSWORD, COLLEGE, COLLEGE_CODE, NAME, DATE, ROLE, STATUS) VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')",
      params
    );
  }
  return password;
};

// Creates a team from already-validated members (see readMembers + checkTeamEmails): the team, its members
// and the team lead's login, then emails the members and the lead's login details. Used by the team form and
// the Excel import. Throws (after undoing the half-created team) when it cannot be saved.
export const createTeam = async ({ spocId, teamName, members, mentorName, mentorEmail }) => {
  const lead = members[0];
  const [spocRows] = await connection.query("SELECT COLLEGE FROM SolveForSakthi_Users WHERE ID = ?", [spocId]);
  const [result] = await connection.query(
    "INSERT INTO SolveForSakthi_Team_List (NAME, SPOC_ID, MENTOR_NAME, MENTOR_EMAIL, LEAD_EMAIL, LEAD_PHONE, CREATED_AT) VALUES (?,?,?,?,?,?, SYSUTCDATETIME())",
    [teamName, spocId, clean(mentorName, 50), clean(mentorEmail, 50), lead.email, lead.phone]
  );
  const teamId = result.insertId;
  let password;
  try {
    await insertMembers(teamId, spocId, members);
    // the team lead's login (the team's account), created together with the team so it is never skipped
    password = await createLeadLogin({ email: lead.email, name: lead.name, college: spocRows[0]?.COLLEGE, teamId });
  } catch (err) {
    // without its members and login the team is useless: undo it
    console.error("Team could not be created:", err.message);
    await connection.query("DELETE FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [teamId]);
    await connection.query("DELETE FROM SolveForSakthi_Team_List WHERE ID = ?", [teamId]);
    throw err;
  }
  welcomeMembers(members, teamName, lead.email);
  notifyTeamLogin({ email: lead.email, name: lead.name, teamName, password });
  return teamId;
};

// POST /check_team_members { members, teamId? } -> { issues } : the email checks only, nothing is saved
const Check_team_members = AsyncHandler(async (req, res) => {
  const { members, teamId } = req.body;
  if (teamId != null && !(await loadTeamFor(req, res, teamId, { manage: true }))) return;
  const issues = await checkTeamEmails(Array.isArray(members) ? members.map((m, i) => ({ ...m, role: i === 0 ? "Team Lead" : `Member ${i}` })) : [], teamId ?? null);
  res.json({ issues, message: issues.length ? issuesMessage(issues) : "OK" });
});

const Add_Team_Members = AsyncHandler(async (req, res) => {
  const { Teamdata, mentorEmail, mentorName } = req.body;
  const { id } = req.params;
  // a SPOC creates teams only under their own account
  if (req.user.ROLE !== "ADMIN" && String(req.user.ID) !== String(id)) {
    return res.status(403).json({ message: "You can only create teams for your own college" });
  }
  const teamName = clean(Teamdata?.teamName, 50);
  if (!teamName) return res.status(400).json({ message: "Enter a team name" });
  const members = await validateTeam(req, res, Teamdata?.members, null);
  if (!members) return;
  let teamId;
  try {
    teamId = await createTeam({ spocId: id, teamName, members, mentorName, mentorEmail });
  } catch {
    return res.status(500).json({ message: "The team could not be saved. Please try again." });
  }
  res.status(200).send(teamId);
});

const Update_team = AsyncHandler(async (req, res) => {
  const { team, id, mentorEmail, mentorName } = req.body;
  const existing = await loadTeamFor(req, res, id, { manage: true });
  if (!existing) return;
  const teamName = clean(team?.teamName, 50);
  if (!teamName) return res.status(400).json({ message: "Enter a team name" });
  const members = await validateTeam(req, res, team?.members, existing.ID);
  if (!members) return;
  const lead = members[0];
  const oldLead = String(existing.LEAD_EMAIL || "").trim().toLowerCase();
  const [oldMembers] = await connection.query("SELECT EMAIL FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [existing.ID]);
  const oldEmails = new Set(oldMembers.map((m) => String(m.EMAIL || "").trim().toLowerCase()));

  await connection.query(
    "UPDATE SolveForSakthi_Team_List SET NAME = ?, MENTOR_NAME = ?, MENTOR_EMAIL = ?, LEAD_EMAIL = ?, LEAD_PHONE = ? WHERE ID = ?",
    [teamName, clean(mentorName, 50), clean(mentorEmail, 50), lead.email, lead.phone, existing.ID]
  );
  // members can be added or removed, so the list is replaced (member rows are not referenced elsewhere)
  await connection.query("DELETE FROM SolveForSakthi_Team_Members_List WHERE Team_ID = ?", [existing.ID]);
  await insertMembers(existing.ID, existing.SPOC_ID, members);

  // a new team lead email becomes the team login: the login moves to it with a fresh password
  // (emailed to the new lead), and the team's submissions follow it
  if (oldLead && lead.email !== oldLead) {
    const [spocRows] = await connection.query("SELECT COLLEGE FROM SolveForSakthi_Users WHERE ID = ?", [existing.SPOC_ID]);
    await connection.query("DELETE FROM SolveForSakthi_Users WHERE EMAIL = ? AND ROLE = 'STUDENT'", [oldLead]);
    const password = await createLeadLogin({ email: lead.email, name: lead.name, college: spocRows[0]?.COLLEGE, teamId: existing.ID });
    await connection.query("UPDATE SolveForSakthi_Submissions SET TEAM_EMAIL = ? WHERE TEAM_EMAIL = ?", [lead.email, oldLead]);
    notifyTeamLogin({ email: lead.email, name: lead.name, teamName, password });
  } else {
    await connection.query("UPDATE SolveForSakthi_Users SET NAME = ? WHERE EMAIL = ? AND ROLE = 'STUDENT'", [lead.name, lead.email]);
  }

  const added = members.filter((m) => !oldEmails.has(m.email));
  if (added.length) welcomeMembers(added, teamName, lead.email);
  res.send("Updated");
});

export { Add_Team_Members, Update_team, Check_team_members };
