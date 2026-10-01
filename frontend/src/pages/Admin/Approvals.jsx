import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import { URL } from "../../Utils";

// SPOCs who signed up themselves wait here until an admin approves or rejects them
const roleLabel = () => "SPOC";

const Approvals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null); // { user, action: "approve" | "reject" }
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchRequests = () => {
    axios.get(`${URL}/spoc_users`, { withCredentials: true })
      .then((res) => setRequests(res.data || []))
      .catch(() => showToast("Could not load approval requests", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmAction = async () => {
    if (!selected) return;
    const { user, action } = selected;
    setSubmitting(true);
    try {
      await axios.post(`${URL}/handlespoc`, { id: user, approve: action === "approve" ? 1 : 0 }, { withCredentials: true });
      showToast(
        `${roleLabel(user.ROLE)} ${user.NAME || user.EMAIL} ${action === "approve" ? "approved" : "rejected"}. A mail has been sent to them.`,
        action === "approve" ? "success" : "error"
      );
      setRequests((prev) => prev.filter((r) => r.ID !== user.ID));
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong, please try again", "error");
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredData = requests
    .filter((r) =>
      [r.NAME, r.EMAIL, r.COLLEGE, r.COLLEGE_CODE].some((v) => String(v || "").toLowerCase().includes(query))
    );

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-8 transition-all duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A202C] mb-1">
          Approvals
        </h1>
        <p className="text-[#718096] text-sm">
          Review and manage SPOC sign-up requests.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow-sm rounded-2xl p-5 border border-[#E2E8F0] mb-8">
        <h2 className="text-sm font-medium text-[#718096] mb-2">Pending SPOC Requests</h2>
        <p className="text-3xl font-bold text-[#FF9900]">{requests.length}</p>
      </div>

      {/* Search */}
      <div className="mb-6 relative w-full md:w-1/2">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          placeholder="Search by name, email or college..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base shadow-sm focus:ring-2 focus:ring-[#FF9900] focus:outline-none transition-all placeholder-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F8FC] text-[#718096]">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">College</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Date Requested</th>
              <th className="text-center py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="py-5 text-center text-[#A0AEC0] italic">Loading requests...</td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((user) => (
                <tr key={user.ID} className="hover:bg-gray-50 border-t border-[#E2E8F0] transition-all">
                  <td className="py-3 px-4 text-[#1A202C] font-medium">{user.NAME || "-"}</td>
                  <td className="py-3 px-4 text-[#718096]">
                    {user.COLLEGE || "-"}
                    {user.COLLEGE_CODE && (
                      <span className="block text-xs text-[#A0AEC0]">{user.COLLEGE_CODE}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#718096]">{user.EMAIL}</td>
                  <td className="py-3 px-4 text-[#A0AEC0]">{user.DATE || "-"}</td>
                  <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelected({ user, action: "approve" })}
                      className="bg-[#48BB78] hover:bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelected({ user, action: "reject" })}
                      className="text-red-600 border border-red-300 hover:bg-red-50 px-4 py-1.5 rounded-xl text-sm transition-all"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-5 text-center text-[#A0AEC0] italic">
                  {requests.length === 0 ? "No pending requests." : "No matching results found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="popup"
            className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md"
            >
              <h2 className="text-lg font-semibold text-[#1A202C] flex items-center gap-2">
                {selected.action === "approve" ? (
                  <span className="text-[#48BB78]">✔</span>
                ) : (
                  <span className="text-red-500">✖</span>
                )}
                {selected.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </h2>
              <p className="text-[#718096] mt-3 text-sm">
                Are you sure you want to{" "}
                <span className={selected.action === "approve" ? "text-[#48BB78] font-medium" : "text-red-500 font-medium"}>
                  {selected.action}
                </span>{" "}
                the {roleLabel(selected.user.ROLE)} <b>{selected.user.NAME || selected.user.EMAIL}</b>
                {selected.user.COLLEGE ? <> ({selected.user.COLLEGE})</> : null}? A mail will be sent to{" "}
                <span className="font-medium">{selected.user.EMAIL}</span>.
              </p>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setSelected(null)}
                  disabled={submitting}
                  className="px-4 py-1.5 text-[#1A202C] bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={submitting}
                  className={`px-4 py-1.5 rounded-xl text-sm text-white transition-all disabled:opacity-50 ${selected.action === "approve"
                    ? "bg-[#48BB78] hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                    }`}
                >
                  {submitting ? "Please wait..." : selected.action === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-slideUp ${toast.type === "success" ? "bg-[#48BB78]" : "bg-red-500"
            }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Approvals;
