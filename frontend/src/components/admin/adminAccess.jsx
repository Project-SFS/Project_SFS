import { createContext, useContext } from "react";
import { FiLock } from "react-icons/fi";

// The logged-in admin and what they may do. The main admin has every permission and alone manages admins.
// Permissions: PROBLEMS (upload problems), EVALUATE (evaluate submissions), USERS (manage users).
export const PERMISSION_LABELS = {
  PROBLEMS: "Upload challenges",
  EVALUATE: "Evaluate submissions",
  USERS: "Manage users",
};
export const PERMISSION_HINTS = {
  PROBLEMS: "Create, edit, close, delete and import challenges",
  EVALUATE: "Review submissions (decision, marks, comment) and delete them",
  USERS: "Users and teams, SPOC approvals, creating SPOCs, passwords, assigning problems",
};

export const AdminContext = createContext({ user: null, loading: true });

export const useAdmin = () => {
  const { user, loading } = useContext(AdminContext);
  const isSuper = Boolean(user?.IS_SUPER_ADMIN);
  // the main admin or an admin with all three permissions acts as a main admin (manages other admins,
  // resets the portal); everyone else only gets what their permissions allow
  const canManageAdmins = isSuper || Object.keys(PERMISSION_LABELS).every((p) => (user?.PERMISSIONS || []).includes(p));
  return {
    user,
    loading,
    isSuper,
    canManageAdmins,
    can: (permission) => isSuper || (user?.PERMISSIONS || []).includes(permission),
  };
};

// Shown instead of a page the admin has no permission for
export const NoAccess = ({ permission }) => (
  <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
    <div className="mx-auto w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-4">
      <FiLock className="text-[#FF9900] text-xl" />
    </div>
    <h1 className="text-lg font-semibold text-[#1A202C]">You don't have access to this page</h1>
    <p className="text-sm text-[#718096] mt-2">
      {permission ? <>It needs the <b>{PERMISSION_LABELS[permission]}</b> permission. </> : null}
      Ask the main admin to give it to you.
    </p>
  </div>
);

// Wraps a page: renders it only with the permission
export const RequirePermission = ({ permission, children }) => {
  const { can, loading } = useAdmin();
  if (loading) return null;
  return can(permission) ? children : <NoAccess permission={permission} />;
};
