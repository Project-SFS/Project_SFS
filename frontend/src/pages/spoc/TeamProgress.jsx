import { useCallback, useEffect, useState } from "react";
import { FileLinks } from "../../submissionFiles";
import axios from "axios";
import toast from "react-hot-toast";
import { URL } from "../../Utils";
import SubmissionStatus from "../student/SubmissionStatus";
import Pagination, { usePagination } from "../../components/common/Pagination";

const formatDate = (value) => (value ? String(value).split("T")[0] : "—");
const isAccepted = (status) => ["APPROVED", "ACCEPTED"].includes(String(status || "").toUpperCase());

// SPOC view: every team's solutions, reviews and marks. Teams submit to any open challenge themselves
// (there is no assigning); a team can have up to `maxAccepted` accepted concepts.
export default function TeamProgress() {
  const [teams, setTeams] = useState([]);
  const [maxAccepted, setMaxAccepted] = useState(3);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${URL}/spoc/progress`);
      setTeams(res.data.teams || []);
      setMaxAccepted(res.data.maxAccepted || 3);
    } catch {
      toast.error("Could not load team progress");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { page, setPage, pageItems, total, totalPages } = usePagination(teams);

  if (loading) {
    return <div className="text-gray-500">Loading team progress...</div>;
  }

  const solutions = teams.flatMap((t) => t.solutions || []);
  const stats = [
    ["Teams", teams.length],
    ["Solutions submitted", solutions.length],
    ["Awaiting review", solutions.filter((s) => s.STATUS === "PENDING").length],
    ["Concept accepted", solutions.filter((s) => isAccepted(s.STATUS)).length],
    ["Teams at the limit", teams.filter((t) => t.ACCEPTED_COUNT >= maxAccepted).length],
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Team Progress</h1>
      <p className="text-gray-600 mb-6">
        Your teams submit solutions to any open challenge themselves. Follow their solutions, reviews and marks here.
        A team can have up to {maxAccepted} accepted concepts; after that it cannot start new solutions. You are emailed
        when a team's solution is reviewed.
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
          const list = team.solutions || [];
          const atLimit = team.ACCEPTED_COUNT >= maxAccepted;
          return (
            <div key={team.ID} className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{team.NAME}</h2>
                  <p className="text-sm text-gray-600">
                    Lead: {team.LEAD_EMAIL || "—"} {team.LEAD_PHONE ? `· ${team.LEAD_PHONE}` : ""} · {team.MEMBER_COUNT} member(s)
                    {team.MENTOR_NAME ? ` · Mentor: ${team.MENTOR_NAME}` : ""}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${atLimit ? "bg-green-100 text-green-800" : "bg-orange-50 text-[#c76f00]"}`}>
                  Concept accepted: {team.ACCEPTED_COUNT} of {maxAccepted}{atLimit ? " · limit reached" : ""}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="text-sm text-gray-500">This team has not submitted a solution yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">
                        <th className="py-2 px-3">Challenge</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Marks</th>
                        <th className="py-2 px-3">Evaluator's comment</th>
                        <th className="py-2 px-3">Submitted</th>
                        <th className="py-2 px-3">Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((sub) => (
                        <tr key={sub.ID} className="border-t border-gray-100 align-top">
                          <td className="py-2 px-3">
                            <span className="text-xs font-bold text-[#fc9300]">SFS_{sub.PROBLEM_ID}</span>
                            <div className="font-medium text-gray-800">{sub.TITLE || "Deleted challenge"}</div>
                            {sub.IS_CLOSED && <div className="text-xs text-gray-500">Concept Received</div>}
                          </td>
                          <td className="py-2 px-3"><SubmissionStatus submission={sub} /></td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {sub.EVAL_TOTAL != null && (isAccepted(sub.STATUS) || sub.STATUS === "CONCEPT_CLOSED") ? <b>{sub.EVAL_TOTAL} / 100</b> : "—"}
                          </td>
                          <td className="py-2 px-3">
                            {sub.EVALUATION_COMMENT ? (
                              <span className="block max-w-xs text-gray-700 whitespace-pre-line line-clamp-3" title={sub.EVALUATION_COMMENT}>{sub.EVALUATION_COMMENT}</span>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{formatDate(sub.SUB_DATE)}</td>
                          <td className="py-2 px-3">
                            {sub.files?.length > 0 && <FileLinks files={sub.files} className="mb-1 max-w-[16rem]" />}
                            {sub.SOL_LINK && (
                              <a href={sub.SOL_LINK} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} label="teams" />
    </div>
  );
}
