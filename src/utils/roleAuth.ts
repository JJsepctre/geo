/**
 * 角色权限工具
 */

import { UserRole, getHomePageByRole, hasRoutePermission } from '../config/roleRoutes';

/**
 * 获取当前用户角色
 */
export function getCurrentUserRole(): UserRole | null {
  const roles = localStorage.getItem('roles');
  if (!roles) return null;
  
  try {
    const roleArray = JSON.parse(roles);
    // 如果有多个角色，返回权限最高的
    if (roleArray.includes('admin')) return 'admin';
    if (roleArray.includes('manager')) return 'manager';
    if (roleArray.includes('engineer')) return 'engineer';
    if (roleArray.includes('user')) return 'user';
    return null;
  } catch {
    return null;
  }
}

/**
 * 根据角色获取登录后应该跳转的页面
 */
export function getLoginRedirectPath(): string {
  const role = getCurrentUserRole();
  if (!role) return '/home';
  
  return getHomePageByRole(role);
}

/**
 * 检查当前用户是否有权限访问指定路由
 */
export function checkRoutePermission(path: string): boolean {
  const role = getCurrentUserRole();
  if (!role) return false;
  
  // 管理员拥有所有权限
  if (role === 'admin') return true;
  
  return hasRoutePermission(role, path);
}

/**
 * 获取用户信息（包含角色）
 */
export function getCurrentUser() {
  const login = localStorage.getItem('login');
  const userId = localStorage.getItem('userId');
  const roles = localStorage.getItem('roles');
  
  if (!login || !roles) return null;
  
  return {
    login,
    userId: userId ? parseInt(userId) : 0,
    roles: JSON.parse(roles),
    role: getCurrentUserRole()
  };
}

/**
 * 检查是否是管理员
 */
export function isAdmin(): boolean {
  return getCurrentUserRole() === 'admin';
}

/**
 * 检查是否是项目经理
 */
export function isManager(): boolean {
  const role = getCurrentUserRole();
  return role === 'admin' || role === 'manager';
}

/**
 * 检查是否是技术人员
 */
export function isEngineer(): boolean {
  const role = getCurrentUserRole();
  return role === 'admin' || role === 'manager' || role === 'engineer';
}
