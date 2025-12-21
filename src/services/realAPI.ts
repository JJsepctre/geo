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

// ==================== 辅助函数 ====================

/**
 * 检查API响应是否成功
 * 兼容多种响应格式：
 * 1. { resultcode: 0, data: true } - resultcode为0且data为true表示成功
 * 2. { resultcode: 200, data: ... } - resultcode为200表示成功
 * 3. true - api.ts的defaultTransform解包后直接返回true
 * 4. 数字 - 创建接口返回新记录ID
 * 5. false - api.ts解包后返回false，表示操作失败
 * 
 * 注意：后端返回 {resultcode: 0, data: false} 时，data: false 表示操作失败
 */
function isSuccessResponse(response: any): boolean {
  // api.ts的defaultTransform会解包data字段
  // 所以 {resultcode: 0, data: true} 会变成 true
  // 而 {resultcode: 0, data: false} 会变成 false
  if (response === true) return true;
  if (response === false) return false; // data: false 表示操作失败
  if (typeof response === 'number') return true;
  if (response && typeof response === 'object') {
    // 如果没被解包，检查完整响应
    if (response.resultcode === 0 || response.resultcode === 200) {
      // 如果有data字段且为false，表示失败
      if (response.data === false) return false;
      return true;
    }
  }
  return false;
}

// ==================== 请求数据类型定义 ====================

// 设计围岩等级请求类型（根据新的SjwydjDTO结构）
export interface DesignRockGradeRequest {
  sjwydj: {
    bdPk?: number;         // 标段主键
    sdPk?: number;         // 隧道主键
    siteId?: string;       // 工点ID
    dkname: string;        // 里程冠号
    dkilo: number;         // 里程公里数
    sjwydjLength: number;  // 预报长度
    wydj: number;          // 围岩等级 (1-6)
    revise?: string;       // 修改原因/备注
    username?: string;     // 填写人账号
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
  sjybPk?: number;       // 设计预报方法主键（部分后端实现要求在Body里携带）
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

// 设计地质信息请求类型（根据新的SjdzDTO结构）
export interface DesignGeologyRequest {
  sjdz: {
    bdPk?: number;         // 标段主键
    sdPk?: number;         // 隧道主键
    sjdzPk?: number;       // 主键（更新时需要）
    sjdzId?: number;       // ID
    sitePk?: number;       // 工点ID
    method: number;        // 地质分类(1-5)
    dkname: string;        // 里程冠号
    dkilo: number;         // 起点里程
    sjdzLength: number;    // 预报长度
    dzxxfj?: number;       // 地质信息附加(1-4)
    revise?: string;       // 修改原因/备注（旧字段名）
    remark?: string;       // 备注（新字段名）
    username?: string;     // 填写人账号
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
   * 创建地震波反射(TSP)预报记录
   * @param data TspDTO数据
   * @returns 创建结果
   */
  async createTsp(data: TspDTO): Promise<BaseResponse> {
    try {
      console.log('🚀 [realAPI] createTsp 调用: /api/v1/wtf/tsp', data);
      const response = await post<BaseResponse>('/api/v1/wtf/tsp', data);
      console.log('✅ [realAPI] createTsp 响应:', response);
      return response;
    } catch (error) {
      console.error('❌ [realAPI] createTsp 异常:', error);
      throw error;
    }
  }

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
    try {
      // 优先尝试 v1 路径
      const respV1 = await get<any>(`/api/v1/sjyb/${sjybPk}`);
      if (respV1 && typeof respV1 === 'object') {
        const code = (respV1 as any).resultcode ?? (respV1 as any).code;
        if (code === 200 || code === 0) {
          return (respV1 as any).data ?? (respV1 as any).result ?? respV1;
        }
      }
      return respV1;
    } catch (e) {
      // 兼容旧路径
      try {
        const resp = await get<any>(`/api/sjyb/${sjybPk}`);
        if (resp && typeof resp === 'object') {
          const code = (resp as any).resultcode ?? (resp as any).code;
          if (code === 200 || code === 0) {
            return (resp as any).data ?? (resp as any).result ?? resp;
          }
        }
        return resp;
      } catch (e2) {
        console.error('❌ [realAPI] getDesignForecastDetail 异常:', e2);
        return null;
      }
    }
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
    console.log('🚀 [realAPI] getComprehensiveConclusionList 调用参数:', params);
    const response = await get<any>(`/api/v1/zhjl/list`, { params: { userid: this.userId, ...params } });
    console.log('✅ [realAPI] getComprehensiveConclusionList 响应:', response);
    return response;
  }

  /**
   * 获取综合结论处置情况数据
   * @param zhjlPk 综合结论主键
   * @returns 处置情况列表
   */
  async getZhjlCzinfo(zhjlPk: number): Promise<any> {
    console.log('🚀 [realAPI] getZhjlCzinfo 调用参数:', zhjlPk);
    const response = await get<any>(`/api/v1/zhjl/${zhjlPk}/zhjlCzinfo`, { params: { zhjlPk } });
    console.log('✅ [realAPI] getZhjlCzinfo 响应:', response);
    return response;
  }

  /**
   * 新增综合结论处置数据
   * @param data 处置数据
   * @returns 新增结果
   */
  async createZhjlCzinfo(data: {
    zhjlPk: number;
    handletype?: number;
    handleresult?: number;
    subsectionId?: string;
    handlecontent?: string;
    addition?: string;
    handletime?: string;
    liableusername?: string;
    liableuserno?: string;
    liableuserphone?: string;
  }): Promise<any> {
    console.log('🚀 [realAPI] createZhjlCzinfo 调用参数:', data);
    const response = await post<any>(`/api/v1/zhjl/${data.zhjlPk}/zhjlCzinfo`, data);
    console.log('✅ [realAPI] createZhjlCzinfo 响应:', response);
    return response;
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
        // 后端dkilo格式：180973.00 表示 180公里973米（公里*1000 + 米）
        const dkilo = item.dkilo || 0;
        const startKm = Math.floor(dkilo / 1000);  // 公里数
        const startM = Math.round(dkilo % 1000);   // 米数

        // 计算结束里程：dkilo + sjybLength
        const lengthM = item.sjybLength || 0;
        const endDkilo = dkilo + lengthM;
        const endKm = Math.floor(endDkilo / 1000);
        const endM = Math.round(endDkilo % 1000);

        // 格式化里程字符串
        const dkname = item.dkname || 'DK';
        const startMileage = `${dkname}${startKm}+${String(startM).padStart(3, '0')}`;
        const endMileage = `${dkname}${endKm}+${String(endM).padStart(3, '0')}`;

        // 方法代码转换为字母标识
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
          mileagePrefix: dkname,
          startMileage,
          endMileage,
          length: item.sjybLength || 0,
          minBurialDepth: item.zxms || 0,
          designTimes: item.plannum || 0,
          drillingCount: item.zksl || 0,
          coreCount: item.qxsl || 0,
          author: item.username || '',
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
      // 后端格式：dkilo 是米数（如 180973 = 180公里973米）
      const dkiloMeters = this.extractMileageInMeters(data.startMileage);

      console.log('🔍 [realAPI] createForecastDesign 里程解析:', {
        startMileage: data.startMileage,
        dkilo: dkiloMeters
      });

      // 根据API入参结构，只需要siteId，不需要bdId
      const requestData = {
        siteId: String((data as any).siteId || (data as any).sitePk || ''),  // 工点ID
        method: this.getMethodCode(data.method),  // 预报方法
        dkname: this.extractMileagePrefix(data.startMileage),  // 里程冠号
        dkilo: dkiloMeters,  // 起始里程（米数）
        sjybLength: data.length,  // 预报长度
        zxms: data.minBurialDepth || 0,  // 最小埋深
        zksl: (data as any).drillingCount || 0,  // 钻孔数量
        qxsl: (data as any).coreCount || 0,  // 取芯数量
        plannum: data.designTimes || 1,  // 设计次数
        username: this.getCurrentLogin()  // 填写人账号
      };

      console.log('📤 [realAPI] createForecastDesign 请求数据:', requestData);

      const response = await post<BaseResponse>('/api/v1/sjyb', requestData);

      if (response.resultcode === 200 || response.resultcode === 0) {
        console.log('✅ [realAPI] createForecastDesign 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createForecastDesign 失败:', response.message);
        throw new Error(response.message || '创建失败');
      }
    } catch (error) {
      console.error('❌ [realAPI] createForecastDesign 异常:', error);
      throw error;
    }
  }

  async updateForecastDesign(id: string, data: Omit<ForecastDesignRecord, 'id' | 'createdAt'>): Promise<{ success: boolean }> {
    try {
      console.log('🚀 [realAPI] updateForecastDesign 开始, id:', id, 'data:', data);

      // 读取后端现有详情，动态继承必要字段
      const detail = await this.getDesignForecastDetail(Number(id)).catch(() => null);
      console.log('🔍 [realAPI] updateForecastDesign 获取到的详情:', detail);

      // 从详情中获取siteId，或者从传入的data中获取
      const siteId = (data as any).siteId || 
                     (detail && typeof detail === 'object' && 'siteId' in detail ? String(detail.siteId) : '') ||
                     (detail && typeof detail === 'object' && 'sitePk' in detail ? String(detail.sitePk) : '');
      const existZksl = (detail && typeof detail === 'object' && 'zksl' in detail) ? Number(detail.zksl) : undefined;
      const existQxsl = (detail && typeof detail === 'object' && 'qxsl' in detail) ? Number(detail.qxsl) : undefined;
      const existPlannum = (detail && typeof detail === 'object' && 'plannum' in detail) ? Number(detail.plannum) : undefined;

      const formDrillCount = (data as any).drillingCount;
      const formCoreCount = (data as any).coreCount;
      const formDesignTimes = (data as any).designTimes;

      // 后端格式：dkilo 是米数（如 180973 = 180公里973米）
      const dkiloMeters = this.extractMileageInMeters(data.startMileage);

      console.log('🔍 [realAPI] updateForecastDesign 里程解析:', {
        startMileage: data.startMileage,
        dkiloMeters
      });

      // 根据API入参结构，bdId设为null，siteId从传入的data或详情获取
      const requestData: any = {
        bdId: null,
        siteId: siteId,  // 从页面传入的siteId
        method: this.getMethodCode(data.method),
        dkname: this.extractMileagePrefix(data.startMileage),
        dkilo: Math.floor(dkiloMeters),  // 起始里程
        sjybLength: Number(Number(data.length).toFixed(2)),  // 预报长度
        zxms: data.minBurialDepth || 0,  // 最小埋深
        zksl: typeof formDrillCount === 'number' ? formDrillCount : (existZksl ?? 0),
        qxsl: typeof formCoreCount === 'number' ? formCoreCount : (existQxsl ?? 0),
        plannum: typeof formDesignTimes === 'number' ? formDesignTimes : (existPlannum ?? 1),
        username: this.getCurrentLogin()
      };

      console.log('📤 [realAPI] updateForecastDesign 请求数据:', requestData);
      console.log('📤 [realAPI] 请求URL: PUT /api/v1/sjyb/' + id);

      const response = await put<BaseResponse>(`/api/v1/sjyb/${id}`, requestData);

      console.log('📥 [realAPI] updateForecastDesign 响应:', response);

      // 处理不同的响应格式
      const resp = response as any;
      if (resp === true || resp?.resultcode === 200 || resp?.resultcode === 0) {
        console.log('✅ [realAPI] updateForecastDesign 成功');
        return { success: true };
      } else if (resp?.resultcode === 400 || resp?.resultcode === 500) {
        console.error('❌ [realAPI] updateForecastDesign 失败:', resp.message);
        throw new Error(resp.message || '更新失败');
      } else {
        // 如果响应是其他格式，也视为成功
        console.log('✅ [realAPI] updateForecastDesign 响应格式未知，视为成功:', resp);
        return { success: true };
      }
    } catch (error) {
      console.error('❌ [realAPI] updateForecastDesign 异常:', error);
      throw error;
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
  async getDesignRockGrades(params: { siteId: string; pageNum?: number; pageSize?: number; wydj?: number; begin?: string; end?: string }) {
    try {
      console.log('🚀 [realAPI] getDesignRockGrades 调用API: /api/v1/sjwydj/list');
      console.log('🔍 [realAPI] 请求参数:', params);

      const response = await get<any>('/api/v1/sjwydj/list', {
        params: {
          siteId: params.siteId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          wydj: params.wydj,
          begin: params.begin,
          end: params.end
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
      const response = await get<{ sjwydj: DesignRockGrade }>(`/api/v1/sjwydj/${id}`);
      return response?.sjwydj;
    } catch (error) {
      console.error('❌ [realAPI] getDesignRockGradeById 失败:', error);
      throw error;
    }
  }

  /**
   * 创建设计围岩等级
   * 根据新的SjwydjDTO结构：必填字段 bdPk, dkilo, dkname, sdPk, sjwydjLength, wydj
   * @param data 设计围岩等级数据
   */
  async createDesignRockGrade(data: DesignRockGradeRequest): Promise<{ success: boolean }> {
    try {
      // 根据新的SjwydjDTO结构，直接传参数（不需要包装在sjwydj对象中）
      const requestData = {
        bdPk: data.sjwydj?.bdPk,  // 标段主键（从传入数据获取）
        sdPk: data.sjwydj?.sdPk,  // 隧道主键（从传入数据获取）
        dkname: data.sjwydj?.dkname || 'DK',  // 里程冠号
        dkilo: data.sjwydj?.dkilo || 0,  // 起始里程
        wydj: data.sjwydj?.wydj || 1,  // 围岩等级(1-6)
        sjwydjLength: data.sjwydj?.sjwydjLength || 0,  // 预报长度
        remark: data.sjwydj?.revise || ''  // 备注
      };
      
      console.log('📤 [realAPI] createDesignRockGrade 请求数据:', requestData);
      const response = await post<any>('/api/v1/sjwydj', requestData);
      console.log('🔍 [realAPI] createDesignRockGrade 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] createDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDesignRockGrade 失败:', response?.message || response);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDesignRockGrade 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新设计围岩等级
   * 根据新的SjwydjDTO结构
   */
  async updateDesignRockGrade(id: string, data: DesignRockGradeRequest): Promise<{ success: boolean }> {
    try {
      // 根据新的SjwydjDTO结构，直接传参数（不需要包装在sjwydj对象中）
      const requestData = {
        bdPk: data.sjwydj?.bdPk || 1,  // 标段主键
        sdPk: data.sjwydj?.sdPk || 1,  // 隧道主键
        dkname: data.sjwydj?.dkname || 'DK',  // 里程冠号
        dkilo: data.sjwydj?.dkilo || 0,  // 起始里程
        wydj: data.sjwydj?.wydj || 1,  // 围岩等级(1-6)
        sjwydjLength: data.sjwydj?.sjwydjLength || 0,  // 预报长度
        remark: data.sjwydj?.revise || ''  // 备注
      };
      
      console.log('📤 [realAPI] updateDesignRockGrade 请求数据:', requestData);
      const response = await put<any>(`/api/v1/sjwydj/${id}`, requestData);
      console.log('🔍 [realAPI] updateDesignRockGrade 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDesignRockGrade 失败:', response?.message || response);
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
      const response = await del<any>(`/api/v1/sjwydj/${id}`);
      console.log('🔍 [realAPI] deleteDesignRockGrade 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] deleteDesignRockGrade 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteDesignRockGrade 失败:', response?.message || response);
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
  async getDesignGeologies(params: { siteId: string; pageNum?: number; pageSize?: number; method?: number; begin?: string; end?: string }) {
    try {
      console.log('🚀 [realAPI] getDesignGeologies 调用参数:', params);

      // 构建请求参数，只包含有值的字段
      const requestParams: any = {
        siteId: params.siteId,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15,
      };

      // 只在有值时添加可选参数
      if (params.method !== undefined) {
        requestParams.method = params.method;
      }
      if (params.begin) {
        requestParams.begin = params.begin;
      }
      if (params.end) {
        requestParams.end = params.end;
      }

      console.log('🔍 [realAPI] getDesignGeologies 实际请求参数:', requestParams);

      const response = await get<{ sjdzIPage: PageResponse<DesignGeology> }>('/api/v1/sjdz/list', {
        params: requestParams
      });

      console.log('🔍 [realAPI] getDesignGeologies 响应:', response);
      // get函数已经自动解包了data，所以response就是{sjdzIPage: {...}}
      return response?.sjdzIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getDesignGeologies 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建设计地质信息
   * 根据新的SjdzDTO结构：必填字段 dkilo, dkname, dzxxfj, method, sjdzLength
   * @param data 设计地质信息数据
   */
  async createDesignGeology(data: DesignGeologyRequest): Promise<{ success: boolean }> {
    try {
      // 根据新的SjdzDTO结构，直接传参数（不需要包装在sjdz对象中）
      const requestData = {
        bdPk: data.sjdz?.bdPk,  // 标段主键（从传入数据获取）
        sdPk: data.sjdz?.sdPk,  // 隧道主键（从传入数据获取）
        dkname: data.sjdz?.dkname || 'DK',  // 里程冠号
        dkilo: data.sjdz?.dkilo || 0,  // 起始里程
        method: data.sjdz?.method || 1,  // 地质分类(1-5)
        sjdzLength: data.sjdz?.sjdzLength || 0,  // 预报长度
        dzxxfj: data.sjdz?.dzxxfj || 1,  // 地质信息附加(1-4)
        remark: data.sjdz?.remark || data.sjdz?.revise || ''  // 备注
      };
      
      console.log('📤 [realAPI] createDesignGeology 请求数据:', requestData);
      const response = await post<any>('/api/v1/sjdz', requestData);
      console.log('🔍 [realAPI] createDesignGeology 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] createDesignGeology 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDesignGeology 失败:', response?.message || response);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDesignGeology 异常:', error);
      return { success: false };
    }
  }

  /**
   * 更新设计地质信息
   * 根据新的SjdzDTO结构
   */
  async updateDesignGeology(id: string, data: any): Promise<{ success: boolean }> {
    try {
      // 根据新的SjdzDTO结构，直接传参数（不需要包装在sjdz对象中）
      const requestData = {
        bdPk: data.sjdz?.bdPk || 1,  // 标段主键
        sdPk: data.sjdz?.sdPk || 1,  // 隧道主键
        dkname: data.sjdz?.dkname || 'DK',  // 里程冠号
        dkilo: data.sjdz?.dkilo || 0,  // 起始里程
        method: data.sjdz?.method || 1,  // 地质分类(1-5)
        sjdzLength: data.sjdz?.sjdzLength || 0,  // 预报长度
        dzxxfj: data.sjdz?.dzxxfj || 1,  // 地质信息附加(1-4)
        remark: data.sjdz?.remark || data.sjdz?.revise || ''  // 备注
      };
      
      console.log('📤 [realAPI] updateDesignGeology 请求数据:', requestData);
      const response = await put<any>(`/api/v1/sjdz/${id}`, requestData);
      console.log('🔍 [realAPI] updateDesignGeology 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateDesignGeology 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDesignGeology 失败:', response?.message || response);
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
      const response = await get<{ wtfIPage: PageResponse<GeophysicalMethod> }>('/api/v1/wtf/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response?.wtfIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getGeophysicalMethods 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 创建物探法记录
   * @param data 数据
   * @param method 预报方法 (1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC)
   */
  async createGeophysicalMethod(data: any, method?: string | null): Promise<{ success: boolean; message?: string }> {
    try {
      // 根据method参数确定API路径
      let apiPath = '/api/v1/wtf';

      if (method) {
        const methodNum = parseInt(method);
        switch (methodNum) {
          case 1: // TSP - 地震波反射
            apiPath = '/api/v1/wtf/tsp';
            break;
          case 2: // HSP - 水平声波剖面
            apiPath = '/api/v1/wtf/hsp';
            break;
          case 3: // LDSN - 陆地声呐
            apiPath = '/api/v1/wtf/ldsn';
            break;
          case 4: // DCBFS - 电磁波反射
            apiPath = '/api/v1/wtf/dcbfs';
            break;
          case 5: // GFBZLD - 高分辨直流电
            apiPath = '/api/v1/wtf/gfbzld';
            break;
          case 6: // SBDC - 瞬变电磁
            apiPath = '/api/v1/wtf/sbdc';
            break;
          default:
            apiPath = '/api/v1/wtf';
        }
      }

      console.log('📤 [realAPI] createGeophysicalMethod 请求路径:', apiPath);
      console.log('📤 [realAPI] createGeophysicalMethod 请求数据:', data);

      // 复制数据，只移除主键字段（新增时不需要）
      const cleanData: any = { ...data };
      // 移除主键字段 - 新增时所有 Pk 字段应该是 null 或不传
      delete cleanData.ybPk;
      delete cleanData.ybId;
      delete cleanData.tspPk;
      delete cleanData.tspId;
      delete cleanData.wtfPk;
      // DCBFS 特有的主键字段
      delete cleanData.dcbfsPk;
      delete cleanData.dcbfsId;
      // HSP 特有的主键字段
      delete cleanData.hspPk;
      delete cleanData.hspId;
      // LDSN 特有的主键字段
      delete cleanData.ldsnPk;
      delete cleanData.ldsnId;
      // GFBZLD 特有的主键字段
      delete cleanData.gfbzldPk;
      delete cleanData.gfbzldId;
      // SBDC 特有的主键字段
      delete cleanData.sbdcPk;
      delete cleanData.sbdcId;

      // 确保siteId是字符串类型
      if (cleanData.siteId) {
        cleanData.siteId = String(cleanData.siteId);
      }

      // 确保method是数字类型
      if (cleanData.method) {
        cleanData.method = Number(cleanData.method);
      }
      
      // 移除 undefined 和空字符串值
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === '') {
            delete cleanData[key];
        }
      });
      
      // 确保必要的数字字段存在
      if (cleanData.flag === undefined) cleanData.flag = 0;
      if (cleanData.submitFlag === undefined) cleanData.submitFlag = 0;

      // DCBFS 新增时，清理子列表中的 Pk 字段
      if (method === '4') {
        if (cleanData.ybjgDTOList) {
          cleanData.ybjgDTOList = cleanData.ybjgDTOList.map((item: any) => {
            const { ybjgPk, ybjgId, ...rest } = item;
            return rest;
          });
        }
        if (cleanData.dcbfsResultinfoDTOList) {
          cleanData.dcbfsResultinfoDTOList = cleanData.dcbfsResultinfoDTOList.map((item: any) => {
            const { dcbfsResultinfoPk, dcbfsResultinfoId, dcbfsPk, ...rest } = item;
            return rest;
          });
        }
        if (cleanData.dcbfsResultpicDTOList) {
          cleanData.dcbfsResultpicDTOList = cleanData.dcbfsResultpicDTOList.map((item: any) => {
            const { dcbfsResultpicPk, dcbfsResultpicId, dcbfsPk, ...rest } = item;
            return rest;
          });
        }
      }

      console.log('📤 [realAPI] createGeophysicalMethod 清理后数据:', cleanData);

      const response = await post<any>(apiPath, cleanData);

      console.log('📥 [realAPI] createGeophysicalMethod 响应:', response);
      console.log('📥 [realAPI] 响应类型:', typeof response);

      // API 返回格式可能是:
      // 1. 直接返回新记录ID (number)
      // 2. { resultcode: 200, data: newId }
      // 3. { code: 200, data: newId }
      if (typeof response === 'number') {
        // 直接返回ID，表示创建成功
        console.log('✅ [realAPI] createGeophysicalMethod 成功，新记录ID:', response);
        return { success: true };
      } else if (response && typeof response === 'object') {
        const code = response.resultcode ?? response.code;
        if (code === 200 || code === 0) {
          console.log('✅ [realAPI] createGeophysicalMethod 成功');
          return { success: true };
        } else if (response.data && typeof response.data === 'number') {
          // data 字段是新记录ID
          console.log('✅ [realAPI] createGeophysicalMethod 成功，新记录ID:', response.data);
          return { success: true };
        } else {
          console.error('❌ [realAPI] createGeophysicalMethod 失败:', response.message || response.msg);
          return { success: false, message: response.message || response.msg || '创建失败' };
        }
      } else {
        // 未知响应格式，但如果没有抛出异常，可能也是成功的
        console.warn('⚠️ [realAPI] createGeophysicalMethod 未知响应格式:', response);
        return { success: true };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] createGeophysicalMethod 异常:', error);
      console.error('❌ [realAPI] 错误详情:', error?.response?.data || error?.message);
      return { success: false, message: error?.response?.data?.message || error?.message || '创建失败' };
    }
  }

  /**
   * 创建掌子面素描记录
   */
  async createPalmSketch(data: any): Promise<{ success: boolean; message?: string }> {
    try {
      // 清理 undefined 和 null 值，避免后端解析错误
      const cleanData: any = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          cleanData[key] = data[key];
        }
      });
      
      console.log('📤 [realAPI] createPalmSketch 请求数据:', cleanData);
      const response = await post<any>('/api/v1/zzmsm', cleanData);
      console.log('📥 [realAPI] createPalmSketch 响应:', response);

      // 后端可能直接返回新记录ID（数字），或者返回 {resultcode: 200, ...} 格式
      if (typeof response === 'number' || (response && response.resultcode === 200)) {
        console.log('✅ [realAPI] createPalmSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createPalmSketch 失败:', response?.message || response);
        return { success: false, message: response?.message || '创建失败' };
      }
    } catch (error) {
      console.error('❌ [realAPI] createPalmSketch 异常:', error);
      return { success: false, message: error instanceof Error ? error.message : '创建失败' };
    }
  }

  /**
   * 创建洞身素描记录
   */
  async createTunnelSketch(data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📤 [realAPI] createTunnelSketch 原始数据:', data);
      
      // 构建只包含业务数据的请求，不发送 pk/id 字段
      const safeData = {
        // 基础预报字段
        siteId: String(data.siteId || ''),
        dkname: data.dkname || 'DK',
        dkilo: data.dkilo !== undefined ? Math.round(Number(data.dkilo)) : 0,
        ybLength: data.ybLength !== undefined ? Number(data.ybLength) : 0,
        monitordate: data.monitordate ? 
          (data.monitordate.includes?.(' ') ? data.monitordate.replace(' ', 'T') : data.monitordate) 
          : new Date().toISOString(),
        testname: data.testname || '',
        testno: data.testno || '',
        testtel: data.testtel || '',
        monitorname: data.monitorname || '',
        monitorno: data.monitorno || '',
        monitortel: data.monitortel || '',
        supervisorname: data.supervisorname || '',
        supervisorno: data.supervisorno || '',
        supervisortel: data.supervisortel || '',
        conclusionyb: data.conclusionyb || '',
        suggestion: data.suggestion || '',
        solution: data.solution || '',
        remark: data.remark || '',
        method: 8, // 洞身素描
        flag: data.flag !== undefined ? Number(data.flag) : 0,
        submitFlag: data.submitFlag !== undefined ? Number(data.submitFlag) : 0,
        // 洞身素描特有字段
        beginkilo: data.beginkilo !== undefined ? Math.round(Number(data.beginkilo)) : 0,
        dssmLength: data.dssmLength !== undefined ? Number(data.dssmLength) : 0,
        sjwydj: data.sjwydj !== undefined ? Number(data.sjwydj) : 0,
        sgwydj: data.sgwydj !== undefined ? Number(data.sgwydj) : 0,
        sjdzms: data.sjdzms || '',
        sgdztz: data.sgdztz || '',
        sggztz: data.sggztz || '',
        shswtz: data.shswtz || '',
        // 分段信息列表（只发送业务数据）
        ybjgDTOList: (data.ybjgDTOList || []).map((item: any) => ({
          dkname: item.dkname || 'DK',
          sdkilo: item.sdkilo !== undefined ? Math.round(Number(item.sdkilo)) : 0,
          edkilo: item.edkilo !== undefined ? Math.round(Number(item.edkilo)) : 0,
          ybjgTime: item.ybjgTime,
          risklevel: item.risklevel || '',
          grade: item.grade !== undefined ? Number(item.grade) : 0,
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        })),
      };
      
      console.log('📤 [realAPI] createTunnelSketch 清理后数据:', safeData);
      const response = await post<any>('/api/v1/dssm', safeData);
      console.log('📥 [realAPI] createTunnelSketch 响应:', response);

      // 后端可能直接返回新记录ID（数字），或者返回 {resultcode: 200, ...} 格式
      if (typeof response === 'number' || (response && response.resultcode === 200)) {
        console.log('✅ [realAPI] createTunnelSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createTunnelSketch 失败:', response?.message || response);
        return { success: false, message: response?.message || '创建失败' };
      }
    } catch (error) {
      console.error('❌ [realAPI] createTunnelSketch 异常:', error);
      return { success: false, message: error instanceof Error ? error.message : '创建失败' };
    }
  }

  /**
   * 创建钻探法记录
   */
  async createDrilling(data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📤 [realAPI] createDrilling 请求数据:', data);
      // 根据method判断是超前水平钻(13)还是加深炮孔(14)
      const method = data.method;
      let apiPath = '/api/v1/ztf';
      if (method === 13) {
        apiPath = '/api/v1/ztf/cqspz';
      } else if (method === 14) {
        apiPath = '/api/v1/ztf/jspk';
      }

      // 构建钻孔列表（超前水平钻）- 只发送业务数据
      const cqspzZkzzDTOList = (data.cqspzZkzzDTOList || data.zkList || []).map((item: any) => {
        // 构建钻孔记录列表
        const ztjlbList = (item.cqspzZkzzZtjlbDTOList || item.cqspzZkzzZtjlbVOList || []).map((record: any) => ({
          kssj: record.kssj ? (record.kssj.includes?.(' ') ? record.kssj.replace(' ', 'T') : record.kssj) : undefined,
          jssj: record.jssj ? (record.jssj.includes?.(' ') ? record.jssj.replace(' ', 'T') : record.jssj) : undefined,
          zksd: record.zksd !== undefined ? Number(record.zksd) : 0,
          zkpressure: record.zkpressure !== undefined ? Number(record.zkpressure) : 0,
          zkspeed: record.zkspeed !== undefined ? Number(record.zkspeed) : 0,
          kwwaterpre: record.kwwaterpre !== undefined ? Number(record.kwwaterpre) : 0,
          kwwaterspe: record.kwwaterspe !== undefined ? Number(record.kwwaterspe) : 0,
          dzms: record.dzms || '',
          kwzbxl: record.kwzbxl || '',
        }));

        // 构建地层信息列表 - 数值字段保留2位小数
        const dcxxList = (item.cqspzZkzzDcxxDTOList || item.cqspzZkzzDcxxVOList || []).map((info: any) => ({
          dcdh: info.dcdh !== undefined && info.dcdh !== null ? Number(info.dcdh) : null,
          dclc: info.dclc !== undefined ? parseFloat(Number(info.dclc).toFixed(2)) : 0.00,
          fchd: info.fchd !== undefined ? parseFloat(Number(info.fchd).toFixed(2)) : 0.00,
          cslcz: info.cslcz !== undefined ? parseFloat(Number(info.cslcz).toFixed(2)) : 0.00,
          csl: info.csl !== undefined ? parseFloat(Number(info.csl).toFixed(2)) : 0.00,
          cywz: info.cywz || '',
          gcdzjj: info.gcdzjj || '',
        }));

        return {
          kwbh: item.kwbh || '',
          jgdjl: item.jgdjl !== undefined ? Number(item.jgdjl) : 0,
          jzxxjl: item.jzxxjl !== undefined ? Number(item.jzxxjl) : 0,
          kwljangle: item.kwljangle !== undefined ? Number(item.kwljangle) : 0,
          kwpjangle: item.kwpjangle !== undefined ? Number(item.kwpjangle) : 0,
          zkzj: item.zkzj !== undefined ? Number(item.zkzj) : 0,
          zjcode: item.zjcode || '',
          kssj: item.kssj ? (item.kssj.includes?.(' ') ? item.kssj.replace(' ', 'T') : item.kssj) : undefined,
          jssj: item.jssj ? (item.jssj.includes?.(' ') ? item.jssj.replace(' ', 'T') : item.jssj) : undefined,
          // kkwzsyt 和 qxpic 是图片字段，需通过单独接口上传
          sfqx: item.sfqx !== undefined ? Number(item.sfqx) : 0,
          remark: item.remark || '',
          cqspzZkzzZtjlbDTOList: ztjlbList,
          cqspzZkzzDcxxDTOList: dcxxList,
        };
      });

      // 构建提交数据 - 只发送业务数据（不含 pk/id 和图片字段）
      const submitData = {
        // 基础预报字段
        siteId: String(data.siteId || ''),
        dkname: data.dkname || 'DK',
        dkilo: data.dkilo !== undefined ? Math.round(Number(data.dkilo)) : 0,
        ybLength: data.ybLength !== undefined ? Number(data.ybLength) : 0,
        monitordate: data.monitordate
          ? data.monitordate.includes?.(' ')
            ? data.monitordate.replace(' ', 'T')
            : data.monitordate
          : new Date().toISOString(),
        testname: data.testname || '',
        testno: data.testno || '',
        testtel: data.testtel || '',
        monitorname: data.monitorname || '',
        monitorno: data.monitorno || '',
        monitortel: data.monitortel || '',
        supervisorname: data.supervisorname || '',
        supervisorno: data.supervisorno || '',
        supervisortel: data.supervisortel || '',
        conclusionyb: data.conclusionyb || '',
        suggestion: data.suggestion || '',
        solution: data.solution || '',
        remark: data.remark || '',
        method: method,
        flag: data.flag !== undefined ? Number(data.flag) : 0,
        submitFlag: data.submitFlag !== undefined ? Number(data.submitFlag) : 0,
        // 超前水平钻特有字段（不含图片字段，图片需通过单独接口上传）
        kwtype: data.kwtype !== undefined ? Number(data.kwtype) : 1,
        // 分段信息列表
        // dzjb 转 grade 的映射：green=0(绿色), yellow=2(黄色), red=1(红色)
        ybjgDTOList: (data.ybjgDTOList || []).map((item: any) => {
          const dzjbToGradeMap: Record<string, number> = { 'green': 0, 'yellow': 2, 'red': 1 };
          const gradeValue = item.grade !== undefined ? Number(item.grade) : (item.dzjb ? dzjbToGradeMap[item.dzjb] ?? 0 : 0);
          // 处理里程合并：sdkilo + sdkiloEnd, edkilo + edkiloEnd
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          // 处理时间格式：空格转T，格式为 "2025-12-13T22:12:34"
          const ybjgTimeFormatted = item.ybjgTime ? String(item.ybjgTime).replace(' ', 'T') : undefined;
          return {
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: ybjgTimeFormatted,
            risklevel: item.risklevel || '',
            grade: gradeValue,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        }),
        // 钻孔列表
        cqspzZkzzDTOList: method === 13 ? cqspzZkzzDTOList : undefined,
      };

      console.log('📤 [realAPI] createDrilling 清理后数据:', submitData);
      const response = await post<any>(apiPath, submitData);
      console.log('📥 [realAPI] createDrilling 响应:', response);

      // 后端可能直接返回新记录ID（数字），或者返回 {resultcode: 200, ...} 格式
      if (typeof response === 'number' || (response && response.resultcode === 200)) {
        console.log('✅ [realAPI] createDrilling 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createDrilling 失败:', response?.message || response);
        return { success: false, message: response?.message || '创建失败' };
      }
    } catch (error) {
      console.error('❌ [realAPI] createDrilling 异常:', error);
      return { success: false, message: error instanceof Error ? error.message : '创建失败' };
    }
  }

  /**
   * 创建地表补充记录
   */
  async createSurfaceSupplement(data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📤 [realAPI] createSurfaceSupplement 原始数据:', data);
      
      // dzjb 转 grade 的映射：green=0(绿色), yellow=2(黄色), red=1(红色)
      const dzjbToGrade = (dzjb: string): number => {
        const map: Record<string, number> = { 'green': 0, 'yellow': 2, 'red': 1 };
        return map[dzjb] ?? 0;
      };
      
      // 处理里程值
      let dkilo = data.dkilo;
      if (data.dkiloKm !== undefined || data.dkiloM !== undefined) {
        dkilo = (Number(data.dkiloKm) || 0) * 1000 + (Number(data.dkiloM) || 0);
      }
      
      // 处理起始里程
      let beginkilo = data.beginkilo;
      if (data.beginkiloStart !== undefined || data.beginkiloEnd !== undefined) {
        beginkilo = (Number(data.beginkiloStart) || 0) * 1000 + (Number(data.beginkiloEnd) || 0);
      }
      
      // 构建 ybjgDTOList - 新增时不发送pk/id字段
      const ybjgDTOList = (data.ybjgDTOList || []).map((item: any) => {
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        const gradeValue = item.grade !== undefined ? Number(item.grade) : (item.dzjb ? dzjbToGrade(item.dzjb) : 0);
        return {
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? (String(item.ybjgTime).includes(' ') ? String(item.ybjgTime).replace(' ', 'T') : item.ybjgTime) : undefined,
          risklevel: item.risklevel || '',
          grade: gradeValue,
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
      });
      
      // 构建提交数据 - 新增时不发送pk/id字段
      // 生成 createdate - 如果没有则使用当前时间，格式：YYYY-MM-DDTHH:mm:ss
      let createdate = data.createdate;
      if (!createdate) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        createdate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      } else if (String(createdate).includes(' ')) {
        createdate = String(createdate).replace(' ', 'T');
      }
      
      const submitData = {
        siteId: String(data.siteId || ''),
        dkname: data.dkname || 'DK',
        dkilo: dkilo !== undefined ? Math.round(Number(dkilo)) : 0,
        ybLength: data.ybLength !== undefined ? Number(data.ybLength) : 0,
        monitordate: data.monitordate ? (String(data.monitordate).includes(' ') ? String(data.monitordate).replace(' ', 'T') : data.monitordate) : undefined,
        createdate: createdate,
        testname: data.testname || '',
        testno: data.testno || '',
        testtel: data.testtel || '',
        monitorname: data.monitorname || '',
        monitorno: data.monitorno || '',
        monitortel: data.monitortel || '',
        supervisorname: data.supervisorname || '',
        supervisorno: data.supervisorno || '',
        supervisortel: data.supervisortel || '',
        conclusionyb: data.conclusionyb || '',
        suggestion: data.suggestion || '',
        solution: data.solution || '',
        remark: data.remark || '',
        method: 12, // 地表补充的method为12
        flag: data.flag !== undefined ? Number(data.flag) : 0,
        submitFlag: data.submitFlag !== undefined ? Number(data.submitFlag) : 0,
        // 地表补充特有字段
        beginkilo: beginkilo !== undefined ? Number(beginkilo) : undefined,
        dbbcLength: data.dbbcLength !== undefined ? Number(data.dbbcLength) : 0,
        sjwydj: data.sjwydj !== undefined ? Number(data.sjwydj) : 0,
        sjqk: data.sjqk !== undefined ? Number(data.sjqk) : 0,
        dcyx: data.dcyx || '',
        dbry: data.dbry || '',
        tsdz: data.tsdz || '',
        rwdk: data.rwdk || '',
        dzpj: data.dzpj || '',
        ybjgDTOList: ybjgDTOList,
      };
      
      console.log('📤 [realAPI] createSurfaceSupplement 清理后数据:', submitData);
      const response = await post<any>('/api/v1/dbbc', submitData);
      console.log('📥 [realAPI] createSurfaceSupplement 响应:', response);

      // 后端可能直接返回新记录ID（数字），或者返回 {resultcode: 200, ...} 格式
      if (typeof response === 'number' || (response && (response.resultcode === 200 || response.resultcode === 0))) {
        console.log('✅ [realAPI] createSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] createSurfaceSupplement 失败:', response?.message || response);
        return { success: false, message: response?.message || '创建失败' };
      }
    } catch (error) {
      console.error('❌ [realAPI] createSurfaceSupplement 异常:', error);
      return { success: false, message: error instanceof Error ? error.message : '创建失败' };
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
      // 先打印原始 data 中的列表
      console.log('🔍 [realAPI] 原始 data.ybjgDTOList:', (data as any).ybjgDTOList);
      console.log('🔍 [realAPI] 原始 data.ybjgDTOList 长度:', (data as any).ybjgDTOList?.length);
      
      const cleanData: any = { ...data };
      
      console.log('🔍 [realAPI] 浅拷贝后 cleanData.ybjgDTOList:', cleanData.ybjgDTOList);
      console.log('🔍 [realAPI] 浅拷贝后 cleanData.ybjgDTOList 长度:', cleanData.ybjgDTOList?.length);

      // 将VO字段转换为DTO字段
      // 注意：只有当 DTOList 不存在或为空时，才用 VOList 覆盖
      if (cleanData.ybjgVOList && cleanData.ybjgVOList.length > 0 && (!cleanData.ybjgDTOList || cleanData.ybjgDTOList.length === 0)) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
      }
      delete cleanData.ybjgVOList;
      
      if (cleanData.tspBxdataVOList && cleanData.tspBxdataVOList.length > 0 && (!cleanData.tspBxdataDTOList || cleanData.tspBxdataDTOList.length === 0)) {
        cleanData.tspBxdataDTOList = cleanData.tspBxdataVOList;
      }
      delete cleanData.tspBxdataVOList;
      
      if (cleanData.tspPddataVOList && cleanData.tspPddataVOList.length > 0 && (!cleanData.tspPddataDTOList || cleanData.tspPddataDTOList.length === 0)) {
        cleanData.tspPddataDTOList = cleanData.tspPddataVOList;
      }
        delete cleanData.tspPddataVOList;

      // LDSN测点列表：只有当 DTOList 不存在或为空时，才用 VOList 覆盖
      if (cleanData.ldsnResultinfoVOList && cleanData.ldsnResultinfoVOList.length > 0 && (!cleanData.ldsnResultinfoDTOList || cleanData.ldsnResultinfoDTOList.length === 0)) {
        cleanData.ldsnResultinfoDTOList = cleanData.ldsnResultinfoVOList;
      }
      delete cleanData.ldsnResultinfoVOList;

      // DCBFS测线布置列表：只有当 DTOList 不存在或为空时，才用 VOList 覆盖
      if (cleanData.dcbfsResultinfoVOList && cleanData.dcbfsResultinfoVOList.length > 0 && (!cleanData.dcbfsResultinfoDTOList || cleanData.dcbfsResultinfoDTOList.length === 0)) {
        cleanData.dcbfsResultinfoDTOList = cleanData.dcbfsResultinfoVOList;
      }
      delete cleanData.dcbfsResultinfoVOList;

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
        tspBxdataDTOList: cleanData.tspBxdataDTOList || cleanData.tspBxdataVOList || [],
        ldsnResultinfoDTOList: cleanData.ldsnResultinfoDTOList || cleanData.ldsnResultinfoVOList || [],
        dcbfsResultinfoDTOList: cleanData.dcbfsResultinfoDTOList || cleanData.dcbfsResultinfoVOList || [],
        gfbzldResultinfoDTOList: cleanData.gfbzldResultinfoDTOList || cleanData.gfbzldResultinfoVOList || [],
      };

      console.log('📋 [realAPI] 保存的列表数据:', {
        ybjgDTOList: savedLists.ybjgDTOList.length,
        tspPddataDTOList: savedLists.tspPddataDTOList.length,
        tspBxdataDTOList: savedLists.tspBxdataDTOList.length,
        ldsnResultinfoDTOList: savedLists.ldsnResultinfoDTOList.length,
        dcbfsResultinfoDTOList: savedLists.dcbfsResultinfoDTOList.length,
        gfbzldResultinfoDTOList: savedLists.gfbzldResultinfoDTOList.length,
      });

      // 移除子列表字段（避免重复）
      delete cleanData.ybjgVOList;
      delete cleanData.tspBxdataVOList;
      delete cleanData.tspPddataVOList;
      delete cleanData.ybjgDTOList;
      delete cleanData.tspBxdataDTOList;
      delete cleanData.tspPddataDTOList;
      delete cleanData.ldsnResultinfoDTOList;
      delete cleanData.ldsnResultinfoVOList;
      delete cleanData.dcbfsResultinfoDTOList;
      delete cleanData.dcbfsResultinfoVOList;
      delete cleanData.dcbfsResultpicDTOList;
      delete cleanData.dcbfsResultpicVOList;
      delete cleanData.gfbzldResultinfoDTOList;
      delete cleanData.gfbzldResultinfoVOList;

      // 所有图片字段都需要通过单独的文件上传接口处理，不在 PUT 接口中传递
      delete cleanData.pic1;
      delete cleanData.pic2;
      delete cleanData.pic3;
      delete cleanData.pic4;
      delete cleanData.pic5;
      delete cleanData.pic6;
      delete cleanData.gcxtpic;
      delete cleanData.originalfile;

      // 根据不同的 method 构建不同的数据结构
      const methodNum = Number(cleanData.method);
      let safeData: any;

      if (methodNum === 2) {
        // HSP (水平声波剖面) - 参考掌子面素描，直接发送数据
        // 只做必要的 VO -> DTO 转换和时间戳清理
        console.log('🔍 [realAPI] HSP 更新 - savedLists.ybjgDTOList:', savedLists.ybjgDTOList);
        console.log('🔍 [realAPI] HSP 更新 - ybjgDTOList 长度:', savedLists.ybjgDTOList?.length);
        
        // 清理 ybjgDTOList 中的非 API 字段，确保符合 YbjgDTO 结构
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          // 合并里程值：sdkilo + sdkiloEnd => sdkilo (如 3 + 5 => 3005 或 3.005)
          // 根据掌子面里程的格式，应该是 km * 1000 + m
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          
          return {
            ybjgPk: item.ybjgPk,
            ybjgId: item.ybjgId,
            ybPk: item.ybPk,
            dkname: item.dkname || '',
            sdkilo: finalSdkilo !== undefined ? Number(finalSdkilo) : undefined,
            edkilo: finalEdkilo !== undefined ? Number(finalEdkilo) : undefined,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : undefined,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : undefined,
            jlresult: item.jlresult || '',
          };
        });
        
        safeData = {
          ...cleanData,
          // 确保必填字段有值，dkilo取整
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybjgDTOList: cleanedYbjgList,
        };
        // 确保 monitordate 格式正确
        if (safeData.monitordate && safeData.monitordate.includes(' ')) {
          safeData.monitordate = safeData.monitordate.replace(' ', 'T');
        }
        console.log('🔍 [realAPI] HSP 更新 - safeData.ybjgDTOList:', safeData.ybjgDTOList);
      } else if (methodNum === 3) {
        // LDSN (陆地声纳) - 严格按照API文档构建数据
        console.log('🔍 [realAPI] LDSN 更新 - cleanData:', cleanData);
        console.log('🔍 [realAPI] LDSN 更新 - savedLists:', savedLists);
        
        // 构建 ybjgDTOList - 确保包含所有必要字段
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          return {
            // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
            ybjgPk: item.ybjgPk || null,
            ybjgId: item.ybjgId || null,
            ybPk: item.ybPk || cleanData.ybPk || null,
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : 0,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        });

        // 构建 ldsnResultinfoDTOList - 确保包含所有必要字段
        const ldsnResultinfoDTOList = (savedLists.ldsnResultinfoDTOList || []).map((item: any) => ({
          ldsnResultinfoPk: item.ldsnResultinfoPk || null,
          ldsnResultinfoId: item.ldsnResultinfoId || null,
          ldsnPk: item.ldsnPk || cleanData.ldsnPk || 0,
          cdxh: item.cdxh !== undefined ? Number(item.cdxh) : 1,
          jgdjl: item.jgdjl !== undefined ? Number(item.jgdjl) : 0,
          jzxjl: item.jzxjl !== undefined ? Number(item.jzxjl) : 0,
        }));

        // 严格按照LdsnDTO文档构建数据
        // 注意：ldsnId/ldsnPk 如果为0则不传，让后端自己处理
        const ldsnPkVal = Number(cleanData.ldsnPk) || 0;
        const ldsnIdVal = Number(cleanData.ldsnId) || 0;
        console.log('🔍 [realAPI] LDSN ID计算 - cleanData.ldsnPk:', cleanData.ldsnPk, 'cleanData.ldsnId:', cleanData.ldsnId);
        console.log('🔍 [realAPI] LDSN ID计算结果 - ldsnPkVal:', ldsnPkVal, 'ldsnIdVal:', ldsnIdVal);
        
        safeData = {
          ybPk: Number(cleanData.ybPk) || 0,
          ybId: Number(cleanData.ybId) || 0,
          siteId: String(cleanData.siteId || ''),
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
          monitordate: cleanData.monitordate ? 
            (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
            : undefined,
        testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
        monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
        supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          method: 3,
          flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
          submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          ybjgDTOList: cleanedYbjgList,
          // LDSN 特有字段 - 只有非0时才传
          ...(ldsnPkVal ? { ldsnPk: ldsnPkVal } : {}),
          ...(ldsnIdVal ? { ldsnId: ldsnIdVal } : {}),
          cxnum: cleanData.cxnum !== undefined ? Number(cleanData.cxnum) : 0,
          sbName: cleanData.sbName || '',
          ldsnResultinfoDTOList: ldsnResultinfoDTOList,
        };
        console.log('🔍 [realAPI] LDSN 更新 - ldsnPk:', ldsnPkVal, 'ldsnId:', ldsnIdVal, '(0则不传)');
        console.log('🔍 [realAPI] LDSN 更新 - safeData:', safeData);
      } else if (methodNum === 4) {
        // DCBFS (电磁波反射) - 严格按照API文档构建数据
        console.log('🔍 [realAPI] DCBFS 更新 - cleanData:', cleanData);
        console.log('🔍 [realAPI] DCBFS 更新 - savedLists:', savedLists);
        
        // 构建 ybjgDTOList - 确保包含所有必要字段
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          const pk = item.ybjgPk || Math.floor(Math.random() * 100000000);
          // 调试：检查 ybjgId 的值和类型
          console.log('🔍 [DCBFS ybjgDTOList] item.ybjgId:', item.ybjgId, 'type:', typeof item.ybjgId, 'pk:', pk);
          // 修复：使用更严格的检查，确保 0、undefined、null 都会被替换
          const finalYbjgId = (item.ybjgId !== undefined && item.ybjgId !== null && item.ybjgId !== 0) ? item.ybjgId : pk;
          console.log('🔍 [DCBFS ybjgDTOList] finalYbjgId:', finalYbjgId);
          return {
            ybjgPk: pk,
            ybjgId: finalYbjgId,
            ybPk: item.ybPk || cleanData.ybPk || 0,
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : 0,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        });

        // 构建 dcbfsResultinfoDTOList - 确保包含所有必要字段
        const dcbfsResultinfoDTOList = (savedLists.dcbfsResultinfoDTOList || []).map((item: any) => {
          const pk = item.dcbfsResultinfoPk || Math.floor(Math.random() * 100000000);
          return {
            dcbfsResultinfoPk: pk,
            dcbfsResultinfoId: item.dcbfsResultinfoId || pk, // 如果Id缺失，使用Pk
            dcbfsPk: item.dcbfsPk || cleanData.dcbfsPk || 0,
            cxxh: item.cxxh !== undefined ? Number(item.cxxh) : 1,
            qdzbx: item.qdzbx !== undefined ? Number(item.qdzbx) : 0,
            qdzby: item.qdzby !== undefined ? Number(item.qdzby) : 0,
            zdzbx: item.zdzbx !== undefined ? Number(item.zdzbx) : 0,
            zdzby: item.zdzby !== undefined ? Number(item.zdzby) : 0,
          };
        });

        // 严格按照DcbfsDTO文档构建数据
        // 注意：dcbfsId/dcbfsPk 如果为0则不传，让后端自己处理
        const dcbfsPkVal = Number(cleanData.dcbfsPk) || 0;
        const dcbfsIdVal = Number(cleanData.dcbfsId) || 0;
        
        safeData = {
          ybPk: Number(cleanData.ybPk) || 0,
          ybId: Number(cleanData.ybId) || 0,
          siteId: String(cleanData.siteId || ''),
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
          monitordate: cleanData.monitordate ? 
            (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
            : undefined,
          testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
          monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
          supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
          conclusionyb: cleanData.conclusionyb || '',
          suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          method: 4,
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          ybjgDTOList: cleanedYbjgList,
          // DCBFS 特有字段 - 只有非0时才传
          ...(dcbfsPkVal ? { dcbfsPk: dcbfsPkVal } : {}),
          ...(dcbfsIdVal ? { dcbfsId: dcbfsIdVal } : {}),
          cxnum: cleanData.cxnum !== undefined ? Number(cleanData.cxnum) : 0,
          sbName: cleanData.sbName || '',
          gzpl: cleanData.gzpl !== undefined ? Number(cleanData.gzpl) : 0,
          dcbfsResultinfoDTOList: dcbfsResultinfoDTOList,
        };
        console.log('🔍 [realAPI] DCBFS 更新 - dcbfsPk:', dcbfsPkVal, 'dcbfsId:', dcbfsIdVal, '(0则不传)');
        console.log('🔍 [realAPI] DCBFS 更新 - safeData:', safeData);
      } else if (methodNum === 5) {
        // GFBZLD (高分辨直流电) - 严格按照API文档构建数据
        console.log('🔍 [realAPI] GFBZLD 更新 - cleanData:', cleanData);
        console.log('🔍 [realAPI] GFBZLD 更新 - savedLists.gfbzldResultinfoDTOList:', savedLists.gfbzldResultinfoDTOList);
        
        // 构建 ybjgDTOList
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          return {
            // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
            ybjgPk: item.ybjgPk || null,
            ybjgId: item.ybjgId || item.ybjgPk || null,
            ybPk: item.ybPk || cleanData.ybPk || null,
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : 0,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        });

        // 构建 gfbzldResultinfoDTOList - 电极距掌子面距离列表
        const gfbzldResultinfoDTOList = (savedLists.gfbzldResultinfoDTOList || []).map((item: any) => ({
          gfbzldResultinfoPk: item.gfbzldResultinfoPk || null,
          gfbzldResultinfoId: item.gfbzldResultinfoId || null,
          gfbzldPk: item.gfbzldPk || cleanData.gfbzldPk || null,
          djxh: item.djxh || '',
          gfbzldResultinfoType: item.gfbzldResultinfoType !== undefined ? Number(item.gfbzldResultinfoType) : 1,
          jzzmjl: item.jzzmjl !== undefined ? Number(item.jzzmjl) : 0,
        }));

        // gfbzldPk/gfbzldId 如果为0则不传，让后端自己处理
        const gfbzldPkVal = Number(cleanData.gfbzldPk) || 0;
        const gfbzldIdVal = Number(cleanData.gfbzldId) || 0;

        safeData = {
          ybPk: Number(cleanData.ybPk) || 0,
          ybId: Number(cleanData.ybId) || 0,
          siteId: String(cleanData.siteId || ''),
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
          monitordate: cleanData.monitordate ? 
            (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
            : undefined,
          testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
          monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
          supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
          conclusionyb: cleanData.conclusionyb || '',
          suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          method: 5,
          flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
          submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          ybjgDTOList: cleanedYbjgList,
          // GFBZLD 特有字段 - 只有非0时才传
          ...(gfbzldPkVal ? { gfbzldPk: gfbzldPkVal } : {}),
          ...(gfbzldIdVal ? { gfbzldId: gfbzldIdVal } : {}),
          gddjnum: cleanData.gddjnum !== undefined ? Number(cleanData.gddjnum) : 0,
          cldjnum: cleanData.cldjnum !== undefined ? Number(cleanData.cldjnum) : 0,
          sbName: cleanData.sbName || '',
          gddy: cleanData.gddy !== undefined ? Number(cleanData.gddy) : 0,
          gddl: cleanData.gddl !== undefined ? Number(cleanData.gddl) : 0,
          gfbzldResultinfoDTOList: gfbzldResultinfoDTOList, // 电极距掌子面距离列表
        };
        console.log('🔍 [realAPI] GFBZLD 更新 - gfbzldPk:', gfbzldPkVal, 'gfbzldId:', gfbzldIdVal, '(0则不传)');
        console.log('🔍 [realAPI] GFBZLD 更新 - gfbzldResultinfoDTOList:', gfbzldResultinfoDTOList);
        console.log('🔍 [realAPI] GFBZLD 更新 - safeData:', safeData);
      } else if (methodNum === 6) {
        // SBDC (瞬变电磁) - 严格按照API文档构建数据
        console.log('🔍 [realAPI] SBDC 更新 - cleanData:', cleanData);
        console.log('🔍 [realAPI] SBDC 更新 - savedLists.ybjgDTOList:', savedLists.ybjgDTOList);
        console.log('🔍 [realAPI] SBDC 更新 - savedLists.ybjgDTOList 长度:', savedLists.ybjgDTOList?.length);
        
        // 构建 ybjgDTOList
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          return {
            // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
            ybjgPk: item.ybjgPk || null,
            ybjgId: item.ybjgId || item.ybjgPk || null,
            ybPk: item.ybPk || cleanData.ybPk || null,
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : 0,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        });

        // sbdcPk/sbdcId 如果为0则不传，让后端自己处理
        const sbdcPkVal = Number(cleanData.sbdcPk) || 0;
        const sbdcIdVal = Number(cleanData.sbdcId) || 0;

        safeData = {
          ybPk: Number(cleanData.ybPk) || 0,
          ybId: Number(cleanData.ybId) || 0,
          siteId: String(cleanData.siteId || ''),
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
        monitordate: cleanData.monitordate ?
          (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate)
          : undefined,
          testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
          monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
          supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
          conclusionyb: cleanData.conclusionyb || '',
          suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          method: 6,
          flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
          submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          ybjgDTOList: cleanedYbjgList,
          // SBDC 特有字段 - 只有非0时才传
          ...(sbdcPkVal ? { sbdcPk: sbdcPkVal } : {}),
          ...(sbdcIdVal ? { sbdcId: sbdcIdVal } : {}),
          sbdcType: cleanData.sbdcType !== undefined ? Number(cleanData.sbdcType) : 1,
          fskwzlc: cleanData.fskwzlc !== undefined ? Number(cleanData.fskwzlc) : 0,
          fskc: cleanData.fskc !== undefined ? Number(cleanData.fskc) : 0,
          fskk: cleanData.fskk !== undefined ? Number(cleanData.fskk) : 0,
          jfxqzs: cleanData.jfxqzs !== undefined ? Number(cleanData.jfxqzs) : 0,
          jskc: cleanData.jskc !== undefined ? Number(cleanData.jskc) : 0,
          jskk: cleanData.jskk !== undefined ? Number(cleanData.jskk) : 0,
          jskzs: cleanData.jskzs !== undefined ? Number(cleanData.jskzs) : 0,
          jsxqdxmj: cleanData.jsxqdxmj !== undefined ? Number(cleanData.jsxqdxmj) : 0,
          sf: cleanData.sf !== undefined ? Number(cleanData.sf) : 0,
          sbName: cleanData.sbName || '',
          fspl: cleanData.fspl !== undefined ? Number(cleanData.fspl) : 0,
          gddl: cleanData.gddl !== undefined ? Number(cleanData.gddl) : 0,
          clsj: cleanData.clsj !== undefined ? Number(cleanData.clsj) : 0,
          mqfw: cleanData.mqfw !== undefined ? Number(cleanData.mqfw) : 0,
          cxbzms: cleanData.cxbzms || '',
        };
        console.log('🔍 [realAPI] SBDC 更新 - sbdcPk:', sbdcPkVal, 'sbdcId:', sbdcIdVal, '(0则不传)');
        console.log('🔍 [realAPI] SBDC 更新 - cleanedYbjgList:', cleanedYbjgList);
        console.log('🔍 [realAPI] SBDC 更新 - cleanedYbjgList 长度:', cleanedYbjgList?.length);
        console.log('🔍 [realAPI] SBDC 更新 - safeData:', safeData);
        console.log('🔍 [realAPI] SBDC 更新 - safeData.ybjgDTOList 长度:', safeData.ybjgDTOList?.length);
      } else if (methodNum === 7) {
        // WZJC (微震监测预报) - 严格按照API文档构建数据
        console.log('🔍 [realAPI] WZJC 更新 - cleanData:', cleanData);
        
        // 构建 ybjgDTOList
        const cleanedYbjgList = (savedLists.ybjgDTOList || []).map((item: any) => {
          let finalSdkilo = item.sdkilo;
          if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
            finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
          }
          let finalEdkilo = item.edkilo;
          if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
            finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
          }
          return {
            // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
            ybjgPk: item.ybjgPk || null,
            ybjgId: item.ybjgId || item.ybjgPk || null,
            ybPk: item.ybPk || cleanData.ybPk || null,
            dkname: item.dkname || 'DK',
            sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
            edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
            ybjgTime: item.ybjgTime ? (item.ybjgTime.includes(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
            risklevel: item.risklevel || '',
            grade: item.grade !== undefined ? Number(item.grade) : 0,
            wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
            jlresult: item.jlresult || '',
          };
        });

        safeData = {
          ybPk: Number(cleanData.ybPk) || 0,
          ybId: Number(cleanData.ybId) || 0,
          siteId: String(cleanData.siteId || ''),
          dkname: cleanData.dkname || 'DK',
          dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
          monitordate: cleanData.monitordate ? 
            (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
            : undefined,
          testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
          monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
          supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
          conclusionyb: cleanData.conclusionyb || '',
          suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          method: 7,
          flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
          submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          ybjgDTOList: cleanedYbjgList,
          // WZJC 特有字段
          jcxx: cleanData.jcxx || '',
          sbxx: cleanData.sbxx || '',
          cgxx: cleanData.cgxx || '',
          cgsjxx: cleanData.cgsjxx || '',
        };
        console.log('🔍 [realAPI] WZJC 更新 - safeData:', safeData);
      } else {
        // TSP 和其他物探法
        safeData = {
          ybPk: Number(cleanData.ybPk),
          ybId: cleanData.ybId ? Number(cleanData.ybId) : undefined,
          siteId: String(cleanData.siteId),
          method: methodNum,
          dkname: cleanData.dkname || '',
          dkilo: cleanData.dkilo !== undefined ? Number(cleanData.dkilo) : 0,
          ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
          testname: cleanData.testname || '',
          testno: cleanData.testno || '',
          testtel: cleanData.testtel || '',
          monitorname: cleanData.monitorname || '',
          monitorno: cleanData.monitorno || '',
          monitortel: cleanData.monitortel || '',
          supervisorname: cleanData.supervisorname || '',
          supervisorno: cleanData.supervisorno || '',
          supervisortel: cleanData.supervisortel || '',
          conclusionyb: cleanData.conclusionyb || '',
          suggestion: cleanData.suggestion || '',
          solution: cleanData.solution || '',
          remark: cleanData.remark || '',
          xcybff: cleanData.xcybff,
          xcybkslc: cleanData.xcybkslc || '',
          flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
          submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
          // TSP 特有字段
          tspPk: cleanData.tspPk ? Number(cleanData.tspPk) : undefined,
          tspId: cleanData.tspId || '',
          jfpknum: cleanData.jfpknum,
          jfpksd: cleanData.jfpksd,
          jfpkzj: cleanData.jfpkzj,
          jfpkjdmgd: cleanData.jfpkjdmgd,
          jfpkjj: cleanData.jfpkjj,
          jspknum: cleanData.jspknum,
          jspksd: cleanData.jspksd,
          jspkzj: cleanData.jspkzj,
          jspkjdmgd: cleanData.jspkjdmgd,
          sbName: cleanData.sbName || '',
          kwwz: cleanData.kwwz,
          leftkilo: cleanData.leftkilo,
          rightkilo: cleanData.rightkilo,
          leftjgdczjl: cleanData.leftjgdczjl,
          rightjgdczjl: cleanData.rightjgdczjl,
          leftzxjl: cleanData.leftzxjl,
          rightzxjl: cleanData.rightzxjl,
          leftjdmgd: cleanData.leftjdmgd,
          rightjdmgd: cleanData.rightjdmgd,
          leftks: cleanData.leftks,
          rightks: cleanData.rightks,
          leftqj: cleanData.leftqj,
          rightqj: cleanData.rightqj,
          monitordate: cleanData.monitordate ?
            (cleanData.monitordate.includes(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate)
            : undefined,
        ybjgDTOList: savedLists.ybjgDTOList,
        tspPddataDTOList: savedLists.tspPddataDTOList,
        tspBxdataDTOList: savedLists.tspBxdataDTOList,
      };
      }

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
   * @param id 记录ID (ybPk)
   * @param method 物探方法代码 (1:TSP, 2:HSP, 3:LDSN, 4:DCBFS, 5:GFBZLD, 6:SBDC, 9:WZJC)
   */
  async deleteGeophysicalMethod(id: string, method?: number): Promise<{ success: boolean }> {
    try {
      // 根据method确定API路径
      let apiPath = '';
      switch (method) {
        case 1:
          apiPath = `/api/v1/wtf/tsp/${id}`;
          break;
        case 2:
          apiPath = `/api/v1/wtf/hsp/${id}`;
          break;
        case 3:
          apiPath = `/api/v1/wtf/ldsn/${id}`;
          break;
        case 4:
          apiPath = `/api/v1/wtf/dcbfs/${id}`;
          break;
        case 5:
          apiPath = `/api/v1/wtf/gfbzld/${id}`;
          break;
        case 6:
          apiPath = `/api/v1/wtf/sbdc/${id}`;
          break;
        case 9:
          apiPath = `/api/v1/wtf/wzjc/${id}`;
          break;
        default:
          // 默认使用tsp路径
          apiPath = `/api/v1/wtf/tsp/${id}`;
          console.warn('⚠️ [realAPI] deleteGeophysicalMethod 未知method:', method, '，使用默认tsp路径');
      }
      
      console.log('🔍 [realAPI] deleteGeophysicalMethod 删除路径:', apiPath, 'method:', method);
      const response = await del<any>(apiPath);

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] deleteGeophysicalMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteGeophysicalMethod 失败:', response?.message || response);
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
      const response = await get<{ ztfIPage: PageResponse<DrillingMethod> }>('/api/v1/ztf/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response?.ztfIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
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
  async updateDrillingMethod(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 [realAPI] updateDrillingMethod 原始数据:', data);
      const method = data.method;
      
      // 根据 method 区分处理
      if (method === 14) {
        // 加深炮孔
        return await this.updateJspk(id, data);
      }
      
      // 超前水平钻 (method === 13) 继续原有逻辑
      console.log('🔍 [realAPI] updateDrillingMethod ID字段:', {
        传入id: id,
        ybPk: data.ybPk,
        cqspzPk: data.cqspzPk,
        cqspzId: data.cqspzId,
        jspkPk: data.jspkPk,
      });
      
      // 清理数据
      const cleanData: any = { ...data };
      
      // 将VO字段转换为DTO字段
      if (cleanData.ybjgVOList && cleanData.ybjgVOList.length > 0 && (!cleanData.ybjgDTOList || cleanData.ybjgDTOList.length === 0)) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
      }
      delete cleanData.ybjgVOList;
      
      // 钻孔列表：VO -> DTO
      if (cleanData.cqspzZkzzVOList && cleanData.cqspzZkzzVOList.length > 0 && (!cleanData.cqspzZkzzDTOList || cleanData.cqspzZkzzDTOList.length === 0)) {
        cleanData.cqspzZkzzDTOList = cleanData.cqspzZkzzVOList;
      }
      delete cleanData.cqspzZkzzVOList;
      
      // 移除时间戳字段
      delete cleanData.gmtCreate;
      delete cleanData.gmtModified;
      delete cleanData.createdate;
      
      // 构建 ybjgDTOList
      // dzjb 转 grade 的映射：green=0(绿色), yellow=2(黄色), red=1(红色)
      const dzjbToGrade = (dzjb: string): number => {
        const map: Record<string, number> = { 'green': 0, 'yellow': 2, 'red': 1 };
        return map[dzjb] ?? 0;
      };
      
      const ybjgDTOList = (cleanData.ybjgDTOList || []).map((item: any) => {
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        // 优先使用 grade，如果没有则从 dzjb 转换
        const gradeValue = item.grade !== undefined ? Number(item.grade) : (item.dzjb ? dzjbToGrade(item.dzjb) : 0);
        // 基础数据字段（不含pk/id）
        const baseData: any = {
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? (item.ybjgTime.includes?.(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
          risklevel: item.risklevel || '',
          grade: gradeValue,  // 地质级别：0=绿色, 1=红色, 2=黄色
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
        // 只有编辑已有记录时才发送pk/id字段
        if (item.ybjgPk) {
          baseData.ybjgPk = item.ybjgPk;
          baseData.ybjgId = item.ybjgId || item.ybjgPk;
          baseData.ybPk = item.ybPk;
        }
        return baseData;
      });
      
      // 构建钻孔列表（超前水平钻）
      const cqspzZkzzDTOList = (cleanData.cqspzZkzzDTOList || cleanData.zkList || []).map((item: any) => {
        // 构建钻孔记录列表
        const ztjlbList = (item.cqspzZkzzZtjlbDTOList || item.cqspzZkzzZtjlbVOList || []).map((record: any) => ({
          cqspzZkzzZtjlbPk: record.cqspzZkzzZtjlbPk || null,
          cqspzZkzzZtjlbId: record.cqspzZkzzZtjlbId || null,
          cqspzZkzzPk: record.cqspzZkzzPk || null,
          kssj: record.kssj ? (record.kssj.includes?.(' ') ? record.kssj.replace(' ', 'T') : record.kssj) : undefined,
          jssj: record.jssj ? (record.jssj.includes?.(' ') ? record.jssj.replace(' ', 'T') : record.jssj) : undefined,
          zksd: record.zksd !== undefined ? Number(record.zksd) : 0,
          zkpressure: record.zkpressure !== undefined ? Number(record.zkpressure) : 0,
          zkspeed: record.zkspeed !== undefined ? Number(record.zkspeed) : 0,
          kwwaterpre: record.kwwaterpre !== undefined ? Number(record.kwwaterpre) : 0,
          kwwaterspe: record.kwwaterspe !== undefined ? Number(record.kwwaterspe) : 0,
          dzms: record.dzms || '',
          kwzbxl: record.kwzbxl || '',
        }));
        
        // 构建地层信息列表
        const dcxxList = (item.cqspzZkzzDcxxDTOList || item.cqspzZkzzDcxxVOList || []).map((info: any) => ({
          cqspzZkzzDcxxPk: info.cqspzZkzzDcxxPk || null,
          cqspzZkzzDcxxId: info.cqspzZkzzDcxxId || null,
          cqspzZkzzPk: info.cqspzZkzzPk || null,
          dcdh: info.dcdh || '',
          dclc: info.dclc !== undefined ? Number(info.dclc) : 0,
          fchd: info.fchd !== undefined ? Number(info.fchd) : 0,
          cslcz: info.cslcz !== undefined ? Number(info.cslcz) : 0,
          csl: info.csl !== undefined ? Number(info.csl) : 0,
          cywz: info.cywz || '',
          gcdzjj: info.gcdzjj || '',
        }));
        
        return {
          cqspzZkzzPk: item.cqspzZkzzPk || null,
          cqspzZkzzId: item.cqspzZkzzId || null,
          cqspzPk: item.cqspzPk || cleanData.cqspzPk || null,
          kwbh: item.kwbh || '',
          jgdjl: item.jgdjl !== undefined ? Number(item.jgdjl) : 0,
          jzxxjl: item.jzxxjl !== undefined ? Number(item.jzxxjl) : 0,
          kwljangle: item.kwljangle !== undefined ? Number(item.kwljangle) : 0,
          kwpjangle: item.kwpjangle !== undefined ? Number(item.kwpjangle) : 0,
          zkzj: item.zkzj !== undefined ? Number(item.zkzj) : 0,
          zjcode: item.zjcode || '',
          kssj: item.kssj ? (item.kssj.includes?.(' ') ? item.kssj.replace(' ', 'T') : item.kssj) : undefined,
          jssj: item.jssj ? (item.jssj.includes?.(' ') ? item.jssj.replace(' ', 'T') : item.jssj) : undefined,
          kkwzsyt: item.kkwzsyt || '',
          sfqx: item.sfqx !== undefined ? Number(item.sfqx) : 0,
          qxpic: item.qxpic || '',
          remark: item.remark || '',
          cqspzZkzzZtjlbDTOList: ztjlbList,
          cqspzZkzzDcxxDTOList: dcxxList,
        };
      });
      
      // 构建安全的提交数据 - 不发送cqspzPk/cqspzId字段，让后端从URL中的ybPk自动查找关联记录
      const ybPkValue = cleanData.ybPk ? Number(cleanData.ybPk) : Number(id);
      const safeData = {
        // ID 字段 - 只发送 ybPk 和 ybId，不发送 cqspzPk/cqspzId
        ybPk: ybPkValue,
        ybId: cleanData.ybId ? Number(cleanData.ybId) : ybPkValue,
        // 基本字段
        siteId: String(cleanData.siteId || ''),
        dkname: cleanData.dkname || 'DK',
        dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
        ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
        monitordate: cleanData.monitordate
          ? cleanData.monitordate.includes?.(' ')
            ? cleanData.monitordate.replace(' ', 'T')
            : cleanData.monitordate
          : undefined,
        testname: cleanData.testname || '',
        testno: cleanData.testno || '',
        testtel: cleanData.testtel || '',
        monitorname: cleanData.monitorname || '',
        monitorno: cleanData.monitorno || '',
        monitortel: cleanData.monitortel || '',
        supervisorname: cleanData.supervisorname || '',
        supervisorno: cleanData.supervisorno || '',
        supervisortel: cleanData.supervisortel || '',
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
        solution: cleanData.solution || '',
        remark: cleanData.remark || '',
        method: cleanData.method !== undefined ? Number(cleanData.method) : 13,
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
        // 超前水平钻特有字段（不含图片字段，图片需通过单独接口上传）
        kwtype: cleanData.kwtype !== undefined ? Number(cleanData.kwtype) : 1,
        // 分段信息列表 - 直接使用已处理的ybjgDTOList（不含pk/id字段）
        ybjgDTOList: ybjgDTOList,
        // 钻孔列表
        cqspzZkzzDTOList: cqspzZkzzDTOList.map((item: any) => ({
          kwbh: item.kwbh || '',
          jgdjl: item.jgdjl,
          jzxxjl: item.jzxxjl,
          kwljangle: item.kwljangle,
          kwpjangle: item.kwpjangle,
          zkzj: item.zkzj,
          zjcode: item.zjcode || '',
          kssj: item.kssj,
          jssj: item.jssj,
          // kkwzsyt 和 qxpic 是图片字段，需通过单独接口上传
          sfqx: item.sfqx,
          remark: item.remark || '',
          // 钻孔记录列表
          cqspzZkzzZtjlbDTOList: (item.cqspzZkzzZtjlbDTOList || []).map((record: any) => ({
            kssj: record.kssj,
            jssj: record.jssj,
            zksd: record.zksd,
            zkpressure: record.zkpressure,
            zkspeed: record.zkspeed,
            kwwaterpre: record.kwwaterpre,
            kwwaterspe: record.kwwaterspe,
            dzms: record.dzms || '',
            kwzbxl: record.kwzbxl || '',
          })),
          // 地层信息列表
          cqspzZkzzDcxxDTOList: (item.cqspzZkzzDcxxDTOList || []).map((info: any) => ({
            dcdh: info.dcdh || '',
            dclc: info.dclc,
            fchd: info.fchd,
            cslcz: info.cslcz,
            csl: info.csl,
            cywz: info.cywz || '',
            gcdzjj: info.gcdzjj || '',
          })),
        })),
      };
      
      console.log('🔍 [realAPI] updateDrillingMethod 清理后数据:', safeData);
      
      // 超前水平钻：优先使用 ybPk（因为API路径是 /api/v1/ztf/cqspz/{ybPk}）
      // 根据实际 API 测试，应该使用 ybPk 而不是 cqspzPk
      const actualId = cleanData.ybPk || cleanData.cqspzPk || id;
      const apiPath = `/api/v1/ztf/cqspz/${actualId}`;
      console.log('🔍 [realAPI] 超前水平钻 API路径:', apiPath, '(ybPk:', cleanData.ybPk, ', cqspzPk:', cleanData.cqspzPk, ', 传入id:', id, ', 实际使用:', actualId, ')');
      
      const response = await put<any>(apiPath, safeData);
      console.log('🔍 [realAPI] updateDrillingMethod 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateDrillingMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateDrillingMethod 失败:', response?.message || response);
        return { success: false, message: response?.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateDrillingMethod 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 更新加深炮孔记录
   */
  private async updateJspk(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 [realAPI] updateJspk 原始数据:', data);
      
      // dzjb 转 grade 的映射：green=0(绿色), yellow=2(黄色), red=1(红色)
      const dzjbToGrade = (dzjb: string): number => {
        const map: Record<string, number> = { 'green': 0, 'yellow': 2, 'red': 1 };
        return map[dzjb] ?? 0;
      };
      
      // 构建 ybjgDTOList
      const ybjgDTOList = (data.ybjgDTOList || data.ybjgVOList || []).map((item: any) => {
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        const gradeValue = item.grade !== undefined ? Number(item.grade) : (item.dzjb ? dzjbToGrade(item.dzjb) : 0);
        // 基础数据字段（不含pk/id）
        const baseData: any = {
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? String(item.ybjgTime).replace(' ', 'T') : undefined,
          risklevel: item.risklevel || '',
          grade: gradeValue,
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
        // 只有编辑已有记录时才发送pk/id字段
        if (item.ybjgPk) {
          baseData.ybjgPk = item.ybjgPk;
          baseData.ybjgId = item.ybjgId || item.ybjgPk;
          baseData.ybPk = item.ybPk;
        }
        return baseData;
      });
      
      // 构建 jspkDataDTOList（加深炮孔数据列表）- 不发送pk/id字段
      const jspkDataSource = data.jspkDataDTOList || data.ztfJspkVOList || data.jspkDataVOList || data.zkList || [];
      console.log('🔍 [realAPI] updateJspk 钻孔数据来源:', jspkDataSource);
      const jspkDataDTOList = jspkDataSource.map((item: any) => ({
        zkwz: item.zkwz || '',
        wcj: item.wcj !== undefined ? Number(item.wcj) : 0,
        zkcd: item.zkcd !== undefined ? Number(item.zkcd) : 0,
        dzqkjs: item.dzqkjs || '',
      }));
      console.log('🔍 [realAPI] updateJspk 转换后钻孔数据:', jspkDataDTOList);
      
      // 构建提交数据 - 不发送jspkPk/jspkId字段，让后端从URL中的ybPk自动查找关联记录
      const ybPkValue = data.ybPk ? Number(data.ybPk) : Number(id);
      const safeData = {
        // ID 字段 - 只发送 ybPk 和 ybId
        ybPk: ybPkValue,
        ybId: data.ybId ? Number(data.ybId) : ybPkValue,
        // 基本字段
        siteId: String(data.siteId || ''),
        dkname: data.dkname || 'DK',
        dkilo: data.dkilo !== undefined ? Math.round(Number(data.dkilo)) : 0,
        ybLength: data.ybLength !== undefined ? Number(data.ybLength) : 0,
        monitordate: data.monitordate ? String(data.monitordate).replace(' ', 'T') : undefined,
        createdate: data.createdate ? String(data.createdate).replace(' ', 'T') : undefined,
        testname: data.testname || '',
        testno: data.testno || '',
        testtel: data.testtel || undefined,  // 空字符串改为 undefined
        monitorname: data.monitorname || '',
        monitorno: data.monitorno || '',
        monitortel: data.monitortel || undefined,  // 空字符串改为 undefined
        supervisorname: data.supervisorname || '',
        supervisorno: data.supervisorno || '',
        supervisortel: data.supervisortel || undefined,  // 空字符串改为 undefined
        conclusionyb: data.conclusionyb || '',
        suggestion: data.suggestion || '',
        solution: data.solution || '',
        remark: data.remark || undefined,  // 空字符串改为 undefined
        method: 14,
        flag: data.flag !== undefined ? Number(data.flag) : 0,
        submitFlag: data.submitFlag !== undefined ? Number(data.submitFlag) : 0,
        kwtype: data.kwtype !== undefined ? Number(data.kwtype) : 2,
        ybjgDTOList: ybjgDTOList,
        jspkDataDTOList: jspkDataDTOList,
      };
      
      // API 路径使用 ybPk（根据 API 文档：/api/v1/ztf/jspk/{ybPk}）
      const ybPk = data.ybPk || data.jspkPk || id;
      const apiPath = `/api/v1/ztf/jspk/${ybPk}`;
      console.log('🔍 [realAPI] updateJspk 提交数据:', safeData);
      console.log('🔍 [realAPI] updateJspk API路径:', apiPath);
      
      const response = await put<any>(apiPath, safeData);
      console.log('🔍 [realAPI] updateJspk 响应:', response);
      
      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateJspk 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateJspk 失败:', response?.message || response);
        return { success: false, message: response?.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateJspk 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 删除钻探法记录
   */
  async deleteDrillingMethod(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<any>(`/api/v1/ztf/${id}`);
      console.log('🔍 [realAPI] deleteDrillingMethod 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] deleteDrillingMethod 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteDrillingMethod 失败:', response?.message || response);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ [realAPI] deleteDrillingMethod 异常:', error);
      return { success: false };
    }
  }

  /**
   * 上传超前水平钻文件
   * POST /api/v1/ztf/cqspz/{ybPk}/file
   * @param ybPk 预报主键
   * @param data 文件数据 (CqspzFileDTO)
   * @returns 上传结果
   */
  async uploadDrillingFile(ybPk: number, data: {
    siteId: string;
    images?: File | null;
    addition?: File | null;
    cqspzZkzzFileDTOList?: Array<{
      cqspzZkzzPk: number;
      kkwzsyt?: File | null;
      qxpic?: File | null;
    }>;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🚀 [realAPI] uploadDrillingFile 调用:', { ybPk, data });
      
      // 使用 FormData 上传文件
      const formData = new FormData();
      formData.append('ybPk', String(ybPk));
      formData.append('siteId', data.siteId);
      
      if (data.images) {
        formData.append('images', data.images);
      }
      if (data.addition) {
        formData.append('addition', data.addition);
      }
      
      // 处理钻孔文件列表
      if (data.cqspzZkzzFileDTOList && data.cqspzZkzzFileDTOList.length > 0) {
        data.cqspzZkzzFileDTOList.forEach((item, index) => {
          formData.append(`cqspzZkzzFileDTOList[${index}].cqspzZkzzPk`, String(item.cqspzZkzzPk));
          if (item.kkwzsyt) {
            formData.append(`cqspzZkzzFileDTOList[${index}].kkwzsyt`, item.kkwzsyt);
          }
          if (item.qxpic) {
            formData.append(`cqspzZkzzFileDTOList[${index}].qxpic`, item.qxpic);
          }
        });
      }
      
      const response = await post<any>(`/api/v1/ztf/cqspz/${ybPk}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('🔍 [realAPI] uploadDrillingFile 响应:', response);
      
      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] uploadDrillingFile 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadDrillingFile 失败:', response?.message || response);
        return { success: false, message: response?.message || '上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadDrillingFile 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  // ========== 掌子面素描 CRUD ==========

  /**
   * 获取掌子面素描列表
   */
  async getFaceSketches(params: { sitePk?: number; userid?: number; pageNum?: number; pageSize?: number }) {
    try {
      const response = await get<{ zzmsmIPage: PageResponse<FaceSketch> }>('/api/v1/zzmsm/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response?.zzmsmIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
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
  async updateFaceSketch(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 [realAPI] updateFaceSketch 原始数据:', data);
      
      // 清理数据：移除VO后缀的字段，转换为DTO
      const cleanData: any = { ...data };
      
      // 将VO字段转换为DTO字段
      if (cleanData.ybjgVOList && cleanData.ybjgVOList.length > 0 && (!cleanData.ybjgDTOList || cleanData.ybjgDTOList.length === 0)) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
      }
      delete cleanData.ybjgVOList;
      
      // 移除时间戳字段
      delete cleanData.gmtCreate;
      delete cleanData.gmtModified;
      delete cleanData.createdate;
      
      // 构建 ybjgDTOList
      const ybjgDTOList = (cleanData.ybjgDTOList || []).map((item: any) => {
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        return {
          // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
          ybjgPk: item.ybjgPk || null,
          ybjgId: item.ybjgId || item.ybjgPk || null,
          ybPk: item.ybPk || cleanData.zzmsmPk || null,
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? (item.ybjgTime.includes?.(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
          risklevel: item.risklevel || '',
          grade: item.grade !== undefined ? Number(item.grade) : 0,
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
      });
      
      // 构建安全的提交数据
      const safeData = {
        zzmsmPk: Number(cleanData.zzmsmPk) || 0,
        zzmsmId: cleanData.zzmsmId || '',
        siteId: String(cleanData.siteId || ''),
        dkname: cleanData.dkname || 'DK',
        dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
        monitordate: cleanData.monitordate ? 
          (cleanData.monitordate.includes?.(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
          : undefined,
        testname: cleanData.testname || '',
        testno: cleanData.testno || '',
        testtel: cleanData.testtel || '',
        monitorname: cleanData.monitorname || '',
        monitorno: cleanData.monitorno || '',
        monitortel: cleanData.monitortel || '',
        supervisorname: cleanData.supervisorname || '',
        supervisorno: cleanData.supervisorno || '',
        supervisortel: cleanData.supervisortel || '',
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
        solution: cleanData.solution || '',
        remark: cleanData.remark || '',
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
        // 掌子面素描特有字段
        zzmlx: cleanData.zzmlx || '',
        zzmqx: cleanData.zzmqx || '',
        zzmgd: cleanData.zzmgd !== undefined ? Number(cleanData.zzmgd) : 0,
        zzmkd: cleanData.zzmkd !== undefined ? Number(cleanData.zzmkd) : 0,
        ycmc: cleanData.ycmc || '',
        ycys: cleanData.ycys || '',
        ycjg: cleanData.ycjg || '',
        ycfh: cleanData.ycfh || '',
        ycqt: cleanData.ycqt || '',
        jlcs: cleanData.jlcs || '',
        jlcx: cleanData.jlcx || '',
        jlqj: cleanData.jlqj || '',
        jlkd: cleanData.jlkd || '',
        jlmj: cleanData.jlmj || '',
        jlcw: cleanData.jlcw || '',
        dsqk: cleanData.dsqk || '',
        dslx: cleanData.dslx || '',
        dsll: cleanData.dsll || '',
        dsph: cleanData.dsph || '',
        ybjgDTOList: ybjgDTOList,
      };
      
      console.log('🔍 [realAPI] updateFaceSketch 清理后数据:', safeData);
      
      const response = await put<any>(`/api/v1/zzmsm/${id}`, safeData);
      console.log('🔍 [realAPI] updateFaceSketch 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateFaceSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateFaceSketch 失败:', response?.message || response);
        return { success: false, message: response?.message || '更新失败' };
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
      const response = await del<any>(`/api/v1/zzmsm/${id}`);
      console.log('🔍 [realAPI] deleteFaceSketch 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] deleteFaceSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteFaceSketch 失败:', response?.message || response);
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
      const response = await get<{ dssmIPage: PageResponse<TunnelSketch> }>('/api/v1/dssm/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      return response?.dssmIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getTunnelSketches 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 更新洞身素描记录
   */
  async updateTunnelSketch(id: string, data: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 [realAPI] updateTunnelSketch 原始数据:', data);
      
      // 清理数据：移除VO后缀的字段，转换为DTO
      const cleanData: any = { ...data };
      
      // 将VO字段转换为DTO字段
      if (cleanData.ybjgVOList && cleanData.ybjgVOList.length > 0 && (!cleanData.ybjgDTOList || cleanData.ybjgDTOList.length === 0)) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
      }
      delete cleanData.ybjgVOList;
      
      // 保存 createdate 后再移除时间戳字段
      const savedCreatedate = cleanData.createdate || data.createdate;
      delete cleanData.gmtCreate;
      delete cleanData.gmtModified;
      delete cleanData.createdate;
      
      // 构建 ybjgDTOList
      const ybjgDTOList = (cleanData.ybjgDTOList || []).map((item: any) => {
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        return {
          // 新增时 ybjgPk/ybjgId 应该为 null，编辑时保留原有值
          ybjgPk: item.ybjgPk || null,
          ybjgId: item.ybjgId || item.ybjgPk || null,
          ybPk: item.ybPk || cleanData.dssmPk || null,
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? (item.ybjgTime.includes?.(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
          risklevel: item.risklevel || '',
          grade: item.grade !== undefined ? Number(item.grade) : 0,
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
      });
      
      // 构建安全的提交数据 - 按照 DssmDTO 文档
      const safeData = {
        // 基础字段
        ybPk: Number(cleanData.ybPk) || 0,
        ybId: Number(cleanData.ybId) || 0,
        siteId: String(cleanData.siteId || ''),
        dkname: cleanData.dkname || 'DK',
        dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
        ybLength: cleanData.ybLength !== undefined ? Number(cleanData.ybLength) : 0,
        monitordate: cleanData.monitordate ? 
          (cleanData.monitordate.includes?.(' ') ? cleanData.monitordate.replace(' ', 'T') : cleanData.monitordate) 
          : undefined,
        createdate: savedCreatedate || new Date().toISOString(),
        testname: cleanData.testname || '',
        testno: cleanData.testno || '',
        testtel: cleanData.testtel || '',
        monitorname: cleanData.monitorname || '',
        monitorno: cleanData.monitorno || '',
        monitortel: cleanData.monitortel || '',
        supervisorname: cleanData.supervisorname || '',
        supervisorno: cleanData.supervisorno || '',
        supervisortel: cleanData.supervisortel || '',
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
        solution: cleanData.solution || '',
        remark: cleanData.remark || '',
        method: 8, // 洞身素描
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
        ybjgDTOList: ybjgDTOList,
        // 洞身素描特有字段 - dssmId 为 0 时使用 dssmPk
        dssmPk: Number(cleanData.dssmPk) || 0,
        dssmId: Number(cleanData.dssmId) || Number(cleanData.dssmPk) || 0,
        beginkilo: cleanData.beginkilo !== undefined ? Math.round(Number(cleanData.beginkilo)) : 0,
        dssmLength: cleanData.dssmLength !== undefined ? Number(cleanData.dssmLength) : 0,
        sjwydj: cleanData.sjwydj !== undefined ? Number(cleanData.sjwydj) : 0,
        sgwydj: cleanData.sgwydj !== undefined ? Number(cleanData.sgwydj) : 0,
        sjdzms: cleanData.sjdzms || '',
        sgdztz: cleanData.sgdztz || '',
        sggztz: cleanData.sggztz || '',
        shswtz: cleanData.shswtz || '',
        // 图片字段需要通过单独的文件上传接口处理，不在 PUT 接口中传递
        // zbqsmt, zbqxct, gbsmt, gbxct, ybqsmt, ybqxct, addition 等图片字段已移除
      };
      
      console.log('🔍 [realAPI] updateTunnelSketch 清理后数据:', safeData);
      
      const response = await put<any>(`/api/v1/dssm/${id}`, safeData);
      console.log('🔍 [realAPI] updateTunnelSketch 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateTunnelSketch 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateTunnelSketch 失败:', response?.message || response);
        return { success: false, message: response?.message || '更新失败' };
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
      const response = await del<any>(`/api/v1/dssm/${id}`);
      console.log('🔍 [realAPI] deleteTunnelSketch 响应:', response);

      if (isSuccessResponse(response)) {
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
      const response = await get<{ dbbcIPage: PageResponse<SurfaceSupplement> }>('/api/v1/dbbc/list', {
        params: {
          userid: params.userid || this.userId,
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 15,
          ...params
        }
      });
      // get函数已经自动解包了data，所以response就是{dbbcIPage: {...}}
      return response?.dbbcIPage || { current: 1, size: 15, records: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('❌ [realAPI] getSurfaceSupplements 失败:', error);
      return { current: 1, size: 15, records: [], total: 0, pages: 0 };
    }
  }

  /**
   * 更新地表补充记录
   */
  async updateSurfaceSupplement(id: string, data: SurfaceSupplementRequest): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔍 [realAPI] updateSurfaceSupplement 原始数据:', data);
      
      // 清理数据：移除VO后缀的字段，转换为DTO
      const cleanData: any = { ...data };
      
      // 将VO字段转换为DTO字段
      if (cleanData.ybjgVOList && cleanData.ybjgVOList.length > 0 && (!cleanData.ybjgDTOList || cleanData.ybjgDTOList.length === 0)) {
        cleanData.ybjgDTOList = cleanData.ybjgVOList;
      }
      delete cleanData.ybjgVOList;
      
      // 移除时间戳字段（保留 createdate）
      delete cleanData.gmtCreate;
      delete cleanData.gmtModified;
      
      // dzjb 转 grade 的映射：green=0(绿色), yellow=2(黄色), red=1(红色)
      const dzjbToGrade = (dzjb: string): number => {
        const map: Record<string, number> = { 'green': 0, 'yellow': 2, 'red': 1 };
        return map[dzjb] ?? 0;
      };
      
      // 构建 ybjgDTOList - 分段信息（新增时不发送pk/id字段）
      const ybjgDTOList = (cleanData.ybjgDTOList || []).map((item: any) => {
        // 处理里程值
        let finalSdkilo = item.sdkilo;
        if (item.sdkiloEnd !== undefined && item.sdkiloEnd !== null) {
          finalSdkilo = (Number(item.sdkilo) || 0) * 1000 + (Number(item.sdkiloEnd) || 0);
        }
        let finalEdkilo = item.edkilo;
        if (item.edkiloEnd !== undefined && item.edkiloEnd !== null) {
          finalEdkilo = (Number(item.edkilo) || 0) * 1000 + (Number(item.edkiloEnd) || 0);
        }
        // 优先使用 grade，如果没有则从 dzjb 转换
        const gradeValue = item.grade !== undefined ? Number(item.grade) : (item.dzjb ? dzjbToGrade(item.dzjb) : 0);
        // 基础数据字段（不含pk/id）
        const baseData: any = {
          dkname: item.dkname || 'DK',
          sdkilo: finalSdkilo !== undefined ? Math.round(Number(finalSdkilo)) : 0,
          edkilo: finalEdkilo !== undefined ? Math.round(Number(finalEdkilo)) : 0,
          ybjgTime: item.ybjgTime ? (item.ybjgTime.includes?.(' ') ? item.ybjgTime.replace(' ', 'T') : item.ybjgTime) : undefined,
          risklevel: item.risklevel || '',
          grade: gradeValue,  // 地质级别：0=绿色, 1=红色, 2=黄色
          wylevel: item.wylevel !== undefined ? Number(item.wylevel) : 0,
          jlresult: item.jlresult || '',
        };
        // 只有编辑已有记录时才发送pk/id字段
        if (item.ybjgPk) {
          baseData.ybjgPk = item.ybjgPk;
          baseData.ybjgId = item.ybjgId || item.ybjgPk;
          baseData.ybPk = item.ybPk;
        }
        return baseData;
      });
      
      // 调试：打印原始数据中的ID字段
      console.log('🔍 [realAPI] updateSurfaceSupplement 原始数据ID字段:', {
        ybPk: cleanData.ybPk,
        ybId: cleanData.ybId,
        dbbcPk: cleanData.dbbcPk,
        dbbcId: cleanData.dbbcId,
        传入id: id
      });
      
      // 构建更新数据 - 根据API文档，更新时需要在请求体中包含所有必要字段
      // PUT /api/v1/dbbc/{ybPk}
      // 构建基础数据
      const ybPkValue = cleanData.ybPk ? Number(cleanData.ybPk) : Number(id);
      
      // 检查 dbbcPk 是否有效（如果 dbbcPk 存在且大于 0）
      const dbbcPkValue = cleanData.dbbcPk ? Number(cleanData.dbbcPk) : 0;
      const dbbcIdValue = cleanData.dbbcId ? Number(cleanData.dbbcId) : 0;
      
      console.log('🔍 [realAPI] updateSurfaceSupplement ID检查:', {
        ybPkValue,
        dbbcPkValue,
        dbbcIdValue,
        原始dbbcPk: cleanData.dbbcPk,
        原始dbbcId: cleanData.dbbcId
      });
      
      const safeData: any = {
        // ID字段 - ybPk 和 ybId 必须包含
        ybPk: ybPkValue,
        ybId: cleanData.ybId ? Number(cleanData.ybId) : ybPkValue,
        // 基本字段
        siteId: String(cleanData.siteId || ''),
        dkname: cleanData.dkname || 'DK',
        dkilo: cleanData.dkilo !== undefined ? Math.round(Number(cleanData.dkilo)) : 0,
        ybLength: cleanData.ybLength !== undefined && cleanData.ybLength !== 0 ? Number(cleanData.ybLength) : (cleanData.dbbcLength || 0),
        testname: cleanData.testname || '',
        testno: cleanData.testno || '',
        testtel: cleanData.testtel || '',
        monitorname: cleanData.monitorname || '',
        monitorno: cleanData.monitorno || '',
        monitortel: cleanData.monitortel || '',
        supervisorname: cleanData.supervisorname || '',
        supervisorno: cleanData.supervisorno || '',
        supervisortel: cleanData.supervisortel || '',
        conclusionyb: cleanData.conclusionyb || '',
        suggestion: cleanData.suggestion || '',
        solution: cleanData.solution || '',
        remark: cleanData.remark || '',
        flag: cleanData.flag !== undefined ? Number(cleanData.flag) : 0,
        submitFlag: cleanData.submitFlag !== undefined ? Number(cleanData.submitFlag) : 0,
        method: cleanData.method !== undefined ? Number(cleanData.method) : 12,
        // 地表补充特有字段
        dbbcLength: cleanData.dbbcLength !== undefined ? Number(cleanData.dbbcLength) : 0,
        sjwydj: cleanData.sjwydj !== undefined ? Number(cleanData.sjwydj) : 0,
        sjqk: cleanData.sjqk !== undefined ? Number(cleanData.sjqk) : 0,
        dcyx: cleanData.dcyx || '',
        dbry: cleanData.dbry || '',
        tsdz: cleanData.tsdz || '',
        rwdk: cleanData.rwdk || '',
        dzpj: cleanData.dzpj || '',
        ybjgDTOList: ybjgDTOList,
      };
      
      // 可选字段 - 只有有值时才添加
      if (cleanData.monitordate) {
        safeData.monitordate = cleanData.monitordate.includes?.(' ') 
          ? cleanData.monitordate.replace(' ', 'T') 
          : cleanData.monitordate;
      }
      // createdate - 更新时保留原始创建时间，如果没有则使用当前时间
      const originalCreatedate = cleanData.createdate || (data as any).createdate;
      if (originalCreatedate) {
        safeData.createdate = String(originalCreatedate).includes(' ') 
          ? String(originalCreatedate).replace(' ', 'T') 
          : originalCreatedate;
      } else {
        // 如果没有createdate，使用当前时间，格式：YYYY-MM-DDTHH:mm:ss
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        safeData.createdate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      }
      console.log('🔍 [realAPI] createdate处理:', { original: originalCreatedate, final: safeData.createdate });
      // 处理开始里程
      if (cleanData.beginkiloStart !== undefined || cleanData.beginkiloEnd !== undefined) {
        safeData.beginkilo = (Number(cleanData.beginkiloStart) || 0) * 1000 + (Number(cleanData.beginkiloEnd) || 0);
      } else if (cleanData.beginkilo !== undefined) {
        safeData.beginkilo = Number(cleanData.beginkilo);
      }
      
      console.log('🔍 [realAPI] updateSurfaceSupplement 清理后数据:', safeData);
      
      // API 路径使用传入的id参数（应该是ybPk，根据api-docs.json）
      // 不再从cleanData中获取ID，直接使用传入的id
      const apiPath = `/api/v1/dbbc/${id}`;
      console.log('🔍 [realAPI] updateSurfaceSupplement API路径:', apiPath, '(传入id:', id, ', cleanData.ybPk:', cleanData.ybPk, ', cleanData.dbbcPk:', cleanData.dbbcPk, ')');
      
      const response = await put<any>(apiPath, safeData);
      console.log('🔍 [realAPI] updateSurfaceSupplement 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] updateSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] updateSurfaceSupplement 失败:', response?.message || response);
        return { success: false, message: response?.message || '更新失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] updateSurfaceSupplement 异常:', error);
      return { success: false, message: error?.message || '网络异常' };
    }
  }

  /**
   * 删除地表补充记录
   */
  async deleteSurfaceSupplement(id: string): Promise<{ success: boolean }> {
    try {
      const response = await del<any>(`/api/v1/dbbc/${id}`);
      console.log('🔍 [realAPI] deleteSurfaceSupplement 响应:', response);

      if (isSuccessResponse(response)) {
        console.log('✅ [realAPI] deleteSurfaceSupplement 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] deleteSurfaceSupplement 失败:', response?.message || response);
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
    // 匹配前缀，包括字母和数字（如 D1K, DK, YDK 等）
    const match = mileage.match(/^([A-Za-z0-9]+?)(?=\d+\+)/);
    return match ? match[1] : 'DK';
  }

  /**
   * 从里程字符串中提取里程数值
   * 如: "DK180+973" -> 180973.00 (公里*1000 + 米，保留2位小数)
   * 后端格式：dkilo = 180973.00 表示 180公里973米
   */
  /**
   * 从里程字符串中提取里程（米数）
   * 如: "DK180+973.5" -> 180973.5 (180公里973.5米 = 180973.5米)
   * 后端格式：dkilo/endMileage 都是米数，带2位小数
   */
  private extractMileageInMeters(mileage: string): number {
    // 支持小数格式，如 DK18+972.03
    const match = mileage.match(/(\d+)\+([\d.]+)$/);
    if (match) {
      const km = parseInt(match[1]) || 0;
      const m = parseFloat(match[2]) || 0;
      // 返回米数：公里*1000 + 米，保留2位小数
      return parseFloat((km * 1000 + m).toFixed(2));
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

      // 正确的参数格式：直接作为query参数传递，Spring Boot会自动绑定到YbInfoPageQueryDTO
      const queryParams: any = {
        siteId: params.siteId,      // 工点ID (必填)
        type: 1,                    // 1=物探法
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
        // submitFlag 不传，获取所有状态的数据
        // method 不传，获取该类型下的所有方法
      };
      
      console.log('📤 [realAPI] 物探法请求参数:', queryParams);

      // 添加超时和错误处理
      const response = await get<any>('/api/v1/wtf/list', { 
        params: queryParams,
        timeout: 30000  // 30秒超时
      }).catch(err => {
        // 网络错误或后端不可达时，返回空数据而不是抛出异常
        console.error('❌ [realAPI] 网络请求失败，可能原因：');
        console.error('   1. 后端服务器 http://121.40.127.120:8080 不可达');
        console.error('   2. 工点ID不存在:', params.siteId);
        console.error('   3. 网络连接问题');
        console.error('   错误详情:', err.message);
        throw err;  // 继续抛出，由外层catch处理
      });
      
      console.log('🔍 [realAPI] getGeophysicalList 响应:', response);
      console.log('🔍 [realAPI] getGeophysicalList 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容多种响应格式
      let pageData = null;
      
      // 格式1: 直接返回分页数据 { records, total, ... }
      if (response && response.records !== undefined) {
        pageData = response;
        console.log('🔍 [realAPI] getGeophysicalList 使用格式1: 直接分页数据');
      }
      // 格式2: 包装在 wtfIPage 字段中 { wtfIPage: { records, total, ... } }
      else if (response && response.wtfIPage) {
        pageData = response.wtfIPage;
        console.log('🔍 [realAPI] getGeophysicalList 使用格式2: wtfIPage字段');
      }
      // 格式3: 标准响应格式 { resultcode: 200, data: { records, ... } }
      else if ((response?.resultcode === 200 || response?.resultcode === 0) && response?.data) {
        pageData = response.data;
        console.log('🔍 [realAPI] getGeophysicalList 使用格式3: 标准响应格式');
      }

      if (pageData) {
        const result = {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
        console.log('✅ [realAPI] getGeophysicalList 返回数据:', result);
        return result;
      }
      
      console.warn('⚠️ [realAPI] getGeophysicalList 无法解析响应格式');
      return { records: [], total: 0, current: 1, size: 10, pages: 0 };
    } catch (error: any) {
      console.error('❌ [realAPI] getGeophysicalList 异常:', error);
      console.error('💡 建议：');
      console.error('   1. 检查后端服务是否启动');
      console.error('   2. 验证工点ID是否正确');
      console.error('   3. 检查网络连接');
      console.error('   4. 临时切换到 Mock 模式进行开发');
      
      // 返回空数据，让页面能够正常显示（只是没有数据）
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

      // 修正：参数放在 queryDTO 对象中
      const queryParams: any = {
        'queryDTO.siteId': params.siteId,
        'queryDTO.type': 2,  // 2=掌子面素描
        'queryDTO.pageNum': params.pageNum || 1,
        'queryDTO.pageSize': params.pageSize || 15
      };

      console.log('🚀 [realAPI] getPalmSketchList 调用参数:', params);
      console.log('📤 [realAPI] 掌子面素描请求参数（修正后）:', queryParams);

      const response = await get<any>('/api/v1/zzmsm/list', { params: queryParams, timeout: 30000 });
      console.log('🔍 [realAPI] getPalmSketchList 响应:', response);
      console.log('🔍 [realAPI] getPalmSketchList 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容多种响应格式
      let pageData = null;
      
      // 格式1: 直接返回分页数据 { records, total, ... }
      if (response && response.records !== undefined) {
        pageData = response;
        console.log('🔍 [realAPI] getPalmSketchList 使用格式1: 直接分页数据');
      }
      // 格式2: 包装在 zzmsmIPage 字段中 { zzmsmIPage: { records, total, ... } }
      else if (response && response.zzmsmIPage) {
        pageData = response.zzmsmIPage;
        console.log('🔍 [realAPI] getPalmSketchList 使用格式2: zzmsmIPage字段');
      }
      // 格式3: 标准响应格式 { resultcode: 200, data: { records, ... } }
      else if ((response?.resultcode === 200 || response?.resultcode === 0) && response?.data) {
        pageData = response.data;
        console.log('🔍 [realAPI] getPalmSketchList 使用格式3: 标准响应格式');
      }

      if (pageData) {
        const result = {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
        console.log('✅ [realAPI] getPalmSketchList 返回数据:', result);
        return result;
      }
      
      console.warn('⚠️ [realAPI] getPalmSketchList 无法解析响应格式');
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

      const queryParams: any = {
        siteId: params.siteId,
        type: 3,  // 3=洞身素描
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };

      console.log('🚀 [realAPI] getTunnelSketchList 调用参数:', params);
      console.log('📤 [realAPI] 洞身素描请求参数:', queryParams);

      const response = await get<any>('/api/v1/dssm/list', { params: queryParams });
      console.log('🔍 [realAPI] getTunnelSketchList 响应:', response);
      console.log('🔍 [realAPI] getTunnelSketchList 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容多种响应格式
      let pageData = null;
      
      // 格式1: 直接返回分页数据 { records, total, ... }
      if (response && response.records !== undefined) {
        pageData = response;
        console.log('🔍 [realAPI] getTunnelSketchList 使用格式1: 直接分页数据');
      }
      // 格式2: 包装在 dssmIPage 字段中 { dssmIPage: { records, total, ... } }
      else if (response && response.dssmIPage) {
        pageData = response.dssmIPage;
        console.log('🔍 [realAPI] getTunnelSketchList 使用格式2: dssmIPage字段');
      }
      // 格式3: 标准响应格式 { resultcode: 200, data: { records, ... } }
      else if ((response?.resultcode === 200 || response?.resultcode === 0) && response?.data) {
        pageData = response.data;
        console.log('🔍 [realAPI] getTunnelSketchList 使用格式3: 标准响应格式');
      }

      if (pageData) {
        const result = {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
        console.log('✅ [realAPI] getTunnelSketchList 返回数据:', result);
        return result;
      }
      
      console.warn('⚠️ [realAPI] getTunnelSketchList 无法解析响应格式');
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getTunnelSketchList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取钻探数据（地质预报-钻探）
   * 钻探法包含：超前水平钻(method=13)和加深炮孔(method=14)
   */
  async getDrillingList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
    try {
      if (!params.siteId) {
        console.error('❌ [realAPI] getDrillingList siteId 是必填参数');
        return { records: [], total: 0, current: 1, size: 10, pages: 0 };
      }

      const queryParams = {
        siteId: params.siteId,
        type: 4,  // 4=钻探法（包含超前水平钻method=13和加深炮孔method=14）
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };

      console.log('🚀 [realAPI] getDrillingList 调用参数:', params);
      console.log('📤 [realAPI] 钻探请求参数:', queryParams);

      const response = await get<any>('/api/v1/ztf/list', { params: queryParams });
      console.log('🔍 [realAPI] getDrillingList 响应:', response);
      console.log('🔍 [realAPI] getDrillingList 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容多种响应格式
      let pageData = null;
      
      // 格式1: 直接返回分页数据 { records, total, ... }
      if (response && response.records !== undefined) {
        pageData = response;
        console.log('🔍 [realAPI] getDrillingList 使用格式1: 直接分页数据');
      }
      // 格式2: 包装在 ztfIPage 字段中 { ztfIPage: { records, total, ... } }
      else if (response && response.ztfIPage) {
        pageData = response.ztfIPage;
        console.log('🔍 [realAPI] getDrillingList 使用格式2: ztfIPage字段');
      }
      // 格式3: 包装在 cqspzIPage 字段中（超前水平钻）
      else if (response && response.cqspzIPage) {
        pageData = response.cqspzIPage;
        console.log('🔍 [realAPI] getDrillingList 使用格式3: cqspzIPage字段');
      }
      // 格式4: 包装在 jspkIPage 字段中（加深炮孔）
      else if (response && response.jspkIPage) {
        pageData = response.jspkIPage;
        console.log('🔍 [realAPI] getDrillingList 使用格式4: jspkIPage字段');
      }
      // 格式5: 标准响应格式 { resultcode: 200, data: { records, ... } }
      else if ((response?.resultcode === 200 || response?.resultcode === 0) && response?.data) {
        pageData = response.data;
        console.log('🔍 [realAPI] getDrillingList 使用格式5: 标准响应格式');
      }

      if (pageData) {
        const result = {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
        console.log('✅ [realAPI] getDrillingList 返回数据:', result);
        return result;
      }
      
      console.warn('⚠️ [realAPI] getDrillingList 无法解析响应格式');
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

      // /api/v1/dbbc/list 是 GET 请求
      const queryParams = {
        siteId: params.siteId,
        type: 5,  // 5=地表补充（type必填，method不填）
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 15
      };

      console.log('🚀 [realAPI] getSurfaceSupplementList 调用参数:', params);
      console.log('📤 [realAPI] 地表补充请求参数（GET）:', queryParams);

      const response = await get<any>('/api/v1/dbbc/list', { params: queryParams });
      console.log('🔍 [realAPI] getSurfaceSupplementList 原始响应:', response);
      console.log('🔍 [realAPI] getSurfaceSupplementList 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容多种响应格式
      let pageData = null;
      
      // 格式1: 直接返回分页数据 { records, total, ... }
      if (response && response.records !== undefined) {
        pageData = response;
        console.log('🔍 [realAPI] getSurfaceSupplementList 使用格式1: 直接分页数据');
      }
      // 格式2: 包装在 dbbcIPage 字段中 { dbbcIPage: { records, total, ... } }
      // 根据swagger-api-docs.json，返回DbbcPageVO，包含dbbcIPage
      else if (response && response.dbbcIPage) {
        pageData = response.dbbcIPage;
        console.log('🔍 [realAPI] getSurfaceSupplementList 使用格式2: dbbcIPage字段');
      }
      // 格式3: 标准响应格式 { resultcode: 200, data: { records, ... } }
      else if ((response?.resultcode === 200 || response?.resultcode === 0) && response?.data) {
        // data 可能是 DbbcPageVO（包含dbbcIPage）或直接是分页数据
        if (response.data.dbbcIPage) {
          pageData = response.data.dbbcIPage;
          console.log('🔍 [realAPI] getSurfaceSupplementList 使用格式3a: data.dbbcIPage');
        } else if (response.data.records !== undefined) {
        pageData = response.data;
          console.log('🔍 [realAPI] getSurfaceSupplementList 使用格式3b: data直接是分页数据');
        } else {
          pageData = response.data;
          console.log('🔍 [realAPI] getSurfaceSupplementList 使用格式3c: data');
        }
      }

      if (pageData) {
        const result = {
          records: pageData.records || [],
          total: pageData.total || 0,
          current: pageData.current || 1,
          size: pageData.size || 10,
          pages: pageData.pages || 1
        };
        console.log('✅ [realAPI] getSurfaceSupplementList 返回数据:', result);
        // 打印第一条记录的所有字段，帮助调试ID问题
        if (result.records.length > 0) {
          console.log('🔍 [realAPI] getSurfaceSupplementList 第一条记录的所有字段:', Object.keys(result.records[0]));
          console.log('🔍 [realAPI] getSurfaceSupplementList 第一条记录详情:', JSON.stringify(result.records[0], null, 2));
          // 特别检查ID字段
          const firstRecord = result.records[0];
          console.log('🔍 [realAPI] ID字段检查 - dbbcPk:', firstRecord.dbbcPk, ', ybPk:', firstRecord.ybPk, ', dbbcId:', firstRecord.dbbcId, ', ybId:', firstRecord.ybId);
        }
        return result;
      }
      
      console.warn('⚠️ [realAPI] getSurfaceSupplementList 无法解析响应格式');
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    } catch (error) {
      console.error('❌ [realAPI] getSurfaceSupplementList 异常:', error);
      return { records: [], total: 0, current: 1, size: 10, pages: 1 };
    }
  }

  /**
   * 获取地表补充信息（单个记录）
   * @param ybPk 预报主键（根据api-docs.json，API路径为 /api/v1/dbbc/{ybPk}）
   */
  async getSurfaceSupplementInfo(ybPk: string): Promise<any> {
    try {
      console.log('🔍 [realAPI] getSurfaceSupplementInfo 请求, ybPk:', ybPk);
      const apiPath = `/api/v1/dbbc/${ybPk}`;
      console.log('🔍 [realAPI] getSurfaceSupplementInfo API路径:', apiPath);
      const response = await get<any>(apiPath);
      console.log('🔍 [realAPI] getSurfaceSupplementInfo 响应:', response);
      console.log('🔍 [realAPI] getSurfaceSupplementInfo 响应的所有键:', response ? Object.keys(response) : 'null');

      // 兼容两种响应格式：
      // 1. 直接返回数据对象 {ybPk, dbbcPk, ...}
      // 2. 包装格式 {resultcode: 200, data: {...}}
      if (response) {
        // 如果响应直接包含ybPk或dbbcPk，说明是直接返回的数据
        if (response.ybPk || response.dbbcPk) {
          console.log('✅ [realAPI] getSurfaceSupplementInfo 直接返回数据');
          console.log('🔍 [realAPI] getSurfaceSupplementInfo 数据详情:', JSON.stringify(response, null, 2));
          return response;
        }
        // 如果是包装格式
        if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
          console.log('✅ [realAPI] getSurfaceSupplementInfo 包装格式返回');
          console.log('🔍 [realAPI] getSurfaceSupplementInfo 数据详情:', JSON.stringify(response.data, null, 2));
          return response.data;
        }
      }
      console.warn('⚠️ [realAPI] getSurfaceSupplementInfo 响应异常:', response);
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getSurfaceSupplementInfo 异常:', error);
      return null;
    }
  }

  // ========== 文件上传API方法 ==========

  /**
   * 上传物探法文件（通用方法）
   * @param method 物探方法代码 (1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC)
   * @param ybPk 预报主键
   * @param siteId 工点ID
   * @param files 文件对象 { pic1?: File, pic2?: File, ... }
   */
  async uploadGeophysicalFiles(
    method: number,
    ybPk: string,
    siteId: string,
    files: { [key: string]: File }
  ): Promise<{ success: boolean; message?: string }> {
    console.log('🚀 [realAPI] uploadGeophysicalFiles 被调用:', { method, ybPk, siteId, filesKeys: Object.keys(files) });
    
    try {
      // 根据 method 确定 API 路径
      let apiPath = '';
      switch (method) {
        case 1:
          apiPath = `/api/v1/wtf/tsp/${ybPk}/file`;
          break;
        case 2:
          apiPath = `/api/v1/wtf/hsp/${ybPk}/file`;
          break;
        case 3:
          apiPath = `/api/v1/wtf/ldsn/${ybPk}/file`;
          break;
        case 4:
          apiPath = `/api/v1/wtf/dcbfs/${ybPk}/file`;
          break;
        case 5:
          apiPath = `/api/v1/wtf/gfbzld/${ybPk}/file`;
          break;
        case 6:
          apiPath = `/api/v1/wtf/sbdc/${ybPk}/file`;
          break;
        case 9:
          apiPath = `/api/v1/wtf/wzjc/${ybPk}/file`;
          break;
        default:
          console.error('❌ [realAPI] uploadGeophysicalFiles 不支持的 method:', method);
          return { success: false, message: '不支持的物探方法' };
      }

      // ybPk 和 siteId 作为 query 参数，文件通过 FormData 上传
      const queryString = `?ybPk=${ybPk}&siteId=${encodeURIComponent(siteId)}`;
      const fullApiPath = `${apiPath}${queryString}`;

      // 构建 FormData - 只放文件
      const formData = new FormData();

      // 添加文件（pic1, pic2, pic3 等）
      let hasFile = false;
      Object.keys(files).forEach(key => {
        const file = files[key];
        if (file && file instanceof File) {
          formData.append(key, file, file.name);
          hasFile = true;
          console.log('📎 [realAPI] 添加文件:', {
            fieldName: key,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          });
        } else {
          console.warn('⚠️ [realAPI] 文件无效:', key, file);
        }
      });

      if (!hasFile) {
        console.error('❌ [realAPI] 没有有效的文件要上传');
        return { success: false, message: '没有有效的文件要上传' };
      }

      console.log('📤 [realAPI] uploadGeophysicalFiles:', { method, ybPk, siteId, files: Object.keys(files), fullApiPath });

      // POST 请求，ybPk/siteId 在 URL query 中，文件在 FormData 中
      const response = await post<any>(fullApiPath, formData);

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] uploadGeophysicalFiles 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadGeophysicalFiles 失败:', response?.message || response);
        return { success: false, message: response?.message || '文件上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadGeophysicalFiles 异常:', error);
      return { success: false, message: error?.message || '文件上传异常' };
    }
  }

  /**
   * 上传地表补充文件
   * @param ybPk 预报主键
   * @param siteId 工点ID
   * @param files 文件对象 { addition?: File }
   */
  async uploadSurfaceSupplementFiles(
    ybPk: string,
    siteId: string,
    files: { addition?: File }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('ybPk', ybPk);
      formData.append('siteId', siteId);

      if (files.addition) {
        formData.append('addition', files.addition);
      }

      console.log('📤 [realAPI] uploadSurfaceSupplementFiles 上传文件:', { ybPk, siteId });

      const response = await post<any>(`/api/v1/dbbc/${ybPk}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] uploadSurfaceSupplementFiles 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadSurfaceSupplementFiles 失败:', response?.message || response);
        return { success: false, message: response?.message || '文件上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadSurfaceSupplementFiles 异常:', error);
      return { success: false, message: error?.message || '文件上传异常' };
    }
  }

  /**
   * 上传钻探法（超前水平钻）文件
   * @param ybPk 预报主键
   * @param siteId 工点ID
   * @param files 文件对象
   */
  async uploadDrillingFiles(
    ybPk: string,
    siteId: string,
    method: number,
    files: { [key: string]: File }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('ybPk', ybPk);
      formData.append('siteId', siteId);

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      // 根据 method 确定路径
      const apiPath = method === 14 
        ? `/api/v1/ztf/jspk/${ybPk}/file` 
        : `/api/v1/ztf/cqspz/${ybPk}/file`;

      console.log('📤 [realAPI] uploadDrillingFiles 上传文件:', { ybPk, siteId, method });

      const response = await post<any>(apiPath, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] uploadDrillingFiles 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadDrillingFiles 失败:', response?.message || response);
        return { success: false, message: response?.message || '文件上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadDrillingFiles 异常:', error);
      return { success: false, message: error?.message || '文件上传异常' };
    }
  }

  /**
   * 上传掌子面素描文件
   */
  async uploadPalmSketchFiles(
    ybPk: string,
    siteId: string,
    files: { [key: string]: File }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('ybPk', ybPk);
      formData.append('siteId', siteId);

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      console.log('📤 [realAPI] uploadPalmSketchFiles 上传文件:', { ybPk, siteId });

      const response = await post<any>(`/api/v1/zzmsm/${ybPk}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] uploadPalmSketchFiles 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadPalmSketchFiles 失败:', response?.message || response);
        return { success: false, message: response?.message || '文件上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadPalmSketchFiles 异常:', error);
      return { success: false, message: error?.message || '文件上传异常' };
    }
  }

  /**
   * 上传洞身素描文件
   */
  async uploadTunnelSketchFiles(
    ybPk: string,
    siteId: string,
    files: { [key: string]: File }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('ybPk', ybPk);
      formData.append('siteId', siteId);

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      console.log('📤 [realAPI] uploadTunnelSketchFiles 上传文件:', { ybPk, siteId });

      const response = await post<any>(`/api/v1/dssm/${ybPk}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response === true || response?.resultcode === 200 || response?.resultcode === 0) {
        console.log('✅ [realAPI] uploadTunnelSketchFiles 成功');
        return { success: true };
      } else {
        console.error('❌ [realAPI] uploadTunnelSketchFiles 失败:', response?.message || response);
        return { success: false, message: response?.message || '文件上传失败' };
      }
    } catch (error: any) {
      console.error('❌ [realAPI] uploadTunnelSketchFiles 异常:', error);
      return { success: false, message: error?.message || '文件上传异常' };
    }
  }

  /**
   * 获取洞身素描详情
   * @param ybPk 预报主键
   */
  async getTunnelSketchDetail(ybPk: number): Promise<any> {
    try {
      console.log('🔍 [realAPI] getTunnelSketchDetail 请求, ybPk:', ybPk);
      const response = await get<any>(`/api/v1/dssm/${ybPk}`);
      console.log('🔍 [realAPI] getTunnelSketchDetail 响应:', response);

      // 处理响应格式
      if (response && typeof response === 'object') {
        if (response.resultcode === 200 && response.data) {
          console.log('✅ [realAPI] getTunnelSketchDetail 成功, 数据:', response.data);
          return response.data;
        } else if (response.ybPk || response.dssmPk) {
          // 直接返回数据对象
          return response;
        }
      }
      console.warn('⚠️ [realAPI] getTunnelSketchDetail 无数据');
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

  /**
   * 获取水平声波剖面详情 (HSP)
   */
  async getHspDetail(ybPk: string): Promise<any> {
    try {
      console.log('🔍 [realAPI] getHspDetail 请求, ybPk:', ybPk);
      const response = await get<any>(`/api/v1/wtf/hsp/${ybPk}`);
      console.log('🔍 [realAPI] getHspDetail 响应:', response);

      // 处理两种可能的响应格式（和 getTspDetail 一致）
      // 1. 标准格式：{ resultcode: 200/0, data: {...} }
      if ((response.resultcode === 200 || response.resultcode === 0) && response.data) {
        console.log('✅ [realAPI] getHspDetail 成功 (标准格式), 数据:', response.data);
        console.log('🔍 [realAPI] getHspDetail ybId:', response.data.ybId, 'hspPk:', response.data.hspPk, 'hspId:', response.data.hspId);
        return response.data;
      }
      // 2. 直接返回数据对象：{ ybPk: ..., hspPk: ..., ... }
      if (response.ybPk || response.hspPk) {
        console.log('✅ [realAPI] getHspDetail 成功 (直接数据), ybId:', response.ybId);
        return response;
      }

      console.warn('⚠️ [realAPI] getHspDetail 失败, resultcode:', response.resultcode, 'message:', response.message);
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getHspDetail 异常:', error);
      return null;
    }
  }

  /**
   * 获取陆地声呐详情 (LDSN)
   */
  async getLdsnDetail(ybPk: string): Promise<any> {
    try {
      console.log('🔍 [realAPI] getLdsnDetail 请求, ybPk:', ybPk);
      const response = await get<any>(`/api/v1/wtf/ldsn/${ybPk}`);
      console.log('🔍 [realAPI] getLdsnDetail 响应:', response);
      console.log('🔍 [realAPI] getLdsnDetail 响应类型:', typeof response);
      console.log('🔍 [realAPI] getLdsnDetail 响应keys:', response ? Object.keys(response) : 'null');

      // api.ts 的 defaultTransform 已经解包了 data 字段
      // 所以响应直接就是数据对象
      
      // 如果响应存在且是对象，直接返回
      if (response && typeof response === 'object') {
        console.log('✅ [realAPI] getLdsnDetail 成功');
        return response;
      }

      console.warn('⚠️ [realAPI] getLdsnDetail 响应为空或格式错误:', response);
      return null;
    } catch (error: any) {
      // 如果是业务错误（resultcode不为0/200），defaultTransform会抛出错误
      // 这里捕获并返回null，让调用方降级处理
      console.error('❌ [realAPI] getLdsnDetail 异常:', error?.message || error);
      return null;
    }
  }

  /**
   * 获取电磁波反射详情 (DCBFS)
   */
  async getDcbfsDetail(ybPk: string): Promise<any> {
    try {
      console.log('🔍 [realAPI] getDcbfsDetail 请求, ybPk:', ybPk);
      const response = await get<any>(`/api/v1/wtf/dcbfs/${ybPk}`);
      console.log('🔍 [realAPI] getDcbfsDetail 响应:', response);
      console.log('🔍 [realAPI] getDcbfsDetail 响应类型:', typeof response);
      console.log('🔍 [realAPI] getDcbfsDetail 响应keys:', response ? Object.keys(response) : 'null');
      console.log('🔍 [realAPI] getDcbfsDetail dcbfsPk:', response?.dcbfsPk, 'dcbfsId:', response?.dcbfsId);
      
      // api.ts 的 defaultTransform 已经解包了 data 字段
      // 所以响应直接就是数据对象
      if (response && typeof response === 'object') {
        console.log('✅ [realAPI] getDcbfsDetail 成功');
        return response;
      }

      console.warn('⚠️ [realAPI] getDcbfsDetail 响应为空或格式错误:', response);
      return null;
    } catch (error: any) {
      console.error('❌ [realAPI] getDcbfsDetail 异常:', error?.message || error);
      return null;
    }
  }

  /**
   * 获取高分辨直流电详情 (GFBZLD)
   */
  async getGfbzldDetail(ybPk: string): Promise<any> {
    try {
      const response = await get<any>(`/api/v1/wtf/gfbzld/${ybPk}`);
      if ((response.resultcode === 200 || response.code === 200) && response.data) return response.data;
      if (response.ybPk) return response;
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getGfbzldDetail 异常:', error);
      return null;
    }
  }

  /**
   * 获取瞬变电磁详情 (SBDC)
   */
  async getSbdcDetail(ybPk: string): Promise<any> {
    try {
      const response = await get<any>(`/api/v1/wtf/sbdc/${ybPk}`);
      if ((response.resultcode === 200 || response.code === 200) && response.data) return response.data;
      if (response.ybPk) return response;
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getSbdcDetail 异常:', error);
      return null;
    }
  }

  /**
   * 获取微震监测详情 (WZJC)
   */
  async getWzjcDetail(ybPk: string): Promise<any> {
    try {
      const response = await get<any>(`/api/v1/wtf/wzjc/${ybPk}`);
      if ((response.resultcode === 200 || response.code === 200) && response.data) return response.data;
      if (response.ybPk) return response;
      return null;
    } catch (error) {
      console.error('❌ [realAPI] getWzjcDetail 异常:', error);
      return null;
    }
  }

  /**
   * 根据方法代码获取物探法详情
   * method: 1=TSP, 2=HSP, 3=LDSN, 4=DCBFS, 5=GFBZLD, 6=SBDC, 9=WZJC
   */
  async getGeophysicalDetailByMethod(method: number | string, ybPk: string): Promise<any> {
    const m = typeof method === 'string' ? parseInt(method) : method;
    switch (m) {
      case 1: return this.getTspDetail(ybPk);
      case 2: return this.getHspDetail(ybPk);
      case 3: return this.getLdsnDetail(ybPk);
      case 4: return this.getDcbfsDetail(ybPk);
      case 5: return this.getGfbzldDetail(ybPk);
      case 6: return this.getSbdcDetail(ybPk);
      case 9: return this.getWzjcDetail(ybPk);
      default:
        console.warn('⚠️ [realAPI] 未知物探法方法代码:', method, '，ybPk:', ybPk);
        return null;
    }
  }
}

// 导出单例
const realAPI = new RealAPIService();
export default realAPI;
