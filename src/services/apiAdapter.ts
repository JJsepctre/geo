/**
 * API适配器 - 自动根据环境变量选择真实API或Mock API
 * 如果配置了REACT_APP_API_BASE_URL，则使用真实API
 * 否则使用Mock API进行本地开发
 */

import realAPI from './realAPI';
import { mockGeoForecastAPI } from './mockAPI';
import type { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// 判断是否使用真实API
// 默认使用真实API（因为已经配置了代理）
const USE_REAL_API = process.env.REACT_APP_USE_REAL_API !== 'false';

/**
 * 统一的API接口
 * 会根据配置自动选择使用真实API或Mock API
 */
class APIAdapter {
  // 获取项目信息
  async getProjectInfo(projectId: string = 'project-001'): Promise<Project> {
    if (USE_REAL_API) {
      return realAPI.getProjectInfo();
    } else {
      return mockGeoForecastAPI.getProjectInfo(projectId);
    }
  }

  // 获取隧道列表
  async getTunnelList(projectId: string = 'project-001'): Promise<Tunnel[]> {
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
      // 真实API已经返回完整的WorkPoint格式，不需要额外处理
      return workPoints;
    } else {
      const response = await mockGeoForecastAPI.getWorkPoints({ tunnelId });
      return response.data;
    }
  }

  // 搜索工点
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    if (USE_REAL_API) {
      const workPoints = await realAPI.searchWorkPoints(keyword, tunnelId);
      return workPoints;
    } else {
      return mockGeoForecastAPI.searchWorkPoints(keyword, tunnelId);
    }
  }

  // 获取工点详情
  async getWorkPointById(workPointId: string): Promise<WorkPoint> {
    if (USE_REAL_API) {
      return realAPI.getWorkPointById(workPointId);
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
   * 获取工点的综合结论（综合结论Tab数据）
   */
  async getWorkPointComprehensiveAnalysis(workPointId: string, params?: { page?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getWorkPointComprehensiveAnalysis(workPointId, params);
    } else {
      // Mock实现：生成综合结论数据
      return this.generateMockComprehensiveAnalysis(workPointId, params);
    }
  }

  // ========== 预报设计管理（用于 ForecastDesignPage） ==========
  
  /**
   * 获取预报设计列表
   */
  async getForecastDesigns(params: {
    page: number;
    pageSize: number;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) {
    if (USE_REAL_API) {
      const result = await realAPI.getForecastDesigns(params);
      
      // 如果后端返回空数据，使用 Mock 数据进行展示
      if (result.total === 0) {
        console.warn('⚠️ [apiAdapter] 后端无设计预报数据，使用 Mock 数据展示界面');
        return this.generateMockDesignInfo('mock', params);
      }
      
      return result;
    } else {
      // Mock实现：生成预报设计列表
      return this.generateMockDesignInfo('mock', params);
    }
  }

  /**
   * 创建预报设计记录
   */
  async createForecastDesign(data: any) {
    if (USE_REAL_API) {
      return realAPI.createForecastDesign(data);
    } else {
      return { success: true };
    }
  }

  /**
   * 更新预报设计记录
   */
  async updateForecastDesign(id: string, data: any) {
    if (USE_REAL_API) {
      return realAPI.updateForecastDesign(id, data);
    } else {
      return { success: true };
    }
  }

  /**
   * 删除预报设计记录
   */
  async deleteForecastDesign(id: string) {
    if (USE_REAL_API) {
      return realAPI.deleteForecastDesign(id);
    } else {
      return { success: true };
    }
  }

  /**
   * 批量删除预报设计记录
   */
  async batchDeleteForecastDesigns(ids: string[]) {
    if (USE_REAL_API) {
      return realAPI.batchDeleteForecastDesigns(ids);
    } else {
      return { success: true };
    }
  }

  /**
   * 导入预报设计记录
   */
  async importForecastDesigns(file: File) {
    if (USE_REAL_API) {
      return realAPI.importForecastDesigns(file);
    } else {
      return { success: true, added: 5 };
    }
  }

  // ========== 设计围岩等级 CRUD ==========

  /**
   * 获取设计围岩等级列表
   */
  async getDesignRockGrades(params?: { sitePk?: number; pageNum?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getDesignRockGrades(params || {});
    } else {
      // Mock实现
      return this.generateMockRockGrades(params);
    }
  }

  /**
   * 创建设计围岩等级
   */
  async createDesignRockGrade(data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.createDesignRockGrade(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createDesignRockGrade:', data);
      return { success: true };
    }
  }

  /**
   * 更新设计围岩等级
   */
  async updateDesignRockGrade(id: string, data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.updateDesignRockGrade(id, data);
    } else {
      console.log('🎭 [apiAdapter] Mock updateDesignRockGrade:', id, data);
      return { success: true };
    }
  }

  /**
   * 删除设计围岩等级
   */
  async deleteDesignRockGrade(id: string): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.deleteDesignRockGrade(id);
    } else {
      console.log('🎭 [apiAdapter] Mock deleteDesignRockGrade:', id);
      return { success: true };
    }
  }

  // ========== 设计地质信息 CRUD ==========

  /**
   * 获取设计地质信息列表
   */
  async getDesignGeologies(params?: { sitePk?: number; pageNum?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getDesignGeologies(params || {});
    } else {
      // Mock实现
      return this.generateMockGeologies(params);
    }
  }

  /**
   * 创建设计地质信息
   */
  async createDesignGeology(data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.createDesignGeology(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createDesignGeology:', data);
      return { success: true };
    }
  }

  /**
   * 更新设计地质信息
   */
  async updateDesignGeology(id: string, data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.updateDesignGeology(id, data);
    } else {
      console.log('🎭 [apiAdapter] Mock updateDesignGeology:', id, data);
      return { success: true };
    }
  }

  /**
   * 删除设计地质信息
   */
  async deleteDesignGeology(id: string): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.deleteDesignGeology(id);
    } else {
      console.log('🎭 [apiAdapter] Mock deleteDesignGeology:', id);
      return { success: true };
    }
  }

  // ========== 物探法 CRUD ==========

  /**
   * 获取物探法列表
   */
  async getGeophysicalMethods(params?: { sitePk?: number; pageNum?: number; pageSize?: number }) {
    if (USE_REAL_API) {
      return realAPI.getGeophysicalMethods(params || {});
    } else {
      // Mock实现
      return this.generateMockGeophysicalMethods(params);
    }
  }

  /**
   * 创建物探法记录
   */
  async createGeophysicalMethod(data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.createGeophysicalMethod(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createGeophysicalMethod:', data);
      return { success: true };
    }
  }

  /**
   * 更新物探法记录
   */
  async updateGeophysicalMethod(id: string, data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.updateGeophysicalMethod(id, data);
    } else {
      console.log('🎭 [apiAdapter] Mock updateGeophysicalMethod:', id, data);
      return { success: true };
    }
  }

  /**
   * 删除物探法记录
   */
  async deleteGeophysicalMethod(id: string): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.deleteGeophysicalMethod(id);
    } else {
      console.log('🎭 [apiAdapter] Mock deleteGeophysicalMethod:', id);
      return { success: true };
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
    
    // 生成综合结论Mock数据
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

  private generateMockRockGrades(params?: { pageNum?: number; pageSize?: number }) {
    const pageSize = params?.pageSize || 15;
    const total = Math.floor(Math.random() * 50) + 20;
    const records = [];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      records.push({
        sjwydjPk: i + 1,
        sjwydjId: i + 1,
        sitePk: 1,
        dkname: 'DK',
        dkilo: 713 + Math.random() * 10,
        sjwydjLength: Math.floor(Math.random() * 500) + 50,
        wydj: Math.floor(Math.random() * 6) + 1, // 1-6
        revise: ['初次设计', '修改设计', '补充设计'][Math.floor(Math.random() * 3)],
        username: ['一分部', '二分部', '三分部'][Math.floor(Math.random() * 3)],
        gmtCreate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        gmtModified: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      });
    }
    
    return {
      current: params?.pageNum || 1,
      size: pageSize,
      records,
      total,
      pages: Math.ceil(total / pageSize)
    };
  }

  private generateMockGeologies(params?: { pageNum?: number; pageSize?: number }) {
    const pageSize = params?.pageSize || 15;
    const total = Math.floor(Math.random() * 40) + 15;
    const records = [];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      records.push({
        sjdzPk: i + 1,
        sjdzId: i + 1,
        sitePk: 1,
        dkname: 'DK',
        dkilo: 713 + Math.random() * 10,
        sjdzLength: Math.floor(Math.random() * 300) + 30,
        method: Math.floor(Math.random() * 5) + 1,
        revise: ['地质调查', '补充勘探', '详细勘探'][Math.floor(Math.random() * 3)],
        username: ['地质组', '勘探组', '设计组'][Math.floor(Math.random() * 3)],
        gmtCreate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        gmtModified: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      });
    }
    
    return {
      current: params?.pageNum || 1,
      size: pageSize,
      records,
      total,
      pages: Math.ceil(total / pageSize)
    };
  }

  private generateMockGeophysicalMethods(params?: { pageNum?: number; pageSize?: number }) {
    const pageSize = params?.pageSize || 15;
    const total = Math.floor(Math.random() * 60) + 30;
    const records = [];
    
    const methods = [
      { code: 1, name: 'TSP' },
      { code: 2, name: 'HSP' },
      { code: 3, name: '陆地声呐' },
      { code: 4, name: '电磁波反射' },
      { code: 5, name: '高分辨直流电' },
      { code: 6, name: '瞬变电磁' },
      { code: 9, name: '微震监测' }
    ];
    
    for (let i = 0; i < Math.min(pageSize, total); i++) {
      const method = methods[Math.floor(Math.random() * methods.length)];
      records.push({
        wtfPk: i + 1,
        wtfId: `wtf_${i + 1}`,
        sitePk: 1,
        ybPk: Math.floor(Math.random() * 10) + 1,
        method: method.code,
        dkname: 'DK',
        dkilo: 713 + Math.random() * 10,
        wtfLength: Math.floor(Math.random() * 200) + 50,
        monitordate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        originalfile: `${method.name}_${i + 1}.dat`,
        addition: `${method.name}探测记录`,
        images: `${method.name}_${i + 1}.jpg`,
        gmtCreate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        gmtModified: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      });
    }
    
    return {
      current: params?.pageNum || 1,
      size: pageSize,
      records,
      total,
      pages: Math.ceil(total / pageSize)
    };
  }

  // ========== 五种预报方法 ==========

  // 获取物探法列表
  async getGeophysicalList(params: { pageNum: number; pageSize: number; siteId?: string }) {
    if (USE_REAL_API) {
      return realAPI.getGeophysicalList(params);
    } else {
      // Mock数据
      const mockData = [
        {
          wtfPk: 1,
          wtfId: 'wtf_001',
          sitePk: 1,
          ybPk: 1,
          method: 1,
          methodName: '地质雷达',
          dkname: 'DK',
          dkilo: 713.920,
          wtfLength: 150,
          monitordate: '2024-01-15',
          originalfile: '地质雷达_001.dat',
          addition: '地质雷达探测记录，发现异常区域',
          images: '地质雷达_001.jpg',
          gmtCreate: '2024-01-15T10:30:00',
          gmtModified: '2024-01-15T10:30:00'
        },
        {
          wtfPk: 2,
          wtfId: 'wtf_002',
          sitePk: 1,
          ybPk: 2,
          method: 2,
          methodName: '红外探测',
          dkname: 'DK',
          dkilo: 714.100,
          wtfLength: 120,
          monitordate: '2024-01-20',
          originalfile: '红外探测_002.dat',
          addition: '红外探测正常',
          images: '红外探测_002.jpg',
          gmtCreate: '2024-01-20T14:20:00',
          gmtModified: '2024-01-20T14:20:00'
        },
        {
          wtfPk: 3,
          wtfId: 'wtf_003',
          sitePk: 1,
          ybPk: 3,
          method: 3,
          methodName: '陆地声呐',
          dkname: 'DK',
          dkilo: 714.500,
          wtfLength: 180,
          monitordate: '2024-02-01',
          originalfile: '陆地声呐_003.dat',
          addition: '陆地声呐探测，发现溶洞',
          images: '陆地声呐_003.jpg',
          gmtCreate: '2024-02-01T09:15:00',
          gmtModified: '2024-02-01T09:15:00'
        }
      ];
      return { 
        records: mockData, 
        total: mockData.length, 
        current: 1, 
        size: 10, 
        pages: 1 
      };
    }
  }

  // 获取掌子面素描列表
  async getPalmSketchList(params: { pageNum: number; pageSize: number; siteId?: string }) {
    if (USE_REAL_API) {
      return realAPI.getPalmSketchList(params);
    } else {
      const mockData = [
        {
          zzmsmPk: 1,
          zzmsmId: 'zzm_001',
          sitePk: 1,
          ybPk: 1,
          dkname: 'DK',
          dkilo: 713.920,
          monitordate: '2024-01-16',
          rockGrade: 'III',
          waterInflow: '中等',
          addition: '掌子面岩体完整，节理发育',
          images: 'zzm_001.jpg',
          gmtCreate: '2024-01-16T08:30:00',
          gmtModified: '2024-01-16T08:30:00'
        },
        {
          zzmsmPk: 2,
          zzmsmId: 'zzm_002',
          sitePk: 1,
          ybPk: 2,
          dkname: 'DK',
          dkilo: 714.200,
          monitordate: '2024-01-22',
          rockGrade: 'IV',
          waterInflow: '少量',
          addition: '掌子面稳定，局部有渗水',
          images: 'zzm_002.jpg',
          gmtCreate: '2024-01-22T10:15:00',
          gmtModified: '2024-01-22T10:15:00'
        }
      ];
      return { 
        records: mockData, 
        total: mockData.length, 
        current: 1, 
        size: 10, 
        pages: 1 
      };
    }
  }

  // 获取洞身素描列表
  async getTunnelSketchList(params: { pageNum: number; pageSize: number; siteId?: string }) {
    if (USE_REAL_API) {
      return realAPI.getTunnelSketchList(params);
    } else {
      const mockData = [
        {
          dssmPk: 1,
          dssmId: 'ds_001',
          sitePk: 1,
          ybPk: 1,
          dkname: 'DK',
          dkilo: 713.850,
          monitordate: '2024-01-18',
          liningThickness: 35,
          crackCount: 2,
          addition: '洞身衬砌完好，发现2条细微裂缝',
          images: 'ds_001.jpg',
          gmtCreate: '2024-01-18T14:00:00',
          gmtModified: '2024-01-18T14:00:00'
        },
        {
          dssmPk: 2,
          dssmId: 'ds_002',
          sitePk: 1,
          ybPk: 2,
          dkname: 'DK',
          dkilo: 714.300,
          monitordate: '2024-01-25',
          liningThickness: 40,
          crackCount: 0,
          addition: '洞身状态良好，无明显缺陷',
          images: 'ds_002.jpg',
          gmtCreate: '2024-01-25T11:30:00',
          gmtModified: '2024-01-25T11:30:00'
        }
      ];
      return { 
        records: mockData, 
        total: mockData.length, 
        current: 1, 
        size: 10, 
        pages: 1 
      };
    }
  }

  // 获取钻探法列表
  async getDrillingList(params: { pageNum: number; pageSize: number; siteId?: string }) {
    if (USE_REAL_API) {
      return realAPI.getDrillingList(params);
    } else {
      const mockData = [
        {
          ztfPk: 1,
          ztfId: 'zt_001',
          sitePk: 1,
          ybPk: 1,
          dkname: 'DK',
          dkilo: 713.900,
          drillDepth: 50,
          coreLength: 48,
          monitordate: '2024-01-12',
          rockType: '花岗岩',
          addition: '钻探取芯完整，岩体强度高',
          images: 'zt_001.jpg',
          gmtCreate: '2024-01-12T09:00:00',
          gmtModified: '2024-01-12T09:00:00'
        },
        {
          ztfPk: 2,
          ztfId: 'zt_002',
          sitePk: 1,
          ybPk: 2,
          dkname: 'DK',
          dkilo: 714.150,
          drillDepth: 45,
          coreLength: 42,
          monitordate: '2024-01-28',
          rockType: '砂岩',
          addition: '钻探发现软弱夹层',
          images: 'zt_002.jpg',
          gmtCreate: '2024-01-28T13:45:00',
          gmtModified: '2024-01-28T13:45:00'
        }
      ];
      return { 
        records: mockData, 
        total: mockData.length, 
        current: 1, 
        size: 10, 
        pages: 1 
      };
    }
  }

  // 获取地表补充信息
  async getSurfaceSupplementInfo(ybPk: string) {
    if (USE_REAL_API) {
      return realAPI.getSurfaceSupplementInfo(ybPk);
    } else {
      return null;
    }
  }
}

// 导出单例
const apiAdapter = new APIAdapter();

// 在开发环境打印API类型
if (process.env.NODE_ENV === 'development') {
  console.log(`🔌 API Mode: ${apiAdapter.getAPIType()}`);
  if (USE_REAL_API) {
    console.log(`📡 Using Real Backend API (via proxy: /api -> http://121.40.127.120:8080/api/v1)`);
  } else {
    console.log(`🎭 Using Mock Data for development`);
  }
}

export default apiAdapter;
