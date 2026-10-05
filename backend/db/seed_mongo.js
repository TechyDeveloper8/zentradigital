import { initSystemRoles } from './init_roles.js';

/**
 * Legacy wrapper: Only initializes required system roles.
 * No dummy users, fake employees, or mock seed records are inserted.
 * All data in MongoDB is real-time.
 */
export async function seedDefaults() {
  await initSystemRoles();
}

export default seedDefaults;
