// Admin permissions. Every admin can see the dashboard, challenges, submissions and exports;
// these three unlock the rest. The main admin (IS_SUPER_ADMIN) always has all of them and alone manages admins.
export const PERMISSIONS = {
    PROBLEMS: "Upload challenges",    // create, edit, close, delete, import challenges
    EVALUATE: "Evaluate submissions", // review and delete submissions
    USERS: "Manage users",            // users, teams, approvals, passwords
}
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS)

export const parsePermissions = (value) =>
    String(value || "").split(",").map((p) => p.trim().toUpperCase()).filter((p) => ALL_PERMISSIONS.includes(p))

// normalised list for saving, e.g. ["users", "PROBLEMS", "x"] -> "PROBLEMS,USERS"
export const serializePermissions = (list) =>
    ALL_PERMISSIONS.filter((p) => (Array.isArray(list) ? list : []).map((x) => String(x).toUpperCase()).includes(p)).join(",")

// The main admin, or an admin with ALL three permissions (a full admin): acts as a main admin - manages
// other admins and can reset the portal. Anyone else only gets what their permissions allow.
// (The main admin account itself stays protected: see User_details.js.)
export const isFullAdmin = (user) => user?.ROLE === "ADMIN" && (Boolean(user.IS_SUPER_ADMIN) || ALL_PERMISSIONS.every((p) => (user.PERMISSIONS || []).includes(p)))
export const canManageAdmins = isFullAdmin

export const hasPermission = (user, permission) =>
    user?.ROLE === "ADMIN" && (Boolean(user.IS_SUPER_ADMIN) || (user.PERMISSIONS || []).includes(permission))
