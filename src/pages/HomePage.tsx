import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Layout, Avatar, Dropdown, Menu, Space, Typography, Message } from '@arco-design/web-react';
import { IconFile, IconExclamationCircle, IconQuestionCircle, IconUser, IconDown } from '@arco-design/web-react/icon';
import { logout } from '../utils/auth';
import http from '../utils/http';
import './HomePage.css';

const { Header, Content } = Layout;
const { Text } = Typography;
const TabPane = Tabs.TabPane;

function HomePage() {
  const navigate = useNavigate();

  // 处理用户菜单点击
  const handleMenuClick = async (key: string) => {
    switch (key) {
      case 'profile':
        Message.info('个人中心功能开发中...');
        break;
      case 'settings':
        Message.info('设置功能开发中...');
        break;
      case 'logout':
        await handleLogout();
        break;
      default:
        break;
    }
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 调用后端退出登录API
      await http.post('/api/auth/logout');
      
      // 清除本地存储
      logout();
      
      Message.success('退出登录成功');
      
      // 跳转到登录页
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      
      // 即使后端API失败，也清除本地存储并跳转
      logout();
      Message.warning('已退出登录');
      navigate('/login');
    }
  };

  // 下载文件的通用函数
  const handleDownload = async (fileType: string) => {
    try {
      Message.loading(`正在准备下载${fileType}...`);
      
      // 根据不同的文件类型设置不同的下载URL和文件名
      const downloadConfig: Record<string, { url: string; filename: string }> = {
        '设计预报模板': {
          url: '/api/download/design-forecast-template',
          filename: '设计预报模板.xlsx'
        },
        '地质预报模板': {
          url: '/api/download/geology-forecast-template',
          filename: '地质预报模板.xlsx'
        },
        '报错汇总': {
          url: '/api/download/error-report',
          filename: '报错汇总.xlsx'
        },
        '操作手册': {
          url: '/api/download/operation-manual',
          filename: '操作手册.pdf'
        }
      };

      const config = downloadConfig[fileType];
      if (!config) {
        Message.error('未找到对应的下载配置');
        return;
      }

      // 方式1: 如果后端提供直接的文件下载API
      const response = await fetch(config.url);
      
      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = config.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      Message.success(`${fileType}下载成功！`);
    } catch (error) {
      console.error('下载失败:', error);
      Message.error(`${fileType}下载失败，请稍后重试`);
    }
  };

  // 备用方案：如果文件在 public 文件夹中，可以直接下载
  // 使用方法：将卡片的 onClick 改为 onClick={() => handleDirectDownload('设计预报模板')}
  // const handleDirectDownload = (fileType: string) => {
  //   const fileMap: Record<string, string> = {
  //     '设计预报模板': '/templates/设计预报模板.xlsx',
  //     '地质预报模板': '/templates/地质预报模板.xlsx',
  //     '报错汇总': '/templates/报错汇总.xlsx',
  //     '操作手册': '/templates/操作手册.pdf'
  //   };
  //   const filePath = fileMap[fileType];
  //   if (filePath) {
  //     const link = document.createElement('a');
  //     link.href = filePath;
  //     link.download = filePath.split('/').pop() || 'download';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     Message.success(`${fileType}下载成功！`);
  //   } else {
  //     Message.error('文件不存在');
  //   }
  // };

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航栏 */}
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
              color: '#165dff',
              cursor: 'pointer',
              padding: '0 8px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '2px solid #165dff',
              fontWeight: 500
            }}
          >
            首页
          </div>
          <div 
            style={{ 
              fontSize: '16px',
              color: '#86909c',
              cursor: 'pointer',
              padding: '0 8px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s'
            }}
            onClick={() => navigate('/geo-forecast')}
            onMouseEnter={(e) => e.currentTarget.style.color = '#165dff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#86909c'}
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

      <Content style={{ 
        padding: '40px',
        backgroundColor: '#f0f2f5',
        overflowY: 'auto',
        height: 'calc(100vh - 64px)'
      }}>
      {/* 顶部四个功能卡片 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* 设计预报模板 */}
        <Card
          hoverable
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px'
          }}
          bodyStyle={{ padding: '20px' }}
          onClick={() => handleDownload('设计预报模板')}
        >
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconFile style={{ fontSize: '24px', color: '#fff' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  设计预报模板
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '11px',
                  marginTop: '4px',
                  letterSpacing: '0.5px'
                }}>
                  DESIGNFOR
                </div>
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              GO
            </div>
          </div>
        </Card>

        {/* 地质预报模板 */}
        <Card
          hoverable
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px'
          }}
          bodyStyle={{ padding: '20px' }}
          onClick={() => handleDownload('地质预报模板')}
        >
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconFile style={{ fontSize: '24px', color: '#fff' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  地质预报模板
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '11px',
                  marginTop: '4px',
                  letterSpacing: '0.5px'
                }}>
                  GEOLOGICAL
                </div>
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#4facfe',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              GO
            </div>
          </div>
        </Card>

        {/* 报错汇总下载 */}
        <Card
          hoverable
          style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px'
          }}
          bodyStyle={{ padding: '20px' }}
          onClick={() => handleDownload('报错汇总')}
        >
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconExclamationCircle style={{ fontSize: '24px', color: '#fff' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  报错汇总下载
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '11px',
                  marginTop: '4px',
                  letterSpacing: '0.5px'
                }}>
                  REPORTING
                </div>
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#fa709a',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              GO
            </div>
          </div>
        </Card>

        {/* 操作手册下载 */}
        <Card
          hoverable
          style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '120px'
          }}
          bodyStyle={{ padding: '20px' }}
          onClick={() => handleDownload('操作手册')}
        >
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconQuestionCircle style={{ fontSize: '24px', color: '#fff' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  操作手册下载
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '11px',
                  marginTop: '4px',
                  letterSpacing: '0.5px'
                }}>
                  OPERATION
                </div>
              </div>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#43e97b',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              GO
            </div>
          </div>
        </Card>
      </div>

      {/* 操作展示模块 */}
      <Card
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: 'calc(100vh - 64px - 120px - 48px - 80px)', // 减去header、顶部卡片、间距和padding
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* 紫色标题栏 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 32px',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 600,
          flexShrink: 0
        }}>
          操作展示模块
        </div>

        {/* 选项卡内容 - 可滚动 */}
        <div style={{ 
          padding: '32px',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <Tabs defaultActiveTab="1" type="line">
            <TabPane key="1" title="地震波反射">
              <OperationSteps type="地震波反射" />
            </TabPane>
            <TabPane key="2" title="电磁波反射">
              <OperationSteps type="电磁波反射" />
            </TabPane>
            <TabPane key="3" title="掌子面素描">
              <OperationSteps type="掌子面素描" />
            </TabPane>
            <TabPane key="4" title="加深炮孔">
              <OperationSteps type="加深炮孔" />
            </TabPane>
            <TabPane key="5" title="超前水平钻">
              <OperationSteps type="超前水平钻" />
            </TabPane>
          </Tabs>
        </div>
      </Card>
      </Content>
    </Layout>
  );
}

// 操作步骤组件
function OperationSteps({ type }: { type: string }) {
  // 根据不同类型定义不同的步骤内容
  const stepsConfig: Record<string, Array<{ number: string; title: string; description: string }>> = {
    '地震波反射': [
      {
        number: '01',
        title: '下载模板',
        description: '在上述文件中选择地质预报模板，下载地震波反射所需要的文件。'
      },
      {
        number: '02',
        title: '更改表格',
        description: '解压文件后选择地震波反射模板，并更改模板内容为真实预报数据。'
      },
      {
        number: '03',
        title: '选择工点',
        description: '点击顶部地质预报进入预报页面，标段查询搜索栏段，左侧选择隧道，右侧查找工点。'
      },
      {
        number: '04',
        title: '选择模块',
        description: '在工点页面中选择地震波反射按钮进入页面，在此页面中可上传数据模板。'
      },
      {
        number: '05',
        title: '导入模板',
        description: '在地震波反射页面中，点击导入按钮，选择已填写好的地震波反射模板文件进行上传。'
      },
      {
        number: '06',
        title: '添加文件',
        description: '确认地震波反射数据无误后，点击添加文件按钮，将预报数据保存到系统中。'
      }
    ],
    '电磁波反射': [
      {
        number: '01',
        title: '下载模板',
        description: '在上述文件中选择地质预报模板，下载电磁波反射所需要的文件。'
      },
      {
        number: '02',
        title: '更改表格',
        description: '解压文件后选择电磁波反射模板，并更改模板内容为真实预报数据。'
      },
      {
        number: '03',
        title: '选择工点',
        description: '点击顶部地质预报进入预报页面，标段查询搜索栏段，左侧选择隧道，右侧查找工点。'
      },
      {
        number: '04',
        title: '选择模块',
        description: '在工点页面中选择电磁波反射按钮进入页面，在此页面中可上传数据模板。'
      },
      {
        number: '05',
        title: '导入模板',
        description: '在电磁波反射页面中，点击导入按钮，选择已填写好的电磁波反射模板文件进行上传。'
      },
      {
        number: '06',
        title: '添加文件',
        description: '确认电磁波反射数据无误后，点击添加文件按钮，将预报数据保存到系统中。'
      }
    ],
    '掌子面素描': [
      {
        number: '01',
        title: '下载模板',
        description: '在上述文件中选择地质预报模板，下载掌子面素描所需要的文件。'
      },
      {
        number: '02',
        title: '更改表格',
        description: '解压文件后选择掌子面素描模板，并更改模板内容为真实素描数据。'
      },
      {
        number: '03',
        title: '选择工点',
        description: '点击顶部地质预报进入预报页面，标段查询搜索栏段，左侧选择隧道，右侧查找工点。'
      },
      {
        number: '04',
        title: '选择模块',
        description: '在工点页面中选择掌子面素描按钮进入页面，在此页面中可上传素描数据。'
      },
      {
        number: '05',
        title: '导入模板',
        description: '在掌子面素描页面中，点击导入按钮，选择已填写好的掌子面素描模板文件进行上传。'
      },
      {
        number: '06',
        title: '添加文件',
        description: '确认掌子面素描数据无误后，点击添加文件按钮，将素描数据保存到系统中。'
      }
    ],
    '加深炮孔': [
      {
        number: '01',
        title: '下载模板',
        description: '在上述文件中选择地质预报模板，下载加深炮孔所需要的文件。'
      },
      {
        number: '02',
        title: '更改表格',
        description: '解压文件后选择加深炮孔模板，并更改模板内容为真实炮孔数据。'
      },
      {
        number: '03',
        title: '选择工点',
        description: '点击顶部地质预报进入预报页面，标段查询搜索栏段，左侧选择隧道，右侧查找工点。'
      },
      {
        number: '04',
        title: '选择模块',
        description: '在工点页面中选择加深炮孔按钮进入页面，在此页面中可上传炮孔数据。'
      },
      {
        number: '05',
        title: '导入模板',
        description: '在加深炮孔页面中，点击导入按钮，选择已填写好的加深炮孔模板文件进行上传。'
      },
      {
        number: '06',
        title: '添加文件',
        description: '确认加深炮孔数据无误后，点击添加文件按钮，将炮孔数据保存到系统中。'
      }
    ],
    '超前水平钻': [
      {
        number: '01',
        title: '下载模板',
        description: '在上述文件中选择地质预报模板，下载超前水平钻所需要的文件。'
      },
      {
        number: '02',
        title: '更改表格',
        description: '解压文件后选择超前水平钻模板，并更改模板内容为真实钻孔数据。'
      },
      {
        number: '03',
        title: '选择工点',
        description: '点击顶部地质预报进入预报页面，标段查询搜索栏段，左侧选择隧道，右侧查找工点。'
      },
      {
        number: '04',
        title: '选择模块',
        description: '在工点页面中选择超前水平钻按钮进入页面，在此页面中可上传钻孔数据。'
      },
      {
        number: '05',
        title: '导入模板',
        description: '在超前水平钻页面中，点击导入按钮，选择已填写好的超前水平钻模板文件进行上传。'
      },
      {
        number: '06',
        title: '添加文件',
        description: '确认超前水平钻数据无误后，点击添加文件按钮，将钻孔数据保存到系统中。'
      }
    ]
  };

  const steps = stepsConfig[type] || stepsConfig['地震波反射'];

  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginTop: '24px'
    }}>
      {/* 左侧：6个步骤卡片 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
      }}>
        {steps.map((step) => (
          <Card
            key={step.number}
            style={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              border: 'none',
              borderRadius: '12px',
              height: '100%'
            }}
            bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ 
              fontSize: '40px', 
              fontWeight: 'bold', 
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '10px',
              lineHeight: 1
            }}>
              {step.number}
            </div>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: 600,
              color: '#333',
              marginBottom: '6px'
            }}>
              {step.title}
            </div>
            <div style={{ 
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.5',
              flex: 1
            }}>
              {step.description}
            </div>
          </Card>
        ))}
      </div>

      {/* 右侧：视频展示区域 */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '12px',
          minHeight: '100%'
        }}
        bodyStyle={{ 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <div style={{ 
          textAlign: 'center',
          color: '#fff',
          width: '100%',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            操作演示视频 - {type}
          </div>
          <div style={{ 
            fontSize: '13px', 
            opacity: 0.9,
            marginTop: '8px'
          }}>
            了解{type}的完整工作流程和操作步骤
          </div>
        </div>
        
        {/* 视频播放器 */}
        <div style={{
          width: '100%',
          flex: 1,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video
            key={type} // 添加key确保不同类型时重新加载视频
            controls
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            poster={`/videos/${type}-poster.jpg`}
          >
            <source src={`/videos/${type}-demo.mp4`} type="video/mp4" />
            <source src={`/videos/${type}-demo.webm`} type="video/webm" />
            您的浏览器不支持视频播放
          </video>
        </div>
      </Card>
    </div>
  );
}

export default HomePage;

