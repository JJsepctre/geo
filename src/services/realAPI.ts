/**
 * 真实API服务 - 统一API调用接口
 * 用于替换所有Mock数据，连接真实后端
 */

import http from '../utils/http';
import type { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// ==================== 扩展类型定义（仅用于realAPI） ====================

// 预报设计记录类型
export interface ForecastDesignRecord {
  id: string;
  createdAt: string;
  method: string;
  startMileage: string;
  endMileage: string;
  length: number;
  minBurialDepth: number;
  designTimes: number;
}

// 探测方法类型
export interface DetectionMethod {
  name: string;
  count: number;
  color: string;
}

// 探测详情类型
export interface DetectionDetail {
  method: string;
  time: string;
  mileage: string;
  length: string;
  status: string;
  operator: string;
}

// 工点探测数据类型
export interface GeoPointDetectionData {
  workPointId: string;
  workPointName: string;
  mileage: string;
  length: number;
  detectionMethods: DetectionMethod[];
  detectionDetails: Record<string, DetectionDetail[]>;
}

// ==================== API服务类 ====================

class RealAPIService {
  // ========== 项目管理 ==========
  
  /**
   * 获取项目信息
   */
  async getProjectInfo(): Promise<Project> {
    return http.get('/api/project/info');
  }

  // ========== 隧道管理 ==========
  
  /**
   * 获取所有隧道列表
   */
  async getTunnels(): Promise<Tunnel[]> {
    const response = await http.get('/api/tunnels');
    return response.data || response; // 兼容不同响应格式
  }

  /**
   * 根据ID获取隧道详情
   */
  async getTunnelById(tunnelId: string): Promise<Tunnel> {
    return http.get(`/api/tunnels/${tunnelId}`);
  }

  // ========== 工点管理 ==========
  
  /**
   * 获取指定隧道的工点列表
   */
  async getWorkPoints(tunnelId: string): Promise<WorkPoint[]> {
    const response = await http.get('/api/workpoints', { 
      params: { tunnelId } 
    });
    return response.data || response;
  }

  /**
   * 搜索工点
   */
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    const response = await http.get('/api/workpoints/search', {
      params: { keyword, tunnelId }
    });
    return response.data || response;
  }

  /**
   * 根据ID获取工点详情
   */
  async getWorkPointById(workPointId: string): Promise<WorkPoint> {
    return http.get(`/api/workpoints/${workPointId}`);
  }

  /**
   * 置顶/取消置顶工点
   */
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    await http.patch(`/api/workpoints/${workPointId}/top`, { isTop });
  }

  // ========== 预报设计管理 ==========
  
  /**
   * 获取预报设计列表（分页）
   */
  async getForecastDesigns(params: {
    page: number;
    pageSize: number;
    method?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    return http.get('/api/forecast/designs', { params });
  }

  /**
   * 新增预报设计
   */
  async createForecastDesign(data: Omit<ForecastDesignRecord, 'id' | 'createdAt'>): Promise<{ success: boolean }> {
    return http.post('/api/forecast/designs', data);
  }

  /**
   * 删除预报设计
   */
  async deleteForecastDesign(id: string): Promise<{ success: boolean }> {
    return http.delete(`/api/forecast/designs/${id}`);
  }

  /**
   * 批量删除预报设计
   */
  async batchDeleteForecastDesigns(ids: string[]): Promise<{ success: boolean }> {
    return http.post('/api/forecast/designs/batch-delete', { ids });
  }

  /**
   * 导入预报设计
   */
  async importForecastDesigns(file: File): Promise<{ success: boolean; added: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/api/forecast/designs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  /**
   * 下载预报设计模板
   */
  getTemplateDownloadUrl(): string {
    const baseURL = process.env.REACT_APP_API_BASE_URL || '';
    return `${baseURL}/api/forecast/designs/template`;
  }

  // ========== 工点探测数据 ==========
  
  /**
   * 获取工点探测数据（用于GeoPointSearch页面）
   */
  async getGeoPointDetectionData(workPointId: string): Promise<GeoPointDetectionData> {
    return http.get(`/api/geopoints/${workPointId}/detection`);
  }

  /**
   * 获取所有工点的探测数据列表
   */
  async getGeoPointsDetectionList(params?: {
    keyword?: string;
    tunnelId?: string;
  }): Promise<GeoPointDetectionData[]> {
    const response = await http.get('/api/geopoints/detection', { params });
    return response.data || response;
  }

  // ========== 工点设计信息（设计信息Tab） ==========
  
  /**
   * 获取工点的设计信息列表（预报设计）
   */
  async getWorkPointDesignInfo(workPointId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    return http.get(`/api/workpoints/${workPointId}/design-info`, { params });
  }

  // ========== 工点地质预报（地质预报Tab） ==========
  
  /**
   * 获取工点的地质预报列表
   */
  async getWorkPointGeologyForecast(workPointId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    return http.get(`/api/workpoints/${workPointId}/geology-forecast`, { params });
  }

  // ========== 工点综合分析（综合分析Tab） ==========
  
  /**
   * 获取工点的综合分析列表
   */
  async getWorkPointComprehensiveAnalysis(workPointId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    return http.get(`/api/workpoints/${workPointId}/comprehensive-analysis`, { params });
  }
}

// 导出单例
const realAPI = new RealAPIService();
export default realAPI;
