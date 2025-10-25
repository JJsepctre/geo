/**
 * API适配器 - 自动根据环境变量选择真实API或Mock API
 * 如果配置了REACT_APP_API_BASE_URL，则使用真实API
 * 否则使用Mock API进行本地开发
 */

import realAPI from './realAPI';
import { mockGeoForecastAPI } from './mockAPI';
import type { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// 判断是否使用真实API
const USE_REAL_API = !!process.env.REACT_APP_API_BASE_URL;

/**
 * 统一的API接口
 * 会根据配置自动选择使用真实API或Mock API
 */
class APIAdapter {
  // 获取项目信息
  async getProjectInfo(projectId: string): Promise<Project> {
    if (USE_REAL_API) {
      return realAPI.getProjectInfo();
    } else {
      return mockGeoForecastAPI.getProjectInfo(projectId);
    }
  }

  // 获取隧道列表
  async getTunnelList(projectId: string): Promise<Tunnel[]> {
    if (USE_REAL_API) {
      const tunnels = await realAPI.getTunnels();
      // 为真实API返回的数据添加projectId
      return tunnels.map(t => ({ ...t, projectId }));
    } else {
      return mockGeoForecastAPI.getTunnelList(projectId);
    }
  }

  // 获取隧道详情
  async getTunnelById(tunnelId: string, projectId: string = 'project-001'): Promise<Tunnel> {
    if (USE_REAL_API) {
      const tunnel = await realAPI.getTunnelById(tunnelId);
      return { ...tunnel, projectId };
    } else {
      // mockGeoForecastAPI没有getTunnelById方法，从列表中查找
      const tunnels = await mockGeoForecastAPI.getTunnelList(projectId);
      const tunnel = tunnels.find(t => t.id === tunnelId);
      if (!tunnel) {
        throw new Error(`Tunnel not found: ${tunnelId}`);
      }
      return tunnel;
    }
  }

  // 获取工点列表
  async getWorkPoints(tunnelId: string): Promise<WorkPoint[]> {
    if (USE_REAL_API) {
      const workPoints = await realAPI.getWorkPoints(tunnelId);
      // 为真实API返回的数据添加缺失的字段
      return workPoints.map(wp => ({
        ...wp,
        mileage: wp.length, // 使用length作为mileage的默认值
        createdAt: new Date().toISOString()
      }));
    } else {
      const response = await mockGeoForecastAPI.getWorkPoints({ tunnelId });
      return response.data;
    }
  }

  // 搜索工点
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    if (USE_REAL_API) {
      const workPoints = await realAPI.searchWorkPoints(keyword, tunnelId);
      // 为真实API返回的数据添加缺失的字段
      return workPoints.map(wp => ({
        ...wp,
        mileage: wp.length,
        createdAt: new Date().toISOString()
      }));
    } else {
      return mockGeoForecastAPI.searchWorkPoints(keyword, tunnelId);
    }
  }

  // 获取工点详情
  async getWorkPointById(workPointId: string): Promise<WorkPoint> {
    if (USE_REAL_API) {
      const wp = await realAPI.getWorkPointById(workPointId);
      return {
        ...wp,
        mileage: wp.length,
        createdAt: new Date().toISOString()
      };
    } else {
      // mockGeoForecastAPI没有getWorkPointById方法，从列表中查找
      const response = await mockGeoForecastAPI.getWorkPoints({});
      const workPoint = response.data.find(wp => wp.id === workPointId);
      if (!workPoint) {
        throw new Error(`WorkPoint not found: ${workPointId}`);
      }
      return workPoint;
    }
  }

  // 获取当前API类型（用于调试）
  getAPIType(): string {
    return USE_REAL_API ? 'Real API' : 'Mock API';
  }

  // 置顶工点
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    if (USE_REAL_API) {
      // 调用真实API
      await realAPI.toggleWorkPointTop(workPointId, isTop);
    } else {
      // Mock API已经实现了toggleWorkPointTop
      return mockGeoForecastAPI.toggleWorkPointTop(workPointId, isTop);
    }
  }

  // ========== 工点探测数据相关 ==========

  /**
   * 获取工点探测数据
   */
  async getGeoPointDetectionData(workPointId: string) {
    if (USE_REAL_API) {
      return realAPI.getGeoPointDetectionData(workPointId);
    } else {
      // Mock实现：生成探测数据
      return this.generateMockDetectionData(workPointId);
    }
  }

  /**
   * 获取工点的设计信息（设计信息Tab数据）
   */
  async getWorkPointDesignInfo(workPointId: string, params?: { page?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getWorkPointDesignInfo(workPointId, params);
    } else {
      // Mock实现：生成设计信息
      return this.generateMockDesignInfo(workPointId, params);
    }
  }

  /**
   * 获取工点的地质预报（地质预报Tab数据）
   */
  async getWorkPointGeologyForecast(workPointId: string, params?: { page?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getWorkPointGeologyForecast(workPointId, params);
    } else {
      // Mock实现：生成地质预报数据
      return this.generateMockGeologyForecast(workPointId, params);
    }
  }

  /**
   * 获取工点的综合分析（综合分析Tab数据）
   */
  async getWorkPointComprehensiveAnalysis(workPointId: string, params?: { page?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getWorkPointComprehensiveAnalysis(workPointId, params);
    } else {
      // Mock实现：生成综合分析数据
      return this.generateMockComprehensiveAnalysis(workPointId, params);
    }
  }

  // ========== Mock数据生成方法 ==========

  private generateMockDetectionData(workPointId: string) {
    // 生成探测方法统计数据
    const detectionMethods = [
      { name: '进度', count: Math.floor(Math.random() * 20) + 5, color: '#3B82F6' },
      { name: '瞬变电磁', count: Math.floor(Math.random() * 15) + 3, color: '#8B5CF6' },
      { name: '高分辨直流电', count: Math.floor(Math.random() * 12) + 2, color: '#10B981' },
      { name: '电磁波', count: Math.floor(Math.random() * 10) + 1, color: '#F59E0B' },
      { name: '陆地声呐', count: Math.floor(Math.random() * 8) + 1, color: '#EF4444' },
      { name: 'HSP', count: Math.floor(Math.random() * 6) + 1, color: '#EC4899' },
      { name: '地震波反射', count: Math.floor(Math.random() * 5) + 1, color: '#14B8A6' },
    ];

    // 生成探测详情数据
    const detectionDetails: Record<string, any[]> = {};
    detectionMethods.forEach(method => {
      const details = [];
      for (let i = 0; i < method.count && i < 5; i++) {
        details.push({
          method: method.name,
          time: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          mileage: `DK${Math.floor(Math.random() * 100) + 700}+${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          length: `${Math.floor(Math.random() * 100) + 10}m`,
          status: ['已完成', '进行中', '计划中'][Math.floor(Math.random() * 3)],
          operator: ['张工', '李工', '王工', '刘工', '陈工'][Math.floor(Math.random() * 5)]
        });
      }
      detectionDetails[method.name] = details;
    });

    return {
      workPointId,
      detectionMethods,
      detectionDetails
    };
  }

  private generateMockDesignInfo(workPointId: string, params?: { page?: number; pageSize?: number }) {
    // const page = params?.page || 1;  // 在真实分页场景中会使用
    const pageSize = params?.pageSize || 10;
    
    // 生成设计信息Mock数据
    const total = Math.floor(Math.random() * 30) + 10;
    const list = [];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      list.push({
        id: `design-${workPointId}-${i}`,
        createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        method: ['方法A', '方法B', '方法C'][Math.floor(Math.random() * 3)],
        startMileage: `DK713+${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        endMileage: `DK713+${String(Math.floor(Math.random() * 1000) + 100).padStart(3, '0')}`,
        length: Math.floor(Math.random() * 500) + 50,
        minBurialDepth: Number((Math.random() * 50 + 10).toFixed(1)),
        designTimes: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return { list, total };
  }

  private generateMockGeologyForecast(workPointId: string, params?: { page?: number; pageSize?: number }) {
    // const page = params?.page || 1;  // 在真实分页场景中会使用
    const pageSize = params?.pageSize || 10;
    
    // 生成地质预报Mock数据
    const total = Math.floor(Math.random() * 25) + 8;
    const list = [];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      list.push({
        id: `geology-${workPointId}-${i}`,
        createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        method: ['地质雷达', '钻探', '物探'][Math.floor(Math.random() * 3)],
        startMileage: `DK713+${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        endMileage: `DK713+${String(Math.floor(Math.random() * 1000) + 100).padStart(3, '0')}`,
        length: Math.floor(Math.random() * 300) + 30,
        minBurialDepth: Number((Math.random() * 40 + 15).toFixed(1)),
        designTimes: Math.floor(Math.random() * 3) + 1
      });
    }
    
    return { list, total };
  }

  private generateMockComprehensiveAnalysis(workPointId: string, params?: { page?: number; pageSize?: number }) {
    // const page = params?.page || 1;  // 在真实分页场景中会使用
    const pageSize = params?.pageSize || 10;
    
    // 生成综合分析Mock数据
    const total = Math.floor(Math.random() * 20) + 5;
    const list = [];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      list.push({
        id: `analysis-${workPointId}-${i}`,
        createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        method: ['综合评估', '风险分析', '安全评价'][Math.floor(Math.random() * 3)],
        startMileage: `DK713+${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        endMileage: `DK713+${String(Math.floor(Math.random() * 1000) + 100).padStart(3, '0')}`,
        length: Math.floor(Math.random() * 400) + 40,
        minBurialDepth: Number((Math.random() * 45 + 12).toFixed(1)),
        designTimes: Math.floor(Math.random() * 4) + 1
      });
    }
    
    return { list, total };
  }
}

// 导出单例
const apiAdapter = new APIAdapter();

// 在开发环境打印API类型
if (process.env.NODE_ENV === 'development') {
  console.log(`🔌 API Mode: ${apiAdapter.getAPIType()}`);
  if (USE_REAL_API) {
    console.log(`📡 API Base URL: ${process.env.REACT_APP_API_BASE_URL}`);
  } else {
    console.log(`🎭 Using Mock Data for development`);
  }
}

export default apiAdapter;
