import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowLeft, FiEdit2, FiLock, FiMail, FiPhone, FiUser, FiBookOpen, FiHash, FiShield,
  FiCalendar, FiUsers, FiUpload, FiCheckCircle, FiAward, FiLogOut, FiClipboard, FiTrendingUp, FiKey, FiSave, FiX,
} from "react-icons/fi";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordFields, { passwordsReady } from "../../components/PasswordFields";
import { URL } from "../../Utils";

// SPOC: their own details (email and college code are fixed), editable name / phone / college,
// password change, team statistics and shortcuts
const input = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#fc9300]";

const initials = (name, email) =>
  (String(name || email || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2) || "?").toUpperCase();

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const ReadOnlyField = ({ icon: Icon, label, value, hint }) => (
  <div>
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1.5">
      {label} {hint && <FiLock className="text-gray-400" title={hint} />}
    </div>
    <div className="flex items-center gap-2 text-gray-900 break-all">
      <Icon className="text-gray-400 shrink-0" /> {value || <span className="text-gray-400">Not set</span>}
    </div>
    {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const SpocProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", college: "" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const load = () =>
    axios.get(`${URL}/profile`, { withCredentials: true })
      .then((res) => setProfile(res.data))
      .catch(() => setError("Could not load your profile. Please log in again."));

  useEffect(() => {
    load();
  }, []);

  const startEdit = () => {
    setForm({ name: profile.NAME || "", phone: profile.PHONE || "", college: profile.COLLEGE || "" });
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${URL}/profile`, form, { withCredentials: true });
      toast.success("Profile updated");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const pwReady = pw.current.length > 0 && passwordsReady(pw.next, pw.confirm);
  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwReady) return;
    setChangingPw(true);
    try {
      await axios.post(`${URL}/profile/password`, { currentPassword: pw.current, newPassword: pw.next }, { withCredentials: true });
      toast.success("Password changed. Other devices have been logged out.");
      setPw({ current: "", next: "", confirm: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change your password");
    } finally {
      setChangingPw(false);
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${URL}/logout`, { withCredentials: true });
    } finally {
      navigate("/login");
    }
  };

  const stats = profile?.stats || {};
  const statCards = [
    ["Active teams", stats.ACTIVE_TEAMS ?? 0, FiUsers],
    ["Graduated teams", stats.GRADUATED_TEAMS ?? 0, FiAward],
    ["Submissions", stats.SUBMISSIONS ?? 0, FiUpload],
    ["Concept accepted", stats.APPROVED ?? 0, FiCheckCircle],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header />
      <Toaster position="top-right" />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <Link to="/spoc" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#fc9300] mb-6">
          <FiArrowLeft /> Back to dashboard
        </Link>

        {error && <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-600">{error}</div>}
        {!profile && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fc9300]" />
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            {/* Summary */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-[#494949] to-[#6b6b6b]" />
              <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
                {/* only the avatar overlaps the banner; the name stays on white */}
                <div className="-mt-10 w-20 h-20 shrink-0 rounded-2xl bg-[#fc9300] text-white text-2xl font-bold flex items-center justify-center ring-4 ring-white shadow">
                  {initials(profile.NAME, profile.EMAIL)}
                </div>
                <div className="flex-1 min-w-0 sm:pt-3">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.NAME || "Your profile"}</h1>
                  <p className="text-sm text-gray-600 break-all">{profile.EMAIL} · {profile.COLLEGE || "No college"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#c76f00] border border-orange-200">SPOC</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.STATUS === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{profile.STATUS}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100">
                {statCards.map(([label, value, Icon]) => (
                  <div key={label} className="p-5 flex items-center gap-3 border-gray-100 [&:not(:last-child)]:border-r">
                    <div className="bg-orange-50 p-2.5 rounded-xl"><Icon className="text-[#fc9300]" /></div>
                    <div>
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-xl font-bold text-gray-900">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Details */}
              <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Personal details</h2>
                  {!editing && (
                    <button onClick={startEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#fc9300] text-[#fc9300] text-sm font-medium hover:bg-[#fc9300] hover:text-white transition">
                      <FiEdit2 /> Edit details
                    </button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={saveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Name <span className="text-red-500">*</span></span>
                      <input value={form.name} maxLength={256} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${input} mt-1.5`} required />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Phone</span>
                      <input value={form.phone} maxLength={20} inputMode="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${input} mt-1.5`} placeholder="e.g. 98765 43210" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-semibold text-gray-700">College name <span className="text-red-500">*</span></span>
                      <input value={form.college} maxLength={100} onChange={(e) => setForm({ ...form, college: e.target.value })} className={`${input} mt-1.5`} required />
                    </label>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 rounded-xl bg-gray-50 p-4">
                      <ReadOnlyField icon={FiMail} label="Email (login)" value={profile.EMAIL} hint="Your login email cannot be changed" />
                      <ReadOnlyField icon={FiHash} label="College code" value={profile.COLLEGE_CODE} hint="Contact the admin to change it" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3">
                      <button type="button" onClick={() => setEditing(false)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">
                        <FiX /> Cancel
                      </button>
                      <button type="submit" disabled={saving || !form.name.trim() || !form.college.trim()} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#fc9300] text-white text-sm font-medium hover:bg-[#e68400] disabled:opacity-50">
                        <FiSave /> {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ReadOnlyField icon={FiUser} label="Name" value={profile.NAME} />
                    <ReadOnlyField icon={FiPhone} label="Phone" value={profile.PHONE} />
                    <ReadOnlyField icon={FiMail} label="Email (login)" value={profile.EMAIL} hint="Your login email cannot be changed" />
                    <ReadOnlyField icon={FiBookOpen} label="College" value={profile.COLLEGE} />
                    <ReadOnlyField icon={FiHash} label="College code" value={profile.COLLEGE_CODE} hint="Contact the admin to change it" />
                    <ReadOnlyField icon={FiShield} label="Role" value="SPOC (college coordinator)" />
                    <ReadOnlyField icon={FiCalendar} label="Member since" value={profile.DATE} />
                  </div>
                )}
              </section>

              {/* Shortcuts */}
              <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
                <div className="space-y-2">
                  {[
                    ["/spoc/team", "Manage teams", "Create, edit and set team passwords", FiUsers],
                    ["/spoc", "Dashboard", "Overview of your teams", FiTrendingUp],
                    ["/problemstatements", "Challenges", "Browse every challenge", FiClipboard],
                  ].map(([to, label, hint, Icon]) => (
                    <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition group">
                      <div className="bg-gray-100 group-hover:bg-white p-2.5 rounded-xl"><Icon className="text-[#fc9300]" /></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">{hint}</div>
                      </div>
                    </Link>
                  ))}
                  <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition text-left">
                    <div className="bg-red-50 p-2.5 rounded-xl"><FiLogOut className="text-red-500" /></div>
                    <div>
                      <div className="text-sm font-semibold text-red-600">Log out</div>
                      <div className="text-xs text-gray-500">Sign out of this device</div>
                    </div>
                  </button>
                </div>
              </aside>
            </div>

            {/* Password */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-orange-50 p-2.5 rounded-xl"><FiKey className="text-[#fc9300]" /></div>
                <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                {profile.PASSWORD_CHANGED_AT ? `Last changed on ${formatDateTime(profile.PASSWORD_CHANGED_AT)}. ` : ""}
                After a change you stay signed in here; other devices are logged out and you get a confirmation email.
              </p>
              <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1.5">Current password <span className="text-red-500">*</span></span>
                  <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={input} required />
                </label>
                <div className="md:col-start-1">
                  <PasswordFields
                    password={pw.next}
                    confirm={pw.confirm}
                    onPasswordChange={(v) => setPw({ ...pw, next: v })}
                    onConfirmChange={(v) => setPw({ ...pw, confirm: v })}
                    label="New password"
                    confirmLabel="Re-enter new password"
                    inputClassName={input}
                    labelClassName="block text-sm font-semibold text-gray-700 mb-1.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={!pwReady || changingPw} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fc9300] text-white text-sm font-semibold hover:bg-[#e68400] disabled:opacity-50 disabled:cursor-not-allowed">
                    <FiKey /> {changingPw ? "Changing…" : "Change password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SpocProfile;
