/**
 * 真实API服务 - 统一API调用接口
 * 用于替换所有Mock数据，连接真实后端
 * 基于Swagger API文档: http://121.40.127.120:8080/swagger-ui/index.html
 */

import { get, post, put, del } from '../utils/api';
import type { Tunnel, WorkPoint, Project } from './geoForecastAPI';

// ==================== 后端API响应类型定义 ====================

// 通用响应格式
export interface BaseResponse<T = any> {
  resultcode: number;
  message?: string;
  msg?: string;  // 有些接口用 msg 而不是 message
  data?: T;
}

// 分页响应格式
export interface PageResponse<T = any> {
  current: number;
  size: number;
  records: T[];
  total: number;
  pages: number;
}

// ==================== 请求数据类型定义 ====================

// 设计围岩等级请求类型（包装在sjwydj对象中）
export interface DesignRockGradeRequest {
  sjwydj: {
    siteId: string;        // 工点ID
    dkname: string;        // 里程冠号
    dkilo: number;         // 里程公里数
    sjwydjLength: number;  // 预报长度
    wydj: number;          // 围岩等级 (1-6)
    revise?: string;       // 修改原因
    username: string;      // 填写人账号
  };
}

// 设计预报方法创建请求类型 (SjybCreateDTO)
export interface DesignForecastCreateRequest {
  bdPk: number;          // 标段主键 (必填)
  sdPk: number;          // 隧道主键 (必填)
  method: number;        // 预报方法代码 (必填, 0-99)
  dkname: string;        // 里程冠号 (必填)
  dkilo: number;         // 起始里程 (必填, int32)
  endMileage: number;    // 结束里程 (必填, double)
  sjybLength: number;    // 预报长度 (必填, double)
  zxms: number;          // 最小埋深 (必填, >=0)
  zksl: number;          // 钻孔数量 (必填, >=0)
  qxsl: number;          // 取芯数量 (必填, >=0)
  plannum: number;       // 设计次数 (必填, >=1)
  username: string;      // 填写人账号 (必填)
}

// 设计预报方法更新请求类型 (SjybUpdateDTO)
export interface DesignForecastUpdateRequest {
  bdPk: number;          // 标段主键 (必填)
  sdPk: number;          // 隧道主键 (必填)
  method: number;        // 预报方法代码 (必填, 0-99)
  dkname: string;        // 里程冠号 (必填)
  dkilo: number;         // 起始里程 (必填, int32)
  endMileage: number;    // 结束里程 (必填, double)
  sjybLength: number;    // 预报长度 (必填, double)
  zxms: number;          // 最小埋深 (必填, >=0)
  zksl: number;          // 钻孔数量 (必填, >=0)
  qxsl: number;          // 取芯数量 (必填, >=0)
  plannum: number;       // 设计次数 (必填, >=1)
  username: string;      // 填写人账号 (必填)
  revise: string;        // 修改原因说明 (必填)
}

// 设计地质信息请求类型（包装在sjdz对象中）
export interface DesignGeologyRequest {
  sjdz: {
    sjdzPk?: number;       // 主键（更新时需要）
    sjdzId?: number;       // ID
    sitePk: number;        // 工点ID（修正字段名）
    method: number;        // 方法代码
    dkname: string;        // 里程冠号
    dkilo: number;         // 起点里程
    sjdzLength: number;    // 长度
    dzxxfj?: number;       // 地质信息附加
    revise?: string;       // 修改原因
    username: string;      // 填写人账号
    gmtCreate?: string;    // 创建时间
    gmtModified?: string;  // 修改时间
  };
}

// ==================== 认证相关请求类型 ====================

// 登录请求类型
export interface LoginRequest {
  login: string;         // 用户名 (必填)
  password: string;      // 密码 (必填)
}

// 重置密码请求类型
export interface ResetPasswordRequest {
  userPk?: number;       // 用户主键
  newPassword: string;   // 新密码 (必填, 6-20字符)
}

// 修改密码请求类型
export interface ChangePasswordRequest {
  oldPassword: string;   // 旧密码 (必填)
  newPassword: string;   // 新密码 (必填, 6-20字符)
}

// ==================== 物探法相关请求类型 ====================

// TSP地震波反射DTO (TspDTO) - 用于multipart/form-data
export interface TspDTO {
  // 基础预报信息
  ybPk?: number;
  ybId?: number;
  siteId?: string;
  dkname?: string;
  dkilo?: number;
  ybLength?: number;
  monitordate?: string;
  createdate?: string;
  
  // 人员信息
  testname?: string;
  testno?: string;
  testtel?: string;
  monitorname?: string;
  monitorno?: string;
  monitortel?: string;
  supervisorname?: string;
  supervisorno?: string;
  supervisortel?: string;
  
  // 结论信息
  conclusionyb?: string;
  suggestion?: string;
  solution?: string;
  remark?: string;
  method?: number;
  flag?: number;
  submitFlag?: number;
  
  // TSP特有字段
  tspPk?: number;
  tspId?: string;
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
  
  // 图片文件 (binary)
  pic1?: File | string;
  pic2?: File | string;
  pic3?: File | string;
  pic4?: File | string;
  pic5?: File | string;
  pic6?: File | string;
  
  // 关联数据列表
  ybjgDTOList?: any[];
  tspBxdataDTOList?: any[];
  tspPddataDTOList?: any[];
}

// 物探法请求类型（通用）
export interface GeophysicalRequest {
  sitePk: number;        // 工点主键
  method: number;        // 方法代码 (1:TSP; 2:HSP; 3:陆地声呐; 4:电磁波反射; 5:高分辨直流电; 6:瞬变电磁; 9:微震监测; 0:其他)
  dkname: string;        // 里程冠号
  dkilo: number;         // 里程公里数
  wtfLength: number;     // 长度
  monitordate?: string;  // 监测日期
  originalfile?: string; // 原始文件
  addition?: string;     // 附加信息
  images?: string;       // 图片
}

// 钻探法请求类型
export interface DrillingRequest {
  sitePk: number;        // 工点主键
  method: number;        // 方法代码
  dkname: string;        // 里程冠号
  dkilo: number;         // 里程公里数
  ztfLength: number;     // 长度
  monitordate?: string;  // 监测日期
  originalfile?: string; // 原始文件
  addition?: string;     // 附加信息
}

// 掌子面素描请求类型
export interface FaceSketchRequest {
  sitePk: number;        // 工点主键
  dkname: string;        // 里程冠号
  dkilo: number;         // 里程公里数
  zzmsmLength: number;   // 长度
  monitordate?: string;  // 监测日期
  originalfile?: string; // 原始文件
  addition?: string;     // 附加信息
  images?: string;       // 图片
}

// 洞身素描请求类型
export interface TunnelSketchRequest {
  sitePk: number;        // 工点主键
  dkname: string;        // 里程冠号
  dkilo: number;         // 里程公里数
  dssmLength: number;    // 长度
  monitordate?: string;  // 监测日期
  originalfile?: string; // 原始文件
  addition?: string;     // 附加信息
  images?: string;       // 图片
}

// 地表补充请求类型
export interface SurfaceSupplementRequest {
  sitePk: number;        // 工点主键
  dkname: string;        // 里程冠号
  dkilo: number;         // 里程公里数
  dbbcLength: number;    // 长度
  monitordate?: string;  // 监测日期
  originalfile?: string; // 原始文件
  addition?: string;     // 附加信息
}

// ==================== 响应数据类型定义 ====================

// 设计围岩等级响应类型
export interface DesignRockGrade {
  sjwydjPk: number;
  sjwydjId: number;
  sitePk: number;
  dkname: string;
  dkilo: number;
  sjwydjLength: number;
  wydj: number;
  revise?: string;
  username: string;
  gmtCreate: string;
  gmtModified: string;
}

// 设计地质信息响应类型
export interface DesignGeology {
  sjdzPk: number;
  sjdzId: number;
  sitePk: number;
  dkname: string;
  dkilo: number;
  sjdzLength: number;
  method: number;
  revise?: string;
  username: string;
  gmtCreate: string;
  gmtModified: string;
}

// 钻探法响应类型
export interface DrillingMethod {
  ztfPk: number;
  ztfId: string;
  sitePk: number;
  method: number;
  dkname: string;
  dkilo: number;
  ztfLength: number;
  monitordate?: string;
  originalfile?: string;
  addition?: string;
  gmtCreate: string;
  gmtModified: string;
}

// 掌子面素描响应类型
export interface FaceSketch {
  zzmsmPk: number;
  zzmsmId: string;
  sitePk: number;
  dkname: string;
  dkilo: number;
  zzmsmLength: number;
  monitordate?: string;
  originalfile?: string;
  addition?: string;
  images?: string;
  gmtCreate: string;
  gmtModified: string;
}

// 洞身素描响应类型
export interface TunnelSketch {
  dssmPk: number;
  dssmId: string;
  sitePk: number;
  dkname: string;
  dkilo: number;
  dssmLength: number;
  monitordate?: string;
  originalfile?: string;
  addition?: string;
  images?: string;
  gmtCreate: string;
  gmtModified: string;
}

// 地表补充响应类型
export interface SurfaceSupplement {
  dbbcPk: number;
  dbbcId: string;
  sitePk: number;
  dkname: string;
  dkilo: number;
  dbbcLength: number;
  monitordate?: string;
  originalfile?: string;
  addition?: string;
  gmtCreate: string;
  gmtModified: string;
}

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

  /**
   * 获取当前登录用户名
   */
  private getCurrentLogin(): string {
    return localStorage.getItem('login') || 'admin';
  }

  // ========== 标段管理 ==========
  
  /**
   * 获取用户已授权标段列表
   * @returns 标段列表
   */
  async getBidSectionList(): Promise<any> {
    try {
      console.log('🚀 [realAPI] getBidSectionList 调用新API: /api/v1/bd/bd-xm');
      
      const response = await get<any>(`/api/v1/bd/bd-xm`);
      
      console.log('🔍 [realAPI] getBidSectionList 原始响应:', response);
      console.log('🔍 [realAPI] 响应类型:', typeof response);
      console.log('🔍 [realAPI] 是否为数组:', Array.isArray(response));
      console.log('🔍 [realAPI] 响应内容详情:', JSON.stringify(response, null, 2));
      
      // 检查不同的响应格式
      let dataArray = null;
      
      if (Array.isArray(response)) {
        // 直接是数组格式 (HTTP拦截器已经提取了data)
        dataArray = response;
        console.log('🔍 [realAPI] 直接数组格式，长度:', dataArray.length);
      } else if (response?.resultcode === 200 && response?.data) {
        // 标准响应格式
        dataArray = response.data;
        console.log('🔍 [realAPI] 标准响应格式，数据长度:', dataArray?.length);
      } else if (response?.data && Array.isArray(response.data)) {
        // 只有data字段且是数组
        dataArray = response.data;
        console.log('🔍 [realAPI] 只有data字段，数据长度:', dataArray?.length);
      } else {
        // 尝试直接使用response作为数据
        console.log('🔍 [realAPI] 尝试直接使用response作为数据:', response);
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // 可能是单个对象，转换为数组
          dataArray = [response];
          console.log('🔍 [realAPI] 单个对象转换为数组');
        }
      }
      
      if (dataArray && Array.isArray(dataArray)) {
        // 转换新API格式为旧格式兼容
        const bdVOList = dataArray.map((item: any) => ({
          bd: {
            bdPk: item.bdID,
            bdname: item.bdname,
            bdcode: item.bdcode,
            xmId: item.xmID,
            xmname: item.xmname,
            xmcode: item.xmcode
          }
        }));
        
        console.log('🔍 [realAPI] 转换后的bdVOList:', bdVOList);
        const result = { bdVOList, resultcode: 200 };
        console.log('🔍 [realAPI] getBidSectionList 最终返回:', result);
        return result;
      }
      
      console.log('⚠️ [realAPI] 无法解析响应数据格式');
      return { bdVOList: [], resultcode: response?.resultcode || 500 };
    } catch (error) {
      console.error('❌ [realAPI] getBidSectionList 异常:', error);
      if (error instanceof Error) {
        console.error('❌ [realAPI] 异常详情:', error.message, error.stack);
      }
      // 容错处理：发生异常时返回空列表，而不是抛出错误导致页面崩溃
      console.warn('⚠️ [realAPI] 由于API错误，返回空标段列表作为容错');
      return { bdVOList: [], resultcode: 500 };
    }
  }

  /**
   * 获取标段和工点信息
   * @param bdId 标段ID
   * @returns 标段和工点信息
   */
  async getBidSectionAndWorkPoints(bdId: string): Promise<any> {
    try {
      console.log('🚀 [realAPI] getBidSectionAndWorkPoints 调用新API: /api/v1/bd/bd-gd/' + bdId);
      
      const response = await get<any>(`/api/v1/bd/bd-gd/${bdId}`);
      
      console.log('🔍 [realAPI] getBidSectionAndWorkPoints 原始响应:', response);
      console.log('🔍 [realAPI] 响应状态码:', response?.resultcode);
      console.log('🔍 [realAPI] 响应数据:', response?.data);
      console.log('🔍 [realAPI] bdInfoVO详情:', response?.bdInfoVO);
      if (response?.bdInfoVO && response.bdInfoVO.length > 0) {
        console.log('🔍 [realAPI] 第一个工作面详情:', response.bdInfoVO[0]);
        console.log('🔍 [realAPI] 工作面的所有属性:', Object.keys(response.bdInfoVO[0] || {}));
        
        // 关键：查看gzwInfoVO数组中的真实工点数据
        const gzwInfoVO = response.bdInfoVO[0].gzwInfoVO;
        if (gzwInfoVO && gzwInfoVO.length > 0) {
          console.log('🔍 [realAPI] gzwInfoVO数组长度:', gzwInfoVO.length);
          console.log('🔍 [realAPI] 第一个真实工点详情:', gzwInfoVO[0]);
          console.log('🔍 [realAPI] 真实工点的所有属性:', Object.keys(gzwInfoVO[0] || {}));
          
          // 打印所有工点的ID
          gzwInfoVO.forEach((site: any, index: number) => {
            console.log(`🔍 [realAPI] 工点${index + 1}:`, {
              siteId: site.siteId || site.sitePk || site.id,
              siteName: site.sitename || site.name,
              所有属性: Object.keys(site)
            });
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ [realAPI] getBidSectionAndWorkPoints 异常:', error);
      throw error;
    }
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
   * @param method 预报方法（13=超前水平钻，14=加深炮孔）
   * @returns 钻探法详细信息
   */
  async getDrillingMethodDetail(ztfPk: number, method?: string | null): Promise<any> {
    console.log('🔍 [realAPI] 钻探法详情请求, ztfPk:', ztfPk, 'method:', method);
    
    // 根据method选择不同的API端点
    let endpoint = '';
    if (method === '13') {
      // 超前水平钻
      endpoint = `/api/v1/ztf/cqspz/${ztfPk}`;
      console.log('📡 [realAPI] 调用超前水平钻详情API:', endpoint);
    } else if (method === '14') {
      // 加深炮孔
      endpoint = `/api/v1/ztf/jspk/${ztfPk}`;
      console.log('📡 [realAPI] 调用加深炮孔详情API:', endpoint);
    } else {
      // 默认使用超前水平钻API
      endpoint = `/api/v1/ztf/cqspz/${ztfPk}`;
      console.log('⚠️ [realAPI] 未指定method，默认使用超前水平钻API:', endpoint);
    }
    
    try {
      const response = await get<any>(endpoint);
      console.log('✅ [realAPI] 钻探法详情响应:', response);
      
      // 处理响应格式
      if (response && typeof response === 'object') {
        if ('resultcode' in response || 'code' in response) {
          const code = response.resultcode || response.code;
          if (code === 200 || code === 0) {
            console.log('📦 [realAPI] 钻探法详情数据:', response.data);
            return response.data || response.result;
          } else {
            const msg = response.message || response.msg || '获取钻探法详情失败';
            console.error('❌ [realAPI] 钻探法详情返回错误:', code, msg);
            throw new Error(msg);
          }
        }
        // 如果响应直接是数据对象
        return response;
      }
      
      console.error('❌ [realAPI] 钻探法详情响应格式未知:', response);
      return null;
    } catch (error) {
      console.error('❌ [realAPI] 钻探法详情请求失败:', error);
      throw error;
    }
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
    siteId?: string;
    pageNum?: number;
    pageSize?: number;
    method?: number;
    begin?: string;
    end?: string;
  }): Promise<any> {
    try {
      console.log('🚀 [realAPI] getDesignForecastList 调用新API: /api/v1/sjyb/list');
      console.log('🔍 [realAPI] 请求参数:', params);
      
      // 使用新的API端点，需要siteId作为必需参数
      const requestParams: any = {
        siteId: params.siteId || '1', // 默认使用工点ID 1
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10
      };
      
      // 只有明确传入method参数时才添加，否则获取全部
      if (params.method !== undefined) {
        requestParams.method = params.method;
      }
      
      if (params.begin) {
        requestParams.begin = params.begin;
      }
      
      if (params.end) {
        requestParams.end = params.end;
      }
      
      console.log('🔍 [realAPI] getDesignForecastList 请求参数:', requestParams);
      
      const response = await get<any>(`/api/v1/sjyb/list`, { params: requestParams });
      console.log('🔍 [realAPI] getDesignForecastList 响应:', response);
      console.log('🔍 [realAPI] 响应的所有属性:', Object.keys(response || {}));
      console.log('🔍 [realAPI] 完整响应结构:', JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error('❌ [realAPI] getDesignForecastList 异常:', error);
      throw error;
    }
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
   * 获取掌子面素描详细信息
   * @param zzmsmPk 掌子面素描主键
   * @returns 掌子面素描详细信息
   */
  async getFaceSketchDetail(zzmsmPk: number): Promise<any> {
    try {
      console.log('🔍 [realAPI] getFaceSketchDetail 请求, zzmsmPk:', zzmsmPk);
      const response = await get<any>(`/api/v1/zzmsm/${zzmsmPk}`);
      console.log('🔍 [realAPI] getFaceSketchDetail 响应:', response);
      console.log('🔍 [realAPI] getFaceSketchDetail 响应类型:', typeof response);
      console.log('🔍 [realAPI] getFaceSketchDetail 响应的所有键:', response ? Object.keys(response) : 'null');
      console.log('🔍 [realAPI] getFaceSketchDetail 完整响应 JSON:', JSON.stringify(response, null, 2));
      
      // 检查响应格式
      if (response && typeof response === 'object') {
        // 检查是否是错误响应
        if (response.resultcode && response.resultcode !== 200 && response.resultcode !== 0) {
          console.error('❌ [realAPI] getFaceSketchDetail 后端返回错误:', response.resultcode, response.message);
          throw new Error(response.message || `服务器返回错误: ${response.resultcode}`);
        }
        
        // 如果有 resultcode 和 data 字段，返回 data
        if (response.resultcode === 200 && response.data) {
          console.log('✅ [realAPI] getFaceSketchDetail 成功 (标准格式), 数据:', response.data);
          return response.data;
        } 
        // 如果 resultcode 是 0
        else if (response.resultcode === 0 && response.data) {
          console.log('✅ [realAPI] getFaceSketchDetail 成功 (resultcode=0), 数据:', response.data);
          return response.data;
        }
        // 如果直接是数据对象（有 zzmsmPk 字段）
        else if (response.zzmsmPk || response.ybPk) {
          console.log('✅ [realAPI] getFaceSketchDetail 成功 (直接数据), 数据:', response);
          return response;
        }
      }
      
      console.warn('⚠️ [realAPI] getFaceSketchDetail 未知响应格式，返回null');
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getFaceSketchDetail 异常:', error);
      return null;
    }
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
    try {
      // 从标段数据中提取项目信息
      const bidData = await this.getBidSectionList();
      
      let projectId = 'project-001';
      let projectName = '渝昆高铁引入昆明枢纽组织工程'; // 默认值作为后备
      let constructionUnit = '中国铁路昆明局集团有限公司'; // 默认值作为后备
      let description = '';

      if (bidData && bidData.bdVOList && bidData.bdVOList.length > 0) {
        const firstBd = bidData.bdVOList[0].bd;
        projectId = firstBd.xmId || projectId;
        projectName = firstBd.xmname || projectName;
        description = `标段总数: ${bidData.bdVOList.length}`;
        
        // 尝试获取更多详细信息（如建设单位）
        try {
          const bdDetail = await this.getBidSectionAndWorkPoints(String(firstBd.bdPk));
          // 检查 bdInfoVO 或直接在 response 中查找
          if (bdDetail?.bdInfoVO?.[0]?.jsdanwei) {
             constructionUnit = bdDetail.bdInfoVO[0].jsdanwei;
          } else if (bdDetail?.jsdanwei) {
             constructionUnit = bdDetail.jsdanwei;
          }
        } catch (e) {
          console.warn('获取标段详情失败，使用默认建设单位', e);
        }
      }
      
      return {
        id: projectId,
        name: projectName,
        constructionUnit: constructionUnit,
        description: description || '新建铁路渝昆高铁引入昆明枢纽工程'
      };
    } catch (error) {
      console.error('获取项目信息失败:', error);
      // 出错时才返回完全的默认值
      return {
        id: 'project-001',
        name: '渝昆高铁引入昆明枢纽组织工程',
        constructionUnit: '中国铁路昆明局集团有限公司',
        description: '新建铁路渝昆高铁引入昆明枢纽工程(离线)'
      };
    }
  }

  /**
   * 获取所有隧道列表（从标段数据转换）
   */
  async getTunnels(): Promise<Tunnel[]> {
    const bidData = await this.getBidSectionList();
    console.log('🔍 [realAPI] getTunnels - bidData:', bidData);
    console.log('🔍 [realAPI] getTunnels - bidData类型:', typeof bidData);
    console.log('🔍 [realAPI] getTunnels - bidData是否为数组:', Array.isArray(bidData));
    
    // 如果bidData是数组，说明getBidSectionList返回了原始数组，需要包装
    let processedData = bidData;
    if (Array.isArray(bidData)) {
      console.log('🔍 [realAPI] getTunnels - 检测到原始数组，进行包装');
      // 将原始数组转换为期望的格式
      const bdVOList = bidData.map((item: any) => ({
        bd: {
          bdPk: item.bdID,
          bdname: item.bdname,
          bdcode: item.bdcode,
          xmId: item.xmID,
          xmname: item.xmname,
          xmcode: item.xmcode
        }
      }));
      processedData = { bdVOList, resultcode: 200 };
      console.log('🔍 [realAPI] getTunnels - 包装后的数据:', processedData);
    }
    
    const tunnels = this.convertBidSectionsToTunnels(processedData);
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
   * 获取指定隧道的工点列表（使用新的API结构）
   */
  async getWorkPoints(tunnelId: string): Promise<WorkPoint[]> {
    try {
      console.log('🚀 [realAPI] getWorkPoints 获取工点列表, tunnelId:', tunnelId);
      
      // 使用新的API获取标段和工点信息
      const response = await this.getBidSectionAndWorkPoints(tunnelId);
      
      // 检查不同的响应格式
      let bdData = null;
      
      if (response && response.resultcode === 200 && response.data) {
        // 标准响应格式
        bdData = response.data;
        console.log('🔍 [realAPI] getWorkPoints 标准响应格式');
      } else if (response && response.bdId && response.bdInfoVO) {
        // 直接返回数据格式
        bdData = response;
        console.log('🔍 [realAPI] getWorkPoints 直接数据格式');
      } else if (response && typeof response === 'object') {
        // 尝试直接使用response
        bdData = response;
        console.log('🔍 [realAPI] getWorkPoints 尝试直接使用response');
      }
      
      if (!bdData) {
        console.log('⚠️ [realAPI] getWorkPoints 没有获取到有效数据');
        return [];
      }

      const workPoints: WorkPoint[] = [];
      
      console.log('🔍 [realAPI] getWorkPoints bdData:', bdData);
      
      // 遍历工作位信息 (bdInfoVO -> GzwInfoVO[])
      if (bdData.bdInfoVO && Array.isArray(bdData.bdInfoVO)) {
        console.log('🔍 [realAPI] getWorkPoints bdInfoVO数量:', bdData.bdInfoVO.length);
        
        bdData.bdInfoVO.forEach((gzwInfo: any, gzwIndex: number) => {
          console.log(`🔍 [realAPI] getWorkPoints 处理工作位 ${gzwIndex}:`, {
            gzwname: gzwInfo.gzwname,
            gzwID: gzwInfo.gzwID,
            gzwInfoVO_length: gzwInfo.gzwInfoVO?.length
          });
          
          // 遍历工点信息 (gzwInfoVO -> SiteInfoVO[])
          if (gzwInfo.gzwInfoVO && Array.isArray(gzwInfo.gzwInfoVO)) {
            gzwInfo.gzwInfoVO.forEach((siteInfo: any, siteIndex: number) => {
              console.log(`🔍 [realAPI] getWorkPoints 处理工点 ${gzwIndex}-${siteIndex}:`, {
                sitename: siteInfo.sitename,
                sitecode: siteInfo.sitecode,
                siteId: siteInfo.siteId,
                startKilo: siteInfo.startKilo,
                stopKilo: siteInfo.stopKilo,
                useflag: siteInfo.useflag
              });
              
              const workPoint: WorkPoint = {
                id: siteInfo.siteId || String(Math.random()),
                name: siteInfo.sitename || '未知工点',
                code: siteInfo.sitecode || '',
                tunnelId: tunnelId,
                mileage: parseFloat(siteInfo.startKilo) || 0,
                length: (parseFloat(siteInfo.stopKilo) || 0) - (parseFloat(siteInfo.startKilo) || 0),
                riskLevel: 'medium', // 默认风险等级
                status: siteInfo.useflag === '1' ? 'active' : 'inactive',
                createdAt: new Date().toISOString()
              };
              
              workPoints.push(workPoint);
            });
          } else {
            console.log(`⚠️ [realAPI] getWorkPoints 工作位 ${gzwIndex} 没有工点信息或格式错误:`, gzwInfo.gzwInfoVO);
          }
        });
      } else {
        console.log('⚠️ [realAPI] getWorkPoints bdData没有bdInfoVO或格式错误:', bdData.bdInfoVO);
      }

      console.log('🔍 [realAPI] getWorkPoints 转换后的工点列表:', workPoints);
      return workPoints;
      
    } catch (error) {
      console.error('❌ [realAPI] getWorkPoints 异常:', error);
      return [];
    }
  }

  /**
   * 搜索工点
   */
  async searchWorkPoints(keyword: string, tunnelId?: string): Promise<WorkPoint[]> {
    try {
      console.log('🚀 [realAPI] searchWorkPoints 搜索工点, keyword:', keyword, 'tunnelId:', tunnelId);
      
      // 如果指定了tunnelId，只在该隧道中搜索
      if (tunnelId) {
        const workPoints = await this.getWorkPoints(tunnelId);
        return workPoints.filter(wp => 
          wp.name.includes(keyword) || 
          wp.code.includes(keyword) ||
          wp.id.includes(keyword)
        );
      }
      
      // 否则在所有隧道中搜索
      const bidData = await this.getBidSectionList();
      if (!bidData || !bidData.bdVOList) {
        return [];
      }
      
      const allWorkPoints: WorkPoint[] = [];
      
      // 遍历所有标段获取工点
      for (const bdVO of bidData.bdVOList) {
        try {
          const workPoints = await this.getWorkPoints(bdVO.bd.bdPk);
          const filteredPoints = workPoints.filter(wp => 
            wp.name.includes(keyword) || 
            wp.code.includes(keyword) ||
            wp.id.includes(keyword)
          );
          allWorkPoints.push(...filteredPoints);
        } catch (error) {
          console.error('❌ [realAPI] searchWorkPoints 获取标段工点失败:', bdVO.bd.bdPk, error);
        }
      }
      
      return allWorkPoints;
      
    } catch (error) {
      console.error('❌ [realAPI] searchWorkPoints 异常:', error);
      return [];
    }
  }

  /**
   * 根据ID获取工点详情
   */
  async getWorkPointById(workPointId: string): Promise<WorkPoint> {
    try {
      console.log('🚀 [realAPI] getWorkPointById 获取工点详情, workPointId:', workPointId);
      
      // 获取所有标段
      const bidData = await this.getBidSectionList();
      if (!bidData || !bidData.bdVOList) {
        throw new Error(`WorkPoint not found: ${workPointId}`);
      }

      // 遍历所有标段查找工点
      for (const bdVO of bidData.bdVOList) {
        try {
          const workPoints = await this.getWorkPoints(bdVO.bd.bdPk);
          const workPoint = workPoints.find(wp => wp.id === workPointId);
          if (workPoint) {
            console.log('🔍 [realAPI] getWorkPointById 找到工点:', workPoint);
            return workPoint;
          }
        } catch (error) {
          console.error('❌ [realAPI] getWorkPointById 获取标段工点失败:', bdVO.bd.bdPk, error);
        }
      }

      throw new Error(`WorkPoint not found: ${workPointId}`);
    } catch (error) {
      console.error('❌ [realAPI] getWorkPointById 异常:', error);
      throw error;
    }
  }

  /**
   * 置顶/取消置顶工点（暂不支持，返回成功）
   */
  async toggleWorkPointTop(workPointId: string, isTop: boolean): Promise<void> {
    // 后端暂无此接口，前端可以自行维护置顶状态
    console.log(`Toggle work point ${workPointId} top status to:`, isTop);
  }

  /**
   * 获取工点探测数据（用于GeoForecastPage等页面）
   */
  async getGeoPointDetectionData(workPointId: string): Promise<GeoPointDetectionData> {
    try {
      const workPoint = await this.getWorkPointById(workPointId);
      
      // 定义所有需要查询的预报方法
      // 物探法子方法
      const wtfMethods = [
        { name: 'TSP', type: 1, method: 1, color: '#3B82F6' },
        { name: 'HSP', type: 1, method: 2, color: '#8B5CF6' },
        { name: '陆地声呐', type: 1, method: 3, color: '#10B981' },
        { name: '电磁波反射', type: 1, method: 4, color: '#F59E0B' },
        { name: '高分辨直流电', type: 1, method: 5, color: '#EF4444' },
        { name: '瞬变电磁', type: 1, method: 6, color: '#EC4899' },
        { name: '微震监测', type: 1, method: 9, color: '#6366F1' },
      ];
      
      // 其他大类方法
      const otherMethods = [
        { name: '掌子面素描', type: 2, method: null, color: '#14B8A6' },
        { name: '洞身素描', type: 3, method: null, color: '#F97316' },
        { name: '钻探法', type: 4, method: null, color: '#84CC16' },
        { name: '地表补充', type: 5, method: null, color: '#06B6D4' },
      ];

      // 并行查询所有方法的数量
      const wtfPromises = wtfMethods.map(async (m) => {
        try {
          const res = await this.getGeophysicalList({ 
            pageNum: 1, 
            pageSize: 1, // 只需要total，所以pageSize=1
            siteId: workPointId
          });
          // 注意：getGeophysicalList 内部写死了 type=1，所以我们只需要过滤 method
          // 但是 API 不支持 method 过滤？
          // 重新检查 getGeophysicalList 实现，它调用 /api/v1/wtf/list，该接口支持 queryDTO 中的 method
          // 但是 getGeophysicalList 并没有暴露 method 参数。
          // 我们需要修改 getGeophysicalList 或者直接调用底层 fetch
          
          // 修正：我们需要一个新的通用查询方法或者修改现有方法支持 method
          // 为了不破坏现有代码，直接在这里调用 API
          const queryParams: any = {
            siteId: workPointId,
            type: 1,
            // submitFlag: 1,
            pageNum: 1,
            pageSize: 1,
            method: m.method
          };
          const response = await get<any>('/api/v1/wtf/list', { params: queryParams });
          // 处理响应获取 total
          let total = 0;
          if (response?.data?.total) total = response.data.total;
          else if (response?.total) total = response.total;
          
          return { ...m, count: total };
        } catch (e) {
          console.error(`查询 ${m.name} 失败`, e);
          return { ...m, count: 0 };
        }
      });

      const otherPromises = otherMethods.map(async (m) => {
        try {
          let total = 0;
          if (m.type === 2) {
             const res = await this.getPalmSketchList({ pageNum: 1, pageSize: 1, siteId: workPointId });
             total = res.total;
          } else if (m.type === 3) {
             const res = await this.getTunnelSketchList({ pageNum: 1, pageSize: 1, siteId: workPointId });
             total = res.total;
          } else if (m.type === 4) {
             const res = await this.getDrillingList({ pageNum: 1, pageSize: 1, siteId: workPointId });
             total = res.total;
          } else if (m.type === 5) {
             const res = await this.getSurfaceSupplementList({ pageNum: 1, pageSize: 1, siteId: workPointId });
             total = res.total;
          }
          return { ...m, count: total };
        } catch (e) {
           console.error(`查询 ${m.name} 失败`, e);
           return { ...m, count: 0 };
        }
      });

      const [wtfResults, otherResults] = await Promise.all([
        Promise.all(wtfPromises),
        Promise.all(otherPromises)
      ]);

      const allMethods = [...wtfResults, ...otherResults];
      // 过滤掉数量为 0 的，或者全部显示
      const detectionMethods = allMethods.map(m => ({
        name: m.name,
        count: m.count,
        color: m.color
      }));

      return {
        workPointId: workPoint.id,
        workPointName: workPoint.name,
        mileage: `DK${Math.floor(workPoint.mileage / 1000)}+${workPoint.mileage % 1000}`,
        length: workPoint.length || 0,
        detectionMethods,
        detectionDetails: {} // 详情暂不加载，需要时再请求
      };
    } catch (error) {
      console.error('获取工点探测数据失败:', error);
      // 出错时返回空数据，而不是假数据
      return {
        workPointId: workPointId,
        workPointName: '加载失败',
        mileage: '',
        length: 0,
        detectionMethods: [],
        detectionDetails: {}
      };
    }
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
    siteId?: string; // 允许显式传递 siteId
  }): Promise<{ list: ForecastDesignRecord[]; total: number }> {
    try {
      // 尝试获取实际的工点ID
      // 如果参数中传递了 siteId，优先使用
      let siteId = params.siteId || '1'; // 默认值
      
      if (!params.siteId) {
        // 如果没有传递 siteId，尝试智能获取（原逻辑）
        try {
        // 获取第一个可用的工点ID
        const bidData = await this.getBidSectionList();
        if (bidData?.bdVOList?.length > 0) {
          const firstBd = bidData.bdVOList[0];
          const bdId = firstBd.bd.bdPk;
          
          // 获取该标段的工点信息
          const workPointData = await this.getBidSectionAndWorkPoints(bdId);
          if (workPointData?.bdInfoVO?.length > 0) {
            const firstGzw = workPointData.bdInfoVO[0];
            if (firstGzw.gzwInfoVO?.length > 0) {
              const firstSite = firstGzw.gzwInfoVO[0];
              siteId = firstSite.siteId || '1';
              console.log('🔍 [realAPI] 使用实际工点ID:', siteId);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ [realAPI] 获取实际工点ID失败，使用默认值:', error);
      }
    }
    
    // 调用后端接口
    const backendParams: any = {
        siteId: siteId,
        pageNum: params.page,
        pageSize: params.pageSize,
      };
      
      // 如果有方法筛选，转换为数字添加到参数
      if (params.method) {
        // 前端可能传的是方法名称，需要转换为数字
        // 暂时不添加method参数，获取全部数据
        console.log('⚠️ [realAPI] 忽略method筛选参数:', params.method);
      }
      
      // 添加时间范围参数
      if (params.startDate) {
        backendParams.begin = params.startDate + 'T00:00:00';
      }
      if (params.endDate) {
        backendParams.end = params.endDate + 'T23:59:59';
      }
      
      // 调用后端 /api/v1/sjyb/list
      console.log('🚀 [realAPI] getForecastDesigns 调用后端接口，参数:', backendParams);
      console.log('🎯 [realAPI] 使用的siteId:', backendParams.siteId);
      
      // 如果数据为空，尝试测试其他可能的siteId
      let response = await this.getDesignForecastList(backendParams);
      
      // 如果第一次请求返回空数据，尝试其他常见的siteId
      if (response?.sjybIPage?.total === 0) {
        console.warn('⚠️ [realAPI] siteId=' + backendParams.siteId + ' 无数据，尝试其他siteId');
        const testSiteIds = ['230412', '11282', '11457', '76833', '1', '2', '3'];
        
        console.group('🧪 [realAPI] 测试多个siteId');
        for (const testId of testSiteIds) {
          try {
            console.log(`\n🔍 测试 siteId=${testId}...`);
            const testResponse = await this.getDesignForecastList({
              ...backendParams,
              siteId: testId
            });
            
            const testTotal = testResponse?.sjybIPage?.total || 0;
            const testRecords = testResponse?.sjybIPage?.records?.length || 0;
            console.log(`   结果: total=${testTotal}, records=${testRecords}`);
            
            if (testTotal > 0) {
              console.log(`✅ 找到有数据的siteId: ${testId}`);
              response = testResponse;
              break;
            }
          } catch (error) {
            console.error(`   ❌ siteId=${testId} 请求失败:`, error);
          }
        }
        console.groupEnd();
        
        // 如果所有测试都失败，显示警告
        if (response?.sjybIPage?.total === 0) {
          console.error('❌ [realAPI] 所有测试的siteId都没有数据！');
          console.warn('💡 可能的原因:');
          console.warn('   1. 数据库中确实没有设计预报数据');
          console.warn('   2. 当前用户没有权限访问任何工点的数据');
          console.warn('   3. 需要通过其他方式（如从工点页面进入）才能获取数据');
        }
      }
      
      console.log('🔍 [realAPI] getForecastDesigns 原始响应:', response);
      console.log('🔍 [realAPI] response.resultcode:', response?.resultcode);
      console.log('🔍 [realAPI] response.message:', response?.message);
      console.log('🔍 [realAPI] response.data:', response?.data);
      console.log('🔍 [realAPI] response.data.sjybIPage:', response?.data?.sjybIPage);
      
      // 详细显示sjybIPage的内容（兼容两种路径）
      const sjybIPage = response?.data?.sjybIPage || response?.sjybIPage;
      if (sjybIPage) {
        console.log('✅ [realAPI] 找到sjybIPage数据');
        console.log('🔍 [realAPI] sjybIPage.records:', sjybIPage.records);
        console.log('🔍 [realAPI] sjybIPage.total:', sjybIPage.total);
        console.log('🔍 [realAPI] sjybIPage.current:', sjybIPage.current);
        console.log('🔍 [realAPI] sjybIPage.size:', sjybIPage.size);
        
        // 如果有records，显示第一条记录的详细信息
        if (sjybIPage.records && sjybIPage.records.length > 0) {
          console.log('🔍 [realAPI] 第一条记录详情:', sjybIPage.records[0]);
        } else {
          console.warn('⚠️ [realAPI] sjybIPage.records 为空或不存在');
        }
      } else {
        console.error('❌ [realAPI] 未找到sjybIPage数据！检查响应结构');
        console.log('🔍 [realAPI] 完整响应:', JSON.stringify(response, null, 2));
      }
      
      // HTTP拦截器已经提取了data，但需要兼容多种返回格式
      // 可能的格式：response.sjybIPage 或 response.data.sjybIPage
      const page = (response?.data?.sjybIPage || response?.sjybIPage || {}) as any;
      const backendList: DesignForecast[] = page.records || [];
      const total = typeof page.total === 'number' ? page.total : 0;
      
      console.log('🔍 [realAPI] 解析后 - records数组长度:', backendList.length, 'total:', total);
      console.log('🔍 [realAPI] 使用的数据路径:', response?.data?.sjybIPage ? 'response.data.sjybIPage' : 'response.sjybIPage');
      
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
    try {
      // 转换前端数据格式为后端格式
      const requestData: DesignForecastCreateRequest = {
        bdPk: 1,  // 标段主键，实际应从参数获取
        sdPk: 1,  // 隧道主键，实际应从参数获取
        method: this.getMethodCode(data.method),
        dkname: this.extractMileagePrefix(data.startMileage),
        dkilo: this.extractMileageNumber(data.startMileage),
        endMileage: this.extractMileageNumber(data.endMileage),
        sjybLength: data.length,
        zxms: data.minBurialDepth || 0,
        zksl: 7,  // 钻孔数量，默认值
        qxsl: 9,  // 取芯数量，默认值
        plannum: data.designTimes || 1,
        username: this.getCurrentLogin()
      };

      const response = await post<BaseResponse>('/api/v1/sjyb', requestData);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createForecastDesign 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createForecastDesign 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createForecastDesign 异常:', error);
      return { success: false };
    }
  }

  async updateForecastDesign(id: string, data: Omit<ForecastDesignRecord, 'id' | 'createdAt'>): Promise<{ success: boolean }> {
    try {
      const requestData: DesignForecastUpdateRequest = {
        bdPk: 1,
        sdPk: 1,
        method: this.getMethodCode(data.method),
        dkname: this.extractMileagePrefix(data.startMileage),
        dkilo: this.extractMileageNumber(data.startMileage),
        endMileage: this.extractMileageNumber(data.endMileage),
        sjybLength: data.length,
        zxms: data.minBurialDepth || 0,
        zksl: 7,
        qxsl: 9,
        plannum: data.designTimes || 1,
        username: this.getCurrentLogin(),
        revise: '更新数据'  // 修改原因，实际应从参数传入
      };

      const response = await put<BaseResponse>(`/api/v1/sjyb/${id}`, requestData);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateForecastDesign 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateForecastDesign 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] updateForecastDesign 异常:', error);
      return { success: false };
    }
  }

  async deleteForecastDesign(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/sjyb/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteForecastDesign 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteForecastDesign 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteForecastDesign 异常:', error);
      return { success: false };
    }
  }

  async batchDeleteForecastDesigns(ids: string[]): Promise<{ success: boolean }> {
    try {
      // 批量删除：逐个调用删除接口
      const results = await Promise.allSettled(
        ids.map(id => this.deleteForecastDesign(id))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const success = successCount === ids.length;
      
      console.log(`✅ [realAPI] batchDeleteForecastDesigns 完成: ${successCount}/${ids.length}`);
      return { success };
    } catch (error) {
      console.error('❌ [realAPI] batchDeleteForecastDesigns 异常:', error);
      return { success: false };
    }
  }

  async importForecastDesigns(file: File): Promise<{ success: boolean; added: number }> {
    try {
      // TODO: 实现Excel导入功能
      // 这需要后端提供专门的导入接口
      console.warn('⚠️ [realAPI] importForecastDesigns 功能待实现');
      return { success: false, added: 0 };
    } catch (error) {
      console.error('❌ [realAPI] importForecastDesigns 异常:', error);
      return { success: false, added: 0 };
    }
  }

  getTemplateDownloadUrl(): string {
    const baseURL = process.env.REACT_APP_API_BASE_URL || '';
    return `${baseURL}/api/forecast/designs/template`;
  }

  // ========== 设计围岩等级 CRUD ==========

  /**
   * 获取设计围岩等级列表
   */
  async getDesignRockGrades(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      console.log('🚀 [realAPI] getDesignRockGrades 调用API: /api/v1/sjwydj/list');
      console.log('🔍 [realAPI] 请求参数:', params);
      
      const response = await get<any>('/api/v1/sjwydj/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      
      console.log('🔍 [realAPI] getDesignRockGrades 原始响应:', response);
      console.log('🔍 [realAPI] response.sjwydjIPage:', response?.sjwydjIPage);
      
      // HTTP拦截器已经提取了data，实际响应格式: { sjwydjIPage: { records: [...], total: number } }
      const sjwydjIPage = response?.sjwydjIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
      
      console.log('🔍 [realAPI] 解析后的sjwydjIPage:', sjwydjIPage);
      
      return sjwydjIPage;
    } catch (error) {
      console.error('❌ [realAPI] getDesignRockGrades 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 获取设计围岩等级详情
   */
  async getDesignRockGradeById(id: string) {
    try {
      const response = await get<BaseResponse<{ sjwydj: DesignRockGrade }>>(`/api/v1/sjwydj/${id}`);
      return response.data?.sjwydj;
    } catch (error) {
      console.error('❌ [realAPI] getDesignRockGradeById 失败:', error);
      throw error;
    }
  }

  /**
   * 创建设计围岩等级
   * @param data 设计围岩等级数据，包含 sjwydj 对象
   */
  async createDesignRockGrade(data: DesignRockGradeRequest): Promise<{ success: boolean }> {
    try {
      // 确保 username 字段存在
      if (data.sjwydj && !data.sjwydj.username) {
        data.sjwydj.username = this.getCurrentLogin();
      }
      const response = await post<BaseResponse>('/api/v1/sjwydj', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDesignRockGrade 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDesignRockGrade 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新设计围岩等级
   */
  async updateDesignRockGrade(id: string, data: DesignRockGradeRequest): Promise<{ success: boolean }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/sjwydj/${id}`, data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDesignRockGrade 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] updateDesignRockGrade 异常:', error);
      return { success: false };
    }
  }

  /**
   * 删除设计围岩等级
   */
  async deleteDesignRockGrade(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/sjwydj/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteDesignRockGrade 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteDesignRockGrade 异常:', error);
      return { success: false };
    }
  }

  // ========== 设计地质信息 CRUD ==========

  /**
   * 获取设计地质信息列表
   */
  async getDesignGeologies(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ sjdzIPage: PageResponse<DesignGeology> }>>('/api/v1/sjdz/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.sjdzIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getDesignGeologies 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建设计地质信息
   * @param data 设计地质信息数据，包含 sjdz 对象
   */
  async createDesignGeology(data: DesignGeologyRequest): Promise<{ success: boolean }> {
    try {
      // 确保 username 字段存在
      if (data.sjdz && !data.sjdz.username) {
        data.sjdz.username = this.getCurrentLogin();
      }
      const response = await post<BaseResponse>('/api/v1/sjdz', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createDesignGeology 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDesignGeology 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDesignGeology 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新设计地质信息
   */
  async updateDesignGeology(id: string, data: DesignGeologyRequest): Promise<{ success: boolean }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/sjdz/${id}`, data);
      
      if (response.resultcode === 0 || response.resultcode === 200) {
        console.log('✅ [realAPI] updateDesignGeology 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDesignGeology 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] updateDesignGeology 异常:', error);
      return { success: false };
    }
  }

  /**
   * 删除设计地质信息
   */
  async deleteDesignGeology(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/sjdz/${id}`);
      
      if (response.resultcode === 0 || response.resultcode === 200) {
        console.log('✅ [realAPI] deleteDesignGeology 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteDesignGeology 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteDesignGeology 异常:', error);
      return { success: false };
    }
  }

  /**
   * 批量删除设计地质信息
   */
  async batchDeleteDesignGeologies(ids: string[]): Promise<{ success: boolean; successCount: number; failCount: number }> {
    let successCount = 0;
    let failCount = 0;

    console.log('🗑️ [realAPI] 开始批量删除设计地质信息:', ids);

    for (const id of ids) {
      try {
        const result = await this.deleteDesignGeology(id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`❌ [realAPI] 删除ID ${id} 失败:`, error);
        failCount++;
      }
    }

    const success = failCount === 0;
    console.log(`✅ [realAPI] 批量删除完成: 成功${successCount}个, 失败${failCount}个`);
    
    return { success, successCount, failCount };
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
    try {
      console.log('📥 [realAPI] 下载设计地质模板:', params);
      
      const response = await get<Blob>('/api/v1/platform/download/geology', {
        params: {
          userid: this.userId,
          ...params
        },
        responseType: 'blob'
      });
      
      console.log('✅ [realAPI] 下载设计地质模板成功');
      return response;
    } catch (error) {
      console.error('❌ [realAPI] 下载设计地质模板失败:', error);
      throw error;
    }
  }

  // ========== 物探法 CRUD ==========

  /**
   * 获取物探法列表
   */
  async getGeophysicalMethods(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ wtfIPage: PageResponse<GeophysicalMethod> }>>('/api/v1/wtf/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.wtfIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getGeophysicalMethods 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建物探法记录
   */
  async createGeophysicalMethod(data: GeophysicalRequest): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>('/api/v1/wtf', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createGeophysicalMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createGeophysicalMethod 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createGeophysicalMethod 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新物探法记录
   * @param id 记录ID
   * @param data 更新数据
   * @param method 预报方法 (1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC, 7=WZJC)
   */
  async updateGeophysicalMethod(id: string, data: GeophysicalRequest, method?: string | null): Promise<{ success: boolean; message?: string }> {
    try {
      // 根据method参数确定API路径
      let apiPath = `/api/v1/wtf/${id}`;
      
      // 根据不同的预报方法使用不同的API端点
      if (method) {
        const methodNum = parseInt(method);
        switch (methodNum) {
          case 1: // TSP - 地震波反射
            apiPath = `/api/v1/wtf/tsp/${id}`;
            break;
          case 2: // HSP - 水平声波剖面
            apiPath = `/api/v1/wtf/hsp/${id}`;
            break;
          case 3: // LDSN - 陆地声呐
            apiPath = `/api/v1/wtf/ldsn/${id}`;
            break;
          case 4: // DCBFS - 电磁波反射
            apiPath = `/api/v1/wtf/dcbfs/${id}`;
            break;
          case 5: // GFBZLD - 高分辨直流电
            apiPath = `/api/v1/wtf/gfbzld/${id}`;
            break;
          case 6: // SBDC - 瞬变电磁
            apiPath = `/api/v1/wtf/sbdc/${id}`;
            break;
          case 7: // WZJC - 微震监测
            apiPath = `/api/v1/wtf/wzjc/${id}`;
            break;
          default:
            console.warn('⚠️ [realAPI] 未知的预报方法:', method, '使用通用API');
        }
      }
      
      console.log('🔄 [realAPI] updateGeophysicalMethod API路径:', apiPath);
      console.log('🔄 [realAPI] updateGeophysicalMethod 接收到的 data 列表:', {
        ybjgDTOList: (data as any).ybjgDTOList?.length,
        tspPddataDTOList: (data as any).tspPddataDTOList?.length,
        tspBxdataDTOList: (data as any).tspBxdataDTOList?.length,
        ybjgVOList: (data as any).ybjgVOList?.length,
        tspPddataVOList: (data as any).tspPddataVOList?.length,
        tspBxdataVOList: (data as any).tspBxdataVOList?.length
      });
      
      // 清理数据：移除VO后缀的字段（这些是查询返回的，不应该在更新时发送）
      const cleanData: any = { ...data };
      
      // 将VO字段转换为DTO字段
      if (cleanData.ybjgVOList) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
        delete cleanData.ybjgVOList;
      }
      if (cleanData.tspBxdataVOList) {
        cleanData.tspBxdataDTOList = cleanData.tspBxdataVOList;
        delete cleanData.tspBxdataVOList;
      }
      if (cleanData.tspPddataVOList) {
        cleanData.tspPddataDTOList = cleanData.tspPddataVOList;
        delete cleanData.tspPddataVOList;
      }
      
      // 移除可能导致问题的时间戳字段
      delete cleanData.gmtCreate;
      delete cleanData.gmtModified;
      delete cleanData.createdate; // 创建时间不应该在更新时修改
      
      // 深度清理函数：移除对象中的时间戳字段
      const deepClean = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => deepClean(item));
        } else if (typeof obj === 'object' && obj !== null) {
          delete obj.gmtCreate;
          delete obj.gmtModified;
          delete obj.createdate;
          
          // 递归处理属性
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') {
              deepClean(obj[key]);
            }
          });
        }
      };
      
      // 关键修复：在删除之前先保存列表数据
      console.log('🔍 [realAPI] cleanData 中的列表字段:', {
        ybjgDTOList: cleanData.ybjgDTOList?.length,
        tspPddataDTOList: cleanData.tspPddataDTOList?.length,
        tspBxdataDTOList: cleanData.tspBxdataDTOList?.length,
        ybjgVOList: cleanData.ybjgVOList?.length,
        tspPddataVOList: cleanData.tspPddataVOList?.length,
        tspBxdataVOList: cleanData.tspBxdataVOList?.length
      });
      
      // 优先使用 DTOList（前端传来的），如果没有再使用 VOList（后端返回的）
      const savedLists = {
        ybjgDTOList: cleanData.ybjgDTOList || cleanData.ybjgVOList || [],
        tspPddataDTOList: cleanData.tspPddataDTOList || cleanData.tspPddataVOList || [],
        tspBxdataDTOList: cleanData.tspBxdataDTOList || cleanData.tspBxdataVOList || []
      };

      console.log('📋 [realAPI] 保存的列表数据:', {
        ybjgDTOList: savedLists.ybjgDTOList.length,
        tspPddataDTOList: savedLists.tspPddataDTOList.length,
        tspBxdataDTOList: savedLists.tspBxdataDTOList.length
      });

      // 移除子列表字段（避免重复）
      delete cleanData.ybjgVOList;
      delete cleanData.tspBxdataVOList;
      delete cleanData.tspPddataVOList;
      delete cleanData.ybjgDTOList;
      delete cleanData.tspBxdataDTOList;
      delete cleanData.tspPddataDTOList;

      // 移除图片字段（定义为binary，可能导致JSON解析错误）
      delete cleanData.pic1;
      delete cleanData.pic2;
      delete cleanData.pic3;
      delete cleanData.pic4;
      delete cleanData.pic5;
      delete cleanData.pic6;

      // 彻底重构数据对象，而不是在原对象上修补
      // 根据 TspDTO 定义手动构建
      const safeData: any = {
        ybPk: Number(cleanData.ybPk),
        ybId: cleanData.ybId ? Number(cleanData.ybId) : undefined,
        siteId: String(cleanData.siteId),
        method: Number(cleanData.method),
        
        // 文本字段，确保非 null
        dkname: cleanData.dkname || '',
        dkilo: cleanData.dkilo !== undefined ? Number(cleanData.dkilo) : 0,
        ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
        
        testname: cleanData.testname || '',
        monitorname: cleanData.monitorname || '',
        supervisorname: cleanData.supervisorname || '',
        
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
        
        // 状态字段
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
        
        // TSP 特有字段
        tspPk: cleanData.tspPk ? Number(cleanData.tspPk) : undefined,
        tspId: cleanData.tspId || '',
        
        // 其他可能需要的字段，给个默认值
        jfpknum: cleanData.jfpknum || 0,
        jfpksd: cleanData.jfpksd || 0,
        jfpkzj: cleanData.jfpkzj || 0,
        
        // 日期
        monitordate: cleanData.monitordate ? 
          (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
          : undefined,

        // 子列表 - 使用之前保存的数据
        ybjgDTOList: savedLists.ybjgDTOList,
        tspPddataDTOList: savedLists.tspPddataDTOList,
        tspBxdataDTOList: savedLists.tspBxdataDTOList,
      };

      console.log('🔄 [realAPI] updateGeophysicalMethod 发送重构数据:', JSON.stringify(safeData, null, 2));
      const response = await put<BaseResponse>(apiPath, safeData);
      
      // 打印完整响应结构用于调试
      console.log('📥 [realAPI] updateGeophysicalMethod 收到响应:', {
        response,
        type: typeof response,
        keys: response ? Object.keys(response) : [],
        resultcode: response?.resultcode,
        message: response?.message,
        data: response?.data
      });
      
      // 兼容多种响应格式
      // 1. 标准格式: { resultcode: 200/0, message: '...', data: {...} }
      // 2. 简化格式: { resultcode: 200/0 }
      // 3. 直接返回数据对象
      if (response && (response.resultcode === 200 || response.resultcode === 0)) {
        console.log('✅ [realAPI] updateGeophysicalMethod 成功');
        return { success: true };
      } else if (!response || typeof response !== 'object') {
        // 如果响应为空或不是对象，可能是成功但没有返回体
        console.log('✅ [realAPI] updateGeophysicalMethod 成功（无响应体）');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateGeophysicalMethod 失败:', {
          resultcode: response.resultcode,
          message: response.message,
          fullResponse: response
        });
        return { success: false, message: response.message || response.msg || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateGeophysicalMethod 异常:', {
        error,
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data
      });
      return { success: false, message: error?.response?.data?.message || error?.message || '网络异常' };
    }
  }

  /**
   * 删除物探法记录
   */
  async deleteGeophysicalMethod(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/wtf/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteGeophysicalMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteGeophysicalMethod 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteGeophysicalMethod 异常:', error);
      return { success: false };
    }
  }

  // ========== 钻探法 CRUD ==========

  /**
   * 获取钻探法列表
   */
  async getDrillingMethods(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ ztfIPage: PageResponse<DrillingMethod> }>>('/api/v1/ztf/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.ztfIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getDrillingMethods 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建钻探法记录
   */
  async createDrillingMethod(data: DrillingRequest): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>('/api/v1/ztf', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createDrillingMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDrillingMethod 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDrillingMethod 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新钻探法记录
   */
  async updateDrillingMethod(id: string, data: DrillingRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/ztf/${id}`, data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateDrillingMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDrillingMethod 失败:', response.message);
        return { success: false, message: response.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateDrillingMethod 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 删除钻探法记录
   */
  async deleteDrillingMethod(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/ztf/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteDrillingMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteDrillingMethod 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteDrillingMethod 异常:', error);
      return { success: false };
    }
  }

  // ========== 掌子面素描 CRUD ==========

  /**
   * 获取掌子面素描列表
   */
  async getFaceSketches(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ zzmsmIPage: PageResponse<FaceSketch> }>>('/api/v1/zzmsm/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.zzmsmIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getFaceSketches 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建掌子面素描记录
   */
  async createFaceSketch(data: FaceSketchRequest): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>('/api/v1/zzmsm', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createFaceSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createFaceSketch 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createFaceSketch 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新掌子面素描记录
   */
  async updateFaceSketch(id: string, data: FaceSketchRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/zzmsm/${id}`, data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateFaceSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateFaceSketch 失败:', response.message);
        return { success: false, message: response.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateFaceSketch 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 删除掌子面素描记录
   */
  async deleteFaceSketch(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/zzmsm/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteFaceSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteFaceSketch 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteFaceSketch 异常:', error);
      return { success: false };
    }
  }

  // ========== 洞身素描 CRUD ==========

  /**
   * 获取洞身素描列表
   */
  async getTunnelSketches(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ dssmIPage: PageResponse<TunnelSketch> }>>('/api/v1/dssm/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.dssmIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getTunnelSketches 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建洞身素描记录
   */
  async createTunnelSketch(data: TunnelSketchRequest): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>('/api/v1/dssm', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createTunnelSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createTunnelSketch 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createTunnelSketch 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新洞身素描记录
   */
  async updateTunnelSketch(id: string, data: TunnelSketchRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/dssm/${id}`, data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateTunnelSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateTunnelSketch 失败:', response.message);
        return { success: false, message: response.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateTunnelSketch 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 删除洞身素描记录
   */
  async deleteTunnelSketch(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/dssm/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteTunnelSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteTunnelSketch 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteTunnelSketch 异常:', error);
      return { success: false };
    }
  }

  // ========== 地表补充 CRUD ==========

  /**
   * 获取地表补充列表
   */
  async getSurfaceSupplements(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<BaseResponse<{ dbbcIPage: PageResponse<SurfaceSupplement> }>>('/api/v1/dbbc/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response.data?.dbbcIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getSurfaceSupplements 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建地表补充记录
   */
  async createSurfaceSupplement(data: SurfaceSupplementRequest): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>('/api/v1/dbbc', data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] createSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createSurfaceSupplement 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createSurfaceSupplement 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新地表补充记录
   */
  async updateSurfaceSupplement(id: string, data: SurfaceSupplementRequest): Promise<{ success: boolean }> {
    try {
      const response = await put<BaseResponse>(`/api/v1/dbbc/${id}`, data);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] updateSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateSurfaceSupplement 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] updateSurfaceSupplement 异常:', error);
      return { success: false };
    }
  }

  /**
   * 删除地表补充记录
   */
  async deleteSurfaceSupplement(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<BaseResponse>(`/api/v1/dbbc/${id}`);
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] deleteSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteSurfaceSupplement 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteSurfaceSupplement 异常:', error);
      return { success: false };
    }
  }

  // ========== 数据转换辅助方法 ==========

  /**
   * 将前端方法名转换为后端方法代码
   */
  private getMethodCode(methodName: string): number {
    const methodMap: Record<string, number> = {
      '其他': 0,
      '地震波反射': 1,
      '水平声波剖面': 2,
      'HSP': 2,
      '陆地声呐': 3,
      '电磁波反射': 4,
      '高分辨直流电': 5,
      '瞬变电磁': 6,
      '掌子面素描': 7,
      '洞身素描': 8,
      '地表补充': 12,
      '超前水平钻': 13,
      '加深炮孔': 14,
      '全部': 99,
    };
    return methodMap[methodName] || 0;
  }

  /**
   * 从里程字符串中提取前缀 (如: "DK713+920" -> "DK")
   */
  private extractMileagePrefix(mileage: string): string {
    const match = mileage.match(/^([A-Z]+)/);
    return match ? match[1] : 'DK';
  }

  /**
   * 从里程字符串中提取数字 (如: "DK713+920" -> 713.920)
   */
  private extractMileageNumber(mileage: string): number {
    const match = mileage.match(/([0-9]+)(?:\+([0-9]+))?/);
    if (match) {
      const km = parseInt(match[1]) || 0;
      const m = parseInt(match[2]) || 0;
      return km + (m / 1000);
    }
    return 0;
  }

  /**
   * 将围岩等级罗马数字转换为数字
   */
  private getRockGradeNumber(grade: string): number {
    const gradeMap: Record<string, number> = {
      'I': 1,
      'II': 2,
      'III': 3,
      'IV': 4,
      'V': 5,
      'VI': 6
    };
    return gradeMap[grade] || 4;
  }

  /**
   * 将围岩等级数字转换为罗马数字
   */
  private getRockGradeLabel(grade: number): string {
    const gradeMap: Record<number, string> = {
      1: 'I',
      2: 'II',
      3: 'III',
      4: 'IV',
      5: 'V',
      6: 'VI'
    };
    return gradeMap[grade] || 'IV';
  }

  // ========== 地质预报数据查询（5大类） ==========

  /**
   * 获取物探法展示数据（地质预报-物探）
   * @param params 查询参数
   * @returns 物探法数据列表（分页）
   */
  async getGeophysicalList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      console.log('🚀 [realAPI] getGeophysicalList 调用参数:', params);
      
      // 强制要求siteId必传，避免使用错误的默认值
      if (!params.siteId) {
        console.error('❌ [realAPI] getGeophysicalList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }
      
      const queryParams = {
        siteId: params.siteId,  // 必填，不使用默认值
        type: 1,                // 1=物探法
        // submitFlag: 1,          // 必填，1=已提交
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };
      /*  */
      console.log('📤 [realAPI] 物探法请求参数:', queryParams);
      
      // 恢复为标准的GET请求，通过Query参数传递
      const response = await get<any>('/api/v1/wtf/list', { params: queryParams });
      console.log('🔍 [realAPI] getGeophysicalList 响应:', response);
      
      // 兼容处理：如果response直接是Page对象（已被拦截器处理过），或者包含resultcode
      let pageData = null;
      if (response && (response.records || Array.isArray(response.records))) {
         pageData = response;
      } else if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
         pageData = response.data;
      }

      if (pageData) {
        return {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
      }
      console.warn('⚠️ [realAPI] 响应码非200或无数据:', response);
      return { records: [], total: 0, current: 1, size: 10, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getGeophysicalList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 0 };
    }
  }

  /**
   * 获取掌子面素描数据（地质预报-掌子面素描）
   */
  async getPalmSketchList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      if (!params.siteId) {
        console.error('❌ [realAPI] getPalmSketchList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }
      
      const queryParams = {
        siteId: params.siteId,
        type: 2,  // 2=掌子面素描
        // submitFlag: 1, // 必填
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };
      
      console.log('🚀 [realAPI] getPalmSketchList 调用参数:', params);
      console.log('📤 [realAPI] 掌子面素描请求参数:', queryParams);
      
      const response = await get<any>('/api/v1/zzmsm/list', { params: queryParams });
      console.log('🔍 [realAPI] getPalmSketchList 响应:', response);
      
      // 兼容处理
      let pageData = null;
      if (response && (response.records || Array.isArray(response.records))) {
         pageData = response;
      } else if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
         pageData = response.data;
      }

      if (pageData) {
        return {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
      }
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getPalmSketchList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取洞身素描数据（地质预报-洞身素描）
   */
  async getTunnelSketchList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      if (!params.siteId) {
        console.error('❌ [realAPI] getTunnelSketchList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }
      
      const queryParams = {
        siteId: params.siteId,
        type: 3,  // 3=洞身素描
        // submitFlag: 1, // 必填
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };
      
      console.log('🚀 [realAPI] getTunnelSketchList 调用参数:', params);
      console.log('📤 [realAPI] 洞身素描请求参数:', queryParams);
      
      const response = await get<any>('/api/v1/dssm/list', { params: queryParams });
      console.log('🔍 [realAPI] getTunnelSketchList 响应:', response);
      
      // 兼容处理
      let pageData = null;
      if (response && (response.records || Array.isArray(response.records))) {
         pageData = response;
      } else if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
         pageData = response.data;
      }

      if (pageData) {
        return {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
      }
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getTunnelSketchList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取钻探数据（地质预报-钻探）
   */
  async getDrillingList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      if (!params.siteId) {
        console.error('❌ [realAPI] getDrillingList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }
      
      const queryParams = {
        siteId: params.siteId,
        type: 4,  // 4=钻探法
        // submitFlag: 1, // 必填
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };
      
      console.log('🚀 [realAPI] getDrillingList 调用参数:', params);
      console.log('📤 [realAPI] 钻探请求参数:', queryParams);
      
      const response = await get<any>('/api/v1/ztf/list', { params: queryParams });
      console.log('🔍 [realAPI] getDrillingList 响应:', response);
      
      // 兼容处理
      let pageData = null;
      if (response && (response.records || Array.isArray(response.records))) {
         pageData = response;
      } else if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
         pageData = response.data;
      }

      if (pageData) {
        return {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
      }
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getDrillingList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取地表补充数据（地质预报-地表补充）
   */
  async getSurfaceSupplementList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      if (!params.siteId) {
        console.error('❌ [realAPI] getSurfaceSupplementList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }
      
      const queryParams = {
        siteId: params.siteId,
        type: 5,  // 5=地表补充
        // submitFlag: 1, // 必填
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };
      
      console.log('🚀 [realAPI] getSurfaceSupplementList 调用参数:', params);
      console.log('📤 [realAPI] 地表补充请求参数:', queryParams);
      
      const response = await get<any>('/api/v1/dbbc/list', { params: queryParams });
      console.log('🔍 [realAPI] getSurfaceSupplementList 响应:', response);
      
      // 兼容处理
      let pageData = null;
      if (response && (response.records || Array.isArray(response.records))) {
         pageData = response;
      } else if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
         pageData = response.data;
      }

      if (pageData) {
        return {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
      }
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getSurfaceSupplementList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取地表补充信息（单个记录）
   */
  async getSurfaceSupplementInfo(ybPk: string): Promise<any> {
    try {
      const response = await get<any>(`/api/v1/dbbc/${ybPk}`);
      
      if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(' [realAPI] getSurfaceSupplementInfo ', error);
      return null;
    }
  }

  // ========== 补充的API方法 ==========

  /**
   * 上传物探法数据
   */
  async uploadGeophysicalData(id: string): Promise<{ success: boolean }> {
    try {
      const response = await post<BaseResponse>(`/api/v1/wtf/${id}/upload`, {});
      
      if (response.resultcode === 200) {
        console.log('✅ [realAPI] uploadGeophysicalData 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadGeophysicalData 失败:', response.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] uploadGeophysicalData 异常:', error);
      return { success: false };
    }
  }

  /**
   * 获取洞身素描详情
   */
  async getTunnelSketchDetail(dssmPk: number): Promise<any> {
    try {
      const response = await get<any>(`/api/v1/dssm/${dssmPk}`);
      
      if (response.resultcode === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getTunnelSketchDetail 异常:', error);
      return null;
    }
  }

  /**
   * 获取地震波反射详情 (TSP)
   */
  async getTspDetail(ybPk: string): Promise<any> {
    try {
      console.log('🔍 [realAPI] getTspDetail 请求, ybPk:', ybPk);
      const response = await get<any>(`/api/v1/wtf/tsp/${ybPk}`);
      console.log('🔍 [realAPI] getTspDetail 响应:', response);
      
      // 处理两种可能的响应格式
      if (response.resultcode === 200 && response.data) {
        // 标准格式：{ resultcode: 200, data: {...} }
        console.log('✅ [realAPI] getTspDetail 成功 (标准格式), 数据:', response.data);
        return response.data;
      } else if (response.ybPk || response.tspPk) {
        // 直接返回数据对象：{ ybPk: ..., tspPk: ..., ... }
        console.log('✅ [realAPI] getTspDetail 成功 (直接数据), 数据:', response);
        return response;
      }
      
      console.warn('⚠️ [realAPI] getTspDetail 失败, resultcode:', response.resultcode, 'message:', response.message);
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getTspDetail 异常:', error);
      return null;
    }
  }
}

// 导出单例
const realAPI = new RealAPIService();
export default realAPI;
