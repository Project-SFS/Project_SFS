import { useCallback, useEffect, useState } from "react";
import { FileLinks } from "../../submissionFiles";
import axios from "axios";
import toast from "react-hot-toast";
import { URL } from "../../Utils";
import SubmissionStatus from "../student/SubmissionStatus";
import Pagination, { usePagination } from "../../components/common/Pagination";

const formatDate = (value) => (value ? String(value).split("T")[0] : "—");
const todayStr = () => new Date().toLocaleDateString("en-CA");

// SPOC view: assign problem statements to teams and follow every team's submissions and reviews
export default function TeamProgress() {
  const [teams, setTeams] = useState([]);
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState({}); // teamId -> problemId chosen in the assign dropdown
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [progressRes, problemsRes] = await Promise.all([
        axios.get(`${URL}/spoc/progress`),
        axios.get(`${URL}/get_problems`),
      ]);
      setTeams(progressRes.data.teams || []);
      setProblems(problemsRes.data.problems || []);
    } catch {
      toast.error("Could not load team progress");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // assign from the dropdown, or approve a team's request (same endpoint)
  const assign = async (teamId, problemId = selected[teamId], approving = false) => {
    if (!problemId) return;
    setBusy(true);
    try {
      await axios.post(`${URL}/spoc/assign_problem`, { teamId, problemId });
      toast.success(approving ? "Request approved. The team lead has been notified." : "Problem assigned. The team lead has been notified by email.");
      if (!approving) setSelected((prev) => ({ ...prev, [teamId]: "" }));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not assign the problem");
    } finally {
      setBusy(false);
    }
  };

  const reject = async (teamId, problemId) => {
    setBusy(true);
    try {
      await axios.post(`${URL}/spoc/reject_request`, { teamId, problemId });
      toast.success("Request rejected. The team lead has been notified.");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reject the request");
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (teamId, problemId) => {
    if (!window.confirm("Remove this problem statement from the team?")) return;
    setBusy(true);
    try {
      await axios.post(`${URL}/spoc/unassign_problem`, { teamId, problemId });
      toast.success("Problem unassigned");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not unassign the problem");
    } finally {
      setBusy(false);
    }
  };

  const { page, setPage, pageItems, total, totalPages } = usePagination(teams);

  if (loading) {
    return <div className="text-gray-500">Loading team progress...</div>;
  }

  const allAssignments = teams.flatMap((t) => t.problems).filter((p) => p.ASSIGNMENT_STATUS === "ASSIGNED");
  const pendingRequests = teams.flatMap((t) => t.problems).filter((p) => p.ASSIGNMENT_STATUS === "REQUESTED").length;
  const stats = [
    ["Teams", teams.length],
    ["Pending requests", pendingRequests],
    ["Problems assigned", allAssignments.length],
    ["Solutions submitted", allAssignments.filter((p) => p.submission).length],
    ["Evaluated", allAssignments.filter((p) => p.submission && p.submission.STATUS !== "PENDING").length],
  ];
  const isClosed = (p) => Boolean(p.SUB_DEADLINE) && String(p.SUB_DEADLINE).split("T")[0] < todayStr();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Team Progress</h1>
      <p className="text-gray-600 mb-6">
        Approve your teams' problem statement requests (or assign one directly) and follow their submissions and scores.
        A team can work on several problem statements, and the same problem statement can go to several teams. You are
        emailed when a team sends a request; team leads are emailed when you approve or reject it and when their solution
        is evaluated (you are copied on the result).
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-3xl font-bold text-[#fc8f00]">{value}</div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow text-gray-600">
          You have no teams yet. Create one under "Team Details".
        </div>
      )}

      <div className="space-y-6">
        {pageItems.map((team) => {
          const assigned = team.problems.filter((p) => p.ASSIGNMENT_STATUS === "ASSIGNED");
          const requests = team.problems.filter((p) => p.ASSIGNMENT_STATUS === "REQUESTED");
          // already assigned or requested problems are handled above; closed ones are listed but disabled
          const takenIds = new Set([...assigned, ...requests].map((p) => String(p.PROBLEM_ID)));
          const assignable = problems.filter((p) => !takenIds.has(String(p.ID)));
          const openCount = assignable.filter((p) => !isClosed(p)).length;
          return (
            <div key={team.ID} className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{team.NAME}</h2>
                  <p className="text-sm text-gray-600">
                    Lead: {team.LEAD_EMAIL || "—"} {team.LEAD_PHONE ? `· ${team.LEAD_PHONE}` : ""} · {team.MEMBER_COUNT} member(s)
                    {team.MENTOR_NAME ? ` · Mentor: ${team.MENTOR_NAME}` : ""}
                  </p>
                </div>
              </div>

              {requests.length > 0 && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                  <div className="text-sm font-semibold text-blue-900 mb-2">Requests from this team</div>
                  {requests.map((p) => (
                    <div key={p.PROBLEM_ID} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-t border-blue-100 first:border-t-0">
                      <div className="text-sm">
                        <span className="text-xs font-bold text-[#fc9300] mr-1">SFS_{p.PROBLEM_ID}</span>
                        <span className="font-medium text-gray-800">{p.TITLE}</span>
                        <span className="text-gray-500"> · requested {formatDate(p.REQUESTED_DATE)} · deadline {formatDate(p.SUB_DEADLINE)}</span>
                        {p.DEADLINE_PASSED && <span className="ml-1 text-xs text-red-600">(closed)</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={busy || p.DEADLINE_PASSED}
                          onClick={() => assign(team.ID, p.PROBLEM_ID, true)}
                          className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => reject(team.ID, p.PROBLEM_ID)}
                          className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {assigned.length === 0 ? (
                <p className="text-sm text-gray-500 mb-4">No problem statement assigned yet.</p>
              ) : (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
                        <th className="py-2 px-3">Problem</th>
                        <th className="py-2 px-3">Deadline</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Marks</th>
                        <th className="py-2 px-3">Evaluator's comment</th>
                        <th className="py-2 px-3">Submitted</th>
                        <th className="py-2 px-3">Solution</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.map((p) => {
                        const sub = p.submission;
                        return (
                          <tr key={p.PROBLEM_ID} className="border-t border-gray-100 align-top">
                            <td className="py-2 px-3">
                              <span className="text-xs font-bold text-[#fc9300]">SFS_{p.PROBLEM_ID}</span>
                              <div className="font-medium text-gray-800">{p.TITLE}</div>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {formatDate(p.SUB_DEADLINE)}
                              {p.DEADLINE_PASSED && <div className="text-xs text-red-600">Closed</div>}
                            </td>
                            <td className="py-2 px-3"><SubmissionStatus submission={sub} /></td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {sub?.EVAL_TOTAL != null && sub.STATUS === "APPROVED" ? <b>{sub.EVAL_TOTAL} / 100</b> : "—"}
                            </td>
                            <td className="py-2 px-3">
                              {sub?.EVALUATION_COMMENT ? (
                                <span className="block max-w-xs text-gray-700 whitespace-pre-line line-clamp-3" title={sub.EVALUATION_COMMENT}>{sub.EVALUATION_COMMENT}</span>
                              ) : "—"}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">{sub ? formatDate(sub.SUB_DATE) : "—"}</td>
                            <td className="py-2 px-3">
                              {sub?.files?.length > 0 && <FileLinks files={sub.files} className="mb-1 max-w-[16rem]" />}
                              {sub?.SOL_LINK && (
                                <a href={sub.SOL_LINK} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a>
                              )}
                              {!sub && "—"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {!sub && (
                                <button
                                  disabled={busy}
                                  onClick={() => unassign(team.ID, p.PROBLEM_ID)}
                                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                >
                                  Unassign
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={selected[team.ID] || ""}
                  onChange={(e) => setSelected((prev) => ({ ...prev, [team.ID]: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[260px]"
                >
                  <option value="">
                    {openCount ? "Choose a problem statement to assign" : "No open problem statements to assign"}
                  </option>
                  {assignable.map((p) => (
                    <option key={p.ID} value={p.ID} disabled={isClosed(p)}>
                      SFS_{p.ID}: {p.TITLE} ({isClosed(p) ? "closed" : "deadline"} {formatDate(p.SUB_DEADLINE)})
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy || !selected[team.ID]}
                  onClick={() => assign(team.ID)}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#fc9300] hover:bg-[#e08300] disabled:bg-gray-300"
                >
                  Assign
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="teams" />
    </div>
  );
}
