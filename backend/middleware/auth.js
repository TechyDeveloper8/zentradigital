import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zentra-enterprise-jwt-secret-key-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch live user and role details from database
    const user = db.prepare(`
      SELECT u.id, u.org_id, u.username, u.email, u.user_type, u.is_active,
             r.name as role_name, r.display_name as role_display
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    req.user = user;
    req.employee = null;
    req.clientProfile = null;

    // If employee, attach employee profile
    if (user.user_type === 'employee' || user.user_type === 'admin') {
      const emp = db.prepare(`
        SELECT e.*, d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.user_id = ?
      `).get(user.id);
      req.employee = emp || null;
    }

    // If client, attach client profile
    if (user.user_type === 'client') {
      const clientRecord = db.prepare(`
        SELECT * FROM clients WHERE user_id = ?
      `).get(user.id);
      req.clientProfile = clientRecord || null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Require one of specified roles (e.g. ['admin', 'sales'])
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role_name === 'admin') {
      return next(); // Admin has universal operational access
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission for this action.' });
    }
    next();
  };
}
