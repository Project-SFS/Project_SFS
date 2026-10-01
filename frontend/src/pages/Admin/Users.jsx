import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FiPlus, FiSearch, FiTrash2, FiUsers, FiX, FiUserCheck, FiKey, FiShield } from "react-icons/fi";
import { useAdmin, PERMISSION_LABELS, PERMISSION_HINTS } from "../../components/admin/adminAccess";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { URL } from "../../Utils";
import Pagination, { usePagination } from "../../components/common/Pagination";
import TeamsSection from "./TeamsSection";

// Platform users an admin manages. Team logins (STUDENT) are managed through their team.
// EVALUATOR is a removed role: leftover accounts can no longer log in and are listed only so
// they can be deleted.
const TABS = [
  { key: "SPOC", label: "SPOC" },
  { key: "ADMIN", label: "Admins" },
  { key: "EVALUATOR", label: "Old evaluators", onlyIfAny: true },
];

const statusStyle = (status) =>
  status === "ACTIVE" ? "bg-green-100 text-green-800"
    : status === "PENDING" ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";

const Users = () => {
  // two sections: platform accounts and registered teams (?section=teams links straight to teams)
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") === "teams" ? "teams" : "accounts";
  const setSection = (next) => setSearchParams(next === "teams" ? { section: "teams" } : {}, { replace: true });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("SPOC");
  const [searchQuery, setSearchQuery] = useState("");
  const [details, setDetails] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const { isSuper } = useAdmin();
  // main admin: editing another admin's permissions
  const [permsFor, setPermsFor] = useState(null);
  const [permsDraft, setPermsDraft] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const permsOf = (u) => String(u.ADMIN_PERMISSIONS || "").split(",").filter(Boolean);
  const openPerms = (u) => { setPermsFor(u); setPermsDraft(permsOf(u)); };
  const savePerms = async () => {
    setSavingPerms(true);
    try {
      const res = await axios.post(`${URL}/admin/set_permissions`, { userId: permsFor.ID, permissions: permsDraft }, { withCredentials: true });
      const saved = (res.data.permissions || []).join(",");
      setUsers((prev) => prev.map((x) => (x.ID === permsFor.ID ? { ...x, ADMIN_PERMISSIONS: saved } : x)));
      showToast(`Permissions saved for ${permsFor.EMAIL}`, "success");
      setPermsFor(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save the permissions", "error");
    } finally {
      setSavingPerms(false);
    }
  };

  const savePassword = async (password, emailUser) => {
    const res = await axios.post(`${URL}/admin/set_password`, { userId: passwordFor.ID, password, emailUser }, { withCredentials: true });
    const self = res.data?.self;
    setPasswordFor(null);
    if (self) {
      // the admin's own login was just signed out
      showToast("Your password was changed. Please log in again.", "success");
      setTimeout(() => { window.location.href = "/login"; }, 1500);
      return;
    }
    showToast(`Password changed for ${passwordFor.EMAIL}${emailUser ? " and emailed to them" : ""}`, "success");
  };
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      axios.get(`${URL}/get_all_users`, { withCredentials: true }),
      axios.get(`${URL}/cookie`, { withCredentials: true }),
    ])
      .then(([usersRes, meRes]) => {
        setUsers((usersRes.data || []).filter((u) => ["SPOC", "ADMIN", "EVALUATOR"].includes(String(u.ROLE).toUpperCase())));
        setCurrentUserId(meRes.data?.ID ?? null);
      })
      .catch(() => showToast("Could not load users", "error"))
      .finally(() => setLoading(false));
  }, []);

  const countFor = (role) => users.filter((u) => String(u.ROLE).toUpperCase() === role).length;
  const tabs = TABS.filter((t) => !t.onlyIfAny || countFor(t.key) > 0 || activeTab === t.key);

  const query = searchQuery.trim().toLowerCase();
  const filtered = users
    .filter((u) => String(u.ROLE).toUpperCase() === activeTab)
    .filter((u) => [u.NAME, u.EMAIL, u.COLLEGE, u.COLLEGE_CODE, u.ID].some((v) => String(v ?? "").toLowerCase().includes(query)));

  const { page, setPage, pageItems, total, totalPages } = usePagination(filtered, { resetKey: `${activeTab}|${query}` });

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axios.post(`${URL}/admin/delete_user`, { id: toDelete.ID }, { withCredentials: true });
      setUsers((prev) => prev.filter((u) => u.ID !== toDelete.ID));
      showToast(`${toDelete.NAME || toDelete.EMAIL} deleted`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete the user", "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A202C] mb-1">Users</h1>
          <p className="text-[#718096] text-sm">
            {section === "teams" ? "Every team registered by the SPOCs, with their problem statements and submissions." : "Manage SPOC and admin accounts."}
          </p>
          <div className="inline-flex mt-4 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
            {[["accounts", "Accounts", FiUserCheck], ["teams", "Teams", FiUsers]].map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${section === key ? "bg-[#FF9900] text-white shadow" : "text-[#718096] hover:bg-gray-50"}`}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>
        </div>
        <Link
          to="/admin/users/create"
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#E68500] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <FiPlus /> Create User
        </Link>
      </div>

      {section === "teams" ? <TeamsSection /> : (<>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {TABS.slice(0, 2).map((t) => (
          <div key={t.key} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4">
            <div className="bg-[#FFF4E5] p-4 rounded-xl">
              <FiUsers className="text-[#FF9900] text-2xl" />
            </div>
            <div>
              <p className="text-sm text-[#718096]">Total {t.label}</p>
              <p className="text-2xl font-bold text-[#1A202C]">{countFor(t.key)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key
                ? "bg-[#FF9900] text-white shadow-md"
                : "bg-white text-[#718096] border border-[#E2E8F0] hover:bg-gray-50"
                }`}
            >
              {t.label} ({countFor(t.key)})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, email or college..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base shadow-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === "ADMIN" && (
        <p className="mb-4 text-sm text-[#4A5568] bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
          {isSuper
            ? "You are the main admin: create admins under Create User and choose what each one may do with the shield icon. Your own account cannot be deleted."
            : "Only the main admin can add admins, change their permissions or delete them."}
        </p>
      )}

      {activeTab === "EVALUATOR" && (
        <p className="mb-4 text-sm text-[#C05621] bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          The evaluator role has been removed: admins now evaluate all submissions. These old accounts can no longer log in and can be deleted.
        </p>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-5 font-semibold">ID</th>
              <th className="text-left py-3 px-5 font-semibold">Name</th>
              <th className="text-left py-3 px-5 font-semibold">Email</th>
              {activeTab === "SPOC" && <th className="text-left py-3 px-5 font-semibold">College</th>}
              {activeTab === "ADMIN" && <th className="text-left py-3 px-5 font-semibold">Permissions</th>}
              <th className="text-left py-3 px-5 font-semibold">Status</th>
              <th className="text-center py-3 px-5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="py-6 text-center text-[#A0AEC0] italic">Loading users...</td></tr>
            ) : pageItems.length > 0 ? (
              pageItems.map((u) => (
                <tr key={u.ID} className="border-t border-[#E2E8F0] hover:bg-gray-50 transition-all">
                  <td className="py-4 px-5 font-medium text-[#1A202C]">{u.ID}</td>
                  <td className="py-4 px-5">
                    <button onClick={() => setDetails(u)} className="text-[#1A202C] hover:text-[#FF9900] transition-colors text-left">
                      {u.NAME || "-"}
                      {u.ID === currentUserId && <span className="ml-2 text-xs text-[#A0AEC0]">(you)</span>}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-[#718096]">{u.EMAIL}</td>
                  {activeTab === "SPOC" && <td className="py-4 px-5 text-[#718096]">{u.COLLEGE || "-"}</td>}
                  {activeTab === "ADMIN" && (
                    <td className="py-4 px-5">
                      {u.IS_SUPER_ADMIN ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-[#494949] text-white"><FiShield /> Main admin · everything</span>
                      ) : permsOf(u).length ? (
                        <div className="flex flex-wrap gap-1">
                          {permsOf(u).map((p) => <span key={p} className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-[#C05621] border border-orange-200">{PERMISSION_LABELS[p] || p}</span>)}
                        </div>
                      ) : (
                        <span className="text-xs text-[#A0AEC0]">View only</span>
                      )}
                    </td>
                  )}
                  <td className="py-4 px-5">
                    <span className={`text-xs font-semibold rounded-full px-2 py-1 ${statusStyle(u.STATUS)}`}>{u.STATUS || "-"}</span>
                  </td>
                  <td className="py-4 px-5 text-center space-x-4 whitespace-nowrap">
                    {u.ROLE === "ADMIN" && isSuper && !u.IS_SUPER_ADMIN && (
                      <button
                        onClick={() => openPerms(u)}
                        className="text-gray-500 hover:text-[#FF9900] transition-all"
                        title="Edit permissions"
                      >
                        <FiShield size={18} />
                      </button>
                    )}
                    {u.ROLE !== "EVALUATOR" && (u.ROLE !== "ADMIN" || isSuper || u.ID === currentUserId) && (
                      <button
                        onClick={() => setPasswordFor(u)}
                        className="text-gray-500 hover:text-[#FF9900] transition-all"
                        title="Change password"
                      >
                        <FiKey size={18} />
                      </button>
                    )}
                    {u.ID !== currentUserId && !u.IS_SUPER_ADMIN && (u.ROLE !== "ADMIN" || isSuper) && (
                      <button
                        onClick={() => setToDelete(u)}
                        className="text-gray-500 hover:text-red-600 transition-all"
                        title="Delete user"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="py-6 text-center text-[#A0AEC0] italic">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="users" />
      </>)}

      {/* Details popup */}
      {details && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDetails(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-lg relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetails(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold text-[#1A202C] mb-4">{details.NAME || details.EMAIL}</h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["ID", details.ID],
                  ["Role", details.ROLE],
                  ["Email", details.EMAIL],
                  ["Phone", details.PHONE],
                  ["College", details.COLLEGE],
                  ["College code", details.ROLE === "SPOC" ? details.COLLEGE_CODE : null],
                  ["Status", details.STATUS],
                  ["Joined", details.DATE],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <tr key={label} className="border-b border-[#E2E8F0]">
                    <td className="py-2 pr-4 font-medium text-[#718096] w-1/3">{label}</td>
                    <td className="py-2 text-[#1A202C] break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-[#1A202C]">Delete user?</h2>
            <p className="text-[#718096] mt-3 text-sm">
              <b>{toDelete.NAME || toDelete.EMAIL}</b> ({toDelete.EMAIL}) will be removed permanently and can no longer log in.
              {toDelete.ROLE === "SPOC" && " A SPOC who still has teams cannot be deleted until those teams are deleted."}
            </p>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-4 py-1.5 text-[#1A202C] bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {permsFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-[#1A202C] flex items-center gap-2"><FiShield className="text-[#FF9900]" /> Admin permissions</h2>
            <p className="text-sm text-[#718096] mt-1 break-all">{permsFor.NAME} · {permsFor.EMAIL}</p>
            <p className="text-xs text-[#A0AEC0] mt-3">Every admin can see the dashboard, problem statements, submissions and exports. These permissions allow the rest:</p>
            <div className="mt-3 space-y-2">
              {Object.keys(PERMISSION_LABELS).map((p) => (
                <label key={p} className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permsDraft.includes(p)}
                    onChange={(e) => setPermsDraft((prev) => (e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)))}
                    className="mt-1 w-4 h-4 accent-[#FF9900]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#1A202C]">{PERMISSION_LABELS[p]}</span>
                    <span className="block text-xs text-[#718096]">{PERMISSION_HINTS[p]}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setPermsFor(null)} disabled={savingPerms} className="px-4 py-2 rounded-xl bg-gray-100 text-sm">Cancel</button>
              <button onClick={savePerms} disabled={savingPerms} className="px-4 py-2 rounded-xl bg-[#FF9900] text-white text-sm font-medium hover:bg-[#e68900] disabled:opacity-50">
                {savingPerms ? "Saving…" : "Save permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordFor && (
        <ChangePasswordModal
          title="Change password"
          subtitle={`${passwordFor.NAME || ""} · ${passwordFor.EMAIL}${passwordFor.ID === currentUserId ? " (your own account: you will be logged out)" : ""}`}
          onSave={savePassword}
          onClose={() => setPasswordFor(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 ${toast.type === "success" ? "bg-[#48BB78]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Users;
