import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Layout, Avatar, Dropdown, Menu, Space, Typography, Message } from '@arco-design/web-react';
import { IconFile, IconExclamationCircle, IconQuestionCircle, IconUser, IconDown } from '@arco-design/web-react/icon';
import { logout } from '../utils/auth';
import http from '../utils/http';
import * as XLSX from 'xlsx';
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

      // 尝试从后端API下载
      try {
        const response = await fetch(config.url);
        
        if (!response.ok) {
          throw new Error('后端API下载失败，尝试本地生成');
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
        console.log('后端API下载失败，尝试本地生成文件:', error);
        // 后端API不可用时，使用本地生成的文件
        generateLocalFile(fileType, config.filename);
      }
    } catch (error) {
      console.error('下载失败:', error);
      Message.error(`${fileType}下载失败，请稍后重试`);
    }
  };

  // 本地生成文件函数
  const generateLocalFile = (fileType: string, filename: string) => {
    try {
      if (filename.endsWith('.xlsx')) {
        // 生成Excel文件
        const ws = generateExcelWorksheet(fileType);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
      } else if (filename.endsWith('.pdf')) {
        // 生成简单的文本文件作为PDF模拟
        generateTextFile(fileType, filename);
      }
      Message.success(`${fileType}生成成功！`);
    } catch (error) {
      console.error('生成文件失败:', error);
      Message.error(`${fileType}生成失败`);
    }
  };

  // 生成Excel工作表
  const generateExcelWorksheet = (fileType: string) => {
    let data: any[] = [];
    
    switch (fileType) {
      case '设计预报模板':
        // 设计预报模板 - 完整结构
        data = [
          ['超前地质预报设计表'],
          [],
          ['基本信息'],
          ['工点名称', '示例隧道'],
          ['所在标段', 'XX标段'],
          ['隧道编号', 'SD-001'],
          ['设计单位', 'XX设计研究院'],
          ['施工单位', 'XX工程局'],
          [],
          ['预报设计详情'],
          ['序号', '里程范围', '预报长度(m)', '预报方法', '设计次数', '最小埋深(m)', '最大埋深(m)', '地层岩性', '水文地质', '备注'],
          [1, 'DK713+890~+950', 60, '地震波反射(超前探测)', 1, 20, 50, '砂岩', '干燥', '首次预报'],
          [2, 'DK713+950~+1010', 60, '地质雷达', 1, 25, 55, '砂岩夹泥岩', '潮湿', ''],
          [3, 'DK713+1010~+1070', 60, '地震波反射+地质雷达', 1, 30, 60, '泥岩', '可能有裂隙水', '断裂带附近'],
          [],
          ['设计说明:', '1. 预报方法选择依据《铁路隧道超前地质预报技术规程》(TB 10123-2019)\n2. 施工过程中应根据实际地质情况及时调整预报参数\n3. 预报数据应及时录入系统，确保数据完整性'],
          [],
          ['设计负责人:', '', '日期:', new Date().toLocaleDateString()],
          ['审核:', '', '批准:', '']
        ];
        break;
      case '地质预报模板':
        // 地质预报模板 - 完整结构
        data = [
          ['隧道超前地质预报记录表'],
          [],
          ['基本信息'],
          ['工点名称', '示例隧道'],
          ['掌子面里程', 'DK713+920'],
          ['预报日期', new Date().toLocaleDateString()],
          ['预报单位', 'XX工程局地质预报组'],
          ['预报负责人', '李四'],
          [],
          ['预报参数'],
          ['预报方法', '地震波反射法+地质雷达'],
          ['预报设备', 'TSP203/TSP206'],
          ['预报长度(m)', 100],
          ['测线布置', '掌子面正顶及左右侧'],
          ['传感器数量', 24],
          [],
          ['数据采集与处理'],
          ['信号质量', '良好'],
          ['数据处理软件', 'TSPwin'],
          ['处理参数', '滤波频率100-1000Hz'],
          [],
          ['地质异常识别'],
          ['序号', '异常里程范围', '异常特征描述', '反射波特征', '推测地质情况'],
          [1, 'DK713+920~+940', '弱反射界面，连续性差', '振幅中等，频率偏低', '节理裂隙发育带'],
          [2, 'DK713+940~+960', '强反射界面，连续性好', '振幅强，频率较高', '可能为断层破碎带'],
          [3, 'DK713+960~+980', '中强反射界面，局部连续性差', '振幅中等，频率变化较大', '可能存在富水区'],
          [],
          ['预报结论'],
          ['1. 掌子面前方100m范围内存在三处主要地质异常。\n2. DK713+940~+960段断层破碎带为主要风险点，建议加强支护。\n3. DK713+960~+980段可能存在富水区，需做好防水措施。\n4. 施工过程中应密切观察掌子面变化，及时调整施工参数。'],
          [],
          ['预报人员:', '', '审核:', '', '批准:', '']
        ];
        break;
      case '报错汇总':
        // 报错汇总 - 完整结构
        data = [
          ['超前地质预报系统错误报告汇总'],
          [],
          ['统计信息'],
          ['报告生成时间:', new Date().toLocaleString()],
          ['错误总数:', 12],
          ['已处理:', 5],
          ['待处理:', 7],
          ['处理率:', '41.67%'],
          [],
          ['错误类型分布'],
          ['错误类型', '数量', '占比', '主要原因'],
          ['数据格式错误', 4, '33.33%', '里程格式不规范，必填项缺失'],
          ['系统功能错误', 3, '25.00%', '报表生成失败，数据导入异常'],
          ['权限访问错误', 2, '16.67%', '无权限操作，登录超时'],
          ['数据一致性错误', 2, '16.67%', '前后数据不一致，关联数据缺失'],
          ['其他错误', 1, '8.33%', '网络中断，系统卡顿'],
          [],
          ['详细错误列表'],
          ['错误ID', '错误类型', '错误描述', '发生时间', '涉及工点', '涉及功能模块', '严重程度', '处理状态', '责任人', '处理时间', '处理结果'],
          ['ERR-20240101-001', '数据格式错误', '里程格式不正确，缺少加号', '2024-01-01 10:23', 'DK713+920', '地质预报录入', '中', '已处理', '张三', '2024-01-01 14:30', '修复里程格式'],
          ['ERR-20240101-002', '系统功能错误', '报表生成时数据溢出', '2024-01-01 11:45', 'DK713+890', '报表管理', '高', '已处理', '李四', '2024-01-01 15:15', '优化数据处理逻辑'],
          ['ERR-20240102-003', '权限访问错误', '用户无权限导出报表', '2024-01-02 09:15', 'DK714+120', '用户管理', '低', '待处理', '-', '-', '-'],
          ['ERR-20240102-004', '数据一致性错误', '设计预报与实际预报数据不匹配', '2024-01-02 14:30', 'DK714+050', '数据审核', '中', '待处理', '-', '-', '-'],
          ['ERR-20240103-005', '系统功能错误', '数据导入时Excel格式不兼容', '2024-01-03 16:20', 'DK714+200', '数据导入', '高', '待处理', '-', '-', '-'],
          [],
          ['问题分析与建议'],
          ['1. 数据格式错误占比最高，建议加强前端数据验证和用户培训\n2. 系统功能错误主要集中在报表生成模块，建议进行专项优化\n3. 建议建立错误跟踪机制，定期分析错误类型分布\n4. 对高频错误类型开发自动化修复工具'],
          [],
          ['报告生成人:', '系统管理员', '报告日期:', new Date().toLocaleDateString()]
        ];
        break;
      default:
        data = [['数据模板'], ['无数据']];
    }
    
    return XLSX.utils.aoa_to_sheet(data);
  };

  // 生成文本文件（模拟PDF）
  const generateTextFile = (fileType: string, filename: string) => {
    let content = '';
    
    if (fileType === '操作手册') {
      content = `=====================================================
           超前地质预报信息管理系统
                  操作手册
                  V1.0.0
       发布日期: ${new Date().toLocaleDateString()}
=====================================================

目录
1. 系统概述
2. 系统架构
3. 功能模块
4. 使用指南
5. 常见问题
6. 系统维护
7. 附录


1. 系统概述
1.1 系统简介
   超前地质预报信息管理系统是一套专为隧道工程地质预报数据采集、管理、分析和展示而设计的综合性信息系统。
   系统支持设计预报、地质预报、数据查询、统计分析等核心功能，为隧道施工安全提供技术支撑。

1.2 系统特点
   - 数据标准化：统一数据格式，确保数据质量和可比性
   - 功能模块化：清晰的功能划分，操作简便
   - 可视化展示：直观展示地质数据和预报成果
   - 多级权限：完善的权限管理体系，保障数据安全
   - 可扩展性：灵活的系统架构，支持功能扩展

1.3 适用范围
   适用于铁路、公路、水利等各类隧道工程的超前地质预报工作。


2. 系统架构
2.1 技术架构
   前端：React + TypeScript + Arco Design
   后端：Spring Boot + MySQL + Redis
   数据存储：MySQL关系型数据库 + 文件存储

2.2 网络架构
   系统支持局域网部署，可通过VPN远程访问。建议配置稳定的网络环境，带宽不低于10Mbps。

2.3 浏览器要求
   - Chrome 90+ / Firefox 88+ / Edge 90+
   - 分辨率不低于1024x768
   - 建议使用1920x1080分辨率以获得最佳体验


3. 功能模块
3.1 首页
   - 快速访问常用功能
   - 下载各类模板文件
   - 系统通知和待办事项展示

3.2 设计预报管理
   - 设计预报录入
   - 设计预报查询
   - 设计预报修改和删除
   - 设计预报报表生成

3.3 地质预报管理
   - 地质预报数据录入
   - 预报数据查询和筛选
   - 异常数据标记
   - 预报成果导出

3.4 工点管理
   - 工点信息维护
   - 工点地图展示
   - 工点相关数据关联

3.5 用户和权限管理
   - 用户信息维护
   - 角色权限配置
   - 操作日志查看

3.6 报表中心
   - 各类统计报表生成
   - 图表可视化展示
   - 报表导出（Excel/PDF）


4. 使用指南
4.1 系统登录
   1. 打开浏览器，输入系统URL
   2. 在登录页面输入用户名和密码
   3. 点击"登录"按钮进入系统

4.2 模板下载
   1. 在首页找到相应的模板下载卡片
   2. 点击卡片上的"GO"按钮或直接点击卡片
   3. 系统将自动下载相应的模板文件
   4. 使用下载的模板进行数据填写

4.3 设计预报录入
   1. 点击左侧菜单栏的"设计预报管理"
   2. 点击"新增"按钮
   3. 填写设计预报基本信息
   4. 填写预报设计详情
   5. 点击"保存"按钮提交数据

4.4 地质预报查询
   1. 点击左侧菜单栏的"地质预报管理"
   2. 在查询条件区域输入筛选条件
   3. 点击"查询"按钮查看结果
   4. 可选择导出查询结果或查看详情

4.5 报表生成
   1. 点击左侧菜单栏的"报表中心"
   2. 选择需要生成的报表类型
   3. 设置报表参数和时间范围
   4. 点击"生成报表"按钮
   5. 可选择在线查看或导出报表


5. 常见问题
5.1 登录问题
   Q: 无法登录系统？
   A: 请检查用户名和密码是否正确；确认网络连接正常；联系管理员重置密码。

5.2 数据录入问题
   Q: 无法保存数据？
   A: 检查必填项是否已填写；确认数据格式是否正确；联系技术人员。

5.3 报表导出问题
   Q: 报表导出失败？
   A: 检查数据量是否过大；确认浏览器是否允许下载；尝试更换浏览器。

5.4 系统性能问题
   Q: 系统运行缓慢？
   A: 清理浏览器缓存；关闭不必要的浏览器标签；检查网络连接。


6. 系统维护
6.1 日常维护
   - 定期备份数据库
   - 检查服务器运行状态
   - 更新系统补丁

6.2 数据备份
   - 建议每日进行增量备份
   - 每周进行全量备份
   - 备份数据异地存储

6.3 系统升级
   - 按照升级文档进行操作
   - 升级前备份所有数据
   - 升级后进行功能测试


7. 附录
7.1 数据字典
   列出系统中使用的主要数据字段及其说明。

7.2 快捷键说明
   Ctrl+S: 保存当前页面数据
   Ctrl+F: 页面内搜索
   F5: 刷新当前页面

7.3 联系方式
   技术支持电话：010-12345678
   技术支持邮箱：support@example.com
   工作时间：周一至周五 9:00-18:00


声明：本操作手册版权归超前地质预报信息管理系统开发团队所有，未经授权不得复制或传播。

© 2024 超前地质预报信息管理系统 版权所有`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

      {/* 底部备案信息 */}
      <div style={{
        textAlign: 'center',
        padding: '16px 0',
        marginTop: '24px',
        color: '#86909c',
        fontSize: '13px'
      }}>
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#86909c', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#165dff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#86909c'}
        >
          京ICP备2025153338号
        </a>
      </div>
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

