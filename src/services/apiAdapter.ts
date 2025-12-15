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
   * 获取工点的设计围岩信息（GeoPointSearchIntegrated 中“设计围岩”Tab 使用）
   * 这里复用设计围岩等级列表接口，并适配为 { list, total } 结构
   */
  async getWorkPointDesignRock(
    workPointId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<{ list: any[]; total: number }> {
    const pageNum = params?.page;
    const pageSize = params?.pageSize;

    // 使用真实的设计围岩接口，按工点ID过滤
    const result: any = await this.getDesignRockGrades({
      siteId: workPointId,
      pageNum,
      pageSize
    });

    const records = result.records || [];
    const list = records.map((item: any, index: number) => ({
      id: String(item.sjwydjPk ?? item.sjwydjId ?? index),
      createdAt: item.gmtCreate || '',
      dkilo: item.dkilo,
      rockGrade: typeof item.wydj === 'number' ? `Ⅲ-${item.wydj}` : item.wydj, // 简单转成字符串展示
      length: item.sjwydjLength,
      revise: item.revise,
      username: item.username,
    }));

    return {
      list,
      total: typeof result.total === 'number' ? result.total : records.length,
    };
  }

  /**
   * 获取工点的设计地质信息（GeoPointSearchIntegrated 中“设计地质”Tab 使用）
   * 使用真实的设计地质列表接口 /api/v1/sjdz/list
   */
  async getWorkPointDesignGeology(
    workPointId: string,
    params?: { page?: number; pageSize?: number; statusFilter?: 'all' | 'editing' | 'uploaded' }
  ): Promise<{ list: any[]; total: number }> {
    const pageNum = params?.page;
    const pageSize = params?.pageSize;
    const statusFilter = params?.statusFilter || 'all'; // 默认显示所有状态

    // 使用真实的设计地质接口
    const result: any = await this.getDesignGeologies({
      siteId: workPointId,
      pageNum,
      pageSize
    });

    const records = result.records || [];
    let list = records.map((item: any, index: number) => {
      // 根据第二张图片的列结构映射数据
      const dkilo = item.dkilo;
      const startMileage = item.dkname && dkilo ? `${item.dkname}${dkilo.toFixed(3)}` : '';
      const endMileage = item.sjdzLength ?
        `${item.dkname}${(dkilo + item.sjdzLength / 1000).toFixed(3)}` : '';

      // 模拟状态：根据创建时间或其他条件判断状态
      // 这里简单模拟：奇数ID为"编辑中"，偶数ID为"已上传"
      const itemId = item.sjdzPk ?? item.sjdzId ?? index;
      const status = itemId % 2 === 1 ? 'editing' : 'uploaded';
      const statusText = status === 'editing' ? '编辑中' : '已上传';

      return {
        id: String(itemId),
        createdAt: item.gmtCreate || '',
        geologyType: this.getGeologyMethodName(item.method), // 地质类型
        geologyInfluence: item.dzxxfj ? this.getGeologyInfluenceName(item.dzxxfj) : '一般', // 地应力影响度
        startMileage,  // 开始里程
        endMileage,    // 结束里程  
        length: item.sjdzLength, // 预报长度
        revise: item.revise || '', // 修改原因
        username: item.username || '', // 填写人
        status: status, // 状态代码
        statusText: statusText, // 状态文本
      };
    });

    // 根据状态过滤数据
    if (statusFilter === 'editing') {
      list = list.filter((item: any) => item.status === 'editing');
    } else if (statusFilter === 'uploaded') {
      list = list.filter((item: any) => item.status === 'uploaded');
    }
    // statusFilter === 'all' 时不过滤

    return {
      list,
      total: list.length, // 过滤后的总数
    };
  }

  /**
   * 根据方法代码获取地质类型名称
   */
  private getGeologyMethodName(method: number): string {
    const methodMap: Record<number, string> = {
      1: '地质雷达',
      2: '红外探测',
      3: '陆地声呐',
      4: '电磁波反射',
      5: '高分辨直流电',
      6: '瞬变电磁',
      7: '微震监测',
      8: '地质调查',
      9: '钻探取芯'
    };
    return methodMap[method] || `方法${method}`;
  }

  /**
   * 根据地质信息附加代码获取影响度名称
   */
  private getGeologyInfluenceName(dzxxfj: number): string {
    const influenceMap: Record<number, string> = {
      1: '轻微',
      2: '一般',
      3: '较复杂',
      4: '复杂',
      5: '极复杂'
    };
    return influenceMap[dzxxfj] || '一般';
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
    const result = await realAPI.getForecastDesigns(params);

    console.log('📊 [apiAdapter] getForecastDesigns 结果:', {
      total: result.total,
      listLength: result.list.length,
      page: params.page,
      pageSize: params.pageSize
    });

    return result;
  }

  /**
   * 创建预报设计记录
   */
  async createForecastDesign(data: any) {
    return realAPI.createForecastDesign(data);
  }

  /**
   * 更新预报设计记录
   */
  async updateForecastDesign(id: string, data: any) {
    return realAPI.updateForecastDesign(id, data);
  }

  /**
   * 删除预报设计记录
   */
  async deleteForecastDesign(id: string) {
    return realAPI.deleteForecastDesign(id);
  }

  /**
   * 批量删除预报设计记录
   */
  async batchDeleteForecastDesigns(ids: string[]) {
    return realAPI.batchDeleteForecastDesigns(ids);
  }

  /**
   * 导入预报设计记录
   */
  async importForecastDesigns(file: File) {
    return realAPI.importForecastDesigns(file);
  }

  // ========== 设计围岩等级 CRUD ==========

  /**
   * 获取设计围岩等级列表
   */
  async getDesignRockGrades(params: { siteId: string; pageNum?: number; pageSize?: number; wydj?: number; begin?: string; end?: string }) {
    if (USE_REAL_API) {
      return realAPI.getDesignRockGrades(params);
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
  async getDesignGeologies(params: { siteId: string; pageNum?: number; pageSize?: number; method?: number; begin?: string; end?: string }) {
    if (USE_REAL_API) {
      return realAPI.getDesignGeologies(params);
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

  /**
   * 批量删除设计地质信息
   */
  async batchDeleteDesignGeologies(ids: string[]): Promise<{ success: boolean; successCount: number; failCount: number }> {
    if (USE_REAL_API) {
      return realAPI.batchDeleteDesignGeologies(ids);
    } else {
      console.log('🎭 [apiAdapter] Mock batchDeleteDesignGeologies:', ids);
      return { success: true, successCount: ids.length, failCount: 0 };
    }
  }

  /**
   * 下载设计地质模板
   */
  async downloadDesignGeologyTemplate(params?: {
    startdate?: string;
    enddate?: string;
    siteID?: number;
    method?: number;
  }): Promise<Blob> {
    if (USE_REAL_API) {
      return realAPI.downloadDesignGeologyTemplate(params);
    } else {
      console.log('🎭 [apiAdapter] Mock downloadDesignGeologyTemplate:', params);
      // 创建一个模拟的Excel文件
      const csvContent = 'ID,地质类型,创建时间,地应力影响度,开始里程,结束里程,预报长度\n1,地质雷达,2024-01-01,一般,DK713+000,DK713+100,100';
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
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
   * @param data 数据
   * @param method 预报方法 (1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC)
   */
  async createGeophysicalMethod(data: any, method?: string | null): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.createGeophysicalMethod(data, method);
    } else {
      console.log('🎭 [apiAdapter] Mock createGeophysicalMethod:', data, method);
      return { success: true };
    }
  }

  /**
   * 创建 TSP 记录
   */
  async createTsp(data: any): Promise<any> {
    if (USE_REAL_API) {
      const res = await realAPI.createTsp(data);
      // 适配返回值，确保包含 success 字段
      if (res && (res.resultcode === 200 || (res as any).code === 200)) {
        return { success: true, ...res };
      }
      return { success: false, ...res };
    } else {
      console.log('🎭 [apiAdapter] Mock createTsp:', data);
      return { success: true };
    }
  }

  /**
   * 创建掌子面素描记录
   */
  async createPalmSketch(data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.createPalmSketch(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createPalmSketch:', data);
      return { success: true };
    }
  }

  /**
   * 创建洞身素描记录
   */
  async createTunnelSketch(data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.createTunnelSketch(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createTunnelSketch:', data);
      return { success: true };
    }
  }

  /**
   * 创建钻探法记录
   */
  async createDrilling(data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.createDrilling(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createDrilling:', data);
      return { success: true };
    }
  }

  /**
   * 创建地表补充记录
   */
  async createSurfaceSupplement(data: any): Promise<{ success: boolean }> {
    if (USE_REAL_API) {
      return realAPI.createSurfaceSupplement(data);
    } else {
      console.log('🎭 [apiAdapter] Mock createSurfaceSupplement:', data);
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

  /**
   * 获取地震波反射详情 (TSP)
   */
  async getTspDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getTspDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getTspDetail(ybPk);
      console.log('🔍 [apiAdapter] getTspDetail 结果:', result);
      return result;
    } else {
      // Mock实现
      console.log('🎭 [apiAdapter] getTspDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取水平声波剖面详情 (HSP)
   */
  async getHspDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getHspDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getHspDetail(ybPk);
      console.log('🔍 [apiAdapter] getHspDetail 结果:', result);
      return result;
    } else {
      // Mock实现
      console.log('🎭 [apiAdapter] getHspDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取陆地声纳详情 (LDSN)
   */
  async getLdsnDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getLdsnDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getLdsnDetail(ybPk);
      console.log('🔍 [apiAdapter] getLdsnDetail 结果:', result);
      return result;
    } else {
      // Mock实现
      console.log('🎭 [apiAdapter] getLdsnDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取电磁波反射详情 (DCBFS)
   */
  async getDcbfsDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getDcbfsDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getDcbfsDetail(ybPk);
      console.log('🔍 [apiAdapter] getDcbfsDetail 结果:', result);
      return result;
    } else {
      // Mock实现
      console.log('🎭 [apiAdapter] getDcbfsDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取高分辨直流电详情 (GFBZLD)
   */
  async getGfbzldDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getGfbzldDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getGfbzldDetail(ybPk);
      console.log('🔍 [apiAdapter] getGfbzldDetail 结果:', result);
      return result;
    } else {
      console.log('🎭 [apiAdapter] getGfbzldDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取瞬变电磁详情 (SBDC)
   */
  async getSbdcDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getSbdcDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getSbdcDetail(ybPk);
      console.log('🔍 [apiAdapter] getSbdcDetail 结果:', result);
      return result;
    } else {
      console.log('🎭 [apiAdapter] getSbdcDetail Mock模式');
      return null;
    }
  }

  /**
   * 获取微震监测详情 (WZJC)
   */
  async getWzjcDetail(ybPk: string): Promise<any> {
    console.log('🔍 [apiAdapter] getWzjcDetail 调用, ybPk:', ybPk, 'USE_REAL_API:', USE_REAL_API);
    if (USE_REAL_API) {
      const result = await realAPI.getWzjcDetail(ybPk);
      console.log('🔍 [apiAdapter] getWzjcDetail 结果:', result);
      return result;
    } else {
      console.log('🎭 [apiAdapter] getWzjcDetail Mock模式');
      return null;
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
  async getGeophysicalList(params: { pageNum: number; pageSize: number; siteId: string }) {
    if (USE_REAL_API) {
      const result = await realAPI.getGeophysicalList(params);
      console.log('🔍 [apiAdapter] getGeophysicalList 真实API结果:', result);
      return result;
    } else {
      return this.getMockGeophysicalData();
    }
  }

  // Mock数据方法
  private getMockGeophysicalData() {
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
        wtfLength: 200,
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
      pages: Math.ceil(mockData.length / 10)
    };
  }

  // 获取掌子面素描列表
  async getPalmSketchList(params: { pageNum: number; pageSize: number; siteId: string }) {
    if (USE_REAL_API) {
      const result = await realAPI.getPalmSketchList(params);
      console.log('🔍 [apiAdapter] getPalmSketchList 真实API结果:', result);
      return result;
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
  async getTunnelSketchList(params: { pageNum: number; pageSize: number; siteId: string }) {
    if (USE_REAL_API) {
      const result = await realAPI.getTunnelSketchList(params);
      console.log('🔍 [apiAdapter] getTunnelSketchList 真实API结果:', result);
      return result;
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
  async getDrillingList(params: { pageNum: number; pageSize: number; siteId: string }) {
    if (USE_REAL_API) {
      const result = await realAPI.getDrillingList(params);
      console.log('🔍 [apiAdapter] getDrillingList 真实API结果:', result);
      return result;
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

  // 获取地表补充列表
  async getSurfaceSupplementList(params: { pageNum: number; pageSize: number; siteId: string }) {
    if (USE_REAL_API) {
      const result = await realAPI.getSurfaceSupplementList(params);
      console.log('🔍 [apiAdapter] getSurfaceSupplementList 真实API结果:', result);
      return result;
    } else {
      return { records: [], total: 0, current: 1, size: 10, pages: 0 };
    }
  }

  // 获取地表补充信息
  async getSurfaceSupplementInfo(ybPk: string) {
    if (USE_REAL_API) {
      const result = await realAPI.getSurfaceSupplementInfo(ybPk);
      console.log('🔍 [apiAdapter] getSurfaceSupplementInfo 真实API结果:', result);
      return result;
    } else {
      return null;
    }
  }

  // 更新地表补充信息
  async updateSurfaceSupplement(id: string, data: any) {
    if (USE_REAL_API) {
      const result = await realAPI.updateSurfaceSupplement(id, data);
      console.log('🔍 [apiAdapter] updateSurfaceSupplement 真实API结果:', result);
      return result;
    } else {
      return { success: true };
    }
  }

  // 删除地表补充信息
  async deleteSurfaceSupplement(id: string) {
    if (USE_REAL_API) {
      const result = await realAPI.deleteSurfaceSupplement(id);
      console.log('🔍 [apiAdapter] deleteSurfaceSupplement 真实API结果:', result);
      return result;
    } else {
      return { success: true };
    }
  }

  // 撤回预报数据（将submitFlag从1改为0）
  async withdrawForecast(type: string, id: string, data: any) {
    if (USE_REAL_API) {
      // 将submitFlag设置为0表示撤回
      const withdrawData = { ...data, submitFlag: 0 };
      console.log('🔄 [apiAdapter] withdrawForecast 撤回数据:', { type, id, withdrawData });

      switch (type) {
        case 'geophysical':
          return realAPI.updateGeophysicalMethod(id, withdrawData, data.method?.toString());
        case 'palmSketch':
          return realAPI.updateFaceSketch(id, withdrawData);
        case 'tunnelSketch':
          return realAPI.updateTunnelSketch(id, withdrawData);
        case 'drilling':
          return realAPI.updateDrillingMethod(id, withdrawData);
        case 'surface':
          return realAPI.updateSurfaceSupplement(id, withdrawData);
        default:
          return { success: false, message: '不支持的类型' };
      }
    } else {
      return { success: true };
    }
  }

  // ========== 五种方法的CRUD操作 ==========

  // 物探法操作
  async getGeophysicalDetail(id: string) {
    if (USE_REAL_API) {
      return realAPI.getGeophysicalMethodDetail(parseInt(id));
    } else {
      return { id, method: '地质雷达', details: 'Mock详情数据' };
    }
  }

  /**
   * 按方法代码与 ybPk 获取物探法详情
   * method: 1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC, 9=WZJC
   */
  async getGeophysicalDetailByMethod(method: number | string, ybPk: string) {
    if (USE_REAL_API) {
      return realAPI.getGeophysicalDetailByMethod(method, ybPk);
    } else {
      return { method, ybPk, details: 'Mock详情数据' };
    }
  }

  async updateGeophysical(id: string, data: any, method?: string | null): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.updateGeophysicalMethod(id, data, method);
    } else {
      return { success: true };
    }
  }

  async deleteGeophysical(id: string) {
    if (USE_REAL_API) {
      return realAPI.deleteGeophysicalMethod(id);
    } else {
      return { success: true };
    }
  }

  /**
   * 获取掌子面素描详情
   */
  async getPalmSketchDetail(id: string) {
    if (USE_REAL_API) {
      return realAPI.getFaceSketchDetail(parseInt(id));
    } else {
      return { id, details: 'Mock掌子面素描详情' };
    }
  }

  /**
   * 获取洞身素描详情
   */




  async copyGeophysical(id: string) {
    if (USE_REAL_API) {
      // 先获取详情，然后创建新记录
      const detail = await this.getGeophysicalDetail(id);
      if (detail) {
        // 移除ID相关字段，创建副本
        const copyData = { ...detail };
        delete copyData.wtfPk;
        delete copyData.wtfId;
        return realAPI.createGeophysicalMethod(copyData);
      }
      return { success: false };
    } else {
      return { success: true };
    }
  }

  async uploadGeophysical(id: string) {
    if (USE_REAL_API) {
      // 调用上传API，具体实现根据后端接口
      return realAPI.uploadGeophysicalData(id);
    } else {
      return { success: true };
    }
  }

  // 掌子面素描操作（保留上方 getPalmSketchDetail 简版实现）

  async updatePalmSketch(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.updateFaceSketch(id, data);
    } else {
      return { success: true };
    }
  }

  async deletePalmSketch(id: string) {
    if (USE_REAL_API) {
      return realAPI.deleteFaceSketch(id);
    } else {
      return { success: true };
    }
  }

  // 洞身素描操作
  async getTunnelSketchDetail(id: string) {
    if (USE_REAL_API) {
      // 使用已存在的方法名
      return realAPI.getTunnelSketchDetail(parseInt(id));
    } else {
      return { id, method: '洞身素描', details: 'Mock详情数据' };
    }
  }

  async updateTunnelSketch(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.updateTunnelSketch(id, data);
    } else {
      return { success: true };
    }
  }

  async deleteTunnelSketch(id: string) {
    if (USE_REAL_API) {
      return realAPI.deleteTunnelSketch(id);
    } else {
      return { success: true };
    }
  }

  // 钻探法操作（保留后部正式版 getDrillingDetail，避免重复）
  async getDrillingDetail(id: string, method?: string | null) {
    if (USE_REAL_API) {
      return realAPI.getDrillingMethodDetail(parseInt(id), method);
    } else {
      return { id, method, details: 'Mock钻探详情' };
    }
  }

  async updateDrilling(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    if (USE_REAL_API) {
      return realAPI.updateDrillingMethod(id, data);
    } else {
      return { success: true };
    }
  }

  async deleteDrilling(id: string) {
    if (USE_REAL_API) {
      return realAPI.deleteDrillingMethod(id);
    } else {
      return { success: true };
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
