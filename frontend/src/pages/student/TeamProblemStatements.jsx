import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { URL } from "../../Utils";
import SubmissionStatus from "./SubmissionStatus";
import DeleteSubmissionButton from "../../components/DeleteSubmissionButton";

const formatDate = (value) => (value ? String(value).split("T")[0] : "N/A");

const FILTERS = [
  ["all", "All problem statements"],
  ["assigned", "Our team's problems"],
  ["requested", "Requested"],
];

// Badge for where the team stands with a problem: not requested / requested / rejected / assigned (+ submission)
const TeamState = ({ problem }) => {
  if (problem.ASSIGNMENT_STATUS === "ASSIGNED") return <SubmissionStatus submission={problem.submission} />;
  const styles = {
    REQUESTED: ["bg-blue-100 text-blue-800", "Requested"],
    REJECTED: ["bg-red-100 text-red-800", "Request declined"],
  };
  const [cls, label] = styles[problem.ASSIGNMENT_STATUS] || ["bg-gray-100 text-gray-600", "Not requested"];
  return <span className={`whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
};

// Every problem statement published by the admins. The team requests one from its SPOC,
// and once the SPOC approves it the team can submit a solution.
export default function TeamProblemStatements() {
  const navigate = useNavigate();
  const [data, setData] = useState({ team: null, problems: [] });
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    return axios
      .get(`${URL}/student/overview`)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the problem statements. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (path, problemId, successMessage) => {
    setBusy(true);
    try {
      await axios.post(`${URL}/student/${path}`, { problemId });
      toast.success(successMessage);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong, please try again");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading problem statements...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600 py-10">{error}</div>;
  }

  const visible = data.problems.filter((p) =>
    filter === "assigned" ? p.ASSIGNMENT_STATUS === "ASSIGNED" : filter === "requested" ? p.ASSIGNMENT_STATUS === "REQUESTED" : true
  );

  const actionFor = (p) => {
    const sub = p.submission;
    if (p.ASSIGNMENT_STATUS === "ASSIGNED") {
      const evaluated = sub && sub.STATUS !== "PENDING";
      const label = evaluated ? "Evaluated" : p.DEADLINE_PASSED ? "Deadline passed" : sub ? "Replace submission" : "Submit solution";
      return (
        <button
          disabled={evaluated || p.DEADLINE_PASSED}
          onClick={() => navigate(`/student/submit-solution?problemId=${p.PROBLEM_ID}`)}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#fc9300] hover:bg-[#e08300] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {label}
        </button>
      );
    }
    if (!data.team) return null;
    if (p.ASSIGNMENT_STATUS === "REQUESTED") {
      return (
        <button
          disabled={busy}
          onClick={() => act("cancel_request", p.PROBLEM_ID, "Request cancelled")}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel request
        </button>
      );
    }
    return (
      <button
        disabled={busy || p.DEADLINE_PASSED}
        onClick={() => act("request_problem", p.PROBLEM_ID, "Request sent to your SPOC")}
        className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#494949] hover:bg-[#333333] disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {p.DEADLINE_PASSED ? "Deadline passed" : p.ASSIGNMENT_STATUS === "REJECTED" ? "Request again" : "Request from SPOC"}
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
            {" "}· Request a problem statement from your SPOC; once approved you can submit a solution.
          </>
        ) : (
          "Your account is not linked to a team yet, so you can browse but not request problem statements."
        )}
      </div>

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
          {filter === "assigned"
            ? "No problem statements are assigned to your team yet. Request one from the full list."
            : filter === "requested"
              ? "You have no pending requests."
              : "No problem statements have been published yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((p) => {
            const sub = p.submission;
            const isOpen = expanded[p.PROBLEM_ID];
            return (
              <div key={p.PROBLEM_ID} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-bold text-[#fc9300]">SFS_{p.PROBLEM_ID}</span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-snug">{p.TITLE}</h3>
                  </div>
                  <TeamState problem={p} />
                </div>

                {p.DESCRIPTION && (
                  <div className="mb-3">
                    <p className={`text-sm text-gray-600 whitespace-pre-line ${isOpen ? "" : "line-clamp-3"}`}>{p.DESCRIPTION}</p>
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [p.PROBLEM_ID]: !isOpen }))}
                      className="mt-1 text-xs font-semibold text-[#fc9300] hover:underline"
                    >
                      {isOpen ? "Show less" : "Read full problem statement"}
                    </button>
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <div>
                    Deadline: <span className="font-medium text-gray-800">{formatDate(p.SUB_DEADLINE)}</span>
                    {p.DEADLINE_PASSED && <span className="ml-2 text-xs font-semibold text-red-600">Closed</span>}
                  </div>
                  {(p.CATEGORY || p.DEPT) && (
                    <div>
                      {p.CATEGORY && <>Category: <span className="font-medium text-gray-800">{p.CATEGORY}</span></>}
                      {p.DEPT && <> · Dept: <span className="font-medium text-gray-800">{p.DEPT}</span></>}
                    </div>
                  )}
                  {p.ASSIGNMENT_STATUS === "REQUESTED" && p.REQUESTED_DATE && (
                    <div>Requested on {formatDate(p.REQUESTED_DATE)}, waiting for your SPOC.</div>
                  )}
                  {sub && (
                    <div>
                      Your solution: <span className="font-medium text-gray-800">{sub.SOL_TITLE || "Untitled"}</span> ({formatDate(sub.SUB_DATE)})
                    </div>
                  )}
                  {sub && sub.STATUS !== "PENDING" && (
                    <div>
                      Score: <span className="font-semibold text-gray-900">{sub.MARK ?? 0} / 100</span>
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
                      confirmText="Delete your submission for this problem? You can submit again before the deadline."
                      onDeleted={() => {
                        toast.success("Submission deleted");
                        load();
                      }}
                    />
                  )}
                  {p.Reference && (
                    <a
                      href={p.Reference}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                    >
                      Reference
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
