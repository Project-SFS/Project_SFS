import jwt from "jsonwebtoken";

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.login_creditionals;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    
    const payload = jwt.verify(token, process.env.JWT_SCERET);
    console.log(payload);
    
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const role = (req.user.ROLE || req.user.role || '').toString().toUpperCase();
  console.log(role);
  
  if (allowedRoles.length === 0 || allowedRoles.includes(role)) return next();
  return res.status(403).json({ message: 'Forbidden: Unauthorized Access' });
};

export { requireAuth, requireRole };
