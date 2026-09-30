import jwt from "jsonwebtoken";
import connection from "../database/db.js";

// The login cookie's user, or null. The account is looked up again so a deleted or rejected
// user loses access at once instead of when the 4 hour token expires.
const sessionUser = async (req) => {
  const token = req.cookies && req.cookies.login_creditionals;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SCERET);
  } catch (err) {
    return null;
  }
  const [rows] = await connection.query("SELECT STATUS FROM SolveForSakthi_Users WHERE ID = ?", [payload.ID]);
  if (rows.length === 0 || rows[0].STATUS === "REJECTED") return null;
  return payload;
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

export { requireAuth, optionalAuth, requireRole, sessionUser };
