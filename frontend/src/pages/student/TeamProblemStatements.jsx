import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { URL } from "../../Utils";
import SubmissionStatus from "./SubmissionStatus";
import DeleteSubmissionButton from "../../components/DeleteSubmissionButton";
import Pagination, { usePagination } from "../../components/common/Pagination";
import ProblemDetailsFields from "../../components/ProblemDetailsFields";
import { normalizeStatus, statusMeta } from "../../submissionStatus";

const formatDate = (value) => (value ? String(value).split("T")[0] : "N/A");

const FILTERS = [
  ["all", "All challenges"],
  ["open", "Open"],
  ["mine", "Our solutions"],
];

// A challenge closed by the admins ("Concept Received") takes no new solutions
const ChallengeState = ({ problem }) => {
  if (problem.submission) return <SubmissionStatus submission={problem.submission} />;
  return problem.IS_CLOSED
    ? <span className="whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">Concept Received</span>
    : <span className="whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800">Open</span>;
};

// Every challenge published by the admins. A team submits a solution to any open challenge directly
// (one solution per challenge), until it has the maximum number of accepted concepts.
export default function TeamProblemStatements() {
  const navigate = useNavigate();
  const [data, setData] = useState({ team: null, problems: [], acceptedCount: 0, maxAccepted: 3, limitReached: false });
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    return axios
      .get(`${URL}/student/overview`)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the challenges. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = data.problems.filter((p) =>
    filter === "open" ? !p.IS_CLOSED : filter === "mine" ? Boolean(p.submission) : true
  );
  const { page, setPage, pageItems, total, totalPages } = usePagination(visible, { resetKey: filter });

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading challenges...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600 py-10">{error}</div>;
  }

  const actionFor = (p) => {
    if (!data.team) return null;
    const sub = p.submission;
    const status = sub ? normalizeStatus(sub.STATUS) : null;
    const changes = status === "CHANGES_REQUESTED";
    const final = status === "APPROVED" || status === "REJECTED";
    // a revision that was asked for can still come in after the challenge is closed
    const closed = p.IS_CLOSED && !changes;
    // the limit only stops NEW solutions; solutions already under way can be finished
    const limited = !sub && data.limitReached;
    const blocked = final || closed || limited;
    const label = final ? statusMeta(status).label
      : changes ? "Upload revised solution"
      : closed ? "Concept Received"
      : limited ? "Limit reached"
      : sub ? "Replace solution" : "Submit solution";
    return (
      <button
        disabled={blocked}
        onClick={() => navigate(`/student/submit-solution?problemId=${p.PROBLEM_ID}`)}
        title={limited ? `Your team already has ${data.maxAccepted} accepted concepts` : undefined}
        className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#fc9300] hover:bg-[#e08300] disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {label}
      </button>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Toaster position="top-right" />
      <div className="mb-4 text-center text-sm text-gray-600">
        {data.team ? (
          <>
            Team <span className="font-semibold text-gray-800">{data.team.NAME}</span>
            {data.team.COLLEGE ? <> · {data.team.COLLEGE}</> : null}
            {" "}· Submit a solution to any open challenge.
          </>
        ) : (
          "Your account is not linked to a team yet, so you can browse but not submit."
        )}
      </div>
      {data.team && (
        <div className={`mb-5 mx-auto max-w-2xl rounded-xl border px-4 py-3 text-sm text-center ${data.limitReached ? "border-green-300 bg-green-50 text-green-900" : "border-orange-200 bg-[#fff7ec] text-gray-700"}`}>
          <b>Concept accepted: {data.acceptedCount} of {data.maxAccepted}</b>
          {data.limitReached
            ? " · Your team reached the maximum, so you cannot start solutions for new challenges. Solutions already under review can still be finished."
            : ` · Once ${data.maxAccepted} of your solutions are accepted, your team cannot start new ones.`}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              filter === key ? "bg-[#fc9300] text-white border-[#fc9300]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          {filter === "mine"
            ? "Your team has not submitted a solution yet. Pick an open challenge from the full list."
            : filter === "open"
              ? "There are no open challenges right now."
              : "No challenges have been published yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pageItems.map((p) => {
            const sub = p.submission;
            const isOpen = expanded[p.PROBLEM_ID];
            return (
              <div key={p.PROBLEM_ID} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-bold text-[#fc9300]">SFS_{p.PROBLEM_ID}</span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-snug">{p.TITLE}</h3>
                  </div>
                  <ChallengeState problem={p} />
                </div>

                {p.DESCRIPTION && (
                  <div className="mb-3">
                    <p className={`text-sm text-gray-600 whitespace-pre-line ${isOpen ? "" : "line-clamp-3"}`}>{p.DESCRIPTION}</p>
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [p.PROBLEM_ID]: !isOpen }))}
                      className="mt-1 text-xs font-semibold text-[#fc9300] hover:underline"
                    >
                      {isOpen ? "Show less" : "Read full challenge"}
                    </button>
                    {isOpen && <ProblemDetailsFields problem={p} className="mt-3" />}
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {p.IS_CLOSED && (
                    <div className="text-xs font-semibold text-gray-600">Concept Received: this challenge takes no new solutions.</div>
                  )}
                  {(p.CATEGORY || p.DEPT) && (
                    <div>
                      {p.CATEGORY && <>Category: <span className="font-medium text-gray-800">{p.CATEGORY}</span></>}
                      {p.DEPT && <> · Dept: <span className="font-medium text-gray-800">{p.DEPT}</span></>}
                    </div>
                  )}
                  {sub && (
                    <div>
                      Your solution: <span className="font-medium text-gray-800">{sub.SOL_TITLE || "Untitled"}</span> ({formatDate(sub.SUB_DATE)})
                    </div>
                  )}
                  {sub && sub.EVAL_TOTAL != null && normalizeStatus(sub.STATUS) === "APPROVED" && (
                    <div>
                      Marks: <span className="font-semibold text-gray-900">{sub.EVAL_TOTAL} / 100</span>
                    </div>
                  )}
                  {sub && sub.EVALUATION_COMMENT && normalizeStatus(sub.STATUS) !== "PENDING" && (
                    <div className={`mt-2 rounded-md border-l-4 ${statusMeta(sub.STATUS).border} bg-gray-50 px-3 py-2`}>
                      <div className="text-xs font-semibold text-gray-700">Evaluator's comment</div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{sub.EVALUATION_COMMENT}</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  {actionFor(p)}
                  {sub && sub.STATUS === "PENDING" && (
                    <DeleteSubmissionButton
                      submissionId={sub.ID}
                      label="Delete submission"
                      className="!rounded-md"
                      confirmText="Delete your solution for this challenge? You can submit again while the challenge is open."
                      onDeleted={() => {
                        toast.success("Submission deleted");
                        load();
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="challenges" />
    </div>
  );
}
