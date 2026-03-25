import { menuPermissions } from '../../mocks/datasets/permissions';
import type { UserRole } from '../../types/app';

export function getMenusByRole(role: UserRole) {
  return menuPermissions.filter((item) => item.roles.includes(role));
}

export function canAccessPath(role: UserRole, path: string) {
  return menuPermissions.some((item) => item.path === path && item.roles.includes(role));
}
