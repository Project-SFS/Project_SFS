import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiX, FiAward, FiMail, FiChevronDown, FiChevronUp, FiKey, FiArchive } from "react-icons/fi";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../common/Pagination";
import { StatusBadge } from "../../submissionStatus";
import ChangePasswordModal from "../ChangePasswordModal";

// The admin's team details dialog: team facts, members, challenges and submissions with their
// review history, and every email sent to the team. Used on the Teams page and, opened in place, from the
// challenge and submission pages.
//   team   - the team record from /admin/teams (when the caller already has it)
//   teamId - or just the id: the record is loaded here
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

// One logged email; the text opens on click
const MailItem = ({ mail }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3 text-sm">
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-[#1A202C]">{mail.SUBJECT || "(no subject)"}</div>
          <div className="text-xs text-[#718096] break-all">
            To {mail.TO_ADDR} · {formatDateTime(mail.SENT_AT)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mail.STATUS !== "SENT" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Not delivered</span>}
          {open ? <FiChevronUp className="text-[#718096]" /> : <FiChevronDown className="text-[#718096]" />}
        </div>
      </button>
      {open && (
        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[#4A5568] bg-[#F7F8FC] rounded-lg p-3 max-h-64 overflow-y-auto">
          {mail.BODY_TEXT || "(no text stored)"}{mail.ERROR ? `\n\nError: ${mail.ERROR}` : ""}
        </pre>
      )}
    </div>
  );
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

const TeamDetailsModal = ({ team: given = null, teamId = null, onClose }) => {
  const [loaded, setLoaded] = useState(null);
  const [loadError, setLoadError] = useState("");
  const team = given || loaded;
  const [history, setHistory] = useState(null); // members, submissions with reviews, mails
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState("");

  // only an id given: load the team record
  useEffect(() => {
    if (given || teamId == null) return;
    setLoaded(null);
    setLoadError("");
    axios.get(`${URL}/admin/teams/${teamId}`, { withCredentials: true })
      .then((res) => setLoaded(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || "Could not load this team"));
  }, [given, teamId]);

  // the full record (also for archived teams)
  const id = team?.ID;
  useEffect(() => {
    if (!id) return;
    setHistory(null);
    setNotice("");
    axios.get(`${URL}/admin/teams/${id}/history`, { withCredentials: true })
      .then((res) => setHistory(res.data))
      .catch(() => setHistory({ members: [], submissions: [], mails: [], error: true }));
  }, [id]);

  // Escape closes the dialog (not while the password dialog is open)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !changingPassword && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changingPassword, onClose]);

  const problemPages = usePagination(team?.problems || [], { resetKey: id });
  const historyPages = usePagination(history?.submissions || [], { resetKey: id });
  const mailPages = usePagination(history?.mails || [], { resetKey: id });

  if (!team) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <p className={loadError ? "text-red-600" : "text-[#718096]"}>{loadError || "Loading team details..."}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">Close</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {team && changingPassword && (
        <ChangePasswordModal
          title="Change team login password"
          subtitle={`${team.NAME} · login ${team.LEAD_EMAIL}`}
          emailLabel="Email the new password to the team lead"
          onSave={async (password, emailUser) => {
            await axios.post(`${URL}/team_password`, { teamId: team.ID, password, emailUser }, { withCredentials: true });
            setChangingPassword(false);
            setNotice(`Password changed${emailUser ? " and emailed to the team lead" : ""}.`);
          }}
          onClose={() => setChangingPassword(false)}
        />
      )}

      {/* Team details */}
      {team && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1A202C]">{team.NAME}</h2>
                <p className="text-sm text-[#718096]">{team.COLLEGE || "No college"}</p>
                {team.REMOVED_AT ? (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    <FiArchive /> Removed by {team.REMOVED_BY_EMAIL || "the SPOC"} on {formatDate(team.REMOVED_AT)} · records kept · read-only
                  </span>
                ) : team.GRADUATED_AT && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <FiAward /> Graduated {team.GRADUATION_YEAR} · archived {formatDate(team.GRADUATED_AT)} · read-only
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Team lead", team.LEAD_EMAIL],
                    ["Lead phone", team.LEAD_PHONE],
                    ["Team login", team.REMOVED_AT ? "Closed (team removed)" : team.GRADUATED_AT ? "Closed (graduated)" : team.HAS_LOGIN ? "Created" : "Not created yet"],
                    ["Graduation year", team.GRADUATION_YEAR ? `${team.GRADUATION_YEAR} (highest member year)` : "Not set"],
                    ["Mentor", [team.MENTOR_NAME, team.MENTOR_EMAIL].filter(Boolean).join(" · ")],
                    ["SPOC", [team.SPOC_NAME, team.SPOC_EMAIL].filter(Boolean).join(" · ")],
                    ["College code", team.COLLEGE_CODE],
                    ["Registered", formatDate(team.CREATED_AT)],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <tr key={label} className="border-b border-[#E2E8F0]">
                      <td className="py-2 pr-4 font-medium text-[#718096] w-1/3">{label}</td>
                      <td className="py-2 text-[#1A202C] break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {team.HAS_LOGIN && !team.GRADUATED_AT && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setNotice(""); setChangingPassword(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FF9900] text-[#FF9900] text-sm font-medium hover:bg-[#FF9900] hover:text-white transition"
                  >
                    <FiKey /> Change team login password
                  </button>
                  {notice && <span className="text-sm text-green-600">{notice}</span>}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Members</h3>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading members...</p>
                ) : history.members.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No members recorded.</p>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                    {history.members.map((m) => (
                      <div key={m.ID} className="px-4 py-2.5 flex flex-wrap justify-between gap-2 text-sm">
                        <div>
                          <span className="font-medium text-[#1A202C]">{m.NAME}</span>
                          <span className="ml-2 text-xs text-[#718096]">{m.ROLE}</span>
                          {m.GRAD_YEAR && <span className="ml-2 text-xs font-medium text-purple-700">Class of {m.GRAD_YEAR}</span>}
                        </div>
                        <div className="text-[#718096] break-all">{[m.EMAIL, m.PHONE].filter(Boolean).join(" · ")}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Challenges & submissions</h3>
                {team.problems.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">This team has not submitted a solution yet.</p>
                ) : (
                  <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                    {problemPages.pageItems.map((p) => (
                      <div key={p.PROBLEM_ID} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link to={`/admin/problems/${p.PROBLEM_ID}/details`} className="font-medium text-[#2B6CB0] hover:underline">
                            SFS_{p.PROBLEM_ID} · {p.TITLE || "Deleted challenge"}
                          </Link>
                        </div>
                        {p.submission ? (
                          <Link
                            to={`/admin/submissions/${p.submission.ID}/details`}
                            className="flex items-center gap-2"
                          >
                            <StatusBadge status={p.submission.STATUS} />
                            {p.submission.TOTAL != null && <span className="font-medium text-[#1A202C]">{p.submission.TOTAL}/100</span>}
                            <span className="text-[#FF9900] font-medium hover:underline">{p.submission.STATUS === "PENDING" ? "Review" : "View"}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-[#A0AEC0]">No submission</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Pagination page={problemPages.page} totalPages={problemPages.totalPages} total={problemPages.total} onChange={problemPages.setPage} label="challenges" />
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Submission & review history</h3>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading history...</p>
                ) : history.submissions.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No submissions.</p>
                ) : (
                  <div className="space-y-3">
                    {historyPages.pageItems.map((sub) => (
                      <div key={sub.ID} className="border border-[#E2E8F0] rounded-xl p-4 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-[#1A202C]">{sub.SOL_TITLE || "Untitled solution"}</div>
                            <div className="text-xs text-[#718096]">SFS_{sub.PROBLEM_ID} · {sub.PROBLEM_TITLE || "Deleted challenge"} · submitted {formatDate(sub.SUB_DATE)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={sub.STATUS} />
                            <Link to={`/admin/submissions/${sub.ID}/details`} className="text-[#FF9900] font-medium hover:underline">Open</Link>
                          </div>
                        </div>
                        {sub.reviews.length > 0 && (
                          <ol className="mt-3 space-y-2 border-l-2 border-[#E2E8F0] pl-3">
                            {sub.reviews.map((r) => (
                              <li key={r.ID}>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <StatusBadge status={r.DECISION} />
                                  <span className="text-[#4A5568] break-all">{r.REVIEWER_EMAIL || r.REVIEWER_NAME || "Deleted user"}</span>
                                  <span className="text-[#A0AEC0]">{formatDateTime(r.REVIEWED_AT)}</span>
                                  {r.EVAL_TOTAL != null && <span className="font-semibold text-[#1A202C]">{r.EVAL_TOTAL}/100</span>}
                                </div>
                                {r.COMMENT && <p className="mt-1 text-[#1A202C] whitespace-pre-line">{r.COMMENT}</p>}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                    <Pagination page={historyPages.page} totalPages={historyPages.totalPages} total={historyPages.total} onChange={historyPages.setPage} label="submissions" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2 flex items-center gap-2"><FiMail /> Communications</h3>
                <p className="text-xs text-[#A0AEC0] mb-2">Emails the platform sent to the team's addresses (lead, members, mentor). Click one to read it.</p>
                {history === null ? (
                  <p className="text-sm text-[#A0AEC0]">Loading emails...</p>
                ) : history.mails.length === 0 ? (
                  <p className="text-sm text-[#A0AEC0]">No emails on record.</p>
                ) : (
                  <>
                    <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                      {mailPages.pageItems.map((m) => <MailItem key={m.ID} mail={m} />)}
                    </div>
                    <Pagination page={mailPages.page} totalPages={mailPages.totalPages} total={mailPages.total} onChange={mailPages.setPage} label="emails" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamDetailsModal;
