import ExcelJS from "exceljs";
import multer from "multer";
import connection from "../database/db.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import { notifyProblemsPublished } from "../utils/notifications.js";

// Excel import of problem statements. The sheet always follows this template (first row = headers):
//   S.No | Problem Title | Problem Description | Domain | Expected Outcomes | Requirements | Technology
// Any other column (e.g. an old "Upload Document" column) is ignored.
// The deadline and category are chosen once in the import form and apply to every row.

export const TEMPLATE_COLUMNS = [
    { key: "sno", header: "S.No", width: 8 },
    { key: "title", header: "Problem Title", width: 40 },
    { key: "description", header: "Problem Description", width: 60 },
    { key: "domain", header: "Domain", width: 22 },
    { key: "outcomes", header: "Expected Outcomes", width: 45 },
    { key: "requirements", header: "Requirements", width: 45 },
    { key: "technology", header: "Technology", width: 28 },
];

const CATEGORIES = ["software", "hardware"];
const MAX_ROWS = 500;
const LIMITS = { title: 300, domain: 200, technology: 500 };

// header text -> column key; tolerant to spacing, case, dots and small wording changes
const normalize = (text) => String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const headerKey = (text) => {
    const h = normalize(text);
    if (!h) return null;
    if (["sno", "slno", "serialno", "serialnumber", "no", "sn"].includes(h)) return "sno";
    if (h.includes("title")) return "title";
    if (h.includes("description")) return "description";
    if (h.includes("domain")) return "domain";
    if (h.includes("outcome")) return "outcomes";
    if (h.includes("requirement")) return "requirements";
    if (h.includes("technolog") || h.includes("techstack")) return "technology";
    return null;
};

// plain text of any Excel cell value (rich text, hyperlink, formula result, date, number)
const cellText = (value) => {
    if (value == null) return "";
    if (value instanceof Date) return value.toISOString().split("T")[0];
    if (typeof value === "object") {
        if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
        if (value.text != null) return cellText(value.text);
        if (value.result != null) return cellText(value.result);
        if (value.hyperlink) return String(value.hyperlink);
        return "";
    }
    return String(value);
};
const clean = (text) => text.replace(/\r\n/g, "\n").trim();

// Reads the uploaded workbook into { rows } or { error }
const readSheet = async (buffer) => {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(buffer);
    } catch {
        return { error: "This file could not be read. Upload the template as an Excel .xlsx file (File → Save As → Excel Workbook)." };
    }

    // first sheet that has the template's header row within its first 15 rows
    for (const sheet of workbook.worksheets) {
        for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
            const columns = {};
            sheet.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
                const key = headerKey(cellText(cell.value));
                if (key && !columns[key]) columns[key] = col;
            });
            if (!columns.title || !columns.description) continue;

            const rows = [];
            for (let i = r + 1; i <= sheet.rowCount; i++) {
                const row = sheet.getRow(i);
                const get = (key) => (columns[key] ? row.getCell(columns[key]).value : null);
                const entry = { row: i };
                for (const { key } of TEMPLATE_COLUMNS) entry[key] = clean(cellText(get(key)));
                if (TEMPLATE_COLUMNS.some(({ key }) => key !== "sno" && entry[key])) rows.push(entry);
            }
            return { rows, sheetName: sheet.name };
        }
    }
    return { error: `No template header row found. The first row must be: ${TEMPLATE_COLUMNS.map((c) => c.header).join(", ")}.` };
};

// Checks every row; status: ready | error / duplicate (skipped)
const validateRows = async (rows) => {
    const [existing] = await connection.query("SELECT TITLE FROM SolveForSakthi_Problems");
    const taken = new Set(existing.map((p) => normalize(p.TITLE)));
    const seen = new Map(); // normalized title -> first row number in this file

    return rows.map((r) => {
        const errors = [];
        if (!r.title) errors.push("Problem Title is empty");
        else if (r.title.length > LIMITS.title) errors.push(`Problem Title is longer than ${LIMITS.title} characters`);
        if (!r.description) errors.push("Problem Description is empty");
        if (r.domain.length > LIMITS.domain) errors.push(`Domain is longer than ${LIMITS.domain} characters`);
        if (r.technology.length > LIMITS.technology) errors.push(`Technology is longer than ${LIMITS.technology} characters`);

        let status = errors.length ? "error" : "ready";
        const key = normalize(r.title);
        if (key && status !== "error") {
            if (taken.has(key)) {
                status = "duplicate";
                errors.push("A problem statement with this title already exists");
            } else if (seen.has(key)) {
                status = "duplicate";
                errors.push(`Same title as row ${seen.get(key)} in this file`);
            }
        }
        if (key && !seen.has(key)) seen.set(key, r.row);
        return { ...r, status, messages: errors };
    });
};

// One problem statement; shared by the manual form and the import so both store the same fields
export const insertProblem = async (p, userId) => {
    const [result] = await connection.query(
        `INSERT INTO SolveForSakthi_Problems
            (TITLE, DESCRIPTION, SUB_DEADLINE, CATEGORY, DEPT, DOMAIN, EXPECTED_OUTCOMES, REQUIREMENTS, TECHNOLOGY, CREATED_BY, CREATED_AT)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME())`,
        [
            p.title, p.description, p.deadline, p.category,
            // the older "department" column feeds the public list's Theme/Department column
            (p.domain || "CSE").slice(0, 50),
            p.domain || null, p.outcomes || null, p.requirements || null, p.technology || null, userId,
        ]
    );
    return result.insertId;
};

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (/\.xlsx$/i.test(file.originalname)) return cb(null, true);
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only Excel .xlsx files can be imported"));
    },
}).single("file");

// POST /admin/problems/import (multipart: file, deadline, category, dryRun)
//   dryRun=true  -> only checks the file and returns every row with its status (nothing is saved)
//   dryRun=false -> also adds the ready rows as problem statements
const Import_problems = AsyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Choose the filled-in Excel template (.xlsx) to import" });
    }
    const deadline = String(req.body.deadline || "").trim();
    const category = String(req.body.category || "").trim().toLowerCase();
    const dryRun = String(req.body.dryRun) !== "false";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(new Date(deadline).getTime())) {
        return res.status(400).json({ message: "Choose a submission deadline for the imported problem statements" });
    }
    if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Choose a category (Software or Hardware)" });
    }

    const parsed = await readSheet(req.file.buffer);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (parsed.rows.length === 0) return res.status(400).json({ message: "The file has the template headers but no problem statements below them" });
    if (parsed.rows.length > MAX_ROWS) return res.status(400).json({ message: `The file has ${parsed.rows.length} rows; import at most ${MAX_ROWS} at a time` });

    const rows = await validateRows(parsed.rows);
    const importable = rows.filter((r) => r.status === "ready");
    const summary = {
        total: rows.length,
        ready: importable.length,
        duplicates: rows.filter((r) => r.status === "duplicate").length,
        errors: rows.filter((r) => r.status === "error").length,
    };

    if (dryRun) return res.json({ dryRun: true, sheet: parsed.sheetName, summary, rows });

    const created = [];
    for (const r of importable) {
        const id = await insertProblem({ ...r, deadline, category }, req.user.ID);
        created.push({ id, title: r.title, row: r.row });
    }
    if (created.length) notifyProblemsPublished(created.map((c) => c.title));
    res.status(201).json({ dryRun: false, summary: { ...summary, imported: created.length }, created, rows });
});

// GET /admin/problems/import/template: the empty template with an instructions sheet
const Problem_import_template = AsyncHandler(async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Solve For Sakthi";
    const sheet = workbook.addWorksheet("Problem Statements", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = TEMPLATE_COLUMNS.map(({ key, header, width }) => ({ key, header, width }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFC9300" } };
    header.alignment = { vertical: "middle", wrapText: true };
    header.height = 28;
    for (let r = 2; r <= 200; r++) sheet.getRow(r).alignment = { vertical: "top", wrapText: true };

    const help = workbook.addWorksheet("Instructions");
    help.columns = [{ width: 28 }, { width: 90 }];
    [
        ["How to fill this template", ""],
        ["", "Add one problem statement per row in the \"Problem Statements\" sheet. Keep the header row unchanged."],
        ["S.No", "Optional running number (1, 2, 3...)."],
        ["Problem Title", "Required. Up to 300 characters. Titles must be unique: rows whose title already exists are skipped."],
        ["Problem Description", "Required. The full problem statement."],
        ["Domain", "Optional. e.g. Automotive, Manufacturing, Energy."],
        ["Expected Outcomes", "Optional. What a good solution should deliver."],
        ["Requirements", "Optional. Constraints, data or skills needed."],
        ["Technology", "Optional. e.g. IoT, Machine Learning, Embedded C."],
        ["", ""],
        ["Deadline and category", "Chosen in the admin panel when importing; they apply to every row of the file."],
        ["Example row", "1 | Smart energy monitoring | Monitor energy use per machine... | Manufacturing | Live dashboard... | Sensor data access | IoT"],
    ].forEach((row, i) => {
        const added = help.addRow(row);
        added.alignment = { vertical: "top", wrapText: true };
        if (i === 0) added.font = { bold: true, size: 14 };
        else added.getCell(1).font = { bold: true };
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="problem-statements-template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
});

export { Import_problems, Problem_import_template, memoryUpload };
