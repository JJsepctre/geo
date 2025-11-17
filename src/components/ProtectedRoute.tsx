import React from 'react'
import { Navigate } from 'react-router-dom'
import { Message } from '@arco-design/web-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 路由守卫组件
 * 检查用户是否已登录，未登录则跳转到登录页
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token')
  const login = localStorage.getItem('login')

  // 检查是否已登录
  if (!token || !login) {
    // 显示提示信息
    Message.warning('请先登录')
    
    // 重定向到登录页
    return <Navigate to="/login" replace />
  }

  // 已登录，渲染子组件
  return <>{children}</>
}

export default ProtectedRoute


