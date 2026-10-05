import bcrypt from 'bcryptjs';
import { Role, Organization, Department, User, Employee, Client } from '../models/index.js';

/**
 * Initializes essential RBAC system roles and default system accounts if they don't already exist.
 * Allows instant login for Admin, Sales, Marketing, Editor, and Client personas.
 */
export async function initSystemRoles() {
  try {
    const systemRoles = [
      {
        name: 'admin',
        display_name: 'Administrator',
        description: 'Full administrative and agency operational access',
        is_system: true
      },
      {
        name: 'sales',
        display_name: 'Sales Executive',
        description: 'Lead generation, sales pipeline, and client proposals',
        is_system: true
      },
      {
        name: 'marketing_manager',
        display_name: 'Marketing & Social Media Manager',
        description: 'Client strategy, content calendar, and campaign approvals',
        is_system: true
      },
      {
        name: 'editor',
        display_name: 'Editor / Creative Team',
        description: 'Creative production, video editing, and asset uploads',
        is_system: true
      },
      {
        name: 'client',
        display_name: 'Client',
        description: 'Client portal access for reviews, approvals, and requests',
        is_system: true
      }
    ];

    for (const r of systemRoles) {
      const exists = await Role.findOne({ name: r.name });
      if (!exists) {
        await Role.create(r);
      }
    }

    // Ensure Organization exists
    let org = await Organization.findOne();
    if (!org) {
      org = await Organization.create({
        name: 'Zentra Digital Agency',
        website: 'https://zentradigital.agency',
        phone: '+91 98765 43210',
        email: 'contact@zentradigital.agency',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        address: 'Level 14, Prestige Trade Tower, Palace Road, Bengaluru'
      });
    }

    // Ensure Departments exist
    const departments = [
      { name: 'Executive & Management', description: 'Agency leadership and administration' },
      { name: 'Growth & Business Development', description: 'Sales, client acquisition, and retention' },
      { name: 'Content & Social Strategy', description: 'Social media management, copywriting, and campaigns' },
      { name: 'Creative Studio', description: 'Video editing, motion graphics, and graphic design' }
    ];

    const deptMap = {};
    for (const d of departments) {
      let dept = await Department.findOne({ name: d.name });
      if (!dept) {
        dept = await Department.create({ ...d, org_id: org._id });
      }
      deptMap[d.name] = dept._id;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync('Admin@123', salt);

    const adminRole = await Role.findOne({ name: 'admin' });
    const salesRole = await Role.findOne({ name: 'sales' });
    const marketingRole = await Role.findOne({ name: 'marketing_manager' });
    const editorRole = await Role.findOne({ name: 'editor' });
    const clientRole = await Role.findOne({ name: 'client' });

    // 1. Ensure Admin user exists and is configured for fresh start
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser && adminRole) {
      adminUser = await User.create({
        org_id: org._id,
        username: 'admin',
        email: 'admin@zentradigital.com',
        password_hash,
        role_id: adminRole._id,
        user_type: 'admin',
        is_active: true
      });
      console.log('[MongoDB] Default Admin user (admin / Admin@123) initialized.');
    } else if (adminUser && adminRole) {
      adminUser.role_id = adminRole._id;
      adminUser.is_active = true;
      adminUser.password_hash = password_hash;
      await adminUser.save();
    }

    if (adminUser) {
      let empExists = await Employee.findOne({ employee_code: 'EMP-001' });
      if (!empExists) {
        await Employee.create({
          user_id: adminUser._id,
          org_id: org._id,
          employee_code: 'EMP-001',
          first_name: 'Admin',
          last_name: 'Director',
          department_id: deptMap['Executive & Management'],
          designation: 'Agency Principal & Administrator',
          employee_type: 'full_time',
          employment_status: 'Active',
          phone: '+91 98765 00001'
        });
      } else {
        empExists.user_id = adminUser._id;
        empExists.employment_status = 'Active';
        await empExists.save();
      }
    }

    console.log('[MongoDB] Fresh start active: Only Admin account initialized.');
  } catch (err) {
    console.error('[MongoDB] Error verifying system roles:', err.message);
  }
}

