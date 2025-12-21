import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Message,
  Tabs,
  Grid,
  Spin,
  Space,
  Empty,
  Upload,
  Modal,
  Radio
} from '@arco-design/web-react'
import { IconLeft, IconSave } from '@arco-design/web-react/icon'
import apiAdapter from '../services/apiAdapter'
import TspSegmentsTab from './tabs/TspSegmentsTab'
import TspSystemTab from './tabs/TspSystemTab'
import TspParamsTab from './tabs/TspParamsTab'

const { TextArea } = Input
const TabPane = Tabs.TabPane

// 预报方法映射
const METHOD_MAP: Record<number, string> = {
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
}

function GeologyForecastEditPage() {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type: string; id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const methodParam = searchParams.get('method')

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<any>(null)
  const [ybjgList, setYbjgList] = useState<any[]>([])
  const [tspPdList, setTspPdList] = useState<any[]>([])
  const [tspBxList, setTspBxList] = useState<any[]>([])
  const [zkList, setZkList] = useState<any[]>([])
  const [ldsnCdList, setLdsnCdList] = useState<any[]>([]) // LDSN测点信息列表
  const [dcbfsCxList, setDcbfsCxList] = useState<any[]>([]) // DCBFS测线布置信息列表
  const [editZkVisible, setEditZkVisible] = useState(false)
  const [currentZk, setCurrentZk] = useState<any>(null)
  const [currentZkIndex, setCurrentZkIndex] = useState<number>(-1)
  const [zkForm] = Form.useForm()
  // LDSN测点弹窗状态
  const [ldsnCdModalVisible, setLdsnCdModalVisible] = useState(false)
  const [currentLdsnCd, setCurrentLdsnCd] = useState<any>(null)
  const [currentLdsnCdIndex, setCurrentLdsnCdIndex] = useState<number>(-1)
  const [ldsnCdForm] = Form.useForm()
  // DCBFS测线弹窗状态
  const [dcbfsCxModalVisible, setDcbfsCxModalVisible] = useState(false)
  const [currentDcbfsCx, setCurrentDcbfsCx] = useState<any>(null)
  const [currentDcbfsCxIndex, setCurrentDcbfsCxIndex] = useState<number>(-1)
  const [dcbfsCxForm] = Form.useForm()
  // GFBZLD电极距掌子面距离表状态
  const [gfbzldDjList, setGfbzldDjList] = useState<any[]>([]) // 电极距掌子面距离列表
  const [gfbzldDjModalVisible, setGfbzldDjModalVisible] = useState(false)
  const [currentGfbzldDj, setCurrentGfbzldDj] = useState<any>(null)
  const [currentGfbzldDjIndex, setCurrentGfbzldDjIndex] = useState<number>(-1)
  const [gfbzldDjForm] = Form.useForm()
  
  // 文件上传状态（用于 GFBZLD 等需要文件上传的方法）
  const [uploadingFile, setUploadingFile] = useState(false)

  // 判断是否为新增模式
  const isCreateMode = id === 'new';
  const siteId = searchParams.get('siteId');

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      if (!id || !type) return;

      // 新增模式：初始化空表单
      if (isCreateMode) {
        console.log('📝 [编辑页面] 新增模式，初始化空表单');
        const initialData = {
          method: methodParam ? parseInt(methodParam) : undefined,
          siteId: siteId,
          dkname: 'DK',
          monitordate: new Date().toISOString().replace('T', ' ').split('.')[0],
        };
        form.setFieldsValue(initialData);
        setRecord(initialData);
        return;
      }

      setLoading(true);
      try {
        let data = null;

        // 尝试从路由状态获取（作为缓存/降级）
        if (location.state?.record) {
          data = location.state.record;
        }

        // 如果是 TSP (物探法 & method=1)，优先调用详情接口
        if (type === 'geophysical' && String(methodParam) === '1') {
          try {
            const detail = await apiAdapter.getTspDetail(id);
            console.log('📥 [编辑页面] TSP详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] TSP详情数据Keys:', Object.keys(detail));
              // 检查列表字段
              if (detail.tspPddataDTOList) console.log('📦 发现 tspPddataDTOList, 长度:', detail.tspPddataDTOList.length);
              if (detail.tspPddataVOList) console.log('📦 发现 tspPddataVOList, 长度:', detail.tspPddataVOList.length);
              data = detail;
            }
          } catch (e) {
            console.error('获取TSP详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 HSP (物探法 & method=2)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '2') {
          try {
            const detail = await apiAdapter.getHspDetail(id);
            console.log('📥 [编辑页面] HSP详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] HSP详情数据Keys:', Object.keys(detail));
              console.log('🔑 [调试] HSP ybId:', detail.ybId, 'hspPk:', detail.hspPk, 'hspId:', detail.hspId);
              data = detail;
            }
          } catch (e) {
            console.error('获取HSP详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 LDSN (物探法 & method=3)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '3') {
          try {
            const detail = await apiAdapter.getLdsnDetail(id);
            console.log('📥 [编辑页面] LDSN详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] LDSN详情数据Keys:', Object.keys(detail));
              console.log('🔑 [调试] LDSN ybId:', detail.ybId, 'ldsnPk:', detail.ldsnPk, 'ldsnId:', detail.ldsnId);
              data = detail;
            }
          } catch (e) {
            console.error('获取LDSN详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 DCBFS (物探法 & method=4)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '4') {
          try {
            const detail = await apiAdapter.getDcbfsDetail(id);
            console.log('📥 [编辑页面] DCBFS详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] DCBFS详情数据Keys:', Object.keys(detail));
              console.log('🔑 [调试] DCBFS ybId:', detail.ybId, 'dcbfsPk:', detail.dcbfsPk, 'dcbfsId:', detail.dcbfsId);
              console.log('🔑 [调试] DCBFS dcbfsResultinfoVOList:', detail.dcbfsResultinfoVOList);
              console.log('🔑 [调试] DCBFS dcbfsResultinfoDTOList:', detail.dcbfsResultinfoDTOList);
              data = detail;
            }
          } catch (e) {
            console.error('获取DCBFS详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 GFBZLD (物探法 & method=5)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '5') {
          try {
            const detail = await apiAdapter.getGfbzldDetail(id);
            console.log('📥 [编辑页面] GFBZLD详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] GFBZLD详情数据Keys:', Object.keys(detail));
              data = detail;
            }
          } catch (e) {
            console.error('获取GFBZLD详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 SBDC (物探法 & method=6)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '6') {
          try {
            const detail = await apiAdapter.getSbdcDetail(id);
            console.log('📥 [编辑页面] SBDC详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] SBDC详情数据Keys:', Object.keys(detail));
              data = detail;
            }
          } catch (e) {
            console.error('获取SBDC详情失败，使用列表数据降级', e);
          }
        }

        // 如果是 WZJC (物探法 & method=7 微震监测预报)，调用详情接口
        if (type === 'geophysical' && String(methodParam) === '7') {
          try {
            const detail = await apiAdapter.getWzjcDetail(id);
            console.log('📥 [编辑页面] WZJC详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] WZJC详情数据Keys:', Object.keys(detail));
              data = detail;
            }
          } catch (e) {
            console.error('获取WZJC详情失败，使用列表数据降级', e);
          }
        }

        // 如果是掌子面素描，调用详情接口
        if (type === 'palmSketch') {
          try {
            const detail = await apiAdapter.getPalmSketchDetail(id);
            console.log('📥 [编辑页面] 掌子面素描详情数据:', detail);
            if (detail) {
              data = detail;
            } else {
              console.error('❌ [编辑页面] 掌子面素描详情API返回null');
              Message.error('未找到掌子面素描数据');
              data = null;
            }
          } catch (e) {
            console.error('❌ [编辑页面] 获取掌子面素描详情失败:', e);
            Message.error('获取详情失败：' + (e instanceof Error ? e.message : '未知错误'));
            data = null;
          }
        }

        // 如果是洞身素描，调用详情接口
        if (type === 'tunnelSketch') {
          try {
            const detail = await apiAdapter.getTunnelSketchDetail(id);
            if (detail) {
              data = detail;
            }
          } catch (e) {
            console.error('获取洞身素描详情失败', e);
          }
        }

        // 如果是钻探法，调用详情接口
        if (type === 'drilling') {
          try {
            console.log('🔍 [编辑页面] 钻探法类型，method:', methodParam);
            // method=13 超前水平钻, method=14 加深炮孔
            const detail = await apiAdapter.getDrillingDetail(id, methodParam);
            console.log('📥 [编辑页面] 钻探法详情数据:', detail);
            if (detail) {
              data = detail;
            } else {
              console.error('❌ [编辑页面] 钻探法详情API返回null');
              Message.error('未找到钻探法数据');
              data = null;
            }
          } catch (e) {
            console.error('❌ [编辑页面] 获取钻探法详情失败:', e);
            Message.error('获取详情失败：' + (e instanceof Error ? e.message : '未知错误'));
            data = null;
          }
        }

        if (data) {
          setRecord(data);
          // 初始化子列表数据
          if (data.ybjgVOList) {
            setYbjgList(data.ybjgVOList);
          } else if (data.ybjgDTOList) {
            setYbjgList(data.ybjgDTOList);
          }

          // 初始化 TSP 特有列表
          if (data.tspPddataDTOList) {
            setTspPdList(data.tspPddataDTOList);
          } else if (data.tspPddataVOList) {
            setTspPdList(data.tspPddataVOList);
          } else if (data.tspPddataList) {
            setTspPdList(data.tspPddataList);
          }

          if (data.tspBxdataDTOList) {
            setTspBxList(data.tspBxdataDTOList);
          } else if (data.tspBxdataVOList) {
            setTspBxList(data.tspBxdataVOList);
          } else if (data.tspBxdataList) {
            setTspBxList(data.tspBxdataList);
          }

          // 初始化钻探法钻孔列表
          if (data.cqspzZkzzVOList) {
            setZkList(data.cqspzZkzzVOList);
            console.log('🔍 [编辑页面] 钻孔列表数据:', data.cqspzZkzzVOList);
          }

          // 初始化LDSN测点列表
          if (data.ldsnResultinfoVOList) {
            setLdsnCdList(data.ldsnResultinfoVOList);
            console.log('🔍 [编辑页面] LDSN测点列表数据:', data.ldsnResultinfoVOList);
          } else if (data.ldsnResultinfoDTOList) {
            setLdsnCdList(data.ldsnResultinfoDTOList);
            console.log('🔍 [编辑页面] LDSN测点列表数据(DTO):', data.ldsnResultinfoDTOList);
          }

          // 初始化DCBFS测线布置列表
          console.log('🔍 [编辑页面] 检查DCBFS测线列表 - dcbfsResultinfoVOList:', data.dcbfsResultinfoVOList, 'dcbfsResultinfoDTOList:', data.dcbfsResultinfoDTOList);
          if (data.dcbfsResultinfoVOList && data.dcbfsResultinfoVOList.length > 0) {
            console.log('🔍 [编辑页面] 设置DCBFS测线列表(VO):', data.dcbfsResultinfoVOList);
            setDcbfsCxList(data.dcbfsResultinfoVOList);
          } else if (data.dcbfsResultinfoDTOList && data.dcbfsResultinfoDTOList.length > 0) {
            console.log('🔍 [编辑页面] 设置DCBFS测线列表(DTO):', data.dcbfsResultinfoDTOList);
            setDcbfsCxList(data.dcbfsResultinfoDTOList);
          } else {
            console.log('🔍 [编辑页面] DCBFS测线列表为空或不存在');
          }

          // 初始化GFBZLD电极距掌子面距离列表
          if (data.gfbzldResultinfoVOList && data.gfbzldResultinfoVOList.length > 0) {
            console.log('🔍 [编辑页面] 设置GFBZLD电极列表(VO):', data.gfbzldResultinfoVOList);
            setGfbzldDjList(data.gfbzldResultinfoVOList);
          } else if (data.gfbzldResultinfoDTOList && data.gfbzldResultinfoDTOList.length > 0) {
            console.log('🔍 [编辑页面] 设置GFBZLD电极列表(DTO):', data.gfbzldResultinfoDTOList);
            setGfbzldDjList(data.gfbzldResultinfoDTOList);
          } else {
            console.log('🔍 [编辑页面] GFBZLD电极列表为空或不存在');
          }

          // 格式化日期
          const formattedDate = data.monitordate
            ? new Date(data.monitordate).toISOString().replace('T', ' ').split('.')[0]
            : undefined;

          // 物探法里程拆分：将 dkilo 拆分为对应的字段用于表单显示
          let dkiloKm, dkiloM, hspDkiloKm, hspDkiloM, sdkilo, dkiloMeter;
          if (type === 'geophysical' && data.dkilo !== undefined && data.dkilo !== null) {
            if (methodParam === '2') {
              // HSP 使用单独的字段名 hspDkiloKm/hspDkiloM
              hspDkiloKm = Math.floor(data.dkilo / 1000);
              hspDkiloM = data.dkilo % 1000;
            } else if (methodParam === '3' || methodParam === '4' || methodParam === '5' || methodParam === '6' || methodParam === '7' || methodParam === '0') {
              // LDSN(3), DCBFS(4), GFBZLD(5), SBDC(6), WZJC(7), 其他(0) - 使用 sdkilo/dkilo
              sdkilo = Math.floor(data.dkilo / 1000);
              dkiloMeter = data.dkilo % 1000;
              console.log('📝 [里程拆分] method=' + methodParam + ', 原始dkilo=' + data.dkilo + ', sdkilo=' + sdkilo + ', dkilo(米)=' + dkiloMeter);
            } else {
              // TSP(1) 等其他物探法 - 使用 dkiloKm/dkiloM
              dkiloKm = Math.floor(data.dkilo / 1000);
              dkiloM = data.dkilo % 1000;
            }
          }

          const formData = {
            ...data,
            monitordate: formattedDate,
            ...(methodParam === '2' && { hspDkiloKm, hspDkiloM }),
            ...((methodParam === '3' || methodParam === '4' || methodParam === '5' || methodParam === '6' || methodParam === '7' || methodParam === '0') && { sdkilo, dkilo: dkiloMeter }),
            ...(type === 'geophysical' && methodParam === '1' && { dkiloKm, dkiloM })
          };

          console.log('📝 [编辑页面] 准备填充到表单的数据:', formData);
          console.log('📝 [编辑页面] 表单数据的所有键:', Object.keys(formData));

          form.setFieldsValue(formData);

          console.log('✅ [编辑页面] 表单数据已填充');
          console.log('🔍 [编辑页面] 当前表单值:', form.getFieldsValue());
        } else {
          console.error('❌ [编辑页面] 无数据可显示');
          // 数据为null，表单保持空白
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
        Message.error('初始化数据失败');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, type, methodParam, location.state]);

  const handleSave = async () => {
    console.log('💾 保存数据 - 原始record:', record);
    console.log('💾 保存数据 - record中的关键字段:', {
      ldsnPk: record?.ldsnPk,
      ldsnId: record?.ldsnId,
      dcbfsPk: record?.dcbfsPk,
      dcbfsId: record?.dcbfsId,
      hspPk: record?.hspPk,
      hspId: record?.hspId,
    });
    
    // 获取表单所有字段值
    const formValues = form.getFieldsValue();
    console.log('💾 保存数据 - 表单值:', formValues);
    
    // 合并 record 和表单值
    const allValues = { ...record, ...formValues };
    console.log('💾 保存数据 - 合并后:', allValues);
    console.log('💾 保存数据 - 合并后关键字段:', {
      ldsnPk: allValues?.ldsnPk,
      ldsnId: allValues?.ldsnId,
    });
    
    let values = allValues;
      
    try {
      if (!type) {
        Message.warning('缺少必要参数');
        return;
      }

      setLoading(true);

      // 构建提交数据
      console.log('💾 [handleSave] 当前 ybjgList 状态:', ybjgList);
      console.log('💾 [handleSave] ybjgList 长度:', ybjgList?.length);
      
      const submitData = {
        ...values,
        ybjgDTOList: ybjgList,
        tspPddataDTOList: tspPdList,
        tspBxdataDTOList: tspBxList,
        ldsnResultinfoDTOList: ldsnCdList, // LDSN测点列表
        dcbfsResultinfoDTOList: dcbfsCxList, // DCBFS测线布置列表
        gfbzldResultinfoDTOList: gfbzldDjList, // GFBZLD电极距掌子面距离列表
      };
      
      console.log('💾 [handleSave] submitData.ybjgDTOList:', submitData.ybjgDTOList);
      console.log('💾 [handleSave] submitData.ybjgDTOList 长度:', submitData.ybjgDTOList?.length);

      // 确保必填字段存在（如果record中没有，尝试从其他来源获取）
      if (!submitData.siteId) {
        // 尝试从URL或其他地方获取siteId
        const urlParams = new URLSearchParams(window.location.search);
        const siteIdFromUrl = urlParams.get('siteId');
        if (siteIdFromUrl) {
          submitData.siteId = siteIdFromUrl;
        } else {
          console.warn('⚠️ 缺少siteId字段，可能导致保存失败');
        }
      }

      // 确保method字段存在
      if (!submitData.method && methodParam) {
        submitData.method = parseInt(methodParam);
      }

      // 物探法里程合并：将 dkiloKm/dkiloM 或 hspDkiloKm/hspDkiloM 或 sdkilo/dkilo 合并为 dkilo
      if (type === 'geophysical') {
        if (methodParam === '2') {
          // HSP - 使用 hspDkiloKm/hspDkiloM
          const km = submitData.hspDkiloKm || 0;
          const m = submitData.hspDkiloM || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.hspDkiloKm;
          delete submitData.hspDkiloM;
        } else if (methodParam === '3' || methodParam === '4' || methodParam === '5' || methodParam === '6' || methodParam === '7' || methodParam === '0') {
          // LDSN(3), DCBFS(4), GFBZLD(5), SBDC(6), WZJC(7), 其他(0) - 使用 sdkilo/dkilo
          // sdkilo 是公里数，dkilo 是米数，需要合并为总米数
          const km = submitData.sdkilo || 0;
          const m = submitData.dkilo || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.sdkilo;
          console.log('💾 [里程合并] method=' + methodParam + ', sdkilo=' + km + ', dkilo(米)=' + m + ', 合并后dkilo=' + submitData.dkilo);
        } else {
          // TSP(1) 等其他物探法 - 使用 dkiloKm/dkiloM
          const km = submitData.dkiloKm || 0;
          const m = submitData.dkiloM || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.dkiloKm;
          delete submitData.dkiloM;
        }
      }

      console.log('💾 保存数据 - 合并后:', submitData);

      let result = null;

      // 新增模式：调用创建API
      if (isCreateMode) {
        console.log('💾 [新增模式] 调用创建API');
        switch (type) {
          case 'geophysical':
            // 如果是TSP (method=1)，调用 createTsp
            if (String(methodParam) === '1') {
              console.log('💾 [新增模式] 调用 createTsp API');
              // 数据清洗与格式化
              const tspData = {
                ...submitData,
                // 确保数值字段为数字类型
                jfpknum: submitData.jfpknum ? Number(submitData.jfpknum) : undefined,
                jfpksd: submitData.jfpksd ? Number(submitData.jfpksd) : undefined,
                jfpkzj: submitData.jfpkzj ? Number(submitData.jfpkzj) : undefined,
                jfpkjdmgd: submitData.jfpkjdmgd ? Number(submitData.jfpkjdmgd) : undefined,
                jfpkjj: submitData.jfpkjj ? Number(submitData.jfpkjj) : undefined,
                jspknum: submitData.jspknum ? Number(submitData.jspknum) : undefined,
                jspksd: submitData.jspksd ? Number(submitData.jspksd) : undefined,
                jspkzj: submitData.jspkzj ? Number(submitData.jspkzj) : undefined,
                jspkjdmgd: submitData.jspkjdmgd ? Number(submitData.jspkjdmgd) : undefined,

                leftkilo: submitData.leftkilo ? Number(submitData.leftkilo) : undefined,
                rightkilo: submitData.rightkilo ? Number(submitData.rightkilo) : undefined,
                leftjgdczjl: submitData.leftjgdczjl ? Number(submitData.leftjgdczjl) : undefined,
                rightjgdczjl: submitData.rightjgdczjl ? Number(submitData.rightjgdczjl) : undefined,
                leftzxjl: submitData.leftzxjl ? Number(submitData.leftzxjl) : undefined,
                rightzxjl: submitData.rightzxjl ? Number(submitData.rightzxjl) : undefined,
                leftjdmgd: submitData.leftjdmgd ? Number(submitData.leftjdmgd) : undefined,
                rightjdmgd: submitData.rightjdmgd ? Number(submitData.rightjdmgd) : undefined,
                leftks: submitData.leftks ? Number(submitData.leftks) : undefined,
                rightks: submitData.rightks ? Number(submitData.rightks) : undefined,
                leftqj: submitData.leftqj ? Number(submitData.leftqj) : undefined,
                rightqj: submitData.rightqj ? Number(submitData.rightqj) : undefined,

                // 确保日期格式为 ISO 8601 字符串 (如果后端需要) 或者保持 YYYY-MM-DD HH:mm:ss
                // 这里假设后端能处理 '2025-12-09 15:22:18' 这种格式，如果不行尝试 ISOString
                monitordate: submitData.monitordate ? new Date(submitData.monitordate).toISOString() : undefined,

                // 确保布尔/枚举值为数字
                kwwz: submitData.kwwz ? Number(submitData.kwwz) : undefined,
                method: 1
              };
              console.log('🧹 [数据清洗] TSP提交数据:', tspData);
              result = await apiAdapter.createTsp(tspData);
            } else {
              result = await apiAdapter.createGeophysicalMethod(submitData, methodParam);
            }
            break;
          case 'palmSketch':
            result = await apiAdapter.createPalmSketch(submitData);
            break;
          case 'tunnelSketch':
            result = await apiAdapter.createTunnelSketch(submitData);
            break;
          case 'drilling':
            const drillingCreateData = { ...submitData, cqspzZkzzVOList: zkList };
            result = await apiAdapter.createDrilling(drillingCreateData);
            break;
          case 'surface':
            result = await apiAdapter.createSurfaceSupplement(submitData);
            break;
          default:
            Message.error('不支持的类型');
            setLoading(false);
            return;
        }
      } else {
        // 编辑模式：调用更新API
        // 确定实际的记录ID（不同类型使用不同的主键）
        let actualId = id;
        if (type === 'geophysical' && submitData.ybPk) {
          actualId = String(submitData.ybPk);
        } else if (type === 'palmSketch' && submitData.zzmsmPk) {
          actualId = String(submitData.zzmsmPk);
        } else if (type === 'tunnelSketch' && submitData.dssmPk) {
          actualId = String(submitData.dssmPk);
        } else if (type === 'drilling' && submitData.ztfPk) {
          actualId = String(submitData.ztfPk);
        } else if (type === 'surface' && submitData.dbbcPk) {
          actualId = String(submitData.dbbcPk);
        }

        console.log('💾 使用的实际ID:', actualId);

        switch (type) {
          case 'geophysical':
            result = await apiAdapter.updateGeophysical(actualId!, submitData, methodParam);
            break;
          case 'palmSketch':
            // 掌子面素描需要包含完整数据
            const palmSketchData = {
              ...submitData,
              ybjgDTOList: ybjgList,  // 包含分段列表
            };
            result = await apiAdapter.updatePalmSketch(actualId!, palmSketchData);
            break;
          case 'tunnelSketch':
            // 洞身素描需要包含完整数据
            const tunnelSketchData = {
              ...submitData,
              ybjgDTOList: ybjgList,  // 包含分段列表
            };
            result = await apiAdapter.updateTunnelSketch(actualId!, tunnelSketchData);
            break;
          case 'drilling':
            // 钻探法需要包含钻孔列表数据
            const drillingData = {
              ...submitData,
              cqspzZkzzVOList: zkList  // 包含钻孔列表
            };
            result = await apiAdapter.updateDrilling(actualId!, drillingData);
            break;
          case 'surface':
            // 地表补充需要包含分段列表数据
            const surfaceData = {
              ...submitData,
              ybjgDTOList: ybjgList  // 包含分段列表
            };
            result = await apiAdapter.updateSurfaceSupplement(actualId!, surfaceData);
            break;
          default:
            Message.error('不支持的类型');
            setLoading(false);
            return;
        }
      }

      console.log('💾 保存结果:', result);
      if (result?.success) {
        Message.success('保存成功');
        navigate(-1); // 返回上一页
      } else {
        Message.error((result as any)?.message || '保存失败，请检查数据格式');
      }
    } catch (error: any) {
      console.error('❌ 保存失败:', error);
      if (error?.message) {
        Message.error(`保存失败: ${error.message}`);
      } else {
        Message.error('表单验证失败，请检查必填项');
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理局部保存（用于子列表即时更新）
  const handlePartialSave = async (partialData: any) => {
    if (!id || !type) return;

    try {
      // setLoading(true); // 局部保存可以不全屏loading，或者用轻量提示
      const values = form.getFieldsValue();

      // 合并数据 - 保留所有现有列表数据，只更新 partialData 中指定的部分
      const submitData = {
        ...record,
        ...values,
        // 关键修复：如果 partialData 中有列表，使用它；否则使用当前状态（而不是 record）
        ybjgDTOList: partialData.ybjgDTOList !== undefined ? partialData.ybjgDTOList : ybjgList,
        tspPddataDTOList: partialData.tspPddataDTOList !== undefined ? partialData.tspPddataDTOList : tspPdList,
        tspBxdataDTOList: partialData.tspBxdataDTOList !== undefined ? partialData.tspBxdataDTOList : tspBxList,
        ldsnResultinfoDTOList: partialData.ldsnResultinfoDTOList !== undefined ? partialData.ldsnResultinfoDTOList : ldsnCdList,
        dcbfsResultinfoDTOList: partialData.dcbfsResultinfoDTOList !== undefined ? partialData.dcbfsResultinfoDTOList : dcbfsCxList,
        ...partialData // 覆盖其他字段
      };

      // 同步更新本地状态
      if (partialData.tspPddataDTOList) {
        setTspPdList(partialData.tspPddataDTOList);
      }
      if (partialData.tspBxdataDTOList) {
        setTspBxList(partialData.tspBxdataDTOList);
      }
      if (partialData.ybjgDTOList) {
        setYbjgList(partialData.ybjgDTOList);
      }
      if (partialData.ldsnResultinfoDTOList) {
        setLdsnCdList(partialData.ldsnResultinfoDTOList);
      }
      if (partialData.dcbfsResultinfoDTOList) {
        setDcbfsCxList(partialData.dcbfsResultinfoDTOList);
      }

      // 确定实际的记录ID（不同类型使用不同的主键）
      let actualId = id;
      if (type === 'geophysical' && submitData.ybPk) {
        actualId = String(submitData.ybPk);
      } else if (type === 'palmSketch' && submitData.zzmsmPk) {
        actualId = String(submitData.zzmsmPk);
      } else if (type === 'tunnelSketch' && submitData.dssmPk) {
        actualId = String(submitData.dssmPk);
      } else if (type === 'drilling' && submitData.ztfPk) {
        actualId = String(submitData.ztfPk);
      }

      // 物探法里程合并：将 sdkilo/dkilo 合并为 dkilo
      if (type === 'geophysical') {
        if (methodParam === '2') {
          // HSP - 使用 hspDkiloKm/hspDkiloM
          const km = submitData.hspDkiloKm || 0;
          const m = submitData.hspDkiloM || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.hspDkiloKm;
          delete submitData.hspDkiloM;
        } else if (methodParam === '3' || methodParam === '4' || methodParam === '5' || methodParam === '6' || methodParam === '7' || methodParam === '0') {
          // LDSN(3), DCBFS(4), GFBZLD(5), SBDC(6), WZJC(7), 其他(0) - 使用 sdkilo/dkilo
          const km = submitData.sdkilo || 0;
          const m = submitData.dkilo || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.sdkilo;
          console.log('💾 [局部保存-里程合并] method=' + methodParam + ', sdkilo=' + km + ', dkilo(米)=' + m + ', 合并后dkilo=' + submitData.dkilo);
        } else {
          // TSP(1) 等其他物探法 - 使用 dkiloKm/dkiloM
          const km = submitData.dkiloKm || 0;
          const m = submitData.dkiloM || 0;
          submitData.dkilo = km * 1000 + m;
          delete submitData.dkiloKm;
          delete submitData.dkiloM;
        }
      }

      console.log('💾 [局部保存] type:', type);
      console.log('💾 [局部保存] partialData:', partialData);
      console.log('💾 [局部保存] submitData 列表长度:', {
        ybjgDTOList: submitData.ybjgDTOList?.length,
        tspPddataDTOList: submitData.tspPddataDTOList?.length,
        tspBxdataDTOList: submitData.tspBxdataDTOList?.length
      });

      let result = null;
      switch (type) {
        case 'geophysical':
          result = await apiAdapter.updateGeophysical(actualId, submitData, methodParam);
          break;
        case 'palmSketch':
          result = await apiAdapter.updatePalmSketch(actualId, submitData);
          break;
        case 'tunnelSketch':
          result = await apiAdapter.updateTunnelSketch(actualId, submitData);
          break;
        case 'drilling':
          result = await apiAdapter.updateDrilling(actualId, submitData);
          break;
        default:
          Message.error('不支持的类型');
          return;
      }

      if (result?.success) {
        Message.success('更新已保存');
        setRecord(submitData); // 更新本地记录
      } else {
        Message.error(result?.message || '更新失败');
      }
    } catch (error: any) {
      console.error('局部保存失败:', error);
      Message.error('更新失败: ' + error.message);
    }
  };

  // 文件上传处理（用于 GFBZLD 等需要单独上传文件的方法）
  const handleFileUpload = async (file: File, fieldName: string) => {
    console.log('📤 [文件上传] 检查参数:', { id, record, siteId: record?.siteId });
    
    if (!id || id === 'new' || !record?.siteId) {
      Message.warning('请先保存基本信息后再上传文件');
      return { status: 'error' };
    }

    try {
      setUploadingFile(true);
      const method = Number(methodParam);
      const ybPk = record.ybPk || id;
      // 优先从 record 获取 siteId，如果没有则从 URL 参数获取
      const siteId = record.siteId || searchParams.get('siteId') || '';
      
      console.log('📤 [文件上传] 开始上传:', { method, ybPk, siteId, fieldName, fileName: file.name });
      
      // 构建文件对象
      const files: { [key: string]: File } = { [fieldName]: file };
      
      const result = await apiAdapter.uploadGeophysicalFiles(method, String(ybPk), siteId, files);
      
      if (result?.success) {
        Message.success(`${fieldName} 上传成功`);
        return { status: 'done', response: result };
      } else {
        Message.error(result?.message || '文件上传失败');
        return { status: 'error' };
      }
    } catch (error: any) {
      console.error('文件上传失败:', error);
      Message.error('文件上传失败: ' + error.message);
      return { status: 'error' };
    } finally {
      setUploadingFile(false);
    }
  };

  // 根据预报方法获取专用标签页标题
  const getMethodSpecificTabTitle = (method: string | null) => {
    switch (method) {
      case '1': return 'TSP观测系统及设备信息';
      case '2': return 'HSP观测系统及设备信息';
      case '3': return 'LDSN观测系统及设备信息';
      case '4': return 'DCBFS观测系统及设备信息';
      case '5': return 'GFBZLD观测系统及设备信息';
      case '6': return 'SBDC观测系统及设备信息';
      case '7': return 'WZJC观测系统及设备信息';
      default: return '观测系统及设备信息';
    }
  };

  // 根据预报方法渲染专用内容
  const renderMethodSpecificContent = (method: string | null) => {
    switch (method) {
      case '1': // TSP 地震波反射
        return <TspSystemTab />;
      case '2': // HSP 水平声波剖面
      case '3': // LDSN 陆地声呐
      case '4': // DCBFS 电磁波反射
      case '5': // GFBZLD 高分辨直流电
      case '6': // SBDC 瞬变电磁
      case '7': // WZJC 微震监测
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty description={`${METHOD_MAP[Number(method)] || '该方法'}的专用界面正在开发中`} />
          </div>
        );
      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty description="请选择具体的预报方法" />
          </div>
        );
    }
  };

  // 根据类型和方法渲染不同的表单内容
  const renderFormContent = () => {
    console.log('🎯 [编辑页面] 渲染条件检查:', {
      type,
      methodParam,
      typeCheck: type === 'geophysical',
      shouldShowTabs: type === 'geophysical',
      methodName: METHOD_MAP[Number(methodParam)] || '未知方法'
    });

    // 掌子面素描的复杂表单
    if (type === 'palmSketch') {
      return (
        <Tabs type="line">
          <TabPane key="basic" title="基本信息">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="预报时间" field="monitordate">
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="里程" field="dkname">
                    <Input placeholder="例如: DK" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="里程位置" field="dkilo">
                    <InputNumber style={{ width: '100%' }} placeholder="里程数值" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监测人" field="monitorname">
                    <Input placeholder="监测人" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监测人编号" field="monitorno">
                    <Input placeholder="监测人编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监测人电话" field="monitortel">
                    <Input placeholder="监测人电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="检测人" field="testname">
                    <Input placeholder="检测人" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人编号" field="testno">
                    <Input placeholder="检测人编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人电话" field="testtel">
                    <Input placeholder="检测人电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监理人" field="supervisorname">
                    <Input placeholder="监理人" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监理人编号" field="supervisorno">
                    <Input placeholder="监理人编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监理人电话" field="supervisortel">
                    <Input placeholder="监理人电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="预报方式" field="method">
                    <Input placeholder="预报方式" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="掌子面状态" field="zzmzt">
                    <Input placeholder="掌子面状态" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>预报结论及位置</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="预报结论内容" field="conclusionyb">
                    <TextArea rows={4} placeholder="请输入预报结论内容" maxLength={500} showWordLimit />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>掌子面素描图</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="掌子面素描图" field="zzmsmpic">
                    <Input placeholder="掌子面素描图文件路径或上传" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="围岩基本分级" field="basicwylevel">
                    <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="I-VI级" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="修正级别" field="fixwylevel">
                    <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="修正后级别" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报长度" field="ybLength">
                    <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="距洞口距离" field="jdkjl">
                    <InputNumber style={{ width: '100%' }} placeholder="距洞口距离(m)" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="处理措施" field="suggestion">
                    <TextArea rows={4} placeholder="请输入处理措施" maxLength={256} showWordLimit />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
          <TabPane key="face_info" title="其他信息及基土体数据信息">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>掌子面信息</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="距洞口距离(m)" field="jdkjl">
                    <InputNumber style={{ width: '100%' }} placeholder="距洞口距离" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="开挖宽度(m)" field="kwkd">
                    <InputNumber style={{ width: '100%' }} placeholder="开挖宽度" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="开挖高度(m)" field="kwgd">
                    <InputNumber style={{ width: '100%' }} placeholder="开挖高度" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="开挖面积(m²)" field="kwmj">
                    <InputNumber style={{ width: '100%' }} placeholder="开挖面积" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="掌子面状态" field="zzmzt">
                    <Input placeholder="掌子面状态描述" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="开挖方式补充" field="kwfs2">
                    <Input placeholder="例如：全断面法" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>围岩等级</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="围岩基本分级(I-VI)" field="basicwylevel">
                    <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="1-6" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="修正后围岩级别" field="fixwylevel">
                    <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="1-6" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="渗水量(L/(min·10m))" field="shenshuiliang">
                    <InputNumber style={{ width: '100%' }} placeholder="渗水量" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="地下水评定" field="dxspd">
                    <Select placeholder="请选择">
                      <Select.Option value={1}>潮湿</Select.Option>
                      <Select.Option value={2}>淋雨</Select.Option>
                      <Select.Option value={3}>涌流</Select.Option>
                    </Select>
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
          <TabPane key="rock_soil" title="掌子面数据">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>掌子面围岩信息</div>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="围岩基本分级" field="basicwylevel">
                    <Select placeholder="请选择">
                      <Select.Option value={1}>Ⅰ</Select.Option>
                      <Select.Option value={2}>Ⅱ</Select.Option>
                      <Select.Option value={3}>Ⅲ</Select.Option>
                      <Select.Option value={4}>Ⅳ</Select.Option>
                      <Select.Option value={5}>Ⅴ</Select.Option>
                      <Select.Option value={6}>Ⅵ</Select.Option>
                    </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="渗水量" field="shenshuiliang">
                    <InputNumber style={{ width: '100%' }} placeholder="渗水量" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="地下水评定" field="dxspd">
                    <Select placeholder="请选择">
                      <Select.Option value={1}>潮湿</Select.Option>
                      <Select.Option value={2}>点滴状出水</Select.Option>
                      <Select.Option value={3}>淋雨</Select.Option>
                      <Select.Option value={4}>涌流</Select.Option>
                    </Select>
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="埋深H" field="maishenH">
                    <InputNumber style={{ width: '100%' }} placeholder="埋深H" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="评估基准" field="pinggujijun">
                    <Input placeholder="评估基准" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="修正后围岩级别" field="fixwylevel">
                    <Select placeholder="请选择">
                      <Select.Option value={1}>Ⅰ</Select.Option>
                      <Select.Option value={2}>Ⅱ</Select.Option>
                      <Select.Option value={3}>Ⅲ</Select.Option>
                      <Select.Option value={4}>Ⅳ</Select.Option>
                      <Select.Option value={5}>Ⅴ</Select.Option>
                      <Select.Option value={6}>Ⅵ</Select.Option>
                    </Select>
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="初始地应力评定" field="csdylpd">
                    <Select placeholder="请选择">
                      <Select.Option value="一般地应力">一般地应力</Select.Option>
                      <Select.Option value="较高地应力">较高地应力</Select.Option>
                      <Select.Option value="高地应力">高地应力</Select.Option>
                    </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="地质构造应力状态" field="dzgzylzt">
                    <Input placeholder="地质构造应力状态" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="初始地应力其他描述" field="csdylqtms">
                    <Input placeholder="初始地应力其他描述" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="掌子面简要描述" field="zzmjyms">
                    <TextArea
                      rows={6}
                      placeholder="请输入掌子面简要描述..."
                      maxLength={2000}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
          <TabPane key="segments" title="分段信息及灾下大趋向">
            <TspSegmentsTab
              form={form}
              ybjgList={ybjgList}
              onListChange={setYbjgList}
              onRemoteSave={handlePartialSave}
            />
          </TabPane>
          <TabPane key="attachments" title="附件及成果上传">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>预报成果图片</div>

              <Grid.Row gutter={16}>
                <Grid.Col span={8}>
                  <div style={{
                    border: '1px solid #E5E6EB',
                    borderRadius: '2px',
                    padding: '20px',
                    backgroundColor: '#FAFAFA',
                    height: '240px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '16px',
                      color: '#1D2129'
                    }}>分段+测点选择</div>
                    <Form.Item field="addition" style={{ marginBottom: 0 }}>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        name="addition"
                        limit={1}
                        accept=".txt,.doc,.docx,.pdf"
                        data={{
                          ybPk: id,
                          siteId: form.getFieldValue('siteId')
                        }}
                        headers={{
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }}
                        tip="支持 txt、doc、docx、pdf 格式"
                      />
                    </Form.Item>
                    <div style={{ marginTop: '16px' }}>
                      <Button type="outline" size="small" style={{ width: '80px' }}>预览</Button>
                    </div>
                  </div>
                </Grid.Col>

                <Grid.Col span={8}>
                  <div style={{
                    border: '1px solid #E5E6EB',
                    borderRadius: '2px',
                    padding: '20px',
                    backgroundColor: '#FAFAFA',
                    height: '240px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '16px',
                      color: '#1D2129'
                    }}>地下开挖平剖面</div>
                    <Form.Item field="zzmsmpic" style={{ marginBottom: 0 }}>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        name="zzmsmpic"
                        limit={1}
                        accept=".jpg,.jpeg,.png,.pdf"
                        listType="picture-card"
                        data={{
                          ybPk: id,
                          siteId: form.getFieldValue('siteId')
                        }}
                        headers={{
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }}
                        tip="支持 jpg、png、pdf 格式"
                      />
                    </Form.Item>
                    <div style={{ marginTop: '16px' }}>
                      <Button type="outline" size="small" style={{ width: '80px' }}>预览</Button>
                    </div>
                  </div>
                </Grid.Col>

                <Grid.Col span={8}>
                  <div style={{
                    border: '1px solid #E5E6EB',
                    borderRadius: '2px',
                    padding: '20px',
                    backgroundColor: '#FAFAFA',
                    height: '240px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '16px',
                      color: '#1D2129'
                    }}>绘制统计图片</div>
                    <Form.Item field="images" style={{ marginBottom: 0 }}>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        name="images"
                        multiple
                        accept=".jpg,.jpeg,.png"
                        listType="picture-card"
                        data={{
                          ybPk: id,
                          siteId: form.getFieldValue('siteId')
                        }}
                        headers={{
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }}
                        tip="支持 jpg、png 格式，可上传多张"
                      />
                    </Form.Item>
                    <div style={{ marginTop: '16px' }}>
                      <Button type="outline" size="small" style={{ width: '80px' }}>预览</Button>
                    </div>
                  </div>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
        </Tabs>
      );
    }

    // 物探法的复杂表单（包含所有物探方法：地震波反射、水平声波剖面、陆地声呐等）
    if (type === 'geophysical') {
      // 陆地声呐有特殊的基本信息布局
      const isLDSN = methodParam === '3';
      // HSP 水平声波剖面有专门的4个选项卡
      const isHSP = methodParam === '2';

      // HSP 专用表单 - 4个选项卡
      if (isHSP) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报方法" field="method" disabled>
                      <Select placeholder="请选择">
                        {Object.entries(METHOD_MAP).map(([k, v]) => <Select.Option key={k} value={Number(k)}>{v}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="工点编号" field="siteId" disabled>
                      <Input placeholder="工点编号" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="hspDkiloKm" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber 
                            style={{ width: '100px' }} 
                            placeholder="0" 
                            min={0}
                            precision={0}
                          />
                        </Form.Item>
                        <span style={{ margin: '0 8px' }}>+</span>
                        <Form.Item field="hspDkiloM" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber 
                            style={{ width: '100px' }} 
                            placeholder="0" 
                            min={0}
                            max={999}
                            precision={0}
                          />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item 
                      label="预报长度" 
                      field="ybLength"
                      rules={[{ required: true, message: '请输入预报长度' }]}
                      extra="单位:m，保留2位小数，整数位不得超过5位"
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        placeholder="预报长度" 
                        precision={2}
                        step={1}
                        min={0}
                        max={99999.99}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人员" field="testname">
                      <Input placeholder="检测人员姓名" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人员编号" field="testno">
                      <Input placeholder="检测人员编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人员电话" field="testtel">
                      <Input placeholder="检测人员电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人员" field="monitorname">
                      <Input placeholder="监测人员姓名" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人员编号" field="monitorno">
                      <Input placeholder="监测人员编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人员电话" field="monitortel">
                      <Input placeholder="监测人员电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人员" field="supervisorname">
                      <Input placeholder="监理人员姓名" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人员编号" field="supervisorno">
                      <Input placeholder="监理人员编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人员电话" field="supervisortel">
                      <Input placeholder="监理人员电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>预报结论</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="预报结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="处理建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入处理建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={3} placeholder="请输入备注信息" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>水平波剖面观测系统信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="测区数量" field="cqnum" extra="整数，不可超过两位">
                      <InputNumber style={{ width: '100%' }} placeholder="请输入测区数量" min={0} max={99} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="测区测点数量" field="cdnum" extra="单位：m，保留1位小数，整数位不超过2位">
                      <InputNumber style={{ width: '100%' }} placeholder="请输入测区测点数量" min={0} max={99.9} precision={1} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="接收方式" field="jsfs">
                      <Select placeholder="请选择接收方式">
                        <Select.Option value="单点接收">单点接收</Select.Option>
                        <Select.Option value="多点接收">多点接收</Select.Option>
                        <Select.Option value="阵列接收">阵列接收</Select.Option>
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="设备名称" field="sbName">
                      <Input placeholder="请输入设备名称" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="attachments" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件及成果图上传</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="图片1" field="pic1">
                      <Upload
                        drag
                        action="/api/v1/hsp/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'pic1' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                        onChange={(fileList, file) => {
                          if (file.status === 'done') {
                            Message.success(`${file.name} 上传成功`);
                            // 更新表单字段
                            const resp = file.response as any;
                            if (resp?.data) {
                              form.setFieldValue('pic1', resp.data);
                            }
                          } else if (file.status === 'error') {
                            Message.error(`${file.name} 上传失败`);
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="图片2" field="pic2">
                      <Upload
                        drag
                        action="/api/v1/hsp/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'pic2' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                        onChange={(fileList, file) => {
                          if (file.status === 'done') {
                            Message.success(`${file.name} 上传成功`);
                            // 更新表单字段
                            const resp = file.response as any;
                            if (resp?.data) {
                              form.setFieldValue('pic2', resp.data);
                            }
                          } else if (file.status === 'error') {
                            Message.error(`${file.name} 上传失败`);
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }

      // LDSN 专用表单 - 4个选项卡
      if (isLDSN) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber 
                            style={{ width: '150px' }} 
                            placeholder="0" 
                            min={0}
                            precision={2}
                          />
                        </Form.Item>
                        <span style={{ margin: '0 8px' }}>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber 
                            style={{ width: '150px' }} 
                            placeholder="0" 
                            min={0}
                            precision={2}
                          />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item 
                      label="预报长度" 
                      field="ybLength"
                      rules={[{ required: true, message: '请输入预报长度' }]}
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        placeholder="预报长度(m)" 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname" rules={[{ required: true, message: '请输入检测人' }]}>
                      <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人身份证" field="testno" rules={[{ required: true, message: '请输入检测人身份证' }]}>
                      <Input placeholder="检测人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel" rules={[{ required: true, message: '请输入检测人电话' }]}>
                      <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人" field="monitorname" rules={[{ required: true, message: '请输入复核人' }]}>
                      <Input placeholder="复核人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno" rules={[{ required: true, message: '请输入复核人身份证' }]}>
                      <Input placeholder="复核人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel" rules={[{ required: true, message: '请输入复核人电话' }]}>
                      <Input placeholder="复核人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname" rules={[{ required: true, message: '请输入监理工程师' }]}>
                      <Input placeholder="监理工程师" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno" rules={[{ required: true, message: '请输入监理身份证' }]}>
                      <Input placeholder="监理身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel" rules={[{ required: true, message: '请输入监理电话' }]}>
                      <Input placeholder="监理电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>其他信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报分段结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入后续建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea rows={4} placeholder="请输入实际采取措施" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={4} placeholder="请输入备注" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>观测系统信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="测线条数" field="cxnum" rules={[{ required: true, message: '请输入测线条数' }]} extra="整数，不可超过两位">
                      <InputNumber style={{ width: '100%' }} placeholder="请输入测线条数" min={0} max={99} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                      <Input placeholder="请输入设备名称" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>测点信息表</div>
                <div style={{ marginBottom: '16px' }}>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      setCurrentLdsnCd({ cdxh: ldsnCdList.length + 1, jgdjl: undefined, jzxjl: undefined });
                      setCurrentLdsnCdIndex(-1);
                      ldsnCdForm.resetFields();
                      ldsnCdForm.setFieldsValue({ cdxh: ldsnCdList.length + 1 });
                      setLdsnCdModalVisible(true);
                    }}
                  >
                    + 新增
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F8FA' }}>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb', width: '80px' }}>测点序号</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>距拱顶距离</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>距中线距离</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb', width: '100px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ldsnCdList.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', border: '1px solid #e5e6eb' }}>
                          <Empty description="暂无数据" />
                        </td>
                      </tr>
                    ) : (
                      ldsnCdList.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.cdxh}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.jgdjl}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.jzxjl}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>
                            <Space>
                              <Button 
                                type="text" 
                                size="small"
                                onClick={() => {
                                  setCurrentLdsnCd(item);
                                  setCurrentLdsnCdIndex(index);
                                  ldsnCdForm.setFieldsValue(item);
                                  setLdsnCdModalVisible(true);
                                }}
                              >
                                编辑
                              </Button>
                              <Button 
                                type="text" 
                                status="danger" 
                                size="small"
                                onClick={() => {
                                  const newList = ldsnCdList.filter((_, i) => i !== index);
                                  setLdsnCdList(newList);
                                }}
                              >
                                删除
                              </Button>
                            </Space>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* LDSN测点信息弹窗 */}
                <Modal
                  title={currentLdsnCdIndex === -1 ? '新增测点' : '编辑测点'}
                  visible={ldsnCdModalVisible}
                  onOk={() => {
                    ldsnCdForm.validate().then((values) => {
                      if (currentLdsnCdIndex === -1) {
                        // 新增
                        setLdsnCdList([...ldsnCdList, values]);
                      } else {
                        // 编辑
                        const newList = [...ldsnCdList];
                        newList[currentLdsnCdIndex] = values;
                        setLdsnCdList(newList);
                      }
                      setLdsnCdModalVisible(false);
                      ldsnCdForm.resetFields();
                    });
                  }}
                  onCancel={() => {
                    setLdsnCdModalVisible(false);
                    ldsnCdForm.resetFields();
                  }}
                  okText="确认"
                  cancelText="取消"
                >
                  <Form form={ldsnCdForm} layout="inline">
                    <Form.Item 
                      label="测点序号" 
                      field="cdxh" 
                      rules={[{ required: true, message: '请输入测点序号' }]}
                    >
                      <InputNumber placeholder="" min={1} precision={0} style={{ width: '120px' }} />
                    </Form.Item>
                    <Form.Item 
                      label="距拱顶距离" 
                      field="jgdjl" 
                      rules={[{ required: true, message: '请输入距拱顶距离' }]}
                    >
                      <InputNumber placeholder="" min={0} max={99.9} precision={1} style={{ width: '120px' }} />
                    </Form.Item>
                    <Form.Item 
                      label="距左线距离" 
                      field="jzxjl" 
                      rules={[{ required: true, message: '请输入距左线距离' }]}
                    >
                      <InputNumber placeholder="" min={0} max={99.9} precision={1} style={{ width: '120px' }} />
                    </Form.Item>
                  </Form>
                </Modal>
              </div>
            </TabPane>

            <TabPane key="attachments" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="原始文件" field="originalfile">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'originalfile' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="附件（其他报告）" field="addition">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'addition' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="作业现场图像" field="images">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'images' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="观测系统布置图" field="gcxtpic">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'gcxtpic' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="剖面图灰阶" field="pic1">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'pic1' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="测线布置图" field="pic2">
                      <Upload
                        drag
                        action="/api/v1/ldsn/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'pic2' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }

      // DCBFS 专用表单 - 4个选项卡 (电磁波反射)
      const isDCBFS = methodParam === '4';
      if (isDCBFS) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" min={0} precision={2} />
                        </Form.Item>
                        <span style={{ margin: '0 8px' }}>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" min={0} precision={2} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item label="预报长度" field="ybLength" rules={[{ required: true, message: '请输入预报长度' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" precision={2} min={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname" rules={[{ required: true, message: '请输入检测人' }]}>
                      <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人身份证" field="testno" rules={[{ required: true, message: '请输入检测人身份证' }]}>
                      <Input placeholder="检测人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel" rules={[{ required: true, message: '请输入检测人电话' }]}>
                      <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人" field="monitorname" rules={[{ required: true, message: '请输入复核人' }]}>
                      <Input placeholder="复核人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno" rules={[{ required: true, message: '请输入复核人身份证' }]}>
                      <Input placeholder="复核人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel" rules={[{ required: true, message: '请输入复核人电话' }]}>
                      <Input placeholder="复核人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname" rules={[{ required: true, message: '请输入监理工程师' }]}>
                      <Input placeholder="监理工程师" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno" rules={[{ required: true, message: '请输入监理身份证' }]}>
                      <Input placeholder="监理身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel" rules={[{ required: true, message: '请输入监理电话' }]}>
                      <Input placeholder="监理电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>其他信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报分段结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入后续建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea rows={4} placeholder="请输入实际采取措施" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={4} placeholder="请输入备注" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>电磁波反射观测系统信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="测线数量" field="cxnum" rules={[{ required: true, message: '请输入测线数量' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="请输入测线数量" min={0} max={99} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                      <Input placeholder="请输入设备名称，如: SIR-20" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="天线工作频率" field="gzpl" rules={[{ required: true, message: '请输入天线工作频率' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="单位: MHz" min={0} max={999} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>测线布置信息表 (当前: {dcbfsCxList.length} 条)</div>
                <div style={{ marginBottom: '16px' }}>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      setCurrentDcbfsCxIndex(-1);
                      setCurrentDcbfsCx(null);
                      dcbfsCxForm.resetFields();
                      dcbfsCxForm.setFieldsValue({ cxxh: dcbfsCxList.length + 1 });
                      setDcbfsCxModalVisible(true);
                    }}
                  >
                    + 新增
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F8FA' }}>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>测线序号</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>起点X像素</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>起点Y像素</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>终点X像素</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>终点Y像素</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb', width: '100px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcbfsCxList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', border: '1px solid #e5e6eb' }}>
                          <Empty description="暂无数据" />
                        </td>
                      </tr>
                    ) : (
                      dcbfsCxList.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.cxxh}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.qdzbx}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.qdzby}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.zdzbx}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.zdzby}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>
                            <Space>
                              <Button 
                                type="text" 
                                size="small"
                                onClick={() => {
                                  setCurrentDcbfsCx(item);
                                  setCurrentDcbfsCxIndex(index);
                                  dcbfsCxForm.setFieldsValue(item);
                                  setDcbfsCxModalVisible(true);
                                }}
                              >
                                编辑
                              </Button>
                              <Button 
                                type="text" 
                                status="danger" 
                                size="small"
                                onClick={async () => {
                                  const newList = dcbfsCxList.filter((_, i) => i !== index);
                                  setDcbfsCxList(newList);
                                  // 同步到后端
                                  if (handlePartialSave) {
                                    await handlePartialSave({ dcbfsResultinfoDTOList: newList });
                                  }
                                }}
                              >
                                删除
                              </Button>
                            </Space>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* DCBFS测线布置信息弹窗 */}
                <Modal
                  title={currentDcbfsCxIndex === -1 ? '新增测线' : '编辑测线'}
                  visible={dcbfsCxModalVisible}
                  onOk={async () => {
                    try {
                      const values = await dcbfsCxForm.validate();
                      let newList: any[];
                      if (currentDcbfsCxIndex === -1) {
                        // 新增
                        newList = [...dcbfsCxList, values];
                      } else {
                        // 编辑
                        newList = [...dcbfsCxList];
                        newList[currentDcbfsCxIndex] = { ...newList[currentDcbfsCxIndex], ...values };
                      }
                      setDcbfsCxList(newList);
                      setDcbfsCxModalVisible(false);
                      dcbfsCxForm.resetFields();
                      // 同步到后端
                      if (handlePartialSave) {
                        await handlePartialSave({ dcbfsResultinfoDTOList: newList });
                      }
                    } catch (e) {
                      // 表单验证失败
                    }
                  }}
                  onCancel={() => {
                    setDcbfsCxModalVisible(false);
                    dcbfsCxForm.resetFields();
                  }}
                  okText="确认"
                  cancelText="取消"
                >
                  <Form form={dcbfsCxForm} layout="vertical">
                    <Form.Item 
                      label="测线序号" 
                      field="cxxh" 
                      rules={[{ required: true, message: '请输入测线序号' }]}
                    >
                      <InputNumber placeholder="序号由1开始递增" min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Grid.Row gutter={16}>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="起点X像素" 
                          field="qdzbx" 
                          rules={[{ required: true, message: '请输入起点X像素' }]}
                        >
                          <InputNumber placeholder="" precision={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="起点Y像素" 
                          field="qdzby" 
                          rules={[{ required: true, message: '请输入起点Y像素' }]}
                        >
                          <InputNumber placeholder="" precision={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Grid.Col>
                    </Grid.Row>
                    <Grid.Row gutter={16}>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="终点X像素" 
                          field="zdzbx" 
                          rules={[{ required: true, message: '请输入终点X像素' }]}
                        >
                          <InputNumber placeholder="" precision={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="终点Y像素" 
                          field="zdzby" 
                          rules={[{ required: true, message: '请输入终点Y像素' }]}
                        >
                          <InputNumber placeholder="" precision={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Grid.Col>
                    </Grid.Row>
                  </Form>
                </Modal>
              </div>
            </TabPane>

            <TabPane key="attachments" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="原始文件" field="originalfile">
                      <Upload
                        drag
                        action="/api/v1/dcbfs/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'originalfile' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="附件（其他报告）" field="addition">
                      <Upload
                        drag
                        action="/api/v1/dcbfs/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'addition' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="作业现场图像" field="images">
                      <Upload
                        drag
                        action="/api/v1/dcbfs/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'images' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="观测系统布置图" field="gcxtpic">
                      <Upload
                        drag
                        action="/api/v1/dcbfs/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'gcxtpic' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="测线布置示意图" field="pic">
                      <Upload
                        drag
                        action="/api/v1/dcbfs/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'pic' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }

      // GFBZLD 专用表单 - 4个选项卡 (高分辨直流电)
      const isGFBZLD = methodParam === '5';
      if (isGFBZLD) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报方法" field="method">
                      <Select disabled placeholder="高分辨直流电">
                        <Select.Option value={5}>高分辨直流电</Select.Option>
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" min={0} precision={2} />
                        </Form.Item>
                        <span style={{ margin: '0 8px' }}>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" min={0} precision={2} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item label="预报长度" field="ybLength" rules={[{ required: true, message: '请输入预报长度' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" precision={2} min={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname" rules={[{ required: true, message: '请输入检测人' }]}>
                      <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人身份证" field="testno" rules={[{ required: true, message: '请输入检测人身份证' }]}>
                      <Input placeholder="检测人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel" rules={[{ required: true, message: '请输入检测人电话' }]}>
                      <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人" field="monitorname" rules={[{ required: true, message: '请输入复核人' }]}>
                      <Input placeholder="复核人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno" rules={[{ required: true, message: '请输入复核人身份证' }]}>
                      <Input placeholder="复核人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel" rules={[{ required: true, message: '请输入复核人电话' }]}>
                      <Input placeholder="复核人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname" rules={[{ required: true, message: '请输入监理工程师' }]}>
                      <Input placeholder="监理工程师" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno" rules={[{ required: true, message: '请输入监理身份证' }]}>
                      <Input placeholder="监理身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel" rules={[{ required: true, message: '请输入监理电话' }]}>
                      <Input placeholder="监理电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>其他信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报分段结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入后续建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea rows={4} placeholder="请输入实际采取措施" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={4} placeholder="请输入备注" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>高分辨直流电观测系统信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="供电电极数量" field="gddjnum" rules={[{ required: true, message: '请输入供电电极数量' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="请输入供电电极数量" min={0} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="测量电极测点数量" field="cldjnum" rules={[{ required: true, message: '请输入测量电极测点数量' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="请输入测量电极测点数量" min={0} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                      <Input placeholder="请输入设备名称" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="供电电压" field="gddy" rules={[{ required: true, message: '请输入供电电压' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="单位: V" min={0} precision={0} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="供电电流" field="gddl" rules={[{ required: true, message: '请输入供电电流' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="单位: A" min={0} precision={2} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>电极距掌子面距离表</div>
                <div style={{ marginBottom: '16px' }}>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      setCurrentGfbzldDjIndex(-1);
                      setCurrentGfbzldDj(null);
                      gfbzldDjForm.resetFields();
                      gfbzldDjForm.setFieldsValue({ djxh: gfbzldDjList.length + 1 });
                      setGfbzldDjModalVisible(true);
                    }}
                  >
                    + 新增
                  </Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F8FA' }}>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>电极序号</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>类型</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb' }}>距掌子面距离</th>
                      <th style={{ padding: '10px', border: '1px solid #e5e6eb', width: '100px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gfbzldDjList.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', border: '1px solid #e5e6eb' }}>
                          <Empty description="暂无数据" />
                        </td>
                      </tr>
                    ) : (
                      gfbzldDjList.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.djxh}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.djlx === 1 ? '供电电极' : '测量电极'}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>{item.jzzmjl}</td>
                          <td style={{ padding: '10px', border: '1px solid #e5e6eb', textAlign: 'center' }}>
                            <Space>
                              <Button 
                                type="text" 
                                size="small"
                                onClick={() => {
                                  setCurrentGfbzldDj(item);
                                  setCurrentGfbzldDjIndex(index);
                                  gfbzldDjForm.setFieldsValue(item);
                                  setGfbzldDjModalVisible(true);
                                }}
                              >
                                编辑
                              </Button>
                              <Button 
                                type="text" 
                                status="danger" 
                                size="small"
                                onClick={async () => {
                                  const newList = gfbzldDjList.filter((_, i) => i !== index);
                                  setGfbzldDjList(newList);
                                  if (handlePartialSave) {
                                    await handlePartialSave({ gfbzldResultinfoDTOList: newList });
                                  }
                                }}
                              >
                                删除
                              </Button>
                            </Space>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* GFBZLD电极距掌子面距离弹窗 */}
                <Modal
                  title={currentGfbzldDjIndex === -1 ? '新增电极' : '编辑电极'}
                  visible={gfbzldDjModalVisible}
                  onOk={async () => {
                    try {
                      const values = await gfbzldDjForm.validate();
                      let newList: any[];
                      if (currentGfbzldDjIndex === -1) {
                        newList = [...gfbzldDjList, values];
                      } else {
                        newList = [...gfbzldDjList];
                        newList[currentGfbzldDjIndex] = { ...newList[currentGfbzldDjIndex], ...values };
                      }
                      setGfbzldDjList(newList);
                      setGfbzldDjModalVisible(false);
                      gfbzldDjForm.resetFields();
                      if (handlePartialSave) {
                        await handlePartialSave({ gfbzldResultinfoDTOList: newList });
                      }
                    } catch (e) {
                      // 表单验证失败
                    }
                  }}
                  onCancel={() => {
                    setGfbzldDjModalVisible(false);
                    gfbzldDjForm.resetFields();
                  }}
                  okText="确认"
                  cancelText="取消"
                >
                  <Form form={gfbzldDjForm} layout="vertical">
                    <Grid.Row gutter={16}>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="电极序号" 
                          field="djxh" 
                          rules={[{ required: true, message: '请输入电极序号' }]}
                        >
                          <InputNumber placeholder="序号" precision={0} style={{ width: '100%' }} min={1} />
                        </Form.Item>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Form.Item 
                          label="类型" 
                          field="djlx" 
                          rules={[{ required: true, message: '请选择类型' }]}
                        >
                          <Select placeholder="请选择类型">
                            <Select.Option value={1}>供电电极</Select.Option>
                            <Select.Option value={2}>测量电极</Select.Option>
                          </Select>
                        </Form.Item>
                      </Grid.Col>
                    </Grid.Row>
                    <Grid.Row gutter={16}>
                      <Grid.Col span={24}>
                        <Form.Item 
                          label="距掌子面距离" 
                          field="jzzmjl" 
                          rules={[{ required: true, message: '请输入距掌子面距离' }]}
                        >
                          <InputNumber placeholder="单位: m" precision={2} style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Grid.Col>
                    </Grid.Row>
                  </Form>
                </Modal>
              </div>
            </TabPane>

            <TabPane key="attachments" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件及成果图信息</div>
                {isCreateMode && (
                  <div style={{ color: '#ff7d00', marginBottom: 16 }}>
                    提示：请先保存基本信息后再上传文件
                  </div>
                )}
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="成果图1 (pic1)">
                      <Upload
                        drag
                        disabled={isCreateMode || uploadingFile}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip={isCreateMode ? "请先保存基本信息" : "点击或拖拽上传图片"}
                        customRequest={async (options) => {
                          const { file, onSuccess, onError } = options;
                          const result = await handleFileUpload(file as File, 'pic1');
                          if (result.status === 'done') {
                            onSuccess?.(result.response);
                          } else {
                            onError?.(new Error('上传失败'));
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="成果图2 (pic2)">
                      <Upload
                        drag
                        disabled={isCreateMode || uploadingFile}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip={isCreateMode ? "请先保存基本信息" : "点击或拖拽上传图片"}
                        customRequest={async (options) => {
                          const { file, onSuccess, onError } = options;
                          const result = await handleFileUpload(file as File, 'pic2');
                          if (result.status === 'done') {
                            onSuccess?.(result.response);
                          } else {
                            onError?.(new Error('上传失败'));
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="成果图3 (pic3)">
                      <Upload
                        drag
                        disabled={isCreateMode || uploadingFile}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip={isCreateMode ? "请先保存基本信息" : "点击或拖拽上传图片"}
                        customRequest={async (options) => {
                          const { file, onSuccess, onError } = options;
                          const result = await handleFileUpload(file as File, 'pic3');
                          if (result.status === 'done') {
                            onSuccess?.(result.response);
                          } else {
                            onError?.(new Error('上传失败'));
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }

      // SBDC 专用表单 - 4个选项卡 (瞬变电磁)
      const isSBDC = methodParam === '6';
      if (isSBDC) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报方法" field="method">
                      <Select disabled placeholder="瞬变电磁">
                        <Select.Option value={6}>瞬变电磁</Select.Option>
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="瞬变电磁" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" precision={2} />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" precision={2} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item label="预报长度" field="ybLength" rules={[{ required: true, message: '请输入预报长度' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" precision={2} min={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname">
                      <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人身份证" field="testno">
                      <Input placeholder="检测人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel">
                      <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人" field="monitorname">
                      <Input placeholder="复核人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno">
                      <Input placeholder="复核人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel">
                      <Input placeholder="复核人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname">
                      <Input placeholder="监理工程师" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno">
                      <Input placeholder="监理身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel">
                      <Input placeholder="监理电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>其他信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报分段结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入后续建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea rows={4} placeholder="请输入实际采取措施" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={4} placeholder="请输入备注" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>瞬变电磁参数信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="采集装置类型" field="sbdcType" rules={[{ required: true, message: '请选择采集装置类型' }]}>
                      <Select placeholder="请选择">
                        <Select.Option value={1}>重叠回线</Select.Option>
                        <Select.Option value={2}>中心回线</Select.Option>
                        <Select.Option value={3}>偶级装置</Select.Option>
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="发射框位置里程" field="fskwzlc" extra="单位：m，保留2位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={2} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="发射框长" field="fskc" extra="单位：m，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="发射框宽" field="fskk" extra="单位：m，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="激发线圈匝数" field="jfxqzs" extra="单位：个，不超过3位整数">
                      <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="接收框长" field="jskc" extra="单位：m，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="接收框宽" field="jskk" extra="单位：m，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="接收框匝数" field="jskzs" extra="单位：个，不超过3位整数">
                      <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="接收线圈等效面积" field="jsxqdxmj" extra="单位：m²，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m²" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="收发距" field="sf" extra="单位：m，保留1位小数（仅偶级装置必填）">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="设备名称" field="sbName">
                      <Input placeholder="" maxLength={20} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>瞬变电磁成果信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="发射频率" field="fspl" extra="单位：Hz，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="Hz" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="供电电流" field="gddl" extra="单位：A，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="A" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="测量时间" field="clsj" extra="单位：ms，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="ms" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="盲区范围" field="mqfw" extra="单位：m，保留1位小数">
                      <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={16}>
                    <Form.Item label="测线布置描述" field="cxbzms">
                      <TextArea rows={2} placeholder="请输入测线布置描述" maxLength={200} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="attachment" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件及成果图信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="附件（word/pdf）" field="addition">
                      <Upload
                        drag
                        action="/api/v1/sbdc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'addition' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="作业现场照片" field="images">
                      <Upload
                        drag
                        action="/api/v1/sbdc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'images' }}
                        accept="image/*"
                        limit={5}
                        listType="picture-card"
                        tip="支持多张图片"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="成果图" field="cgt">
                      <Upload
                        drag
                        action="/api/v1/sbdc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'cgt' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }

      // WZJC 专用表单 - 4个选项卡 (微震监测预报)
      const isWZJC = methodParam === '7';
      if (isWZJC) {
        return (
          <Tabs type="line">
            <TabPane key="basic" title="基本信息及其他信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报方法" field="method">
                      <Select disabled placeholder="微震监测预报">
                        <Select.Option value={7}>微震监测预报</Select.Option>
                      </Select>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="微震监测预报" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" precision={2} />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber style={{ width: '150px' }} placeholder="0" precision={2} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item label="预报长度" field="ybLength" rules={[{ required: true, message: '请输入预报长度' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" precision={2} min={0} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname">
                      <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人身份证" field="testno">
                      <Input placeholder="检测人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel">
                      <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人" field="monitorname">
                      <Input placeholder="复核人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno">
                      <Input placeholder="复核人身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel">
                      <Input placeholder="复核人电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname">
                      <Input placeholder="监理工程师" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno">
                      <Input placeholder="监理身份证" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel">
                      <Input placeholder="监理电话" />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>

                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>其他信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea rows={4} placeholder="请输入预报分段结论" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea rows={4} placeholder="请输入后续建议" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea rows={4} placeholder="请输入实际采取措施" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea rows={4} placeholder="请输入备注" maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="segments" title="分段信息及下次超前地质预报">
              <TspSegmentsTab
                form={form}
                ybjgList={ybjgList}
                onListChange={setYbjgList}
                onRemoteSave={handlePartialSave}
              />
            </TabPane>

            <TabPane key="system_device" title="观测系统信息及设备信息">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>描述</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="监测信息" field="jcxx">
                      <TextArea placeholder="请输入监测信息" rows={4} maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="设备信息" field="sbxx">
                      <TextArea placeholder="请输入设备信息" rows={4} maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="成果信息" field="cgxx">
                      <TextArea placeholder="请输入成果信息" rows={4} maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="成果数据信息" field="cgsjxx">
                      <TextArea placeholder="请输入成果数据信息" rows={4} maxLength={512} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>

            <TabPane key="attachment" title="附件及成果图">
              <div style={{ padding: '20px' }}>
                <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件及成果图信息</div>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="原始文件" field="originalfile">
                      <Upload
                        drag
                        action="/api/v1/wzjc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'originalfile' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="附件（基础报告）" field="addition">
                      <Upload
                        drag
                        action="/api/v1/wzjc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'addition' }}
                        limit={1}
                        tip="点击或拖拽上传"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="作业现场图序" field="images">
                      <Upload
                        drag
                        action="/api/v1/wzjc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'images' }}
                        accept="image/*"
                        limit={5}
                        listType="picture-card"
                        tip="支持多张图片"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="观测系统布置图" field="gcsysbzt">
                      <Upload
                        drag
                        action="/api/v1/wzjc/file/upload"
                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                        data={{ ybPk: id, siteId: record?.siteId || '', fileType: 'gcsysbzt' }}
                        accept="image/*"
                        limit={1}
                        listType="picture-card"
                        tip="支持 jpg、png 等图片格式"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </div>
            </TabPane>
          </Tabs>
        );
      }
      
      return (
        <Tabs type="line">
          <TabPane key="basic" title="基本信息及其他信息">
            <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
            <Grid.Row gutter={24}>
              <Grid.Col span={8}>
                <Form.Item label="预报方法" field="method" disabled>
                  <Select placeholder="请选择">
                    {Object.entries(METHOD_MAP).map(([k, v]) => <Select.Option key={k} value={Number(k)}>{v}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Grid.Col>
              {!isLDSN && (
                <Grid.Col span={8}>
                  <Form.Item label="工点编号" field="siteId" disabled>
                    <Input placeholder="工点编号" />
                  </Form.Item>
                </Grid.Col>
              )}
            </Grid.Row>
            <Grid.Row gutter={24}>
              <Grid.Col span={8}>
                <Form.Item label="里程冠号" field="dkname">
                  <Input placeholder="例如: DK" />
                </Form.Item>
              </Grid.Col>
              {isLDSN ? (
                <>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="sdkilo" noStyle rules={[{ required: true, message: '请输入起始里程' }]}>
                          <InputNumber 
                            style={{ width: '150px' }} 
                            placeholder="0" 
                            precision={2}
                          />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkilo" noStyle rules={[{ required: true, message: '请输入里程值' }]}>
                          <InputNumber 
                            style={{ width: '150px' }} 
                            placeholder="0" 
                            precision={2}
                          />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Form.Item label="预报长度" field="ybLength" rules={[{ required: true, message: '请输入预报长度' }]}>
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" />
                    </Form.Item>
                  </Grid.Col>
                </>
              ) : (
                <>
                  <Grid.Col span={8}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="dkiloKm" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber 
                            style={{ width: '80px' }} 
                            placeholder="0" 
                            min={0}
                            precision={0}
                          />
                        </Form.Item>
                        <span style={{ margin: '0 4px' }}>+</span>
                        <Form.Item field="dkiloM" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber 
                            style={{ width: '80px' }} 
                            placeholder="0" 
                            min={0}
                            max={999}
                            precision={0}
                          />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item 
                      label="预报长度" 
                      field="ybLength"
                      extra="单位:m，保留2位小数，整数位不得超过5位"
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        placeholder="预报长度" 
                        precision={2}
                        step={1}
                        min={0}
                        max={99999.99}
                      />
                    </Form.Item>
                  </Grid.Col>
                </>
              )}
            </Grid.Row>

            <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
            <Grid.Row gutter={24}>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "检测人" : "检测人员"} field="testname">
                  <Input placeholder={isLDSN ? "检测人" : "检测人员姓名"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "检测人身份证" : "检测人员编号"} field="testno">
                  <Input placeholder={isLDSN ? "检测人身份证" : "检测人员编号"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "检测人电话" : "检测人员电话"} field="testtel">
                  <Input placeholder={isLDSN ? "检测人电话" : "检测人员电话"} />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={24}>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "复核人" : "监测人员"} field="monitorname">
                  <Input placeholder={isLDSN ? "复核人" : "监测人员姓名"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "复核人身份证" : "监测人员编号"} field="monitorno">
                  <Input placeholder={isLDSN ? "复核人身份证" : "监测人员编号"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "复核人电话" : "监测人员电话"} field="monitortel">
                  <Input placeholder={isLDSN ? "复核人电话" : "监测人员电话"} />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={24}>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "监理工程师" : "监理人员"} field="supervisorname">
                  <Input placeholder={isLDSN ? "监理工程师" : "监理人员姓名"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "监理身份证" : "监理人员编号"} field="supervisorno">
                  <Input placeholder={isLDSN ? "监理身份证" : "监理人员编号"} />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={8}>
                <Form.Item label={isLDSN ? "监理电话" : "监理人员电话"} field="supervisortel">
                  <Input placeholder={isLDSN ? "监理电话" : "监理人员电话"} />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>

            <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>
              {isLDSN ? '其他信息' : '预报结论'}
            </div>
            <Grid.Row gutter={24}>
              <Grid.Col span={24}>
                <Form.Item label={isLDSN ? "预报分段结论" : "预报结论"} field="conclusionyb">
                  <TextArea 
                    rows={4} 
                    placeholder={isLDSN ? "请输入预报分段结论" : "请输入预报结论"}
                    maxLength={512}
                    showWordLimit
                  />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>
            <Grid.Row gutter={24}>
              <Grid.Col span={24}>
                <Form.Item label={isLDSN ? "后续建议" : "处理建议"} field="suggestion">
                  <TextArea 
                    rows={4} 
                    placeholder={isLDSN ? "请输入后续建议" : "请输入处理建议"}
                    maxLength={512}
                    showWordLimit
                  />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>
            {!isLDSN && (
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="解决方案" field="solution">
                    <TextArea rows={3} placeholder="请输入解决方案" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            )}
            <Grid.Row gutter={24}>
              <Grid.Col span={24}>
                <Form.Item label={isLDSN ? "实际采取措施" : "备注"} field={isLDSN ? "solution" : "remark"}>
                  <TextArea 
                    rows={3} 
                    placeholder={isLDSN ? "请输入实际采取措施" : "请输入备注信息"}
                    maxLength={512}
                    showWordLimit
                  />
                </Form.Item>
              </Grid.Col>
            </Grid.Row>
            {!isLDSN && (
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="备注" field="remark">
                    <TextArea 
                      rows={3} 
                      placeholder="请输入备注信息"
                      maxLength={512}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            )}
            {isLDSN && (
              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="备注" field="remark">
                    <TextArea 
                      rows={3} 
                      placeholder="请输入备注"
                      maxLength={512}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            )}
          </TabPane>
          <TabPane key="segments" title="分段信息">
            <TspSegmentsTab
              form={form}
              ybjgList={ybjgList}
              onListChange={setYbjgList}
              onRemoteSave={handlePartialSave}
            />
          </TabPane>
          <TabPane key="method_info" title={getMethodSpecificTabTitle(methodParam)}>
            {renderMethodSpecificContent(methodParam)}
          </TabPane>
          <TabPane key="params" title="炮点参数及围岩参数">
            <TspParamsTab
              pdList={tspPdList}
              onPdListChange={setTspPdList}
              bxList={tspBxList}
              onBxListChange={setTspBxList}
              onRemoteSave={handlePartialSave}
            />
          </TabPane>
          <TabPane key="attachments" title="附件及成果信息">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>预报成果图片</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="图片1" field="pic1">
                    <Input placeholder="图片1文件路径" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="图片2" field="pic2">
                    <Input placeholder="图片2文件路径" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="图片3" field="pic3">
                    <Input placeholder="图片3文件路径" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="图片4" field="pic4">
                    <Input placeholder="图片4文件路径" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="图片5" field="pic5">
                    <Input placeholder="图片5文件路径" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="图片6" field="pic6">
                    <Input placeholder="图片6文件路径" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
        </Tabs>
      );
    }

    // 钻探法的复杂表单（超前水平钻）
    if (type === 'drilling') {
      return (
        <Tabs type="line">
          <TabPane key="basic" title="基本信息及其他信息">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>基本信息</div>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="预报方法" field="method">
                    <Select placeholder="请选择" disabled>
                      {Object.entries(METHOD_MAP).map(([k, v]) => <Select.Option key={k} value={Number(k)}>{v}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报时间" field="monitordate">
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="起点里程" field="dkname">
                    <Input placeholder="例如: DK" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="终点里程" field="dkilo">
                    <InputNumber style={{ width: '100%' }} placeholder="终点里程数值" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="里程区间" field="lcqj">
                    <InputNumber style={{ width: '100%' }} placeholder="里程区间" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报长度" field="ybLength">
                    <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" precision={2} />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="地点" field="location">
                    <Input placeholder="地点名称" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="地区人地道编号" field="dqrddNo">
                    <Input placeholder="地区人地道编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="记录人人地道" field="jlrrdd">
                    <Input placeholder="记录人人地道" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="记录人" field="recorder">
                    <Input placeholder="记录人姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="技术负责人" field="techLeader">
                    <Input placeholder="技术负责人" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="记录人电话" field="recorderTel">
                    <Input placeholder="记录人电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监理人" field="supervisorname">
                    <Input placeholder="监理人" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="洞室测量" field="dscl">
                    <Input placeholder="洞室测量" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>预报信息</div>

              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="地质超前探测" field="dzqctc">
                    <TextArea
                      rows={6}
                      placeholder="请输入地质超前探测信息..."
                      maxLength={2000}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="预报结构现状态" field="ybjgxzt">
                    <TextArea
                      rows={6}
                      placeholder="请输入预报结构现状态..."
                      maxLength={2000}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>

          <TabPane key="segments" title="分段信息及下次超前地质预报">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>分段信息</div>

              {/* 分段信息表格 */}
              <div style={{ marginBottom: '20px' }}>
                <Button type="primary" size="small" style={{ marginBottom: '12px' }}>新增</Button>
                <div style={{ border: '1px solid #E5E6EB', borderRadius: '2px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#F7F8FA' }}>
                      <tr>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>序号</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>初始终点标</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>开挖到期标</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>现桩号到期标</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>与下次计划</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>记录时间段</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>检测说明</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>围岩分析</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>地质描绘</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ybjgList && ybjgList.length > 0 ? (
                        ybjgList.map((item: any, index: number) => (
                          <tr key={item.ybjgPk || index} style={{ borderBottom: '1px solid #E5E6EB' }}>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{index + 1}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.dkname || '-'}{item.sdkilo ? `+${item.sdkilo}` : ''}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.dkname || '-'}{item.edkilo ? `+${item.edkilo}` : ''}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.xzhddqb || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.yxcjh || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.ybjgTime || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.jcsm || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>围岩{item.wylevel ? ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'][item.wylevel - 1] : '-'} {item.grade ? `级${item.grade}` : ''}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{item.jlresult || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>
                              <Button type="text" size="mini" status="danger">删除</Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#86909C', fontSize: '14px' }}>
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '30px', fontWeight: 'bold' }}>下次超前地质预报信息</div>

              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="下次预报说明" field="xcybsm">
                    <TextArea
                      rows={6}
                      placeholder="请输入下次预报说明..."
                      maxLength={2000}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="现场评论说明" field="xcplsm">
                    <TextArea
                      rows={6}
                      placeholder="请输入现场评论说明..."
                      maxLength={2000}
                      showWordLimit
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>

          <TabPane key="drill_info" title="超前水平钻信息表">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>超前水平钻信息详情</div>

              {/* 钻孔信息表格 */}
              <div style={{ marginBottom: '20px' }}>
                <Button type="primary" size="small" style={{ marginBottom: '12px' }}>新增</Button>
                <div style={{ border: '1px solid #E5E6EB', borderRadius: '2px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead style={{ backgroundColor: '#F7F8FA' }}>
                      <tr>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>序号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>开钻时间</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>完钻时间</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>开钻桩号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>完钻人地编号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>开孔入地编号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>开孔_编号编号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>记录人编号</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>钻孔全长</th>
                        <th style={{ padding: '14px 10px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '14px', fontWeight: '500' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zkList && zkList.length > 0 ? (
                        zkList.map((item: any, index: number) => (
                          <tr key={item.cqspzZkzzPk || index} style={{ borderBottom: '1px solid #E5E6EB' }}>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{index + 1}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>
                              {item.kssj ? new Date(item.kssj).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>
                              {item.jssj ? new Date(item.jssj).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{item.kwbh || '-'}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{item.zkzj || '-'}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{item.kkwzsyt || '-'}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{item.kwbh || '-'}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>{item.zjcode || '-'}</td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>
                              {item.jgdjl || item.jzxxjl || '-'}
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>
                              <Space size="small">
                                <Button
                                  type="text"
                                  size="small"
                                  status="warning"
                                  style={{ fontSize: '14px' }}
                                  onClick={() => {
                                    console.log('🔍 [编辑钻孔] 钻孔数据:', item);
                                    console.log('🔍 [编辑钻孔] 测点数据:', item.cqspzZkzzDcxxVOList);
                                    console.log('🔍 [编辑钻孔] 钻探记录:', item.cqspzZkzzZtjlbVOList);
                                    setCurrentZk(item);
                                    setCurrentZkIndex(index);
                                    zkForm.setFieldsValue(item);
                                    setEditZkVisible(true);
                                  }}
                                >
                                  编辑
                                </Button>
                                <Button
                                  type="text"
                                  size="small"
                                  status="danger"
                                  style={{ fontSize: '14px' }}
                                  onClick={() => {
                                    const newList = zkList.filter((_, idx) => idx !== index);
                                    setZkList(newList);
                                    Message.success('已从列表中删除，点击保存按钮提交更改');
                                  }}
                                >
                                  删除
                                </Button>
                              </Space>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#86909C', fontSize: '14px' }}>
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane key="attachments" title="附件及图片上传">
            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>附件及成果信息上传</div>

              <Grid.Row gutter={24} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Grid.Col span={12}>
                  <Form.Item label="附件（任意格式）" style={{ marginBottom: 0 }}>
                    <Upload
                      action={`/api/v1/ztf/jspk/upload`}
                      headers={{
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }}
                      data={{
                        ybPk: id,
                        siteId: record?.siteId || ''
                      }}
                      accept="*/*"
                      limit={10}
                      multiple
                      drag
                      tip="点击或拖拽文件到此区域上传"
                      onChange={(fileList, file) => {
                        console.log('📤 [文件列表变化]', fileList, file);
                        if (file.status === 'done') {
                          console.log('✅ [上传成功]', file.name);
                          Message.success(`${file.name} 上传成功`);
                        } else if (file.status === 'error') {
                          console.error('❌ [上传失败]', file.name);
                          Message.error(`${file.name} 上传失败`);
                        }
                      }}
                    />
                  </Form.Item>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Form.Item label="代以明预报图" style={{ marginBottom: 0 }}>
                    <Upload
                      action={`/api/v1/ztf/jspk/upload`}
                      headers={{
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }}
                      data={{
                        ybPk: id,
                        siteId: record?.siteId || ''
                      }}
                      accept="image/*"
                      limit={5}
                      multiple
                      drag
                      tip="点击或拖拽图片到此区域上传"
                      onChange={(fileList, file) => {
                        console.log('📤 [图片列表变化]', fileList, file);
                        if (file.status === 'done') {
                          console.log('✅ [图片上传成功]', file.name);
                          Message.success(`${file.name} 上传成功`);
                        } else if (file.status === 'error') {
                          console.error('❌ [图片上传失败]', file.name);
                          Message.error(`${file.name} 上传失败`);
                        }
                      }}
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          </TabPane>
        </Tabs>
      );
    }

    // 默认简单表单
    return (
      <div style={{ padding: '20px', background: '#fff' }}>
        <Form.Item label="里程" field="dkilo" rules={[{ required: true, message: '请输入里程' }]}>
          <Input placeholder="如 DK713+521.20" />
        </Form.Item>
        <Form.Item label="监测日期" field="monitordate">
          <Input placeholder="监测日期" />
        </Form.Item>
        <Form.Item label="备注" field="addition">
          <Input placeholder="备注信息" />
        </Form.Item>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 顶部信息栏 */}
      <div style={{
        height: 48,
        background: '#E6E8EB',
        borderRadius: '4px 4px 0 0',
        marginBottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#1D2129',
        fontSize: '14px',
        fontWeight: 500,
        borderBottom: '1px solid #C9CDD4'
      }}>
        <span>{record ? `编辑 - ${METHOD_MAP[record.method] || '地质预报'}` : '编辑地质预报'}</span>
        <Button
          type="text"
          icon={<IconLeft style={{ fontSize: 18 }} />}
          style={{ color: '#1D2129' }}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 4px 4px' }}>
        <Spin loading={loading} style={{ width: '100%', minHeight: '200px' }}>
          <Form form={form} layout="vertical">
            {renderFormContent()}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Space size="large">
                <Button onClick={() => navigate(-1)}>取消</Button>
                <Button type="primary" icon={<IconSave />} onClick={() => {
                  console.log('🔴🔴🔴 保存按钮被点击了！时间:', new Date().toISOString());
                  console.log('🔴 当前form:', form);
                  console.log('🔴 form.getFieldsValue():', form.getFieldsValue());
                  handleSave();
                }}>
                  保存
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </div>

      {/* 钻孔编辑对话框 */}
      <Modal
        title="超前地质预报钻孔信息"
        visible={editZkVisible}
        onCancel={() => {
          setEditZkVisible(false);
          zkForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await zkForm.validate();
            const newList = [...zkList];
            if (currentZkIndex >= 0) {
              newList[currentZkIndex] = { ...currentZk, ...values };
              setZkList(newList);
              Message.success('钻孔信息已更新，请点击保存按钮提交');
            }
            setEditZkVisible(false);
            zkForm.resetFields();
          } catch (error) {
            Message.error('请填写完整信息');
          }
        }}
        style={{ width: '1200px' }}
      >
        <Form form={zkForm} layout="vertical">
          <Tabs>
            <TabPane key="basic" title="基本信息">
              <Grid.Row gutter={24}>
                {/* 左侧表单字段 */}
                <Grid.Col span={12}>
                  <Grid.Row gutter={16}>
                    <Grid.Col span={24}>
                      <Form.Item label="开始时间" field="kssj">
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={24}>
                      <Form.Item label="结束时间" field="jssj">
                        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={24}>
                      <Form.Item label="开始桩号" field="kwbh">
                        <Input placeholder="开始桩号" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={24}>
                      <Form.Item label="结束桩号" field="endZh">
                        <Input placeholder="结束桩号" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={24}>
                      <Form.Item label="开孔_开挖桩号" field="kwljangle">
                        <InputNumber style={{ width: '100%' }} placeholder="例如: 3" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={24}>
                      <Form.Item label="开孔_人口编号" field="kwpjangle">
                        <InputNumber style={{ width: '100%' }} placeholder="例如: 0" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </Grid.Col>

                {/* 右侧钻孔示意图 */}
                <Grid.Col span={12}>
                  <div style={{
                    width: '100%',
                    height: '400px',
                    border: '1px solid #E5E6EB',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FAFAFA'
                  }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                      {/* 坐标轴 */}
                      <line x1="40" y1="320" x2="360" y2="320" stroke="#333" strokeWidth="1.5" />
                      <line x1="40" y1="80" x2="40" y2="320" stroke="#333" strokeWidth="1.5" />

                      {/* 刻度标注 */}
                      <text x="30" y="75" fontSize="14" fill="#666">0</text>
                      <text x="355" y="335" fontSize="14" fill="#666">400</text>
                      <text x="15" y="325" fontSize="14" fill="#666">-400</text>

                      {/* 根据测点数据绘制钻孔轮廓 */}
                      {currentZk?.cqspzZkzzDcxxVOList && currentZk.cqspzZkzzDcxxVOList.length > 0 ? (
                        <>
                          {/* 绘制测点连线 */}
                          <polyline
                            points={currentZk.cqspzZkzzDcxxVOList.map((point: any, idx: number) => {
                              const angle = (idx / currentZk.cqspzZkzzDcxxVOList.length) * 2 * Math.PI;
                              const radius = point.dclc || 100;
                              const x = 200 + radius * Math.cos(angle);
                              const y = 200 + radius * Math.sin(angle);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#165DFF"
                            strokeWidth="2"
                          />
                          {/* 绘制测点 */}
                          {currentZk.cqspzZkzzDcxxVOList.map((point: any, idx: number) => {
                            const angle = (idx / currentZk.cqspzZkzzDcxxVOList.length) * 2 * Math.PI;
                            const radius = point.dclc || 100;
                            const x = 200 + radius * Math.cos(angle);
                            const y = 200 + radius * Math.sin(angle);
                            return (
                              <circle key={idx} cx={x} cy={y} r="3" fill="#165DFF" />
                            );
                          })}
                        </>
                      ) : (
                        /* 默认圆形示意图 */
                        <circle
                          cx="200"
                          cy="200"
                          r="100"
                          fill="none"
                          stroke="#165DFF"
                          strokeWidth="2"
                        />
                      )}

                      {/* 中心点 */}
                      <circle cx="200" cy="200" r="4" fill="#FF4D4F" />

                      {/* 辅助线 */}
                      <line x1="100" y1="200" x2="300" y2="200" stroke="#86909C" strokeWidth="1" strokeDasharray="5" />
                      <line x1="200" y1="100" x2="200" y2="300" stroke="#86909C" strokeWidth="1" strokeDasharray="5" />
                    </svg>
                  </div>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24} style={{ marginTop: '20px' }}>
                <Grid.Col span={12}>
                  <Form.Item label="孔代号" field="kkwzsyt">
                    <Input placeholder="孔代号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="记录人编号" field="zjcode">
                    <Input placeholder="记录人编号" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="备注" field="remark">
                    <TextArea rows={2} placeholder="请输入备注..." />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>

              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="是否存在缺陷" field="sfqx">
                    <Radio.Group>
                      <Radio value={0}>不存在</Radio>
                      <Radio value={1}>存在</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="缺陷图片" field="qxpic">
                    <Upload action="/api/upload" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </TabPane>

            <TabPane key="records" title="钻孔记录">
              <div style={{ marginBottom: '20px' }}>
                <Button type="primary" size="small" style={{ marginBottom: '12px' }}>新增</Button>
                <div style={{ border: '1px solid #E5E6EB', borderRadius: '2px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead style={{ backgroundColor: '#F7F8FA' }}>
                      <tr>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>开始时间</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>结束时间</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>钻孔深度</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>钻孔压力</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>钻速</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>开孔水压</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>开孔水速</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>开孔主变性率</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>地质描述</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentZk?.cqspzZkzzZtjlbVOList && currentZk.cqspzZkzzZtjlbVOList.length > 0 ? (
                        currentZk.cqspzZkzzZtjlbVOList.map((record: any, idx: number) => (
                          <tr key={record.cqspzZkzzZtjlbPk || idx} style={{ borderBottom: '1px solid #E5E6EB' }}>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>
                              {record.kssj ? new Date(record.kssj).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>
                              {record.jssj ? new Date(record.jssj).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.zksd || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.zkpressure || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.zkspeed || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.kwwaterpre || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.kwwaterspe || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.kwzbxl || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{record.dzms || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>
                              <Space size="small">
                                <Button type="text" size="mini" status="warning">编辑</Button>
                                <Button type="text" size="mini" status="danger">删除</Button>
                              </Space>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#86909C', fontSize: '14px' }}>
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPane>

            <TabPane key="detail" title="底层信息">
              <div style={{ marginBottom: '20px' }}>
                <Button type="primary" size="small" style={{ marginBottom: '12px' }}>新增</Button>
                <div style={{ border: '1px solid #E5E6EB', borderRadius: '2px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead style={{ backgroundColor: '#F7F8FA' }}>
                      <tr>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>地点代号</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>地点里程</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>分叉厚度</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>出水位置</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>出水量</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>测样位置</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>工程地质简介</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E6EB', fontSize: '13px', fontWeight: '500' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentZk?.cqspzZkzzDcxxVOList && currentZk.cqspzZkzzDcxxVOList.length > 0 ? (
                        currentZk.cqspzZkzzDcxxVOList.map((point: any, idx: number) => (
                          <tr key={point.cqspzZkzzDcxxPk || idx} style={{ borderBottom: '1px solid #E5E6EB' }}>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.dcdh || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.dclc || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.fchd || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.cslcz || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.csl || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.cywz || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>{point.gcdzjj || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px' }}>
                              <Space size="small">
                                <Button type="text" size="mini" status="warning">编辑</Button>
                                <Button type="text" size="mini" status="danger">删除</Button>
                              </Space>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#86909C', fontSize: '14px' }}>
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  )
}

export default GeologyForecastEditPage
