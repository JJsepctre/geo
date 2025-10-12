import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理错误响应
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 定义数据类型
export interface Tunnel {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  projectId: string;
}

export interface WorkPoint {
  id: string;
  name: string;
  code: string;
  mileage: number;
  tunnelId: string;
  length: number;
  status: string;
  createdAt: string;
  isTop?: boolean;
  type?: string; // 工点类型：明洞、洞门、主洞段等
  riskLevel?: string; // 风险等级：低风险、中风险、高风险
  geologicalCondition?: string; // 地质条件：Ⅰ级围岩、Ⅱ级围岩等
}

export interface Project {
  id: string;
  name: string;
  constructionUnit: string;
  description?: string;
}

export interface SearchParams {
  keyword?: string;
  tunnelId?: string;
  page?: number;
  pageSize?: number;
}

// API服务类
class GeoForecastAPI {
  // 获取项目信息
  async getProjectInfo(projectId: string): Promise<Project> {
    return api.get(`/projects/${projectId}`);
  }

  // 获取隧道列表
  async getTunnelList(projectId?: string): Promise<Tunnel[]> {
    const params = projectId ? { projectId } : {};
    return api.get('/tunnels', { params });
  }

  // 搜索隧道
  async searchTunnels(keyword: string): Promise<Tunnel[]> {
    return api.get('/tunnels/search', { params: { keyword } });
  }

  // 获取工点列表
  async getWorkPoints(params: SearchParams): Promise<{
    data: WorkPoint[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return api.get('/work-points', { params });
  }

  // 搜索工点
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    const params: SearchParams = { keyword };
    if (tunnelId) params.tunnelId = tunnelId;
    return api.get('/work-points/search', { params });
  }

  // 置顶工点
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    return api.patch(`/work-points/${workPointId}/top`, { isTop });
  }

  // 获取工点详情
  async getWorkPointDetail(workPointId: string): Promise<WorkPoint> {
    return api.get(`/work-points/${workPointId}`);
  }
}

// 创建API实例
export const geoForecastAPI = new GeoForecastAPI();

// 在开发环境中，提供Mock API的选项
const useMockAPI = process.env.REACT_APP_USE_MOCK_API === 'true' || 
                   (!process.env.REACT_APP_API_BASE_URL && process.env.NODE_ENV === 'development');

// 导出可能使用Mock的API实例
let apiInstance: GeoForecastAPI;

if (useMockAPI) {
  // 动态导入Mock API
  import('./mockAPI').then(({ mockGeoForecastAPI }) => {
    // 将Mock API的方法复制到真实API实例上
    Object.assign(geoForecastAPI, mockGeoForecastAPI);
  });
}

apiInstance = geoForecastAPI;

export { apiInstance as api };

// 导出axios实例以供其他地方使用
export default api;