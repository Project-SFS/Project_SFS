// Review states of a submission, shared by the admin, SPOC and team pages.
// ACCEPTED is the old marks-era result and shows as Approved.
export const SUBMISSION_STATUS = {
  PENDING: { label: "Awaiting review", cls: "bg-yellow-100 text-yellow-800", border: "border-yellow-300", text: "text-yellow-800" },
  CHANGES_REQUESTED: { label: "Changes needed", cls: "bg-orange-100 text-orange-800", border: "border-orange-300", text: "text-orange-800" },
  APPROVED: { label: "Approved", cls: "bg-green-100 text-green-800", border: "border-green-300", text: "text-green-800" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-800", border: "border-red-300", text: "text-red-800" },
};

export const normalizeStatus = (status) => {
  const s = String(status || "PENDING").toUpperCase();
  return s === "ACCEPTED" ? "APPROVED" : SUBMISSION_STATUS[s] ? s : "PENDING";
};

export const statusMeta = (status) => SUBMISSION_STATUS[normalizeStatus(status)];

// the team can (re)upload while it waits for a review or after changes were requested
export const teamCanEdit = (status) => ["PENDING", "CHANGES_REQUESTED"].includes(normalizeStatus(status));

// reviewed at least once and not waiting for a review again
export const isReviewed = (status) => normalizeStatus(status) !== "PENDING";

export const StatusBadge = ({ status, className = "" }) => {
  const meta = statusMeta(status);
  return (
    <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
};

// External evaluation: 5 criteria x 20 = 100 (same as backend utils/review.js)
export const EVAL_CRITERIA = [
  { key: "understanding", column: "EVAL_UNDERSTANDING", label: "Understanding of Problem Statement", hint: "Clarity of the problem, objectives, requirements, scope, and understanding of the real-world problem", max: 20 },
  { key: "solution", column: "EVAL_SOLUTION", label: "Proposed Solution & Innovation", hint: "Relevance, originality, creativity, effectiveness, and suitability of the proposed solution", max: 20 },
  { key: "tools", column: "EVAL_TOOLS", label: "Tools & Technologies Used", hint: "Appropriateness of technologies, tools, frameworks, architecture, and justification for their selection", max: 20 },
  { key: "presentation", column: "EVAL_PRESENTATION", label: "PPT & Presentation", hint: "Quality and structure of PPT, clarity of explanation, communication skills, technical presentation, and ability to answer questions", max: 20 },
  { key: "acceptance", column: "EVAL_ACCEPTANCE", label: "Industry / Intra-Department Acceptance", hint: "Acceptance by industry/intra-department, stakeholder feedback, practical relevance, usefulness, and potential for actual adoption", max: 20 },
];
export const EVAL_TOTAL_MAX = 100;

// Marks per criterion and the total, from a row with EVAL_* columns; nothing when no marks were given
export const MarksBreakdown = ({ row, className = "" }) => {
  if (!row || row.EVAL_TOTAL == null) return null;
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden text-sm ${className}`}>
      {EVAL_CRITERIA.map((c) => (
        <div key={c.key} className="flex justify-between gap-3 px-4 py-2 border-b border-gray-100">
          <span className="text-gray-600">{c.label}</span>
          <span className="font-medium text-gray-900 shrink-0">{row[c.column] ?? 0} / {c.max}</span>
        </div>
      ))}
      <div className="flex justify-between px-4 py-2.5 bg-[#fff7ec] font-semibold">
        <span>Total</span>
        <span className="text-[#fc9300]">{row.EVAL_TOTAL} / {EVAL_TOTAL_MAX}</span>
      </div>
    </div>
  );
};
