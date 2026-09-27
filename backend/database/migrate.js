import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { hashSync } from "bcrypt"
import connection from "./mysql.js"

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../schema/mysql_schema.sql")

const seedDatabase = async () => {
    const password = hashSync(process.env.MOCK_PASSWORD || "Password@123", 10)
    const today = new Date()
    const dateOnly = (offsetDays = 0) => {
        const date = new Date(today)
        date.setDate(date.getDate() + offsetDays)
        return date.toISOString().slice(0, 10)
    }

    const users = [
        ["eval1@sakthi.com", "EVALUATOR", "Evaluator One", null, null, "123-456-7890"],
        ["eval2@sakthi.com", "EVALUATOR", "Evaluator Two", null, null, "987-654-3210"],
        ["spoc1@collegea.edu", "SPOC", "College A SPOC", "College A", "c1", null],
        ["team1@collegea.edu", "TEAM", "Innovators Lead", "College A", null, null],
        ["spoc2@collegeb.edu", "SPOC", "College B SPOC", "College B", "c2", "555-0106"],
        ["spoc3@collegec.edu", "SPOC", "College C SPOC", "College C", "c3", "555-0107"],
        ...Array.from({ length: 10 }, (_, index) => [
            `student${index + 1}@college${index % 3 + 1}.edu`,
            "STUDENT",
            `Student ${index + 1}`,
            `College ${String.fromCharCode(65 + index % 3)}`,
            null,
            `555-01${String(index + 10).slice(-2)}`,
        ]),
    ]

    const userIds = {}
    for (const [email, role, name, college, collegeCode, phone] of users) {
        const [existing] = await connection.query("SELECT ID FROM Users WHERE EMAIL = ? LIMIT 1", [email])
        if (existing.length === 0) {
            await connection.query(
                "INSERT INTO Users (EMAIL, PASSWORD, ROLE, COLLEGE, COLLEGE_CODE, NAME, PHONE, STATUS, DATE) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)",
                [email, password, role, college, collegeCode, name, phone, dateOnly()]
            )
        }
        const [saved] = await connection.query("SELECT ID FROM Users WHERE EMAIL = ? LIMIT 1", [email])
        userIds[email] = saved[0].ID
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@sakthi.com"
    const [admin] = await connection.query("SELECT ID FROM Users WHERE EMAIL = ? LIMIT 1", [adminEmail])
    userIds[adminEmail] = admin[0]?.ID

    const colleges = [
        ["c1", "College A", userIds["spoc1@collegea.edu"], "Verified"],
        ["c2", "College B", userIds["spoc2@collegeb.edu"], "Verified"],
        ["c3", "College C", userIds["spoc3@collegec.edu"], "Pending"],
    ]
    for (const college of colleges) {
        await connection.query(
            "INSERT INTO Colleges (ID, NAME, SPOC_ID, STATUS) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE NAME = VALUES(NAME), SPOC_ID = VALUES(SPOC_ID), STATUS = VALUES(STATUS)",
            college
        )
    }

    const requests = [
        ["req1", "College C", "reqspoc@collegec.edu", dateOnly(-5), "Pending"],
        ["req2", "College D", "reqspoc2@colleged.edu", dateOnly(-2), "Pending"],
    ]
    for (const request of requests) {
        await connection.query(
            "INSERT INTO Spoc_Requests (ID, COLLEGE_NAME, EMAIL, DATE_REQUESTED, STATUS) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE COLLEGE_NAME = VALUES(COLLEGE_NAME), EMAIL = VALUES(EMAIL), DATE_REQUESTED = VALUES(DATE_REQUESTED), STATUS = VALUES(STATUS)",
            request
        )
    }

    const problemSeeds = [
        ["Optimizing CNC Machining Efficiency", "Develop a machine learning model to predict and minimize tool wear.", "Software", 30, ["eval1@sakthi.com", "eval2@sakthi.com"]],
        ["Supply Chain Risk Assessment Dashboard", "Create a web-based dashboard for visualizing and assessing material supplier risks.", "Data", 60, ["eval2@sakthi.com"]],
        ["AI-Powered Crop Disease Detection", "Build a mobile-friendly image classification service that helps farmers identify common crop diseases.", "Software", 45, ["eval1@sakthi.com"]],
        ["Smart Campus Energy Monitoring", "Design an IoT-based system to monitor building energy use and identify waste.", "Hardware", 35, ["eval2@sakthi.com"]],
        ["Accessible Learning Content Platform", "Create a learning platform that converts course materials into accessible formats.", "Software", 50, ["eval1@sakthi.com", "eval2@sakthi.com"]],
        ["Public Transport Route Optimizer", "Use ridership and traffic data to recommend efficient public transport routes.", "Data", 28, ["eval2@sakthi.com"]],
        ["Community Water Quality Sensor", "Prototype a low-cost water quality monitoring device with clear alerts.", "Hardware", 40, ["eval1@sakthi.com"]],
        ["Local Language Citizen Services Assistant", "Develop a multilingual assistant for public services and eligibility guidance.", "Software", 55, ["eval1@sakthi.com", "eval2@sakthi.com"]],
        ["Food Waste Tracking for Institutional Kitchens", "Build a tracking and analytics solution that measures institutional food waste.", "Data", 32, ["eval2@sakthi.com"]],
        ["Emergency Resource Coordination Dashboard", "Create a real-time dashboard for emergency supplies, shelters, and volunteers.", "Software", 25, ["eval1@sakthi.com"]],
    ]
    const problemIds = {}
    for (const [title, description, category, deadlineOffset, evaluatorEmails] of problemSeeds) {
        const [existing] = await connection.query("SELECT ID FROM problems WHERE TITLE = ? LIMIT 1", [title])
        let problemId = existing[0]?.ID
        if (!problemId) {
            const [result] = await connection.query(
                "INSERT INTO problems (TITLE, DESCRIPTION, SUB_DEADLINE, CATEGORY, DEPT, Reference, Evaluator_ID) VALUES (?, ?, ?, ?, 'CSE', ?, ?)",
                [title, description, dateOnly(deadlineOffset), category, null, userIds[evaluatorEmails[0]]]
            )
            problemId = result.insertId
        }
        problemIds[title] = problemId
        for (const email of evaluatorEmails) {
            await connection.query(
                "INSERT INTO problem_evaluators (PROBLEM_ID, EVALUATOR_ID) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM problem_evaluators WHERE PROBLEM_ID = ? AND EVALUATOR_ID = ?)",
                [problemId, userIds[email], problemId, userIds[email]]
            )
        }
    }

    const teams = [
        ["Innovators", userIds["spoc1@collegea.edu"], "team1@collegea.edu", "555-0201", "Mentor One", "mentor1@collegea.edu"],
        ["Tech Wizards", userIds["spoc2@collegeb.edu"], "student2@college2.edu", "555-0202", "Mentor Two", "mentor2@collegeb.edu"],
        ["Data Masters", userIds["spoc2@collegeb.edu"], "student3@college3.edu", "555-0203", "Mentor Three", "mentor3@collegeb.edu"],
        ["Health Innovators", userIds["spoc1@collegea.edu"], "student4@college1.edu", "555-0204", "Mentor Four", "mentor4@collegea.edu"],
        ["Northeast Solutions", userIds["spoc3@collegec.edu"], "student5@college2.edu", "555-0205", "Mentor Five", "mentor5@collegec.edu"],
    ]
    const teamIds = {}
    for (const team of teams) {
        const [existing] = await connection.query("SELECT ID FROM Team_List WHERE NAME = ? LIMIT 1", [team[0]])
        let teamId = existing[0]?.ID
        if (!teamId) {
            const [result] = await connection.query(
                "INSERT INTO Team_List (NAME, SPOC_ID, LEAD_EMAIL, LEAD_PHONE, MENTOR_NAME, MENTOR_EMAIL) VALUES (?, ?, ?, ?, ?, ?)",
                team
            )
            teamId = result.insertId
        }
        teamIds[team[0]] = teamId
    }

    for (let index = 1; index <= 10; index += 1) {
        const email = `student${index}@college${(index - 1) % 3 + 1}.edu`
        const teamName = teams[(index - 1) % teams.length][0]
        const [existing] = await connection.query("SELECT ID FROM Team_Members_List WHERE EMAIL = ? LIMIT 1", [email])
        if (existing.length === 0) {
            await connection.query(
                "INSERT INTO Team_Members_List (NAME, SPOC_ID, EMAIL, PHONE, GENDER, ROLE, Team_ID) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [`Student ${index}`, teams[(index - 1) % teams.length][1], email, `555-01${String(index + 10).slice(-2)}`, index % 2 ? "Female" : "Male", "Member", teamIds[teamName]]
            )
        }
    }

    const submissions = [
        ["Optimizing CNC Machining Efficiency", "Innovators", "Submitted", "Smart Community Health Monitoring", "A comprehensive system for monitoring water quality.", 2, null],
        ["Optimizing CNC Machining Efficiency", "Tech Wizards", "Evaluated", "Smart Community Health Monitoring", "IoT-based solution for real-time water quality monitoring.", 5, 85],
        ["Supply Chain Risk Assessment Dashboard", "Data Masters", "Evaluated", "Supply Chain Risk Assessment Dashboard Implementation", "Interactive dashboard for visualizing supply chain risks.", 3, 92],
        ["Optimizing CNC Machining Efficiency", "Health Innovators", "Submitted", "Smart Community Health Monitoring", "Machine learning approach to predict water-borne diseases.", 1, null],
        ["Optimizing CNC Machining Efficiency", "Northeast Solutions", "Evaluated", "Smart Community Health Monitoring", "Community-focused health monitoring system.", 7, 78],
    ]
    for (const [problemTitle, teamName, status, title, description, daysAgo, mark] of submissions) {
        const teamId = teamIds[teamName]
        const leadEmail = teams.find((team) => team[0] === teamName)[2]
        const [existing] = await connection.query("SELECT ID FROM submissions WHERE PROBLEM_ID = ? AND TEAM_ID = ? LIMIT 1", [problemIds[problemTitle], teamId])
        if (existing.length === 0) {
            await connection.query(
                "INSERT INTO submissions (PROBLEM_ID, TEAM_ID, TEAM_EMAIL, SOL_TITLE, SOL_DESCRIPTION, SUB_DATE, STATUS, SOL_LINK, FILES, MARK) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [problemIds[problemTitle], teamId, leadEmail, title, description, dateOnly(-daysAgo), status.toUpperCase(), "/sample.pdf", "report.pdf,code.zip,presentation.pptx", mark]
            )
        }
    }
}

// Creates any missing tables, then makes sure an ADMIN user exists.
// Safe to run on every start: tables use IF NOT EXISTS and the admin is only inserted once.
const migrate = async () => {
    const statements = fs.readFileSync(schemaPath, "utf8")
        .replace(/--.*$/gm, "")
        .split(";")
        .map(s => s.trim())
        // the pool is already connected to DB_NAME, so skip database-level statements
        .filter(s => s && !/^(CREATE DATABASE|USE)\b/i.test(s))

    for (const statement of statements) {
        await connection.query(statement)
    }

    const email = process.env.ADMIN_EMAIL || "admin@sakthi.com"
    const password = process.env.ADMIN_PASSWORD || "Admin@123"

    const [admins] = await connection.query("SELECT ID FROM Users WHERE ROLE = 'ADMIN' LIMIT 1")
    if (admins.length === 0) {
        await connection.query(
            "INSERT INTO Users (EMAIL, PASSWORD, ROLE, NAME, STATUS, DATE) VALUES (?, ?, 'ADMIN', 'Admin', 'ACTIVE', ?)",
            [email, hashSync(password, 10), new Date().toISOString().split("T")[0]]
        )
        console.log(`Default admin created: ${email}`)
    }

    await seedDatabase()

    console.log("Database migration complete")
}

export default migrate
