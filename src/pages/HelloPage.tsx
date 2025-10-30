import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Spin,
  Message,
  Empty,
  Select,
  Collapse
} from '@arco-design/web-react';
import { IconSearch, IconUser, IconDown, IconFile, IconRight } from '@arco-design/web-react/icon';
import { Tunnel, WorkPoint, Project } from '../services/geoForecastAPI';
import apiAdapter from '../services/apiAdapter';
import { mockConfig } from '../services/mockConfig';
import DetectionChart from '../components/DetectionChart';
import './HelloPage.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Text } = Typography;
const CollapseItem = Collapse.Item;

function HelloPage() {
  const navigate = useNavigate();
  
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

  // 工点详情状态
  const [selectedWorkPoint, setSelectedWorkPoint] = useState<WorkPoint | null>(null);
  const [detectionData, setDetectionData] = useState<any>(null);
  const [loadingDetection, setLoadingDetection] = useState(false);

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '退出登录' },
  ];

  // 加载工点探测数据
  const loadWorkPointDetectionData = useCallback(async (workPointId: string) => {
    setLoadingDetection(true);
    try {
      const data = await apiAdapter.getGeoPointDetectionData(workPointId);
      setDetectionData(data);
    } catch (error) {
      console.error('加载探测数据失败:', error);
      Message.error('加载探测数据失败');
    } finally {
      setLoadingDetection(false);
    }
  }, []);

  // 打开工点详情（展开折叠面板时）
  const handleOpenWorkPointDetail = useCallback((workPoint: WorkPoint) => {
    setSelectedWorkPoint(workPoint);
    
    // 加载探测数据
    loadWorkPointDetectionData(workPoint.id);
  }, [loadWorkPointDetectionData]);

  // 获取项目信息
  const fetchProjectInfo = useCallback(async () => {
    setLoadingProject(true);
    try {
      // 假设当前项目ID为 'project-001'
      const project = await apiAdapter.getProjectInfo('project-001');
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
      const tunnels = await apiAdapter.getTunnelList('project-001');
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
      const workPointsData = await apiAdapter.getWorkPoints(tunnelId);
      setWorkPoints(workPointsData);
      setFilteredWorkPoints(workPointsData);
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
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        height: '64px',
        flexShrink: 0
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

      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        {/* 左侧隧道选择面板 */}
        <Sider 
          width={280} 
          style={{ 
            backgroundColor: '#f7f8fa',
            borderRight: '1px solid #e8e9ea',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ 
            padding: '16px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: 500,
              color: '#1d2129',
              flexShrink: 0
            }}>
              <IconFile style={{ marginRight: '8px', color: '#165dff' }} />
              标段查询
            </div>
            
            <Search 
              placeholder="搜索隧道名称或编号"
              style={{ marginBottom: '16px', flexShrink: 0 }}
              value={tunnelSearchKeyword}
              onChange={(value) => handleTunnelSearch(value)}
              allowClear
            />

            <div style={{ 
              marginTop: '20px',
              flex: 1,
              overflow: 'auto',
              minHeight: 0
            }}>
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
        <Content style={{ 
          backgroundColor: '#f0f2f5', 
          padding: '24px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
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
            padding: '20px 24px',
            backgroundColor: '#fff',
            borderRadius: '2px',
            border: '1px solid #e8e9ea',
            borderLeft: '4px solid #165dff'
          }}>
            <Spin loading={loadingProject}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFile style={{ marginRight: '8px', color: '#165dff', fontSize: '16px' }} />
                  <span style={{ fontWeight: 500, color: '#1d2129', marginRight: '12px' }}>建设单位:</span>
                  <span style={{ color: '#4e5969' }}>
                    {projectInfo?.constructionUnit || '中国铁路昆明局集团有限公司'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFile style={{ marginRight: '8px', color: '#165dff', fontSize: '16px' }} />
                  <span style={{ fontWeight: 500, color: '#1d2129', marginRight: '12px' }}>项目名称:</span>
                  <span style={{ color: '#4e5969' }}>
                    {projectInfo?.name || '渝昆高铁引入昆明枢纽组织工程'}
                  </span>
                </div>
              </div>
            </Spin>
          </div>

          {/* 工点搜索区域 */}
          <Card 
<<<<<<< HEAD
            title={<span style={{ fontSize: '16px', fontWeight: 500 }}>工点搜索</span>}
            style={{ 
              width: '100%',
              marginBottom: '24px'
            }}
            bordered
=======
            title="工点搜索"
            style={{ width: '100%' }}
            extra={
              <Space>
                <Search 
                  placeholder="输入名称搜索"
                  // style={{ width: 200 }}
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
                  // value={selectedWorkPointType}
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
                  // value={selectedRiskLevel}
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
>>>>>>> 03b9f6334946a5521ab7852c7740f2f7690044e2
          >
            {/* 搜索条件行 */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              backgroundColor: '#f7f8fa', 
              borderRadius: '4px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <Input 
                placeholder="输入名称搜索"
                style={{ flex: 1, minWidth: '200px' }}
                value={workPointSearchKeyword}
                onChange={(value) => handleWorkPointSearch(value)}
                allowClear
                suffix={<IconSearch />}
              />
              <Select
                placeholder="工点类型"
                style={{ width: '160px' }}
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
                style={{ width: '160px' }}
                value={selectedRiskLevel}
                onChange={setSelectedRiskLevel}
                allowClear
              >
                <Select.Option value="低风险">低风险</Select.Option>
                <Select.Option value="中风险">中风险</Select.Option>
                <Select.Option value="高风险">高风险</Select.Option>
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
            </div>

            {/* 工点列表 */}
            <Spin loading={loadingWorkPoints}>
                {filteredWorkPoints.length === 0 ? (
                  <Empty 
                    description={workPointSearchKeyword ? "未找到匹配的工点" : "暂无工点数据"}
                    style={{ padding: '40px 0' }}
                  />
                ) : (
                  <Collapse
                    accordion={false}
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: 'none'
                    }}
                    expandIcon={<IconRight />}
                    expandIconPosition="right"
                    onChange={(key, keys) => {
                      // 当展开工点时加载数据
                      if (typeof key === 'string' && keys.includes(key)) {
                        const workPoint = filteredWorkPoints.find(wp => wp.id === key);
                        if (workPoint) {
                          handleOpenWorkPointDetail(workPoint);
                        }
                      }
                    }}
                  >
                  {filteredWorkPoints.map((item) => (
                    <CollapseItem
                      key={item.id}
                      header={
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%'
                        }}>
                          <IconFile style={{ 
                            marginRight: '12px', 
                            color: '#165dff', 
                            fontSize: '16px'
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 500,
                              color: '#1d2129',
                              fontSize: '15px',
                              marginBottom: '6px'
                            }}>
                              {item.name}
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#86909c',
                              display: 'flex',
                              gap: '16px',
                              flexWrap: 'wrap'
                            }}>
                              <span>里程: {item.code}</span>
                              <span>长度: {item.length > 0 ? '+' : ''}{item.length}m</span>
                              {item.type && <span>类型: {item.type}</span>}
                              {item.riskLevel && (
                                <span style={{ 
                                  color: item.riskLevel === '高风险' ? '#f53f3f' : 
                                         item.riskLevel === '中风险' ? '#ff7d00' : '#00b42a',
                                  fontWeight: 500
                                }}>
                                  {item.riskLevel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      }
                      name={item.id}
                      extra={
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('查顶按钮点击:', item.name);
                          }}
                          style={{ marginLeft: '12px' }}
                        >
                          查顶
                        </Button>
                      }
                      destroyOnHide
                    >
                      {/* 工点详细内容 - 移除条件判断，让每个工点都能显示 */}
                      <div style={{ padding: '20px' }}>
                        {/* 探测信息图表 */}
                        <Card 
                          title={<span style={{ fontSize: '16px', fontWeight: 500 }}>探测信息</span>}
                          style={{ marginBottom: '20px' }}
                          bodyStyle={{ padding: '24px' }}
                        >
                          <Spin loading={loadingDetection}>
                            {detectionData && selectedWorkPoint?.id === item.id ? (
                              <DetectionChart data={detectionData} />
                            ) : (
                              <Empty description="暂无探测数据" style={{ padding: '60px 0' }} />
                            )}
                          </Spin>
                        </Card>

                        {/* 三个导航按钮 */}
                        <Card bodyStyle={{ padding: '24px' }}>
                          <Space size="large">
                            <Button
                              type="primary"
                              size="large"
                              onClick={() => navigate('/forecast/design')}
                            >
                              设计信息
                            </Button>
                            <Button
                              type="primary"
                              size="large"
                              onClick={() => navigate('/forecast/geology')}
                            >
                              地质预报
                            </Button>
                            <Button
                              type="primary"
                              size="large"
                              onClick={() => navigate('/forecast/comprehensive')}
                            >
                              综合分析
                            </Button>
                          </Space>
                        </Card>
                      </div>
                    </CollapseItem>
                  ))}
                </Collapse>
              )}
            </Spin>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default HelloPage;