import React, { useState } from 'react'
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Message,
  Space,
  Checkbox
} from '@arco-design/web-react'
import { IconUser, IconLock } from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import http from '../utils/http'
import { isAuthenticated, saveLoginInfo } from '../utils/auth'
import { getBdXmList, getBdGdInfo } from '../services/projectAPI'
import { getLoginRedirectPath } from '../utils/roleAuth'

const FormItem = Form.Item

// 登录请求类型
interface LoginRequest {
  username: string
  password: string
}

// 登录响应类型
interface LoginResponse {
  token: string
  login?: string  // 后端可能不返回，使用可选
  userId?: number
  roles: string[]
}

// API响应类型
interface BaseResponse<T> {
  resultcode: number
  message: string
  data: T
}

function LoginPage() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // 处理登录
  const handleLogin = async (values: LoginRequest & { remember?: boolean }) => {
    setLoading(true)
    try {
      console.log('🔐 登录请求:', { 
        url: '/api/auth/login',
        login: values.username, 
        password: '******',
        fullPayload: {
          login: values.username,
          password: values.password
        }
      })

      // http拦截器已经返回response.data，所以response就是BaseResponse类型
      // 注意：后端字段从 username 改为 login
      const response = await http.post<BaseResponse<LoginResponse>>(
        '/api/auth/login',
        {
          login: values.username,
          password: values.password
        }
      )

      console.log('✅ 登录响应:', {
        resultcode: response.resultcode,
        message: response.message,
        hasData: !!response.data,
        fullResponse: response
      })

      // response已经是BaseResponse<LoginResponse>类型
      // 注意：后端成功状态码是 0，不是 200
      if (response.resultcode === 0 && response.data) {
        // 打印后端返回的完整数据，用于调试
        console.log('📦 [Login] 后端返回的完整数据:', response.data)
        
        const { token, login, userId, roles } = response.data
        
        // 如果后端没有返回login，使用登录时输入的用户名
        const finalLogin = login || values.username
        
        console.log('📦 [Login] 解析后的数据:', {
          token,
          login: finalLogin,
          userId,
          roles,
          note: login ? '使用后端返回的login' : '使用登录输入的username'
        })

        // 存储token和用户信息
        saveLoginInfo(token, finalLogin, userId, roles)

        // 如果勾选了记住密码
        if (values.remember) {
          localStorage.setItem('rememberedLogin', values.username)
        } else {
          localStorage.removeItem('rememberedLogin')
        }

        Message.success('登录成功！')
        
        // 登录成功后，获取标段和项目信息
        try {
          const bdXmData = await getBdXmList()
          console.log('📋 [Login] 标段和项目列表:', bdXmData)
          
          // 如果有标段数据，获取第一个标段的工点信息
          if (bdXmData.data && Array.isArray(bdXmData.data) && bdXmData.data.length > 0) {
            const firstBd = bdXmData.data[0]
            console.log('🏗️ [Login] 获取第一个标段的工点信息, bdId:', firstBd.bdId)
            
            const bdGdData = await getBdGdInfo(firstBd.bdId)
            console.log('📍 [Login] 工点信息:', bdGdData)
          }
        } catch (apiError) {
          console.error('⚠️ [Login] 获取项目数据失败，但不影响登录:', apiError)
          // 即使API调用失败也不影响登录流程
        }
        
        // 根据用户角色跳转到对应的首页
        const redirectPath = getLoginRedirectPath()
        console.log('🚀 [Login] 根据角色跳转:', { roles, redirectPath })
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          navigate(redirectPath)
        }, 500)
      } else {
        const errorMsg = `登录失败 (resultcode: ${response.resultcode}): ${response.message || '未知错误'}`
        console.error('❌', errorMsg)
        Message.error(errorMsg)
      }
    } catch (error: any) {
      console.error('❌ 登录异常:', {
        message: error.message,
        response: error.response,
        fullError: error
      })
      
      // 显示更详细的错误信息
      if (error.response) {
        const errData = error.response.data
        const errorMsg = `登录失败: ${errData?.message || error.message || '网络错误'}`
        Message.error(errorMsg)
      } else if (error.request) {
        Message.error('无法连接到服务器，请检查网络连接')
      } else {
        Message.error(error.message || '登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时检查登录状态和记住的用户名
  React.useEffect(() => {
    // 如果已登录，直接跳转到首页
    if (isAuthenticated()) {
      navigate('/home', { replace: true })
      return
    }

    // 检查是否有记住的登录名
    const rememberedLogin = localStorage.getItem('rememberedLogin')
    if (rememberedLogin) {
      form.setFieldsValue({
        username: rememberedLogin,
        remember: true
      })
    }
  }, [form, navigate])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'backgroundMove 20s linear infinite'
      }} />

      <style>
        {`
          @keyframes backgroundMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}
      </style>

      <Card
        style={{
          width: 420,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          borderRadius: '16px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo和标题 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            color: '#fff',
            fontWeight: 'bold'
          }}>
            地
          </div>
          <h2 style={{ 
            margin: 0,
            fontSize: '28px',
            fontWeight: 600,
            color: '#1d2129',
            marginBottom: '8px'
          }}>
            超前地质预报系统
          </h2>
          <p style={{ 
            margin: 0,
            fontSize: '14px',
            color: '#86909c'
          }}>
            Advanced Geological Forecast System
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleLogin}
          autoComplete="off"
        >
          <FormItem
            field="username"
            rules={[
              { required: true, message: '请输入用户名' }
            ]}
          >
            <Input
              prefix={<IconUser />}
              placeholder="请输入用户名"
              size="large"
              style={{ 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </FormItem>

          <FormItem
            field="password"
            rules={[
              { required: true, message: '请输入密码' }
            ]}
          >
            <Input.Password
              prefix={<IconLock />}
              placeholder="请输入密码"
              size="large"
              style={{ 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </FormItem>

          <FormItem field="remember" triggerPropName="checked" style={{ marginBottom: '8px' }}>
            <Checkbox>记住用户名</Checkbox>
          </FormItem>

          <FormItem style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              long
              style={{
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                height: '44px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              登录
            </Button>
          </FormItem>
        </Form>

        {/* 底部提示 */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e6eb',
          textAlign: 'center'
        }}>
          <Space size="large">
            <a 
              href="#" 
              style={{ 
                color: '#667eea', 
                fontSize: '14px',
                textDecoration: 'none'
              }}
              onClick={(e) => {
                e.preventDefault()
                Message.info('请联系管理员重置密码')
              }}
            >
              忘记密码？
            </a>
            <span style={{ color: '#e5e6eb' }}>|</span>
            <a 
              href="#" 
              style={{ 
                color: '#667eea', 
                fontSize: '14px',
                textDecoration: 'none'
              }}
              onClick={(e) => {
                e.preventDefault()
                Message.info('请联系管理员申请账号')
              }}
            >
              申请账号
            </a>
          </Space>
        </div>

        {/* 版本信息 */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#c9cdd4'
        }}>
          <div>测试账号：admin / password123</div>
          <div style={{ marginTop: '8px' }}>Version 1.0.0</div>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage

