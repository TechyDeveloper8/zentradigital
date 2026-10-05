import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Employee, Client } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zentra-enterprise-jwt-secret-key-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection offline.' });
    }

    // Fetch live user and role details from MongoDB
    const userDoc = await User.findById(decoded.id).populate('role_id');

    if (!userDoc || !userDoc.is_active) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    const user = {
      id: userDoc._id.toString(),
      _id: userDoc._id,
      org_id: userDoc.org_id,
      username: userDoc.username,
      email: userDoc.email,
      user_type: userDoc.user_type,
      is_active: userDoc.is_active,
      role_name: userDoc.role_id?.name,
      role_display: userDoc.role_id?.display_name
    };

    req.user = user;
    req.employee = null;
    req.clientProfile = null;
    req.client = null;

    // If employee or admin, attach employee profile
    if (user.user_type === 'employee' || user.user_type === 'admin') {
      const empDoc = await Employee.findOne({ user_id: userDoc._id }).populate('department_id');
      if (empDoc) {
        req.employee = {
          ...empDoc.toJSON(),
          department_name: empDoc.department_id?.name || null
        };
      }
    }

    // If client, attach client profile
    if (user.user_type === 'client') {
      const clientDoc = await Client.findOne({ user_id: userDoc._id });
      if (clientDoc) {
        req.clientProfile = clientDoc.toJSON();
        req.client = req.clientProfile;
      }
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
