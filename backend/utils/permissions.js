// Admin permissions. Every admin can see the dashboard, problem statements, submissions and exports;
// these three unlock the rest. The main admin (IS_SUPER_ADMIN) always has all of them and alone manages admins.
export const PERMISSIONS = {
    PROBLEMS: "Upload problems",      // create, edit, delete, import problem statements
    EVALUATE: "Evaluate submissions", // review and delete submissions
    USERS: "Manage users",            // users, teams, approvals, passwords, problem assignment
}
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS)

export const parsePermissions = (value) =>
    String(value || "").split(",").map((p) => p.trim().toUpperCase()).filter((p) => ALL_PERMISSIONS.includes(p))

// normalised list for saving, e.g. ["users", "PROBLEMS", "x"] -> "PROBLEMS,USERS"
export const serializePermissions = (list) =>
    ALL_PERMISSIONS.filter((p) => (Array.isArray(list) ? list : []).map((x) => String(x).toUpperCase()).includes(p)).join(",")

export const hasPermission = (user, permission) =>
    user?.ROLE === "ADMIN" && (Boolean(user.IS_SUPER_ADMIN) || (user.PERMISSIONS || []).includes(permission))
