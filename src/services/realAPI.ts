/**
 * 真实API服务 - 统一API调用接口
 * 用于替换所有Mock数据，连接真实后端
 * 基于Swagger API文档: http://121.40.127.120:8080/swagger-ui/index.html
 */

import { get } from '../utils/api';
import type { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// ==================== 后端API响应类型定义 ====================

// 标段（Bid Section）类型
export interface BidSection {
  bdPk: number;
  bdId: string;
  bdname: string;
  bdcode: string;
  xmId: string;
  xmcode: string;
  xmname: string;
  jsdanwei?: string;
  sgdanwei?: string;
  jldanwei?: string;
  bdStartKilo?: string;
  bdStopKilo?: string;
  gmtCreate?: string;
  gmtModified?: string;
}

// 工作位（Work Position）类型
export interface WorkPosition {
  gzwPk: number;
  gzwId: string;
  bdPk: number;
  gzwname: string;
  gzwStartKilo?: string;
  gzwStopKilo?: string;
  gmtCreate?: string;
  gmtModified?: string;
}

// 工点（Site）类型 - 真实后端字段
export interface BackendSite {
  sitePk: number;
  siteId: string;
  gzwPk: number;
  sitename: string;
  sitecode: string;
  siteStartKilo?: string;
  siteStopKilo?: string;
  useflag?: number | string; // 可以是数字1或字符串"1"
  gmtCreate?: string;
  gmtModified?: string;
}

// 物探法（Geophysical）基本数据类型
export interface GeophysicalMethod {
  wtfPk: number;
  wtfId: string;
  sitePk: number;
  ybPk: number;
  method: number; // 1:TSP; 2:HSP; 3:陆地声呐; 4:电磁波反射; 5:高分辨直流电; 6:瞬变电磁; 9:微震监测; 0:其他
  originalfile?: string;
  addition?: string;
  images?: string;
  gcxtpic?: string;
  dkname?: string;
  dkilo?: number;
  monitordate?: string;
  wtfLength?: number;
  gmtCreate?: string;
  gmtModified?: string;
}

// 地震波反射（TSP）详细数据类型
export interface TspDetailData {
  tsp: {
    tspPk: number;
    tspId: string;
    wtfPk: number;
    jfpknum?: number;
    jfpksd?: number;
    jfpkzj?: number;
    jfpkjdmgd?: number;
    jfpkjj?: number;
    jspknum?: number;
    jspksd?: number;
    jspkzj?: number;
    jspkjdmgd?: number;
    sbName?: string;
    kwwz?: number;
    leftkilo?: number;
    rightkilo?: number;
    leftjgdczjl?: number;
    rightjgdczjl?: number;
    leftzxjl?: number;
    rightzxjl?: number;
    leftjdmgd?: number;
    rightjdmgd?: number;
    leftks?: number;
    rightks?: number;
    leftqj?: number;
    rightqj?: number;
    pic1?: string;
    pic2?: string;
    pic3?: string;
    pic4?: string;
    pic5?: string;
    pic6?: string;
    gmtCreate?: string;
    gmtModified?: string;
  };
  tspBxdataList?: any[];
  tspPddataList?: any[];
}

// 设计预报（Design Forecast）类型
export interface DesignForecast {
  sjybPk: number;
  sjybId: number;
  sitePk: number;
  method: number;
  dkname: string;
  dkilo: number;
  sjybLength: number;
  zxms?: number;
  zksl?: number;
  qxsl?: number;
  revise?: string;
  username?: string;
  plantime?: string;
  plannum?: number;
  gmtCreate?: string;
  gmtModified?: string;
}

// 预报设计记录类型（前端使用）
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
  private readonly userId = 1; // 默认用户ID，实际应该从登录状态获取

  // ========== 标段管理 ==========
  
  /**
   * 获取标段列表（包含工作位和工点的完整层级结构）
   * @param userId 用户ID
   * @returns 标段列表，包含嵌套的工作位和工点
   */
  async getBidSectionList(userId?: number): Promise<any> {
    const uid = userId || this.userId;
    const response = await get<any>(`/api/bd/list`, { params: { userid: uid } });
    console.log('🔍 [realAPI] getBidSectionList 原始响应:', response);
    console.log('🔍 [realAPI] bdVOList 存在?', !!response?.bdVOList);
    console.log('🔍 [realAPI] bdVOList 长度:', response?.bdVOList?.length);
    return response;
  }

  // ========== 物探法管理 ==========
  
  /**
   * 获取物探法基本数据列表
   * @param params 查询参数
   * @returns 物探法数据列表（分页）
   */
  async getGeophysicalMethodList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    method?: number; // 1:TSP; 2:HSP; 3:陆地声呐; 4:电磁波反射; 5:高分辨直流电; 6:瞬变电磁; 9:微震监测; 0:其他
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/wtf/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取物探法基本数据详情
   * @param wtfPk 物探法主键
   * @returns 物探法详细信息
   */
  async getGeophysicalMethodDetail(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/${wtfPk}`);
  }

  /**
   * 获取地震波反射数据
   * @param wtfPk 物探法主键
   * @returns TSP详细数据
   */
  async getTspData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/tsp`, { params: { wtfPk } });
  }

  /**
   * 获取水平声波剖面数据
   * @param wtfPk 物探法主键
   * @returns HSP详细数据
   */
  async getHspData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/hsp`, { params: { wtfPk } });
  }

  /**
   * 获取陆地声呐数据
   * @param wtfPk 物探法主键
   * @returns 陆地声呐详细数据
   */
  async getLdsnData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/ldsn`, { params: { wtfPk } });
  }

  /**
   * 获取电磁波反射数据
   * @param wtfPk 物探法主键
   * @returns 电磁波反射详细数据
   */
  async getDcbfsData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/dcbfs`, { params: { wtfPk } });
  }

  /**
   * 获取高分辨直流电法数据
   * @param wtfPk 物探法主键
   * @returns 高分辨直流电法详细数据
   */
  async getGfbzldData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/gfbzld`, { params: { wtfPk } });
  }

  /**
   * 获取瞬变电磁法数据
   * @param wtfPk 物探法主键
   * @returns 瞬变电磁法详细数据
   */
  async getSbdcData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/sbdc`, { params: { wtfPk } });
  }

  /**
   * 获取微震监测数据
   * @param wtfPk 物探法主键
   * @returns 微震监测详细数据
   */
  async getWzjcData(wtfPk: number): Promise<any> {
    return get<any>(`/api/wtf/wzjc`, { params: { wtfPk } });
  }

  // ========== 钻探法管理 ==========
  
  /**
   * 获取钻探法列表
   * @param params 查询参数
   * @returns 钻探法数据列表（分页）
   */
  async getDrillingMethodList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    kwtype?: number; // 1:超前水平钻; 2:加深炮孔
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/ztf/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取钻探法详情
   * @param ztfPk 钻探法主键
   * @returns 钻探法详细信息
   */
  async getDrillingMethodDetail(ztfPk: number): Promise<any> {
    return get<any>(`/api/ztf/${ztfPk}`);
  }

  /**
   * 获取超前水平钻数据
   * @param ztfPk 钻探法主键
   * @returns 超前水平钻详细数据
   */
  async getCqspzData(ztfPk: number): Promise<any> {
    return get<any>(`/api/ztf/cqspz`, { params: { ztfPk } });
  }

  /**
   * 获取加深炮孔数据
   * @param ztfPk 钻探法主键
   * @returns 加深炮孔详细数据
   */
  async getJspkData(ztfPk: number): Promise<any> {
    return get<any>(`/api/ztf/jspk`, { params: { ztfPk } });
  }

  // ========== 设计预报管理 ==========
  
  /**
   * 获取设计预报方法列表
   * @param params 查询参数
   * @returns 设计预报数据列表（分页）
   */
  async getDesignForecastList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    method?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/sjyb/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取设计预报详情
   * @param sjybPk 设计预报主键
   * @returns 设计预报详细信息
   */
  async getDesignForecastDetail(sjybPk: number): Promise<any> {
    return get<any>(`/api/sjyb/${sjybPk}`);
  }

  // ========== 设计地质信息 ==========
  
  /**
   * 获取设计地质信息列表
   * @param params 查询参数
   * @returns 设计地质信息列表（分页）
   */
  async getDesignGeologyList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    method?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/sjdz/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取设计地质信息详情
   * @param sjdzPk 设计地质主键
   * @returns 设计地质详细信息
   */
  async getDesignGeologyDetail(sjdzPk: number): Promise<any> {
    return get<any>(`/api/sjdz/${sjdzPk}`);
  }

  // ========== 设计围岩等级 ==========
  
  /**
   * 获取设计围岩等级列表
   * @param params 查询参数
   * @returns 设计围岩等级列表（分页）
   */
  async getDesignRockGradeList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    wydj?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/sjwydj/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取设计围岩等级详情
   * @param sjwydjPk 设计围岩等级主键
   * @returns 设计围岩等级详细信息
   */
  async getDesignRockGradeDetail(sjwydjPk: number): Promise<any> {
    return get<any>(`/api/sjwydj/${sjwydjPk}`);
  }

  // ========== 掌子面素描 ==========
  
  /**
   * 获取掌子面素描数据列表
   * @param params 查询参数
   * @returns 掌子面素描数据列表（分页）
   */
  async getFaceSketchList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/zzmsm/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取掌子面素描详情
   * @param zzmsmPk 掌子面素描主键
   * @returns 掌子面素描详细信息
   */
  async getFaceSketchDetail(zzmsmPk: number): Promise<any> {
    return get<any>(`/api/zzmsm/${zzmsmPk}`);
  }

  // ========== 洞身素描 ==========
  
  /**
   * 获取洞身素描数据列表
   * @param params 查询参数
   * @returns 洞身素描数据列表（分页）
   */
  async getTunnelSketchList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/dssm/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取洞身素描详情
   * @param dssmPk 洞身素描主键
   * @returns 洞身素描详细信息
   */
  async getTunnelSketchDetail(dssmPk: number): Promise<any> {
    return get<any>(`/api/dssm/${dssmPk}`);
  }

  // ========== 地表补充 ==========
  
  /**
   * 获取地表补充数据列表
   * @param params 查询参数
   * @returns 地表补充数据列表（分页）
   */
  async getSurfaceSupplementList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/dbbc/list`, { params: { userid: this.userId, ...params } });
  }

  /**
   * 获取地表补充详情
   * @param dbbcPk 地表补充主键
   * @returns 地表补充详细信息
   */
  async getSurfaceSupplementDetail(dbbcPk: number): Promise<any> {
    return get<any>(`/api/dbbc/${dbbcPk}`);
  }

  // ========== 综合结论 ==========
  
  /**
   * 获取综合结论列表
   * @param params 查询参数
   * @returns 综合结论列表（分页）
   */
  async getComprehensiveConclusionList(params: {
    userid?: number;
    pageNum?: number;
    pageSize?: number;
    warndealflag?: number; // 0:未处置; 1:已处置
    begin?: string;
    end?: string;
  }): Promise<any> {
    return get<any>(`/api/zhjl/list`, { params: { userid: this.userId, ...params } });
  }

  // ========== 数据转换方法（将后端数据转换为前端需要的格式） ==========

  /**
   * 将后端标段数据转换为隧道列表
   * @param bidSectionData 后端返回的标段数据
   * @returns Tunnel[] 隧道列表
   */
  convertBidSectionsToTunnels(bidSectionData: any): Tunnel[] {
    console.log('🔍 [realAPI] convertBidSectionsToTunnels 输入:', bidSectionData);
    console.log('🔍 [realAPI] bidSectionData类型:', typeof bidSectionData);
    console.log('🔍 [realAPI] bidSectionData.bdVOList:', bidSectionData?.bdVOList);
    
    if (!bidSectionData || !bidSectionData.bdVOList) {
      console.warn('⚠️ [realAPI] 标段数据为空或缺少bdVOList');
      return [];
    }

    const tunnels: Tunnel[] = [];
    bidSectionData.bdVOList.forEach((bdVO: any, index: number) => {
      const bd = bdVO.bd;
      console.log(`🔍 [realAPI] 处理标段 ${index}:`, bd);
      tunnels.push({
        id: String(bd.bdPk),
        name: bd.bdname || `标段${index + 1}`,
        code: bd.bdcode || `BD${index + 1}`,
        status: 'active',
        projectId: bd.xmId || 'project-001'
      });
    });

    console.log('🔍 [realAPI] 转换完成，隧道数量:', tunnels.length);
    return tunnels;
  }

  /**
   * 将后端工点数据转换为前端WorkPoint格式
   * @param siteData 后端返回的工点数据
   * @param gzwPk 工作位主键
   * @returns WorkPoint 工点对象
   */
  convertSiteToWorkPoint(siteData: BackendSite, gzwPk?: number): WorkPoint {
    console.log(`🔍 [realAPI] 转换工点数据:`, siteData);
    
    return {
      id: String(siteData.sitePk),
      name: siteData.sitename || `工点${siteData.sitePk}`,
      code: siteData.sitecode || `SITE-${siteData.sitePk}`,
      mileage: this.parseKilometer(siteData.siteStartKilo || '0'),
      tunnelId: String(gzwPk || siteData.gzwPk),
      length: this.calculateLength(siteData.siteStartKilo, siteData.siteStopKilo),
      status: siteData.useflag === 1 || siteData.useflag === '1' ? 'active' : 'inactive',
      createdAt: siteData.gmtCreate || new Date().toISOString(),
      isTop: false,
      type: '工点',
      riskLevel: '中风险',
      geologicalCondition: 'Ⅲ级围岩'
    };
  }

  /**
   * 计算长度（从起止里程）
   */
  private calculateLength(startKilo?: string, stopKilo?: string): number {
    if (!startKilo || !stopKilo) return 0;
    // 提取里程数字部分（假设格式为 DKxxx+yyy）
    const start = this.parseKilometer(startKilo);
    const stop = this.parseKilometer(stopKilo);
    return Math.abs(stop - start);
  }

  /**
   * 解析里程字符串为数字
   */
  private parseKilometer(kilo: string): number {
    // 移除 DK、K 等前缀，只保留数字和+号
    const cleaned = kilo.replace(/[DKdk]/g, '');
    const parts = cleaned.split('+');
    const km = parseInt(parts[0] || '0');
    const m = parseInt(parts[1] || '0');
    return km * 1000 + m;
  }

  // ========== 项目管理 ==========
  
  /**
   * 获取项目信息
   */
  async getProjectInfo(): Promise<Project> {
    // 从标段数据中提取项目信息
    const bidData = await this.getBidSectionList();
    if (bidData && bidData.bdVOList && bidData.bdVOList.length > 0) {
      const firstBd = bidData.bdVOList[0].bd;
      return {
        id: firstBd.xmId || 'project-001',
        name: firstBd.xmname || '渝昆高铁引入昆明枢纽组织工程',
        constructionUnit: firstBd.jsdanwei || '中国铁路昆明局集团有限公司',
        description: `标段总数: ${bidData.bdVOList.length}`
      };
    }
    
    // 默认项目信息
    return {
      id: 'project-001',
      name: '渝昆高铁引入昆明枢纽组织工程',
      constructionUnit: '中国铁路昆明局集团有限公司',
      description: '新建铁路渝昆高铁引入昆明枢纽工程'
    };
  }

  /**
   * 获取所有隧道列表（从标段数据转换）
   */
  async getTunnels(): Promise<Tunnel[]> {
    const bidData = await this.getBidSectionList();
    console.log('🔍 [realAPI] getTunnels - bidData:', bidData);
    const tunnels = this.convertBidSectionsToTunnels(bidData);
    console.log('🔍 [realAPI] getTunnels - 转换后的隧道列表:', tunnels);
    return tunnels;
  }

  /**
   * 根据ID获取隧道详情
   */
  async getTunnelById(tunnelId: string): Promise<Tunnel> {
    const tunnels = await this.getTunnels();
    const tunnel = tunnels.find(t => t.id === tunnelId);
    if (!tunnel) {
      throw new Error(`Tunnel not found: ${tunnelId}`);
    }
    return tunnel;
  }

  /**
   * 获取指定隧道的工点列表（从标段->工作位->工点层级提取）
   */
  async getWorkPoints(tunnelId: string): Promise<WorkPoint[]> {
    const bidData = await this.getBidSectionList();
    if (!bidData || !bidData.bdVOList) {
      return [];
    }

    const workPoints: WorkPoint[] = [];
    
    // 在标段列表中查找对应的标段（tunnelId对应bdPk）
    const targetBd = bidData.bdVOList.find((bdVO: any) => String(bdVO.bd.bdPk) === tunnelId);
    if (!targetBd || !targetBd.gzwVOList) {
      return [];
    }

    // 遍历工作位列表，提取所有工点
    targetBd.gzwVOList.forEach((gzwVO: any) => {
      if (gzwVO.siteVOList) {
        gzwVO.siteVOList.forEach((siteVO: any) => {
          const workPoint = this.convertSiteToWorkPoint(siteVO.site, gzwVO.gzw.gzwPk);
          workPoints.push(workPoint);
        });
      }
    });

    return workPoints;
  }

  /**
   * 搜索工点
   */
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    const bidData = await this.getBidSectionList();
    if (!bidData || !bidData.bdVOList) {
      return [];
    }

    const workPoints: WorkPoint[] = [];
    const lowerKeyword = keyword.toLowerCase();

    bidData.bdVOList.forEach((bdVO: any) => {
      // 如果指定了tunnelId，只搜索该标段
      if (tunnelId && String(bdVO.bd.bdPk) !== tunnelId) {
        return;
      }

      if (bdVO.gzwVOList) {
        bdVO.gzwVOList.forEach((gzwVO: any) => {
          if (gzwVO.siteVOList) {
            gzwVO.siteVOList.forEach((siteVO: any) => {
              const site = siteVO.site;
              if (
                site.sitename.toLowerCase().includes(lowerKeyword) ||
                site.sitecode.toLowerCase().includes(lowerKeyword)
              ) {
                const workPoint = this.convertSiteToWorkPoint(site, gzwVO.gzw.gzwPk);
                workPoints.push(workPoint);
              }
            });
          }
        });
      }
    });

    return workPoints;
  }

  /**
   * 根据ID获取工点详情
   */
  async getWorkPointById(workPointId: string): Promise<WorkPoint> {
    const bidData = await this.getBidSectionList();
    if (!bidData || !bidData.bdVOList) {
      throw new Error(`WorkPoint not found: ${workPointId}`);
    }

    for (const bdVO of bidData.bdVOList) {
      if (bdVO.gzwVOList) {
        for (const gzwVO of bdVO.gzwVOList) {
          if (gzwVO.siteVOList) {
            for (const siteVO of gzwVO.siteVOList) {
              if (String(siteVO.site.sitePk) === workPointId) {
                return this.convertSiteToWorkPoint(siteVO.site, gzwVO.gzw.gzwPk);
              }
            }
          }
        }
      }
    }

    throw new Error(`WorkPoint not found: ${workPointId}`);
  }

  /**
   * 置顶/取消置顶工点（暂不支持，返回成功）
   */
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    // 后端暂无此接口，前端可以自行维护置顶状态
    console.log(`Toggle work point ${workPointId} top status to:`, isTop);
  }

  /**
   * 获取工点探测数据（用于HelloPage等页面）
   */
  async getGeoPointDetectionData(workPointId: string): Promise<GeoPointDetectionData> {
    // 这里需要根据工点ID查询相关的物探法数据
    // 暂时返回mock数据结构，后续根据实际需求调用相应的物探法接口
    const workPoint = await this.getWorkPointById(workPointId);
    
    // 可以调用物探法列表接口，筛选该工点的数据
    // const geophysicalData = await this.getGeophysicalMethodList({ ... });
    
    return {
      workPointId: workPoint.id,
      workPointName: workPoint.name,
      mileage: `DK${Math.floor(workPoint.mileage / 1000)}+${workPoint.mileage % 1000}`,
      length: workPoint.length || 0,
      detectionMethods: [
        { name: 'TSP', count: 0, color: '#3B82F6' },
        { name: 'HSP', count: 0, color: '#8B5CF6' },
      ],
      detectionDetails: {}
    };
  }

  /**
   * 获取工点的设计信息
   */
  async getWorkPointDesignInfo(workPointId: string, params?: { page?: number; pageSize?: number }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    // 根据工点ID（sitePk）查询设计预报数据
    // const designData = await this.getDesignForecastList({
    //   pageNum: params?.page || 1,
    //   pageSize: params?.pageSize || 10
    // });

    // 转换数据格式
    const list: ForecastDesignRecord[] = [];
    // TODO: 数据转换逻辑 - 需要根据sitePk筛选设计预报数据
    console.log('getWorkPointDesignInfo called for workPointId:', workPointId, params);

    return { list, total: 0 };
  }

  /**
   * 获取工点的地质预报
   */
  async getWorkPointGeologyForecast(workPointId: string, params?: { page?: number; pageSize?: number }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    // 查询地质相关数据
    return { list: [], total: 0 };
  }

  /**
   * 获取工点的综合结论
   */
  async getWorkPointComprehensiveAnalysis(workPointId: string, params?: { page?: number; pageSize?: number }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    // 查询综合结论数据
    return { list: [], total: 0 };
  }

  // ========== 预报设计管理（原有接口，保持兼容） ==========
  
  async getForecastDesigns(params: {
    page: number;
    pageSize: number;
    method?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    try {
      // 调用后端接口
      const backendParams: any = {
        currentPage: params.page,
        pageSize: params.pageSize,
      };
      
      // 如果有方法筛选，添加到参数
      if (params.method) {
        backendParams.method = params.method;
      }
      
      // 调用后端 /api/sjyb/list
      const response = await this.getDesignForecastList(backendParams);
      
      console.log('🔍 [realAPI] getForecastDesigns 原始响应:', response);
      console.log('🔍 [realAPI] sjybIPage:', response?.sjybIPage);
      
      // 后端返回格式: { sjybIPage: { records: [...], total: number } }
      const page = response?.sjybIPage || {};
      const backendList: DesignForecast[] = page.records || [];
      const total = page.total || 0;
      
      console.log('🔍 [realAPI] 解析后 - records数组长度:', backendList.length, 'total:', total);
      
      // 数据转换: 后端 DesignForecast -> 前端 ForecastDesignRecord
      const list: ForecastDesignRecord[] = backendList.map(item => {
        // 计算起点和终点里程
        const startMileage = `${item.dkname || 'DK'}${Math.floor(item.dkilo || 0)}`;
        const endMileage = `${item.dkname || 'DK'}${Math.floor((item.dkilo || 0) + (item.sjybLength || 0))}`;
        
        // 方法代码转换为字母标识（简化处理，可以根据实际需求映射）
        const methodMap: { [key: number]: string } = {
          0: '其他',
          1: '地震波反射',
          2: '水平声波剖面',
          3: '陆地声呐',
          4: '电磁波反射',
          5: '高分辨直流电',
          6: '瞬变电磁',
          7: '掌子面素描',
          8: '洞身素描',
          12: '地表补充',
          13: '超前水平钻',
          14: '加深炮孔',
          99: '全部',
        };
        
        return {
          id: String(item.sjybPk),
          createdAt: item.gmtCreate || item.plantime || '',
          method: methodMap[item.method] || String(item.method),
          startMileage,
          endMileage,
          length: item.sjybLength || 0,
          minBurialDepth: item.zxms || 0,
          designTimes: item.plannum || 0,
        };
      });
      
      console.log('✅ [realAPI] getForecastDesigns 转换后数据:', { list, total });
      
      // 如果后端返回空数据，返回一些示例数据用于UI展示
      if (list.length === 0) {
        console.warn('⚠️ [realAPI] 后端无设计预报数据，可能原因：');
        console.warn('   1. userid=1 没有权限访问数据');
        console.warn('   2. 数据库中没有该用户的设计预报记录');
        console.warn('   3. 设计预报数据需要通过工点（sitePk）查询');
        console.warn('💡 建议：设计预报数据应该在工点详情页面中展示，而不是独立列表');
        
        // 返回空列表，让前端使用 Mock 数据
        return { list: [], total: 0 };
      }
      
      return { list, total };
    } catch (error) {
      console.error('❌ [realAPI] getForecastDesigns 失败:', error);
      return { list: [], total: 0 };
    }
  }

  async createForecastDesign(data: Omit<ForecastDesignRecord, 'id' | 'createdAt'>): Promise<{ success: boolean }> {
    return { success: false };
  }

  async deleteForecastDesign(id: string): Promise<{ success: boolean }> {
    return { success: false };
  }

  async batchDeleteForecastDesigns(ids: string[]): Promise<{ success: boolean }> {
    return { success: false };
  }

  async importForecastDesigns(file: File): Promise<{ success: boolean; added: number }> {
    return { success: false, added: 0 };
  }

  getTemplateDownloadUrl(): string {
    const baseURL = process.env.REACT_APP_API_BASE_URL || '';
    return `${baseURL}/api/forecast/designs/template`;
  }
}

// 导出单例
const realAPI = new RealAPIService();
export default realAPI;
