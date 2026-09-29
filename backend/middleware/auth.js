import jwt from "jsonwebtoken";

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.login_creditionals;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    
    const payload = jwt.verify(token, process.env.JWT_SCERET);
    
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Sets req.user when a valid login cookie is present, but lets anonymous requests through
const optionalAuth = (req, res, next) => {
  const token = req.cookies && req.cookies.login_creditionals;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SCERET);
    } catch (err) {
      // an expired cookie is treated like no cookie
    }
  }
  return next();
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const role = (req.user.ROLE || req.user.role || '').toString().toUpperCase();
  
  if (allowedRoles.length === 0 || allowedRoles.includes(role)) return next();
  return res.status(403).json({ message: 'Forbidden: Unauthorized Access' });
};

export { requireAuth, optionalAuth, requireRole };
