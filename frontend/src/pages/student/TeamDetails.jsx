import axios from "axios";
import { useEffect, useState } from "react";
import { FiUsers, FiHash, FiBookOpen, FiUserCheck, FiMail, FiPhone, FiUser, FiAward, FiInfo, FiStar } from "react-icons/fi";
import { URL } from "../../Utils";

// The team lead's view of their own team: team facts on top, one card per member below.
// Changes to the team are made by the SPOC, so this page is read-only.
const Fact = ({ icon: Icon, label, value, sub }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 min-w-0">
    <div className="shrink-0 rounded-lg bg-orange-50 p-2 text-[#fc9300]"><Icon /></div>
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900 [overflow-wrap:anywhere]">{value || "—"}</div>
      {sub && <div className="text-xs text-gray-500 [overflow-wrap:anywhere]">{sub}</div>}
    </div>
  </div>
);

const TeamDetails = () => {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [college, setCollege] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await axios.get(`${URL}/cookie`, { withCredentials: true });
        if (!alive) return;
        setCollege(me.data?.COLLEGE || "");
        const ids = await axios.post(`${URL}/fetch_team_id_email`, { email: me.data?.EMAIL }, { withCredentials: true });
        const teamId = ids.data?.[0]?.ID;
        if (!teamId) throw new Error("no team");
        const [m, t] = await Promise.all([
          axios.post(`${URL}/fetch_team_members`, { id: teamId }, { withCredentials: true }),
          axios.post(`${URL}/fetch_team_for_students`, { id: teamId }, { withCredentials: true }),
        ]);
        if (!alive) return;
        // team lead first, then the members in the order they were added
        const list = [...(m.data?.result || [])].sort((a, b) =>
          a.ROLE === "Team Lead" ? -1 : b.ROLE === "Team Lead" ? 1 : a.ID - b.ID);
        setMembers(list);
        setTeam(t.data?.[0] || null);
      } catch {
        if (alive) setError("Your team details could not be loaded. Please refresh the page or contact your SPOC.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100" />)}
        </div>
      </div>
    );
  }
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>;

  const lead = members.find((m) => m.ROLE === "Team Lead") || members[0];
  const gradYear = team?.GRADUATION_YEAR || Math.max(0, ...members.map((m) => Number(m.GRAD_YEAR) || 0)) || null;

  return (
    <div className="space-y-6">
      {/* Team summary */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#494949] to-[#5c5c5c] px-5 sm:px-6 py-5 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-[#fc9300] p-3 shrink-0"><FiUsers className="text-xl" /></div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-white/70">Your team</div>
              <h2 className="text-xl sm:text-2xl font-bold [overflow-wrap:anywhere]">{team?.NAME || "—"}</h2>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">TID_{team?.ID}</span>
        </div>
        <div className="grid gap-3 p-5 sm:p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={FiStar} label="Team lead" value={lead?.NAME} sub={lead?.EMAIL} />
          <Fact icon={FiBookOpen} label="College" value={college} />
          <Fact icon={FiUserCheck} label="Mentor" value={team?.MENTOR_NAME} sub={team?.MENTOR_EMAIL} />
          <Fact icon={FiAward} label="Final graduation year" value={gradYear} sub={`${members.length} member${members.length === 1 ? "" : "s"}`} />
        </div>
      </section>

      {/* Members */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Team members</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const isLead = m.ROLE === "Team Lead";
            return (
              <article key={m.ID} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${isLead ? "border-orange-200 ring-1 ring-orange-100" : "border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white ${isLead ? "bg-[#fc9300]" : "bg-gray-500"}`}>
                    {(m.NAME || "?").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate" title={m.NAME}>{m.NAME || "—"}</p>
                    <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${isLead ? "bg-orange-100 text-[#c76f00]" : "bg-gray-100 text-gray-700"}`}>
                      {m.ROLE}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2 min-w-0"><FiMail className="shrink-0 text-gray-400" /><span className="truncate" title={m.EMAIL}>{m.EMAIL || "—"}</span></div>
                  <div className="flex items-center gap-2"><FiPhone className="shrink-0 text-gray-400" /><span>{m.PHONE || "—"}</span></div>
                  <div className="flex items-center gap-2"><FiUser className="shrink-0 text-gray-400" /><span>{m.GENDER || "—"}</span></div>
                  <div className="flex items-center gap-2"><FiHash className="shrink-0 text-gray-400" /><span>Graduating {m.GRAD_YEAR || "—"}</span></div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <FiInfo className="mt-0.5 shrink-0 text-gray-400" />
        Something wrong or a member changed? Ask your SPOC to update the team. Your login email is the team lead's email.
      </p>
    </div>
  );
};

export default TeamDetails;
