import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Input, 
  Button, 
  Card,
  Space,
  Typography,
  Divider,
  List,
  Spin,
  Message,
  Empty,
  Select
} from '@arco-design/web-react';
import { IconSearch, IconUser, IconDown, IconFile } from '@arco-design/web-react/icon';
import { Tunnel, WorkPoint, Project } from '../services/geoForecastAPI';
import { mockGeoForecastAPI } from '../services/mockAPI';
import { mockConfig } from '../services/mockConfig';
import './HelloPage.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Text } = Typography;

function HelloPage() {
  // 状态管理
  const [selectedTunnel, setSelectedTunnel] = useState<string>('');
  const [tunnelList, setTunnelList] = useState<Tunnel[]>([]);
  const [workPoints, setWorkPoints] = useState<WorkPoint[]>([]);
  const [projectInfo, setProjectInfo] = useState<Project | null>(null);
  
  // 搜索状态
  const [tunnelSearchKeyword, setTunnelSearchKeyword] = useState('');
  const [workPointSearchKeyword, setWorkPointSearchKeyword] = useState('');
  const [selectedWorkPointType, setSelectedWorkPointType] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [filteredTunnels, setFilteredTunnels] = useState<Tunnel[]>([]);
  const [filteredWorkPoints, setFilteredWorkPoints] = useState<WorkPoint[]>([]);
  
  // 加载状态
  const [loadingTunnels, setLoadingTunnels] = useState(false);
  const [loadingWorkPoints, setLoadingWorkPoints] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '退出登录' },
  ];

  // 获取项目信息
  const fetchProjectInfo = useCallback(async () => {
    setLoadingProject(true);
    try {
      // 假设当前项目ID为 'project-001'
      const project = await mockGeoForecastAPI.getProjectInfo('project-001');
      setProjectInfo(project);
    } catch (error) {
      console.error('获取项目信息失败:', error);
      Message.error('获取项目信息失败');
      // 设置默认项目信息
      setProjectInfo({
        id: 'project-001',
        name: '渝昆高铁引入昆明枢纽组织工程',
        constructionUnit: '渝昆高铁引入昆明枢纽组织工程'
      });
    } finally {
      setLoadingProject(false);
    }
  }, []);

  // 获取隧道列表
  const fetchTunnelList = useCallback(async () => {
    setLoadingTunnels(true);
    try {
      const tunnels = await mockGeoForecastAPI.getTunnelList('project-001');
      setTunnelList(tunnels);
      setFilteredTunnels(tunnels);
      
      // 如果没有选中的隧道，默认选中第一个
      if (tunnels.length > 0 && !selectedTunnel) {
        setSelectedTunnel(tunnels[0].id);
      }
    } catch (error) {
      console.error('获取隧道列表失败:', error);
      Message.error('获取隧道列表失败');
      // 设置默认隧道数据
      const defaultTunnels: Tunnel[] = [
        { id: '1', name: '大庆山隧道', code: 'DQS', status: 'active', projectId: 'project-001' },
        { id: '2', name: '青龙山隧道', code: 'QLS', status: 'active', projectId: 'project-001' },
        { id: '3', name: '阳春1号隧道', code: 'YC1', status: 'active', projectId: 'project-001' },
        { id: '4', name: '阳春2号隧道', code: 'YC2', status: 'active', projectId: 'project-001' },
        { id: '5', name: '青草山隧道', code: 'QCS', status: 'active', projectId: 'project-001' },
        { id: '6', name: '新对歌山隧道', code: 'XDGS', status: 'active', projectId: 'project-001' },
      ];
      setTunnelList(defaultTunnels);
      setFilteredTunnels(defaultTunnels);
      if (!selectedTunnel) {
        setSelectedTunnel(defaultTunnels[0].id);
      }
    } finally {
      setLoadingTunnels(false);
    }
  }, [selectedTunnel]);

  // 获取工点列表
  const fetchWorkPoints = useCallback(async (tunnelId: string) => {
    if (!tunnelId) return;
    
    setLoadingWorkPoints(true);
    try {
      const result = await mockGeoForecastAPI.getWorkPoints({ tunnelId, pageSize: 100 });
      setWorkPoints(result.data);
      setFilteredWorkPoints(result.data);
    } catch (error) {
      console.error('获取工点列表失败:', error);
      Message.error('获取工点列表失败');
      // 设置默认工点数据
      const defaultWorkPoints: WorkPoint[] = [
        { id: '1', name: 'DK713+920大庆山隧道明洞', code: 'DK713+920', mileage: 713920, tunnelId, length: 60, status: 'active', createdAt: '2024-01-01' },
        { id: '2', name: 'DK713+920大庆山隧道明洞小里程', code: 'DK713+920-S', mileage: 713920, tunnelId, length: -505, status: 'active', createdAt: '2024-01-01' },
        { id: '3', name: 'DK714+996大庆山隧道明洞', code: 'DK714+996', mileage: 714996, tunnelId, length: 22, status: 'active', createdAt: '2024-01-01' },
        { id: '4', name: 'DK714+996大庆山隧道明洞大里程', code: 'DK714+996-L', mileage: 714996, tunnelId, length: 1413, status: 'active', createdAt: '2024-01-01' },
        { id: '5', name: 'DK714+996大庆山隧道明洞小里程', code: 'DK714+996-S', mileage: 714996, tunnelId, length: -1035, status: 'active', createdAt: '2024-01-01' },
        { id: '6', name: '大庆山隧道出口明洞', code: 'DQS-EXIT', mileage: 715000, tunnelId, length: 15, status: 'active', createdAt: '2024-01-01' },
        { id: '7', name: '大庆山隧道出口洞门', code: 'DQS-GATE', mileage: 715100, tunnelId, length: -6, status: 'active', createdAt: '2024-01-01' },
      ];
      setWorkPoints(defaultWorkPoints);
      setFilteredWorkPoints(defaultWorkPoints);
    } finally {
      setLoadingWorkPoints(false);
    }
  }, []);

  // 隧道搜索处理
  const handleTunnelSearch = useCallback((keyword: string) => {
    setTunnelSearchKeyword(keyword);
    if (!keyword.trim()) {
      setFilteredTunnels(tunnelList);
      return;
    }
    
    const filtered = tunnelList.filter(tunnel => 
      tunnel.name.toLowerCase().includes(keyword.toLowerCase()) ||
      tunnel.code.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredTunnels(filtered);
  }, [tunnelList]);

  // 应用工点筛选
  const applyWorkPointFilters = useCallback((keyword: string, type: string, risk: string) => {
    let filtered = workPoints;

    // 关键词搜索
    if (keyword.trim()) {
      filtered = filtered.filter(workPoint => 
        workPoint.name.toLowerCase().includes(keyword.toLowerCase()) ||
        workPoint.code.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 类型筛选
    if (type) {
      filtered = filtered.filter(workPoint => workPoint.type === type);
    }

    // 风险等级筛选
    if (risk) {
      filtered = filtered.filter(workPoint => workPoint.riskLevel === risk);
    }

    // 排序：置顶的在前面
    filtered.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      return 0;
    });

    setFilteredWorkPoints(filtered);
  }, [workPoints]);

  // 工点搜索和筛选处理
  const handleWorkPointSearch = useCallback(async (keyword: string) => {
    setWorkPointSearchKeyword(keyword);
    applyWorkPointFilters(keyword, selectedWorkPointType, selectedRiskLevel);
  }, [selectedWorkPointType, selectedRiskLevel, applyWorkPointFilters]);

  // 当筛选条件变化时重新应用筛选
  useEffect(() => {
    applyWorkPointFilters(workPointSearchKeyword, selectedWorkPointType, selectedRiskLevel);
  }, [workPointSearchKeyword, selectedWorkPointType, selectedRiskLevel, applyWorkPointFilters]);

  // 隧道选择处理
  const handleTunnelSelect = useCallback((tunnelId: string) => {
    setSelectedTunnel(tunnelId);
    setWorkPointSearchKeyword(''); // 清空工点搜索
    fetchWorkPoints(tunnelId);
  }, [fetchWorkPoints]);

  // 工点置顶处理
  const handleWorkPointToggleTop = useCallback(async (workPointId: string, isTop: boolean) => {
    try {
      await mockGeoForecastAPI.toggleWorkPointTop(workPointId, isTop);
      
      // 更新本地状态
      const updatedWorkPoints = workPoints.map(wp => 
        wp.id === workPointId ? { ...wp, isTop } : wp
      );
      setWorkPoints(updatedWorkPoints);
      
      // 重新过滤和排序
      const filteredAndSorted = updatedWorkPoints
        .filter(wp => 
          !workPointSearchKeyword || 
          wp.name.toLowerCase().includes(workPointSearchKeyword.toLowerCase()) ||
          wp.code.toLowerCase().includes(workPointSearchKeyword.toLowerCase())
        )
        .sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
      
      setFilteredWorkPoints(filteredAndSorted);
      Message.success(isTop ? '置顶成功' : '取消置顶成功');
    } catch (error) {
      console.error('置顶操作失败:', error);
      Message.error('置顶操作失败');
    }
  }, [workPoints, workPointSearchKeyword]);

  // 初始化数据
  useEffect(() => {
    fetchProjectInfo();
    fetchTunnelList();
  }, [fetchProjectInfo, fetchTunnelList]);

  // 当选中隧道变化时，获取对应的工点数据
  useEffect(() => {
    if (selectedTunnel) {
      fetchWorkPoints(selectedTunnel);
    }
  }, [selectedTunnel, fetchWorkPoints]);

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
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#1d2129', fontSize: '20px', fontWeight: 600 }}>
            超前地质预报
          </h3>
          <Menu
            mode="horizontal"
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none',
              marginLeft: '60px'
            }}
            defaultSelectedKeys={['geology']}
          >
            <Menu.Item key="home">首页</Menu.Item>
            <Menu.Item key="geology">地质预报</Menu.Item>
          </Menu>
        </div>
        
        <Dropdown 
          droplist={
            <Menu>
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
      </Header>

      <Layout>
        {/* 左侧隧道选择面板 */}
        <Sider 
          width={280} 
          style={{ 
            backgroundColor: '#f7f8fa',
            borderRight: '1px solid #e8e9ea'
          }}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: 500,
              color: '#1d2129'
            }}>
              <IconFile style={{ marginRight: '8px', color: '#165dff' }} />
              标段查询
            </div>
            
            <Search 
              placeholder="搜索隧道名称或编号"
              style={{ marginBottom: '16px' }}
              value={tunnelSearchKeyword}
              onChange={(value) => handleTunnelSearch(value)}
              allowClear
            />

            <div style={{ marginTop: '20px' }}>
              <Spin loading={loadingTunnels}>
                {filteredTunnels.length === 0 ? (
                  <Empty 
                    description="暂无隧道数据"
                    style={{ padding: '20px 0' }}
                  />
                ) : (
                  filteredTunnels.map((tunnel) => (
                    <Card
                      key={tunnel.id}
                      hoverable
                      style={{
                        marginBottom: '8px',
                        backgroundColor: tunnel.id === selectedTunnel ? '#e8f3ff' : '#fff',
                        border: tunnel.id === selectedTunnel ? '1px solid #165dff' : '1px solid #e8e9ea',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      bodyStyle={{ padding: '12px 16px' }}
                      onClick={() => handleTunnelSelect(tunnel.id)}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: tunnel.id === selectedTunnel ? '#165dff' : '#1d2129'
                      }}>
                        <IconFile style={{ marginRight: '8px' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{tunnel.name}</div>
                          <div style={{ fontSize: '12px', color: '#86909c', marginTop: '2px' }}>
                            {tunnel.code}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </Spin>
            </div>
          </div>
        </Sider>

        {/* 主要内容区域 */}
        <Content style={{ backgroundColor: '#fff', padding: '24px' }}>
          {/* 统计概览卡片 */}
          <div style={{ 
            marginBottom: '24px',
            display: 'flex',
            gap: '16px'
          }}>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#165dff' }}>
                {mockConfig.project.totalTunnels}
              </div>
              <div style={{ color: '#86909c', marginTop: '4px' }}>隧道总数</div>
            </Card>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {mockConfig.project.totalWorkPoints}
              </div>
              <div style={{ color: '#86909c', marginTop: '4px' }}>工点总数</div>
            </Card>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {mockConfig.project.completedWorkPoints}
              </div>
              <div style={{ color: '#86909c', marginTop: '4px' }}>已完成</div>
            </Card>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                {mockConfig.project.highRiskPoints}
              </div>
              <div style={{ color: '#86909c', marginTop: '4px' }}>高风险工点</div>
            </Card>
          </div>

          {/* 项目信息区域 */}
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f7f8fa',
            borderRadius: '6px',
            borderLeft: '4px solid #165dff'
          }}>
            <Spin loading={loadingProject}>
              <Space size="large">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFile style={{ marginRight: '8px', color: '#165dff' }} />
                  <span style={{ fontWeight: 600, color: '#1d2129' }}>建设单位</span>
                  <Text style={{ marginLeft: '12px' }}>
                    {projectInfo?.constructionUnit || '渝昆高铁引入昆明枢纽组织工程'}
                  </Text>
                </div>
                
                <Divider type="vertical" style={{ height: '20px' }} />
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFile style={{ marginRight: '8px', color: '#165dff' }} />
                  <span style={{ fontWeight: 600, color: '#1d2129' }}>项目名称</span>
                  <Text style={{ marginLeft: '12px' }}>
                    {projectInfo?.name || '渝昆高铁引入昆明枢纽组织工程'}
                  </Text>
                </div>
              </Space>
            </Spin>
          </div>

          {/* 工点搜索区域 */}
          <Card 
            title="工点搜索"
            style={{ width: '100%' }}
            extra={
              <Space>
                <Search 
                  placeholder="输入名称搜索"
                  style={{ width: 200 }}
                  value={workPointSearchKeyword}
                  onChange={(value) => handleWorkPointSearch(value)}
                  allowClear
                  searchButton={
                    <Button type="primary" icon={<IconSearch />}>
                      搜索
                    </Button>
                  }
                />
                <Select
                  placeholder="工点类型"
                  style={{ width: 120 }}
                  value={selectedWorkPointType}
                  onChange={setSelectedWorkPointType}
                  allowClear
                >
                  <Select.Option value="明洞">明洞</Select.Option>
                  <Select.Option value="洞门">洞门</Select.Option>
                  <Select.Option value="主洞段">主洞段</Select.Option>
                  <Select.Option value="横通道">横通道</Select.Option>
                  <Select.Option value="暗挖段">暗挖段</Select.Option>
                  <Select.Option value="救援站">救援站</Select.Option>
                  <Select.Option value="通风井">通风井</Select.Option>
                </Select>
                <Select
                  placeholder="风险等级"
                  style={{ width: 100 }}
                  value={selectedRiskLevel}
                  onChange={setSelectedRiskLevel}
                  allowClear
                >
                  <Select.Option value="低风险">
                    <span style={{ color: '#52c41a' }}>低风险</span>
                  </Select.Option>
                  <Select.Option value="中风险">
                    <span style={{ color: '#faad14' }}>中风险</span>
                  </Select.Option>
                  <Select.Option value="高风险">
                    <span style={{ color: '#f5222d' }}>高风险</span>
                  </Select.Option>
                </Select>
                <Button 
                  onClick={() => {
                    // 刷新当前隧道的工点数据
                    if (selectedTunnel) {
                      fetchWorkPoints(selectedTunnel);
                    }
                  }}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Spin loading={loadingWorkPoints}>
              {filteredWorkPoints.length === 0 ? (
                <Empty 
                  description={workPointSearchKeyword ? "未找到匹配的工点" : "暂无工点数据"}
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  dataSource={filteredWorkPoints}
                  render={(item, index) => (
                    <List.Item 
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < filteredWorkPoints.length - 1 ? '1px solid #f2f3f5' : 'none',
                        transition: 'background-color 0.2s'
                      }}
                      className="work-point-item"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7f8fa';
                        e.currentTarget.style.margin = '0 -12px';
                        e.currentTarget.style.padding = '12px';
                        e.currentTarget.style.borderRadius = '4px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.margin = '0';
                        e.currentTarget.style.padding = '12px 0';
                        e.currentTarget.style.borderRadius = '0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <IconFile style={{ marginRight: '8px', color: '#86909c' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: item.isTop ? 600 : 400,
                            color: item.isTop ? '#165dff' : '#1d2129',
                            marginBottom: '4px'
                          }}>
                            {item.isTop && '📌 '}{item.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#86909c', 
                            display: 'flex', 
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <span>编号: {item.code}</span>
                            {item.type && <span>类型: {item.type}</span>}
                            {item.riskLevel && (
                              <span style={{ 
                                color: item.riskLevel === '高风险' ? '#f53f3f' : 
                                       item.riskLevel === '中风险' ? '#ff7d00' : '#00b42a'
                              }}>
                                {item.riskLevel}
                              </span>
                            )}
                            {item.geologicalCondition && <span>围岩: {item.geologicalCondition}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Text style={{ color: '#86909c', fontSize: '13px' }}>
                          工点长度: {item.length > 0 ? '+' : ''}{item.length}
                        </Text>
                        
                        <Button
                          type="text"
                          size="small"
                          onClick={() => handleWorkPointToggleTop(item.id, !item.isTop)}
                          style={{ 
                            color: item.isTop ? '#165dff' : '#86909c',
                            padding: '4px 8px'
                          }}
                        >
                          {item.isTop ? '取消置顶' : '置顶'}
                        </Button>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default HelloPage;