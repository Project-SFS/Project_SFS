import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FiShield, FiBriefcase, FiUserPlus } from "react-icons/fi";
import { URL } from "../../Utils";
import PasswordFields, { passwordsReady } from "../../components/PasswordFields";
import { useAdmin, PERMISSION_LABELS, PERMISSION_HINTS } from "../../components/admin/adminAccess";

const ROLES = [
  { value: "ADMIN", label: "Platform Admin", icon: FiShield, hint: "Another admin. Choose below what they may do; every admin can see the dashboard, problem statements, submissions and exports." },
  { value: "SPOC", label: "SPOC", icon: FiBriefcase, hint: "College coordinator: creates teams and assigns problem statements to them." },
];

const EMPTY = { name: "", email: "", phone: "", college: "", college_code: "", password: "" };

// Platform admin creates Admin / SPOC accounts. They are active immediately and the
// new user receives their login details by email.
export default function CreateUser() {
  const navigate = useNavigate();
  const [role, setRole] = useState("SPOC");
  // only the main admin creates admins, and chooses their permissions
  const { isSuper } = useAdmin();
  const roles = ROLES.filter((r) => r.value !== "ADMIN" || isSuper);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  // "generate": the server creates a secure password; "set": the admin types it twice
  const [passwordMode, setPasswordMode] = useState("generate");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordOk = passwordMode === "generate" || passwordsReady(form.password, confirmPassword);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!passwordOk) {
      toast.error("Enter a password that meets the rules, and the same password again");
      return;
    }
    setBusy(true);
    try {
      await axios.post(`${URL}/admin/create_user`, { ...form, password: passwordMode === "set" ? form.password : "", role, permissions: role === "ADMIN" ? permissions : undefined });
      setCreated({ role, email: form.email.trim().toLowerCase(), name: form.name.trim() });
      toast.success("Account created. Login details were emailed to the user.");
      setForm(EMPTY);
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the account");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30";
  const label = "block text-sm font-semibold text-[#4A5568] mb-1.5";
  const roleInfo = ROLES.find((r) => r.value === role);

  return (
    <div className="max-w-3xl mx-auto">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A202C] flex items-center gap-3">
          <FiUserPlus className="text-[#FF9900]" /> Create User
        </h1>
        <p className="text-[#718096] mt-1">
          Accounts created here are active immediately. The user gets an email with their login details.
        </p>
      </div>

      {created && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <b>{created.name}</b> ({created.email}) was created as{" "}
          <b>{ROLES.find((r) => r.value === created.role)?.label}</b>. They can log in now.
          <button onClick={() => navigate("/admin/users")} className="ml-2 underline font-semibold">
            View users
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
        <div>
          <span className={label}>Role</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map(({ value, label: text, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setRole(value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  role === value
                    ? "border-[#FF9900] bg-[#FFF7EC] text-[#1A202C]"
                    : "border-[#E2E8F0] text-[#4A5568] hover:bg-gray-50"
                }`}
              >
                <Icon className={role === value ? "text-[#FF9900]" : "text-gray-400"} /> {text}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#718096] mt-2">{roleInfo?.hint}</p>
          {!isSuper && <p className="text-xs text-[#A0AEC0] mt-1">Only the main admin can create admin accounts.</p>}
        </div>

        {role === "ADMIN" && (
          <div>
            <span className={label}>Permissions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(PERMISSION_LABELS).map((p) => (
                <label key={p} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${permissions.includes(p) ? "border-[#FF9900] bg-[#FFF7EC]" : "border-[#E2E8F0] hover:bg-gray-50"}`}>
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={(e) => setPermissions((prev) => (e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)))}
                    className="mt-0.5 w-4 h-4 accent-[#FF9900]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#1A202C]">{PERMISSION_LABELS[p]}</span>
                    <span className="block text-xs text-[#718096]">{PERMISSION_HINTS[p]}</span>
                  </span>
                </label>
              ))}
            </div>
            {permissions.length === 0 && <p className="text-xs text-[#C05621] mt-2">With no permission ticked, this admin can only view.</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={label}>Full name *</label>
            <input name="name" value={form.name} onChange={onChange} required className={input} />
          </div>
          <div>
            <label className={label}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required className={input} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className={input} />
          </div>

          {role === "SPOC" && (
            <>
              <div>
                <label className={label}>College name *</label>
                <input name="college" value={form.college} onChange={onChange} required className={input} />
              </div>
              <div>
                <label className={label}>College code *</label>
                <input name="college_code" value={form.college_code} onChange={onChange} required className={input} />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <span className={label}>Password</span>
            <div className="flex flex-wrap gap-4 mb-3">
              {[["generate", "Generate a secure password"], ["set", "Set a password"]].map(([value, text]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#4A5568] cursor-pointer">
                  <input
                    type="radio"
                    name="passwordMode"
                    value={value}
                    checked={passwordMode === value}
                    onChange={() => setPasswordMode(value)}
                    className="accent-[#FF9900]"
                  />
                  {text}
                </label>
              ))}
            </div>
            {passwordMode === "set" && (
              <PasswordFields
                password={form.password}
                confirm={confirmPassword}
                onPasswordChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
                onConfirmChange={setConfirmPassword}
                inputClassName={input}
                labelClassName={label}
              />
            )}
            <p className="text-xs text-[#718096] mt-2">Either way, the password is emailed to the user.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !passwordOk}
            className="px-6 py-2.5 rounded-xl bg-[#FF9900] hover:bg-[#E68500] text-white font-semibold disabled:bg-gray-300"
          >
            {busy ? "Creating..." : `Create ${roleInfo?.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
