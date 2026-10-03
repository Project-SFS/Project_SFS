import jwt from "jsonwebtoken";
import connection from "../database/db.js";
import { parsePermissions, hasPermission, PERMISSIONS, canManageAdmins } from "../utils/permissions.js";

// The login cookie's user, or null. The account is looked up again so a deleted or rejected
// user (or an account of the removed EVALUATOR role) loses access at once instead of when the
// 4 hour token expires.
const sessionUser = async (req) => {
  const token = req.cookies && req.cookies.login_creditionals;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SCERET);
  } catch (err) {
    return null;
  }
  const [rows] = await connection.query("SELECT STATUS, ROLE, PASSWORD_CHANGED_AT, IS_SUPER_ADMIN, ADMIN_PERMISSIONS FROM SolveForSakthi_Users WHERE ID = ?", [payload.ID]);
  if (rows.length === 0 || ["REJECTED", "GRADUATED", "REMOVED"].includes(rows[0].STATUS) || rows[0].ROLE === "EVALUATOR") return null;
  // the token carries the user's row as it was at login, including PASSWORD_CHANGED_AT; once an admin or
  // SPOC changes the password the stored value differs, so logins from before the change stop working
  const stamp = (value) => (value ? new Date(value).getTime() : 0);
  if (stamp(rows[0].PASSWORD_CHANGED_AT) !== stamp(payload.PASSWORD_CHANGED_AT)) return null;
  // admin rights always come from the database, so a change applies at once
  const { ADMIN_PERMISSIONS, IS_SUPER_ADMIN, ...user } = payload;
  if (rows[0].ROLE !== "ADMIN") return user;
  const isSuper = Boolean(rows[0].IS_SUPER_ADMIN);
  return { ...user, IS_SUPER_ADMIN: isSuper, PERMISSIONS: isSuper ? Object.keys(PERMISSIONS) : parsePermissions(rows[0].ADMIN_PERMISSIONS) };
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await sessionUser(req);
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

// Sets req.user when a valid login cookie is present, but lets anonymous requests through
const optionalAuth = async (req, res, next) => {
  try {
    req.user = (await sessionUser(req)) || undefined;
    return next();
  } catch (err) {
    return next(err);
  }
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const role = (req.user.ROLE || req.user.role || '').toString().toUpperCase();

  if (allowedRoles.length === 0 || allowedRoles.includes(role)) return next();
  return res.status(403).json({ message: 'Forbidden: Unauthorized Access' });
};

// Admin route that needs one of the admin permissions (the main admin has all)
const requirePermission = (permission) => (req, res, next) => {
  if (hasPermission(req.user, permission)) return next();
  return res.status(403).json({ message: `You need the "${PERMISSIONS[permission]}" permission for this. Ask the main admin.` });
};

// The main admin or an admin with all three permissions (managing admins, portal reset)
const requireSuperAdmin = (req, res, next) => {
  if (canManageAdmins(req.user)) return next();
  return res.status(403).json({ message: `Only the main admin or an admin with all three permissions can do this` });
};

export { requireAuth, optionalAuth, requireRole, requirePermission, requireSuperAdmin, sessionUser };
