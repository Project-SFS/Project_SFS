// Submission review states. A team can (re)upload while its submission is PENDING or CHANGES_REQUESTED;
// a revised upload goes back to PENDING. APPROVED and REJECTED are final for the team (an admin can still
// change the decision).
export const PENDING = "PENDING"
export const CHANGES_REQUESTED = "CHANGES_REQUESTED"
export const APPROVED = "APPROVED"
export const REJECTED = "REJECTED"

export const DECISIONS = [CHANGES_REQUESTED, APPROVED, REJECTED]
export const DECISION_LABELS = { [PENDING]: "Awaiting review", [CHANGES_REQUESTED]: "Changes needed", [APPROVED]: "Approved", [REJECTED]: "Rejected" }

export const canTeamEdit = (status) => status === PENDING || status === CHANGES_REQUESTED

// Message for a team that tries to change a submission it can no longer change
export const lockedMessage = (status) =>
    status === APPROVED ? "Your solution was approved and can no longer be changed"
        : "Your solution was rejected and can no longer be changed"

// Deadline / problem check for an upload. A team asked for changes may still send its revision after the
// deadline; a missing problem always blocks.
export const uploadClosedReason = (closedReason, previous) =>
    closedReason && !(previous?.STATUS === CHANGES_REQUESTED && closedReason !== "Problem not found") ? closedReason : null

// External evaluation: 5 criteria, 20 marks each (100). key = request field, column = database column.
export const CRITERIA = [
    { key: "understanding", column: "EVAL_UNDERSTANDING", label: "Understanding of Problem Statement", max: 20 },
    { key: "solution", column: "EVAL_SOLUTION", label: "Proposed Solution & Innovation", max: 20 },
    { key: "tools", column: "EVAL_TOOLS", label: "Tools & Technologies Used", max: 20 },
    { key: "presentation", column: "EVAL_PRESENTATION", label: "PPT & Presentation", max: 20 },
    { key: "acceptance", column: "EVAL_ACCEPTANCE", label: "Industry / Intra-Department Acceptance", max: 20 },
]
export const MARKS_TOTAL = CRITERIA.reduce((sum, c) => sum + c.max, 0)

// Reads the marks from a request body: { marks } with all five whole numbers, null when none are given,
// or { error } when only some are given or one is out of range
export const parseMarks = (input) => {
    const values = CRITERIA.map((c) => input?.[c.key])
    if (values.every((v) => v === undefined || v === null || v === "")) return { marks: null }
    const marks = {}
    for (const [i, c] of CRITERIA.entries()) {
        const n = Number(values[i])
        if (values[i] === undefined || values[i] === null || values[i] === "" || !Number.isInteger(n) || n < 0 || n > c.max) {
            return { error: `Give "${c.label}" a whole number from 0 to ${c.max}` }
        }
        marks[c.column] = n
    }
    marks.EVAL_TOTAL = CRITERIA.reduce((sum, c) => sum + marks[c.column], 0)
    return { marks }
}
