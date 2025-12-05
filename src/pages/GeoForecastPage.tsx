import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Message } from '@arco-design/web-react';
import { Tunnel, WorkPoint, Project } from '../services/geoForecastAPI';
// import apiAdapter from '../services/apiAdapter';
import apiAdapter from '../services/realAPI';
import './GeoForecastPage.css';

// Components
import HelloHeader from './components/GeoForecastPage/HelloHeader';
import TunnelSider from './components/GeoForecastPage/TunnelSider';
import StatisticsCards from './components/GeoForecastPage/StatisticsCards';
import ProjectInfoBar from './components/GeoForecastPage/ProjectInfoBar';
import WorkPointFilter from './components/GeoForecastPage/WorkPointFilter';
import WorkPointList from './components/GeoForecastPage/WorkPointList';

const { Content } = Layout;

function GeoForecastPage() {
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

  // 统计数据状态
  const [statistics, setStatistics] = useState({
    totalTunnels: 0,
    totalWorkPoints: 0,
    completedWorkPoints: 0,
    highRiskPoints: 0
  });
  
  // 原有的单状态保留用于兼容（如果需要），但建议全面迁移到Map
  // 下面这些单一状态在多选展开时会导致“数据串味”
  // const [selectedWorkPoint, setSelectedWorkPoint] = useState<WorkPoint | null>(null);
  // const [detectionData, setDetectionData] = useState<any>(null);
  // ...

  // 移除 loadWorkPointDetectionData 和 loadForecastMethodsData 的具体实现
  // 将它们移到 WorkPointList 组件内部处理，通过传递 apiAdapter 实例或者在组件内部引入
  
  // 打开工点详情（展开折叠面板时）
  // 这个回调现在只需要负责状态管理，不再负责数据加载
  const handleOpenWorkPointDetail = useCallback((workPoint: WorkPoint, expanded: boolean) => {
    // 数据加载逻辑已移至 WorkPointList 组件内部
  }, []);

  // 计算统计数据
  const calculateStatistics = useCallback(async (tunnels?: Tunnel[]) => {
    try {
      // 获取所有隧道数据（如果有传入则使用传入的，否则从API获取）
      // 注意：这里为了避免重复请求，尽量使用已有的 tunnelList
      const tunnelsData = tunnels || await apiAdapter.getTunnels();
      
      // 获取所有工点数据（遍历所有隧道）
      let allWorkPoints: WorkPoint[] = [];
      for (const tunnel of tunnelsData) {
        try {
          const points = await apiAdapter.getWorkPoints(tunnel.id);
          allWorkPoints = [...allWorkPoints, ...points];
        } catch (error) {
          console.error(`获取隧道 ${tunnel.id} 的工点失败:`, error);
        }
      }

      // 计算统计数据
      const stats = {
        totalTunnels: tunnelsData.length,
        totalWorkPoints: allWorkPoints.length,
        completedWorkPoints: allWorkPoints.filter(wp => wp.status === '已完成').length,
        highRiskPoints: allWorkPoints.filter(wp => wp.riskLevel === '高风险').length
      };

      console.log('📊 统计数据:', stats);
      setStatistics(stats);
    } catch (error) {
      console.error('计算统计数据失败:', error);
    }
  }, []);

  // 获取项目信息
  const fetchProjectInfo = useCallback(async () => {
    setLoadingProject(true);
    try {
      // 假设当前项目ID为 'project-001'
      const project = await apiAdapter.getProjectInfo();
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
      const tunnels = await apiAdapter.getTunnels();
      setTunnelList(tunnels);
      setFilteredTunnels(tunnels);
      
      // 如果没有选中的隧道，默认选中第一个
      // 注意：这里仅设置列表，不处理选中逻辑，避免循环依赖
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
    } finally {
      setLoadingTunnels(false);
    }
  }, []); // 移除 selectedTunnel 依赖

  // 监听隧道列表变化，设置默认选中
  useEffect(() => {
    if (tunnelList.length > 0 && !selectedTunnel) {
      setSelectedTunnel(tunnelList[0].id);
    }
  }, [tunnelList, selectedTunnel]);

  // 获取工点列表
  const fetchWorkPoints = useCallback(async (tunnelId: string) => {
    if (!tunnelId) {
      console.log('⚠️ [GeoForecastPage] fetchWorkPoints tunnelId为空，跳过');
      return;
    }
    
    console.log('🚀 [GeoForecastPage] fetchWorkPoints 开始获取工点, tunnelId:', tunnelId);
    setLoadingWorkPoints(true);
    try {
      const workPointsData = await apiAdapter.getWorkPoints(tunnelId);
      console.log('✅ [GeoForecastPage] fetchWorkPoints 获取到工点数据:', workPointsData);
      console.log('🔍 [GeoForecastPage] 工点数据长度:', workPointsData?.length);
      
      setWorkPoints(workPointsData);
      setFilteredWorkPoints(workPointsData);
    } catch (error) {
      console.error('❌ [GeoForecastPage] 获取工点列表失败:', error);
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
    // fetchWorkPoints(tunnelId); // 不直接调用，而是通过 useEffect 依赖 selectedTunnel 触发
  }, []);

  // 初始化数据
  useEffect(() => {
    fetchProjectInfo();
    fetchTunnelList();
    // calculateStatistics 会依赖 tunnelList 的变化而执行
  }, [fetchProjectInfo, fetchTunnelList]); // 移除 calculateStatistics，因为它现在依赖 tunnelList

  // 当隧道列表加载完成后计算统计数据
  useEffect(() => {
    if (tunnelList.length > 0) {
      calculateStatistics(tunnelList);
    }
  }, [tunnelList, calculateStatistics]);

  // 当选中隧道变化时，获取对应的工点数据
  useEffect(() => {
    if (selectedTunnel) {
      fetchWorkPoints(selectedTunnel);
    }
  }, [selectedTunnel, fetchWorkPoints]);

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航栏 */}
      <HelloHeader onNavigate={navigate} />

      <Layout style={{ height: 'calc(100vh - 64px)', flexDirection: 'row' }}>
        {/* 左侧隧道选择面板 */}
        <TunnelSider 
          searchKeyword={tunnelSearchKeyword}
          onSearch={handleTunnelSearch}
          loading={loadingTunnels}
          tunnels={filteredTunnels}
          selectedTunnelId={selectedTunnel}
          onSelectTunnel={handleTunnelSelect}
        />

        {/* 主要内容区域 */}
        <Content style={{ 
          backgroundColor: '#f0f2f5', 
          padding: '24px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {/* 统计概览卡片 */}
          <StatisticsCards statistics={statistics} />

          {/* 项目信息区域 */}
          <ProjectInfoBar 
            loading={loadingProject} 
            projectInfo={projectInfo} 
          />

          {/* 工点搜索区域 */}
          <Card title="工点搜索" style={{ width: '100%' }}>
            {/* 搜索条件行 */}
            <WorkPointFilter 
              keyword={workPointSearchKeyword}
              onSearch={handleWorkPointSearch}
              type={selectedWorkPointType}
              onTypeChange={setSelectedWorkPointType}
              riskLevel={selectedRiskLevel}
              onRiskLevelChange={setSelectedRiskLevel}
              onRefresh={() => {
                if (selectedTunnel) {
                  fetchWorkPoints(selectedTunnel);
                }
              }}
            />

            {/* 工点列表 */}
            <WorkPointList 
              loading={loadingWorkPoints}
              workPoints={filteredWorkPoints}
              searchKeyword={workPointSearchKeyword}
              onExpand={handleOpenWorkPointDetail}
              onNavigate={navigate}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default GeoForecastPage;