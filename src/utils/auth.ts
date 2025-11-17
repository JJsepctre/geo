/**
 * 认证相关的工具函数
 */

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token')
  const login = localStorage.getItem('login')
  return !!(token && login)
}

/**
 * 获取当前登录的用户信息
 */
export function getCurrentUser() {
  return {
    token: localStorage.getItem('token'),
    login: localStorage.getItem('login'),
    userId: localStorage.getItem('userId'),
    roles: JSON.parse(localStorage.getItem('roles') || '[]')
  }
}

/**
 * 退出登录
 * 清除所有本地存储的用户信息
 */
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('login')
  localStorage.removeItem('userId')
  localStorage.removeItem('roles')
  // 不清除 rememberedLogin，保留记住的登录名
}

/**
 * 保存登录信息
 */
export function saveLoginInfo(
  token: string,
  login: string,
  userId: number | undefined,
  roles: string[]
) {
  localStorage.setItem('token', token)
  localStorage.setItem('login', login)
  // userId 可能为 undefined，需要处理
  localStorage.setItem('userId', userId ? userId.toString() : '0')
  localStorage.setItem('roles', JSON.stringify(roles || []))
}


