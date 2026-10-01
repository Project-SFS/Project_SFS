import { useEffect, useState } from "react";
import { FiKey, FiX } from "react-icons/fi";
import PasswordFields, { passwordsReady } from "./PasswordFields";

// Set a new password for someone else's login (admin -> any account, SPOC -> their team).
// onSave(password, emailUser) returns a promise; its rejection message is shown in the popup.
const ChangePasswordModal = ({ title, subtitle, onSave, onClose, emailLabel = "Email the new password to the user" }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailUser, setEmailUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const ready = passwordsReady(password, confirm);

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(password, emailUser);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not change the password");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button type="button" onClick={onClose} disabled={saving} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <FiX size={20} />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-[#FFF4E5] p-2.5 rounded-xl"><FiKey className="text-[#FF9900] text-lg" /></div>
          <h2 className="text-lg font-semibold text-[#1A202C]">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-[#718096] mb-5 break-all">{subtitle}</p>}

        <PasswordFields
          password={password}
          confirm={confirm}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          label="New password"
          confirmLabel="Re-enter new password"
          inputClassName="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900] outline-none"
          labelClassName="block text-sm font-semibold text-[#4A5568] mb-1.5"
          autoFocus
        />

        <label className="flex items-center gap-2 mt-4 text-sm text-[#4A5568] cursor-pointer">
          <input type="checkbox" checked={emailUser} onChange={(e) => setEmailUser(e.target.checked)} className="w-4 h-4 accent-[#FF9900]" />
          {emailLabel}
        </label>
        <p className="text-xs text-[#A0AEC0] mt-1">Anyone logged in with the old password is logged out.</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl bg-gray-100 text-[#1A202C] text-sm hover:bg-gray-200 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={!ready || saving} className="px-4 py-2 rounded-xl bg-[#FF9900] text-white text-sm font-medium hover:bg-[#e68900] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordModal;
