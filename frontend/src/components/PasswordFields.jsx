import { useState } from "react";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";

// Same rule as the backend (utils/password.js): 8+ characters with a letter, a number and a symbol
export const PASSWORD_RULES = [
  ["At least 8 characters", (p) => p.length >= 8],
  ["A letter", (p) => /[A-Za-z]/.test(p)],
  ["A number", (p) => /[0-9]/.test(p)],
  ["A symbol (e.g. ! @ # $)", (p) => /[^A-Za-z0-9]/.test(p)],
];

export const passwordIsValid = (password) => PASSWORD_RULES.every(([, test]) => test(password || ""));

// true when both fields are filled in, follow the rule and match
export const passwordsReady = (password, confirm) => passwordIsValid(password) && password === confirm;

// Password + re-enter password, with show/hide, the rule checklist and a match check.
// Pass className strings to fit the page's input style.
const PasswordFields = ({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  label = "Password",
  confirmLabel = "Re-enter password",
  inputClassName = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
  labelClassName = "block text-sm font-semibold text-gray-700 mb-2",
  required = true,
  autoFocus = false,
}) => {
  const [show, setShow] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;
  const matches = confirm.length > 0 && password === confirm;

  const field = (value, onChange, text, name, extraClass = "") => (
    <div>
      <label className={labelClassName} htmlFor={name}>
        {text} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClassName} pr-11 ${extraClass}`}
          required={required}
          autoFocus={autoFocus && name === "new-password"}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {field(password, onPasswordChange, label, "new-password")}
      {password.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {PASSWORD_RULES.map(([text, test]) => {
            const ok = test(password);
            return (
              <li key={text} className={`flex items-center gap-1 ${ok ? "text-green-600" : "text-gray-500"}`}>
                {ok ? <FiCheck /> : <FiX className="text-gray-400" />} {text}
              </li>
            );
          })}
        </ul>
      )}
      {field(confirm, onConfirmChange, confirmLabel, "confirm-password", mismatch ? "!border-red-400" : "")}
      {mismatch && <p className="text-xs text-red-600">The passwords do not match.</p>}
      {matches && passwordIsValid(password) && <p className="text-xs text-green-600 flex items-center gap-1"><FiCheck /> Passwords match.</p>}
    </div>
  );
};

export default PasswordFields;
