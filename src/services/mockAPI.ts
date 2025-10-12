// Mock数据服务，用于演示功能
import { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock项目数据
const mockProject: Project = {
  id: 'project-001',
  name: '渝昆高铁引入昆明枢纽组织工程',
  constructionUnit: '中国铁路昆明局集团有限公司',
  description: '新建铁路渝昆高铁引入昆明枢纽工程'
};

// Mock隧道数据 - 增加更多真实的隧道
const mockTunnels: Tunnel[] = [
  { id: '1', name: '大庆山隧道', code: 'DQS', status: 'active', projectId: 'project-001' },
  { id: '2', name: '青龙山隧道', code: 'QLS', status: 'active', projectId: 'project-001' },
  { id: '3', name: '阳春1号隧道', code: 'YC1', status: 'active', projectId: 'project-001' },
  { id: '4', name: '阳春2号隧道', code: 'YC2', status: 'active', projectId: 'project-001' },
  { id: '5', name: '青草山隧道', code: 'QCS', status: 'active', projectId: 'project-001' },
  { id: '6', name: '新对歌山隧道', code: 'XDGS', status: 'active', projectId: 'project-001' },
  { id: '7', name: '梨花山隧道', code: 'LHS', status: 'active', projectId: 'project-001' },
  { id: '8', name: '白云山隧道', code: 'BYS', status: 'active', projectId: 'project-001' },
  { id: '9', name: '凤凰山隧道', code: 'FHS', status: 'active', projectId: 'project-001' },
  { id: '10', name: '金马山隧道', code: 'JMS', status: 'active', projectId: 'project-001' },
];

// Mock工点数据 - 为每个隧道生成更丰富的工点数据
const generateMockWorkPoints = (tunnelId: string, tunnelName: string): WorkPoint[] => {
  const tunnelCode = tunnelName.substring(0, 2).toUpperCase();
  const basePoints = [
    { name: `${tunnelName}进口明洞`, code: `${tunnelCode}-IN-MD`, length: 65, type: '明洞' },
    { name: `${tunnelName}进口洞门`, code: `${tunnelCode}-IN-GATE`, length: 12, type: '洞门' },
    { name: `${tunnelName}进口小里程段`, code: `${tunnelCode}-IN-S`, length: -435, type: '暗挖段' },
    { name: `${tunnelName}主洞Ⅰ段`, code: `${tunnelCode}-MAIN-1`, length: 856, type: '主洞段' },
    { name: `${tunnelName}主洞Ⅱ段`, code: `${tunnelCode}-MAIN-2`, length: 1205, type: '主洞段' },
    { name: `${tunnelName}主洞Ⅲ段`, code: `${tunnelCode}-MAIN-3`, length: 932, type: '主洞段' },
    { name: `${tunnelName}横通道1#`, code: `${tunnelCode}-CROSS-1`, length: 28, type: '横通道' },
    { name: `${tunnelName}横通道2#`, code: `${tunnelCode}-CROSS-2`, length: 32, type: '横通道' },
    { name: `${tunnelName}出口大里程段`, code: `${tunnelCode}-OUT-L`, length: 1456, type: '暗挖段' },
    { name: `${tunnelName}出口小里程段`, code: `${tunnelCode}-OUT-S`, length: -892, type: '暗挖段' },
    { name: `${tunnelName}出口明洞`, code: `${tunnelCode}-OUT-MD`, length: 48, type: '明洞' },
    { name: `${tunnelName}出口洞门`, code: `${tunnelCode}-OUT-GATE`, length: 15, type: '洞门' },
    { name: `${tunnelName}应急救援站`, code: `${tunnelCode}-RESCUE`, length: 125, type: '救援站' },
    { name: `${tunnelName}通风竖井`, code: `${tunnelCode}-VENT`, length: 85, type: '通风井' },
  ];

  // 根据隧道ID生成不同的起始里程
  const baseMileage = 710000 + parseInt(tunnelId) * 5000;

  return basePoints.map((point, index) => ({
    id: `${tunnelId}-${index + 1}`,
    name: point.name,
    code: point.code,
    mileage: baseMileage + index * 150,
    tunnelId,
    length: point.length,
    status: Math.random() > 0.1 ? 'active' : 'inactive', // 90%激活状态
    createdAt: new Date(2024, 0, Math.floor(Math.random() * 365)).toISOString(),
    isTop: index === 0 && Math.random() > 0.5, // 第一个工点有50%概率置顶
    type: point.type,
    riskLevel: ['低风险', '中风险', '高风险'][Math.floor(Math.random() * 3)],
    geologicalCondition: ['Ⅰ级围岩', 'Ⅱ级围岩', 'Ⅲ级围岩', 'Ⅳ级围岩', 'Ⅴ级围岩'][Math.floor(Math.random() * 5)]
  }));
};

// 为所有隧道生成工点数据
const allMockWorkPoints: WorkPoint[] = mockTunnels.flatMap(tunnel => 
  generateMockWorkPoints(tunnel.id, tunnel.name)
);

export class MockGeoForecastAPI {
  // 获取项目信息
  async getProjectInfo(projectId: string): Promise<Project> {
    await delay(500);
    if (projectId === 'project-001') {
      return mockProject;
    }
    throw new Error('项目不存在');
  }

  // 获取隧道列表
  async getTunnelList(projectId?: string): Promise<Tunnel[]> {
    await delay(300);
    return mockTunnels.filter(tunnel => 
      !projectId || tunnel.projectId === projectId
    );
  }

  // 搜索隧道
  async searchTunnels(keyword: string): Promise<Tunnel[]> {
    await delay(200);
    const lowerKeyword = keyword.toLowerCase();
    return mockTunnels.filter(tunnel => 
      tunnel.name.toLowerCase().includes(lowerKeyword) ||
      tunnel.code.toLowerCase().includes(lowerKeyword)
    );
  }

  // 获取工点列表
  async getWorkPoints(params: {
    tunnelId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: WorkPoint[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    await delay(400);
    
    let filteredPoints = allMockWorkPoints;
    if (params.tunnelId) {
      filteredPoints = allMockWorkPoints.filter(point => 
        point.tunnelId === params.tunnelId
      );
    }

    // 排序：置顶的在前面
    filteredPoints.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      return 0;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: filteredPoints.slice(startIndex, endIndex),
      total: filteredPoints.length,
      page,
      pageSize
    };
  }

  // 搜索工点
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    await delay(300);
    
    let filteredPoints = allMockWorkPoints;
    if (tunnelId) {
      filteredPoints = allMockWorkPoints.filter(point => 
        point.tunnelId === tunnelId
      );
    }

    const lowerKeyword = keyword.toLowerCase();
    const searchResults = filteredPoints.filter(point => 
      point.name.toLowerCase().includes(lowerKeyword) ||
      point.code.toLowerCase().includes(lowerKeyword)
    );

    // 排序：置顶的在前面
    searchResults.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      return 0;
    });

    return searchResults;
  }

  // 置顶工点
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    await delay(200);
    
    const point = allMockWorkPoints.find(p => p.id === workPointId);
    if (point) {
      point.isTop = isTop;
    }
    
    // 模拟可能的错误
    if (Math.random() < 0.1) {
      throw new Error('网络错误，请重试');
    }
  }

  // 获取工点详情
  async getWorkPointDetail(workPointId: string): Promise<WorkPoint> {
    await delay(200);
    
    const point = allMockWorkPoints.find(p => p.id === workPointId);
    if (!point) {
      throw new Error('工点不存在');
    }
    
    return point;
  }
}

// 创建Mock API实例
export const mockGeoForecastAPI = new MockGeoForecastAPI();

// 导出用于开发环境的API实例选择器
export const getAPIInstance = () => {
  // 在开发环境中使用Mock API，生产环境中使用真实API
  const useMockAPI = process.env.REACT_APP_USE_MOCK_API === 'true' || 
                     process.env.NODE_ENV === 'development';
  
  return useMockAPI ? mockGeoForecastAPI : null;
};