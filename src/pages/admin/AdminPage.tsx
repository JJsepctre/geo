import React, { useState } from 'react'
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Space, Typography, Message } from '@arco-design/web-react'
import { 
  IconUser, 
  IconSettings, 
  IconSafe, 
  IconHome,
  IconDown,
  IconLeft
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import UserManagement from './UserManagement'
import RoleManagement from './RoleManagement'
import PermissionManagement from './PermissionManagement'
import SiteManagement from './SiteManagement'

const { Header, Sider, Content } = Layout
const { Text } = Typography

function AdminPage() {
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState('users')
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      localStorage.removeItem('token')
      localStorage.removeItem('login')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('roles')
      Message.success('退出登录成功')
      navigate('/login')
    } else if (key === 'back') {
      navigate('/geo-forecast')
    }
  }

  const userMenuItems = [
    { key: 'back', label: '返回系统' },
    { key: 'logout', label: '退出登录' },
  ]

  const renderContent = () => {
    switch (selectedKey) {
      case 'users':
        return <UserManagement />
      case 'roles':
        return <RoleManagement />
      case 'permissions':
        return <PermissionManagement />
      case 'sites':
        return <SiteManagement />
      default:
        return <UserManagement />
    }
  }

  const menuTitles: Record<string, string> = {
    users: '用户管理',
    roles: '角色管理',
    permissions: '权限管理',
    sites: '工点管理'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航 */}
      <Header style={{ 
        backgroundColor: '#7c5cfc', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
            超前地质预报管理系统 - 管理后台
          </h2>
        </div>
        
        <Dropdown 
          droplist={
            <Menu onClickMenuItem={handleMenuClick}>
              {userMenuItems.map(item => (
                <Menu.Item key={item.key}>
                  {item.key === 'back' && <IconLeft style={{ marginRight: 8 }} />}
                  {item.label}
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar size={32} style={{ backgroundColor: '#fff', color: '#7c5cfc' }}>
              <IconUser />
            </Avatar>
            <Text style={{ color: '#fff' }}>管理员</Text>
            <IconDown style={{ color: '#fff' }} />
          </Space>
        </Dropdown>
      </Header>

      <Layout>
        {/* 左侧菜单 */}
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          style={{ backgroundColor: '#fff' }}
          width={220}
        >
          <Menu
            selectedKeys={[selectedKey]}
            onClickMenuItem={(key) => setSelectedKey(key)}
            style={{ height: '100%', borderRight: 'none' }}
          >
            <Menu.Item key="users">
              <IconUser style={{ marginRight: 8 }} />
              用户管理
            </Menu.Item>
            <Menu.Item key="roles">
              <IconSafe style={{ marginRight: 8 }} />
              角色管理
            </Menu.Item>
            <Menu.Item key="permissions">
              <IconSettings style={{ marginRight: 8 }} />
              权限管理
            </Menu.Item>
            <Menu.Item key="sites">
              <IconHome style={{ marginRight: 8 }} />
              工点管理
            </Menu.Item>
          </Menu>
        </Sider>

        {/* 主内容区 */}
        <Content style={{ padding: '16px 24px', backgroundColor: '#f5f6f7' }}>
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>管理后台</Breadcrumb.Item>
            <Breadcrumb.Item>{menuTitles[selectedKey]}</Breadcrumb.Item>
          </Breadcrumb>
          
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminPage
