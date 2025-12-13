import React from 'react';
import { Layout, Dropdown, Menu, Space, Avatar, Typography, Message } from '@arco-design/web-react';
import { IconUser, IconDown } from '@arco-design/web-react/icon';

const { Header } = Layout;
const { Text } = Typography;

interface HelloHeaderProps {
  onNavigate: (path: string) => void;
  activeTab?: string;
}

const HelloHeader: React.FC<HelloHeaderProps> = ({ onNavigate, activeTab = 'forecast' }) => {
  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      // 清除登录信息
      localStorage.removeItem('token');
      localStorage.removeItem('login');
      localStorage.removeItem('userInfo');
      Message.success('退出登录成功');
      // 跳转到登录页
      onNavigate('/login');
    } else if (key === 'profile') {
      Message.info('个人中心功能开发中');
    } else if (key === 'settings') {
      Message.info('设置功能开发中');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <Header style={{ 
      backgroundColor: '#fff', 
      padding: '0 24px',
      borderBottom: '1px solid #e8e9ea',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      height: '64px',
      flexShrink: 0,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <h3 style={{ margin: 0, color: '#165dff', fontSize: '20px', fontWeight: 600 }}>
          超前地质预报
        </h3>
      </div>

      {/* 中间导航选项卡 */}
      <div style={{ 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '40px',
        alignItems: 'center',
        height: '64px'
      }}>
        <div 
          style={{ 
            fontSize: '16px',
            color: activeTab === 'home' ? '#165dff' : '#86909c',
            cursor: 'pointer',
            padding: '0 8px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: activeTab === 'home' ? '2px solid #165dff' : 'none',
            fontWeight: activeTab === 'home' ? 500 : 400,
            transition: 'color 0.2s'
          }}
          onClick={() => onNavigate('/home')}
          onMouseEnter={(e) => {
            if (activeTab !== 'home') e.currentTarget.style.color = '#165dff';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'home') e.currentTarget.style.color = '#86909c';
          }}
        >
          首页
        </div>
        <div 
          style={{ 
            fontSize: '16px',
            color: activeTab === 'forecast' ? '#165dff' : '#86909c',
            cursor: 'pointer',
            padding: '0 8px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: activeTab === 'forecast' ? '2px solid #165dff' : 'none',
            fontWeight: activeTab === 'forecast' ? 500 : 400
          }}
        >
          地质预报
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Dropdown 
          droplist={
            <Menu onClickMenuItem={handleMenuClick}>
              {userMenuItems.map(item => (
                <Menu.Item key={item.key}>{item.label}</Menu.Item>
              ))}
            </Menu>
          }
        >
          <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '6px' }} className="user-area">
            <Avatar size={32} style={{ backgroundColor: '#165dff' }}>
              <IconUser />
            </Avatar>
            <Text>admin</Text>
            <IconDown />
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HelloHeader;