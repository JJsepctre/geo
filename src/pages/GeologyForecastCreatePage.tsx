import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Space,
  Upload,
  Table,
  Empty,
  Modal,
} from '@arco-design/web-react';
import { IconLeft, IconSave, IconPlus, IconDelete } from '@arco-design/web-react/icon';
import apiAdapter from '../services/apiAdapter';
import SegmentModal, { SegmentData } from '../components/SegmentModal';
import { formatDateForAPI } from '../utils/dateUtils';

const { TextArea } = Input;
const TabPane = Tabs.TabPane;

// 预报方法映射 (物探法)
// 注意: method=0 是其他, method=7 是微震监测预报
const METHOD_MAP: Record<number, string> = {
  1: '地震波反射',
  2: '水平声波剖面',
  3: '陆地声呐',
  4: '电磁波反射',
  5: '高分辨直流电',
  6: '瞬变电磁',
  7: '微震监测预报',
  0: '其他',
};

// 瞬变电磁 - 采集装置类型枚举
const SBDC_TYPE_MAP: Record<number, string> = {
  1: '重叠回线',
  2: '中心回线',
  3: '偶级装置',
};

// 选项卡标题映射 - 根据不同方法显示不同选项卡
const TAB_TITLES: Record<number, string[]> = {
  1: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  2: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  3: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  4: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  5: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  6: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  7: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
  0: ['基本信息及其他信息', '分段信息及下次超前地质预报', '观测系统信息及设备信息', '附件及成果图'],
};

function GeologyForecastCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const methodParam = searchParams.get('method');
  const siteId = searchParams.get('siteId');
  const methodNum = methodParam ? parseInt(methodParam) : 1;
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentModalVisible, setSegmentModalVisible] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SegmentData | null>(null);
  
  // 电磁波反射 - 测线布置信息
  const [cxLines, setCxLines] = useState<any[]>([]);
  const [cxLineModalVisible, setCxLineModalVisible] = useState(false);
  const [editingCxLineIndex, setEditingCxLineIndex] = useState<number | null>(null);
  const [cxLineForm] = Form.useForm();

  // 陆地声呐 - 测点信息
  const [cdPoints, setCdPoints] = useState<any[]>([]);
  const [cdPointModalVisible, setCdPointModalVisible] = useState(false);
  const [editingCdPointIndex, setEditingCdPointIndex] = useState<number | null>(null);
  const [cdPointForm] = Form.useForm();

  // 高分辨直流电 - 电极距掌子面距离信息
  const [djPoints, setDjPoints] = useState<any[]>([]);
  const [djPointModalVisible, setDjPointModalVisible] = useState(false);
  const [editingDjPointIndex, setEditingDjPointIndex] = useState<number | null>(null);
  const [djPointForm] = Form.useForm();

  // 打开新增分段弹窗
  const handleOpenSegmentModal = () => {
    setEditingSegment(null);
    setSegmentModalVisible(true);
  };

  // 打开编辑分段弹窗
  const handleEditSegment = (index: number) => {
    setEditingSegment({ ...segments[index], _index: index });
    setSegmentModalVisible(true);
  };

  // 确认添加/编辑分段
  const handleConfirmSegment = (data: SegmentData) => {
    const segmentWithIndex = editingSegment as any;
    if (segmentWithIndex && segmentWithIndex._index !== undefined) {
      // 编辑模式
      const newSegments = [...segments];
      newSegments[segmentWithIndex._index] = data;
      setSegments(newSegments);
    } else {
      // 新增模式
      setSegments([...segments, data]);
    }
    setSegmentModalVisible(false);
  };

  // 围岩等级映射
  const gradeMap: Record<number, string> = { 1: 'Ⅰ级', 2: 'Ⅱ级', 3: 'Ⅲ级', 4: 'Ⅳ级', 5: 'Ⅴ级', 6: 'Ⅵ级' };

  // 分段信息表格列定义
  const segmentColumns = [
    { title: '序号', dataIndex: 'index', width: 60, render: (_: any, __: any, index: number) => index + 1 },
    { title: '里程冠号', dataIndex: 'dkname', width: 100 },
    { title: '开始里程值', dataIndex: 'sdkilo', width: 100 },
    { title: '结束里程值', dataIndex: 'edkilo', width: 100 },
    { title: '生产时间', dataIndex: 'ybjgTime', width: 150 },
    { title: '风险类别', dataIndex: 'risklevel', width: 100 },
    { title: '地质现象', dataIndex: 'dzjb', width: 100, render: (v: string) => {
      const colorMap: Record<string, { bg: string; text: string; label: string }> = {
        'green': { bg: '#52c41a', text: '#fff', label: '绿色' },
        'yellow': { bg: '#faad14', text: '#fff', label: '黄色' },
        'red': { bg: '#ff4d4f', text: '#fff', label: '红色' },
      };
      const config = colorMap[v];
      if (config) {
        return <span style={{ backgroundColor: config.bg, color: config.text, padding: '2px 8px', borderRadius: 4 }}>{config.label}</span>;
      }
      return v || '-';
    }},
    { title: '围岩等级', dataIndex: 'wylevel', width: 100, render: (v: number) => gradeMap[v] || v || '-' },
    { title: '预报结论', dataIndex: 'jlresult', width: 120, ellipsis: true },
    {
      title: '操作',
      width: 120,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button type="text" size="small" onClick={() => handleEditSegment(index)}>编辑</Button>
          <Button type="text" status="danger" icon={<IconDelete />} onClick={() => handleDeleteSegment(index)} />
        </Space>
      ),
    },
  ];

  // 删除分段
  const handleDeleteSegment = (index: number) => {
    const newSegments = [...segments];
    newSegments.splice(index, 1);
    setSegments(newSegments);
  };

  // 电磁波反射 - 测线布置信息操作
  const handleOpenCxLineModal = () => {
    setEditingCxLineIndex(null);
    cxLineForm.resetFields();
    cxLineForm.setFieldsValue({
      cxxh: cxLines.length + 1,
      qdzbx: 0,
      qdzby: 0,
      zdzbx: 0,
      zdzby: 0,
    });
    setCxLineModalVisible(true);
  };

  const handleEditCxLine = (index: number) => {
    setEditingCxLineIndex(index);
    cxLineForm.setFieldsValue(cxLines[index]);
    setCxLineModalVisible(true);
  };

  const handleConfirmCxLine = async () => {
    try {
      const values = await cxLineForm.validate();
      if (editingCxLineIndex !== null) {
        const newLines = [...cxLines];
        newLines[editingCxLineIndex] = values;
        setCxLines(newLines);
      } else {
        setCxLines([...cxLines, values]);
      }
      setCxLineModalVisible(false);
    } catch (e) {
      // 表单验证失败
    }
  };

  const handleDeleteCxLine = (index: number) => {
    const newLines = [...cxLines];
    newLines.splice(index, 1);
    setCxLines(newLines);
  };

  // 测线布置信息表格列定义
  const cxLineColumns = [
    { title: '测线序号', dataIndex: 'cxxh', width: 100 },
    { title: '起点坐标X', dataIndex: 'qdzbx', width: 120 },
    { title: '起点坐标Y', dataIndex: 'qdzby', width: 120 },
    { title: '终点坐标X', dataIndex: 'zdzbx', width: 120 },
    { title: '终点坐标Y', dataIndex: 'zdzby', width: 120 },
    {
      title: '操作',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            style={{ color: '#165DFF' }}
            icon={<span style={{ fontSize: 16 }}>✎</span>}
            onClick={() => handleEditCxLine(index)}
          />
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<span style={{ fontSize: 16 }}>⊖</span>}
            onClick={() => handleDeleteCxLine(index)}
          />
        </Space>
      ),
    },
  ];

  // 陆地声呐 - 测点信息操作
  const handleOpenCdPointModal = () => {
    setEditingCdPointIndex(null);
    cdPointForm.resetFields();
    cdPointForm.setFieldsValue({
      cdxh: cdPoints.length + 1,
      jgdjl: 0,
      jzxjl: 0,
    });
    setCdPointModalVisible(true);
  };

  const handleEditCdPoint = (index: number) => {
    setEditingCdPointIndex(index);
    cdPointForm.setFieldsValue(cdPoints[index]);
    setCdPointModalVisible(true);
  };

  const handleConfirmCdPoint = async () => {
    try {
      const values = await cdPointForm.validate();
      if (editingCdPointIndex !== null) {
        const newPoints = [...cdPoints];
        newPoints[editingCdPointIndex] = values;
        setCdPoints(newPoints);
      } else {
        setCdPoints([...cdPoints, values]);
      }
      setCdPointModalVisible(false);
    } catch (e) {
      // 表单验证失败
    }
  };

  const handleDeleteCdPoint = (index: number) => {
    const newPoints = [...cdPoints];
    newPoints.splice(index, 1);
    setCdPoints(newPoints);
  };

  // 陆地声呐 - 测点信息表格列定义
  const cdPointColumns = [
    { title: '测点序号', dataIndex: 'cdxh', width: 120 },
    { title: '距拱顶距离(m)', dataIndex: 'jgdjl', width: 180 },
    { title: '距左线距离(m)', dataIndex: 'jzxjl', width: 180 },
    {
      title: '操作',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            style={{ color: '#165DFF' }}
            icon={<span style={{ fontSize: 16 }}>✎</span>}
            onClick={() => handleEditCdPoint(index)}
          />
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<span style={{ fontSize: 16 }}>⊖</span>}
            onClick={() => handleDeleteCdPoint(index)}
          />
        </Space>
      ),
    },
  ];

  // 高分辨直流电 - 电极距掌子面距离操作
  const handleOpenDjPointModal = () => {
    setEditingDjPointIndex(null);
    djPointForm.resetFields();
    djPointForm.setFieldsValue({
      djxh: `DJ${String(djPoints.length + 1).padStart(3, '0')}`,
      gfbzldResultinfoType: 1,
      jzzmjl: 0,
    });
    setDjPointModalVisible(true);
  };

  const handleEditDjPoint = (index: number) => {
    setEditingDjPointIndex(index);
    djPointForm.setFieldsValue(djPoints[index]);
    setDjPointModalVisible(true);
  };

  const handleConfirmDjPoint = async () => {
    try {
      const values = await djPointForm.validate();
      if (editingDjPointIndex !== null) {
        const newPoints = [...djPoints];
        newPoints[editingDjPointIndex] = values;
        setDjPoints(newPoints);
      } else {
        setDjPoints([...djPoints, values]);
      }
      setDjPointModalVisible(false);
    } catch (e) {
      // 表单验证失败
    }
  };

  const handleDeleteDjPoint = (index: number) => {
    const newPoints = [...djPoints];
    newPoints.splice(index, 1);
    setDjPoints(newPoints);
  };

  // 高分辨直流电 - 电极距掌子面距离表格列定义
  const djPointColumns = [
    { title: '电极序号', dataIndex: 'djxh', width: 150 },
    { 
      title: '类型', 
      dataIndex: 'gfbzldResultinfoType', 
      width: 150,
      render: (v: number) => v === 1 ? '供电电极' : '测量电极'
    },
    { title: '距掌子面距离', dataIndex: 'jzzmjl', width: 180 },
    {
      title: '操作',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            style={{ color: '#165DFF' }}
            icon={<span style={{ fontSize: 16 }}>✎</span>}
            onClick={() => handleEditDjPoint(index)}
          />
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<span style={{ fontSize: 16 }}>⊖</span>}
            onClick={() => handleDeleteDjPoint(index)}
          />
        </Space>
      ),
    },
  ];

  // 构建提交数据 - 根据不同方法构建不同的数据结构
  const buildSubmitData = (values: any): any => {
    // 里程合并：将 dkiloKm 和 dkiloM 合并为 dkilo
    const dkilo = (values.dkiloKm || 0) * 1000 + (values.dkiloM || 0);
    
    const baseData = {
      ybPk: 0,  // 新增时为0
      ybId: 0,  // 新增时为0
      siteId: String(siteId),
      method: methodNum,
      dkname: values.dkname || 'DK',
      dkilo: dkilo,
      ybLength: values.ybLength ? Number(values.ybLength) : 0,
      monitordate: formatDateForAPI(values.monitordate),
      createdate: formatDateForAPI(new Date()),
      testname: values.testname || '',
      testno: values.testno || '',
      testtel: values.testtel || '',
      monitorname: values.monitorname || '',
      monitorno: values.monitorno || '',
      monitortel: values.monitortel || '',
      supervisorname: values.supervisorname || '',
      supervisorno: values.supervisorno || '',
      supervisortel: values.supervisortel || '',
      conclusionyb: values.conclusionyb || '',
      suggestion: values.suggestion || '',
      solution: values.solution || '',
      remark: values.remark || '',
      flag: 0,
      submitFlag: 0,
      ybjgDTOList: segments.map((seg, idx) => ({
        ybjgPk: null,  // 新增时设为null
        ybjgId: null,  // 新增时设为null
        ybPk: null,    // 新增时设为null
        dkname: seg.dkname || 'DK',
        sdkilo: Number(seg.sdkilo) || 0,
        edkilo: Number(seg.edkilo) || 0,
        ybjgTime: formatDateForAPI(seg.ybjgTime),
        risklevel: seg.risklevel || '',
        grade: Number(seg.wylevel) || 1,  // grade使用wylevel的值
        wylevel: Number(seg.wylevel) || 1,  // 围岩等级，默认1
        jlresult: seg.jlresult || '',
      })),
    };

    // 根据不同方法添加特有字段
    switch (methodNum) {
      case 1: // TSP - 地震波反射
        return {
          ...baseData,
          jfpknum: values.jfpknum || 0,
          jfpksd: values.jfpksd || 0,
          jfpkzj: values.jfpkzj || 0,
          jfpkjdmgd: values.jfpkjdmgd || 0,
          jfpkjj: values.jfpkjj || 0,
          jspknum: values.jspknum || 0,
          jspksd: values.jspksd || 0,
          jspkzj: values.jspkzj || 0,
          jspkjdmgd: values.jspkjdmgd || 0,
          sbName: values.sbName || '',
          kwwz: values.kwwz || 1,
          leftkilo: values.leftkilo || 0,
          rightkilo: values.rightkilo || 0,
          leftjgdczjl: values.leftjgdczjl || 0,
          rightjgdczjl: values.rightjgdczjl || 0,
          leftzxjl: values.leftzxjl || 0,
          rightzxjl: values.rightzxjl || 0,
          leftjdmgd: values.leftjdmgd || 0,
          rightjdmgd: values.rightjdmgd || 0,
          leftks: values.leftks || 0,
          rightks: values.rightks || 0,
          leftqj: values.leftqj || 0,
          rightqj: values.rightqj || 0,
          tspPddataDTOList: [],
          tspBxdataDTOList: [],
        };
      case 2: // HSP - 水平声波剖面
        return {
          ...baseData,
          hspPk: 0,  // 新增时为0
          hspId: 0,  // 新增时为0
          cqnum: values.cqnum || 0,
          cdnum: values.cdnum || 0,
          jsfs: values.jsfs || '',
          sbName: values.sbName || '',
          // 文件字段：不发送（undefined会被后端忽略）
          pic1: undefined,
          pic2: undefined,
        };
      case 3: // LDSN - 陆地声呐
        return {
          ...baseData,
          ldsnPk: 0,
          ldsnId: 0,
          sbName: values.sbName || '',
          cxnum: values.cxnum || 0,
          ldsnResultinfoDTOList: cdPoints.map((point, idx) => ({
            ldsnResultinfoPk: 0,
            ldsnResultinfoId: idx + 1,
            ldsnPk: 0,
            cdxh: point.cdxh || idx + 1,
            jgdjl: point.jgdjl || 0,
            jzxjl: point.jzxjl || 0,
          })),
        };
      case 4: // DCBFS - 电磁波反射
        return {
          ...baseData,
          dcbfsPk: 0,
          dcbfsId: 0,
          sbName: values.sbName || '',
          cxnum: values.cxnum || 0,
          gzpl: values.gzpl || 0,
          dcbfsResultinfoDTOList: cxLines.map((line, idx) => ({
            dcbfsResultinfoPk: 0,
            dcbfsResultinfoId: idx + 1,
            dcbfsPk: 0,
            cxxh: line.cxxh || idx + 1,
            qdzbx: line.qdzbx || 0,
            qdzby: line.qdzby || 0,
            zdzbx: line.zdzbx || 0,
            zdzby: line.zdzby || 0,
          })),
          dcbfsResultpicDTOList: [],  // 成果图列表，新增时为空
        };
      case 5: // GFBZLD - 高分辨直流电
        return {
          ...baseData,
          gfbzldPk: 0,
          gfbzldId: 0,
          gddjnum: values.gddjnum || 0,  // 供电电极数量
          cldjnum: values.cldjnum || 0,  // 测量电极测点数量
          sbName: values.sbName || '',
          gddy: values.gddy || 0,  // 供电电压
          gddl: values.gddl || 0,  // 供电电流
          pic1: values.pic1 || '',  // 视电系统布置图
          pic2: values.pic2 || '',  // 电势等值线图
          pic3: values.pic3 || '',  // 成果图
          gfbzldResultinfoDTOList: djPoints.map((point, idx) => ({
            gfbzldResultinfoPk: 0,
            gfbzldResultinfoId: idx + 1,
            gfbzldPk: 0,
            djxh: point.djxh || `DJ${String(idx + 1).padStart(3, '0')}`,
            gfbzldResultinfoType: point.gfbzldResultinfoType || 1,
            jzzmjl: point.jzzmjl || 0,
          })),
        };
      case 6: // SBDC - 瞬变电磁
        return {
          ...baseData,
          sbdcPk: 0,
          sbdcId: 0,
          sbdcType: values.sbdcType || 1,  // 采集装置类型
          fskwzlc: values.fskwzlc || 0,  // 发射框位置里程
          fskc: values.fskc || 0,  // 发射框长
          fskk: values.fskk || 0,  // 发射框宽
          jfxqzs: values.jfxqzs || 0,  // 激发线圈匝数
          jskc: values.jskc || 0,  // 接收框长
          jskk: values.jskk || 0,  // 接收框宽
          jskzs: values.jskzs || 0,  // 接收框匝数
          jsxqdxmj: values.jsxqdxmj || 0,  // 接收线圈等效面积
          sf: values.sf || 0,  // 收发距
          sbName: values.sbName || '',  // 设备名称
          fspl: values.fspl || 0,  // 发射频率
          gddl: values.gddl || 0,  // 供电电流
          clsj: values.clsj || 0,  // 测量时间
          mqfw: values.mqfw || 0,  // 盲区范围
          cxbzms: values.cxbzms || '',  // 测线布置描述
        };
      case 7: // WZJC - 微震监测预报
        return {
          ...baseData,
          cumEventnum: values.cumEventnum || 0,  // 累积微震事件数
          cumEnergy: values.cumEnergy || 0,  // 累积微震释放能
          cumAppvol: values.cumAppvol || 0,  // 累积微震视体积
          eventRate: values.eventRate || 0,  // 微震事件率
          energyRate: values.energyRate || 0,  // 微震释放能率
          appvolRate: values.appvolRate || 0,  // 微震视体积率
          hdtzfxyms: values.hdtzfxyms || '',  // 活动特征分析与描述
          wzsjfbtzt: values.wzsjfbtzt || '',  // 微震事件分布特征图
        };
      case 0: // 其他
        return {
          ...baseData,
          // 其他方法只需要基本字段
        };
      default:
        return baseData;
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validate();
      console.log('💾 [新增页面] 表单数据:', values);
      
      setLoading(true);
      const submitData = buildSubmitData(values);
      console.log('💾 [新增页面] 提交数据:', JSON.stringify(submitData, null, 2));
      console.log('💾 [新增页面] ybPk:', submitData.ybPk, 'ybId:', submitData.ybId);
      
      const result = await apiAdapter.createGeophysicalMethod(submitData, methodParam);
      
      if (result?.success) {
        Message.success('新增成功');
        navigate(-1);
      } else {
        Message.error((result as any)?.message || '新增失败');
      }
    } catch (error: any) {
      console.error('❌ [新增页面] 保存失败:', error);
      // 显示具体的验证错误
      if (error?.errors) {
        const errorFields = Object.keys(error.errors);
        console.log('❌ [新增页面] 验证失败字段:', errorFields, error.errors);
        Message.error(`请填写必填项: ${errorFields.join(', ')}`);
      } else {
        Message.error(error?.message || '请填写必填项');
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取选项卡标题
  const tabTitles = TAB_TITLES[methodNum] || TAB_TITLES[1];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 顶部信息栏 */}
      <div style={{
        height: 48,
        background: '#E6E8EB',
        borderRadius: '4px 4px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#1D2129',
        fontSize: '14px',
        fontWeight: 500,
        borderBottom: '1px solid #C9CDD4'
      }}>
        <span>新增 - {METHOD_MAP[Number(methodParam)] || '物探法'}</span>
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
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            dkname: 'DK',
            monitordate: new Date().toISOString().replace('T', ' ').split('.')[0],
          }}
        >
          <Tabs type="line">
            {/* 第一个选项卡：基本信息及其他信息 */}
            <TabPane key="basic" title={tabTitles[0]}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="预报方法" required>
                    <Select value={methodNum} disabled>
                      {Object.entries(METHOD_MAP).map(([k, v]) => (
                        <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              
              {/* 陆地声呐(method=3)、电磁波反射(method=4)、高分辨直流电(method=5)、瞬变电磁(method=6)、微震监测预报(method=7)、其他(method=0)使用独立的里程冠号和掌子面里程字段 */}
              {(methodNum === 3 || methodNum === 4 || methodNum === 5 || methodNum === 6 || methodNum === 7 || methodNum === 0) ? (
                <>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                        <Input placeholder={methodNum === 3 ? "陆地声纳" : methodNum === 4 ? "电磁波反射" : methodNum === 5 ? "高分辨直流电" : methodNum === 6 ? "瞬变电磁" : methodNum === 7 ? "微震监测预报" : methodNum === 0 ? "其他" : "DK"} />
                      </Form.Item>
                    </Grid.Col>
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
                        <InputNumber style={{ width: '100%' }} placeholder="预报长度(米)" precision={2} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              ) : (
                <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="dkiloKm" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber style={{ width: 100 }} placeholder="180" precision={0} min={0} />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkiloM" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber style={{ width: 100 }} placeholder="972" precision={0} min={0} max={999} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item 
                      label="预报长度" 
                      field="ybLength" 
                      rules={[{ required: true, message: '请输入预报长度' }]}
                      extra="单位:m，保留2位小数，整数位不超过5位"
                    >
                      <InputNumber style={{ width: '100%' }} placeholder="预报长度" precision={2} step={1} min={0} max={99999.99} />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              )}
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="检测人" field="testname">
                    <Input placeholder="检测人员姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人身份证" field="testno">
                    <Input placeholder="检测人员身份证" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人电话" field="testtel">
                    <Input placeholder="检测人员电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="复核人" field="monitorname">
                    <Input placeholder="复核人员姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="复核人身份证" field="monitorno">
                    <Input placeholder="复核人员身份证" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="复核人电话" field="monitortel">
                    <Input placeholder="复核人员电话" />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监理工程师" field="supervisorname">
                    <Input placeholder="监理工程师姓名" />
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
                    <TextArea placeholder="请输入预报分段结论" rows={4} maxLength={512} showWordLimit />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="后续建议" field="suggestion">
                    <TextArea placeholder="请输入后续建议" rows={4} maxLength={512} showWordLimit />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="实际采取措施" field="solution">
                    <TextArea placeholder="请输入实际采取措施" rows={4} maxLength={512} showWordLimit />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="备注" field="remark">
                    <TextArea placeholder="请输入备注" rows={4} maxLength={512} showWordLimit />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </TabPane>

            {/* 第二个选项卡：分段信息及下次超前地质预报 */}
            <TabPane key="segments" title={tabTitles[1]}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>分段信息</div>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<IconPlus />} onClick={handleOpenSegmentModal}>
                  新增
                </Button>
              </div>
              <Table
                columns={segmentColumns}
                data={segments}
                rowKey={(record: any, index?: number) => String(index ?? 0)}
                pagination={false}
                border
                size="small"
                noDataElement={<Empty description="暂无数据" />}
              />

              {/* 下次超前地质预报 - 暂时隐藏，后端不支持 */}
              {/* <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '30px', fontWeight: 'bold', textAlign: 'center' }}>下次超前地质预报</div>
              <Grid.Row gutter={24}>
                <Grid.Col span={12}>
                  <Form.Item label="下次预报方法" field="nextMethod">
                    <Select placeholder="请选择">
                      {Object.entries(METHOD_MAP).map(([k, v]) => (
                        <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Form.Item label="预报开始里程">
                    <Input.Group>
                      <Form.Item field="nextDkname" noStyle>
                        <Input style={{ width: 80 }} placeholder="DK" />
                      </Form.Item>
                      <span style={{ padding: '0 8px', lineHeight: '32px' }}>+</span>
                      <Form.Item field="nextDkilo" noStyle>
                        <InputNumber style={{ width: 150 }} precision={2} placeholder="里程值" />
                      </Form.Item>
                    </Input.Group>
                  </Form.Item>
                </Grid.Col>
              </Grid.Row> */}
            </TabPane>

            {/* 第三个选项卡：观测系统信息及设备信息 */}
            <TabPane key="equipment" title={tabTitles[2]}>
              {/* HSP 水平声波剖面特有字段 */}
              {methodNum === 2 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>水平声波剖面观测系统信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="测区数量" field="cqnum" rules={[{ required: true, message: '请输入测区数量' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="请输入" min={0} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="测区测点数量" field="cdnum" rules={[{ required: true, message: '请输入测区测点数量' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="请输入" min={0} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="接收方式" field="jsfs" rules={[{ required: true, message: '请选择接收方式' }]}>
                        <Input placeholder="请输入" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                        <Input placeholder="请输入" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              )}
              {/* TSP 地震波反射特有字段 */}
              {methodNum === 1 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>激发孔参数</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={6}>
                      <Form.Item label="激发孔数量" field="jfpknum">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item label="激发孔深度(m)" field="jfpksd">
                        <InputNumber style={{ width: '100%' }} precision={2} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item label="激发孔直径(mm)" field="jfpkzj">
                        <InputNumber style={{ width: '100%' }} precision={0} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item label="激发孔间距(m)" field="jfpkjj">
                        <InputNumber style={{ width: '100%' }} precision={2} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>接收孔参数</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={6}>
                      <Form.Item label="接收孔数量" field="jspknum">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item label="接收孔深度(m)" field="jspksd">
                        <InputNumber style={{ width: '100%' }} precision={2} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item label="接收孔直径(mm)" field="jspkzj">
                        <InputNumber style={{ width: '100%' }} precision={0} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="设备名称" field="sbName">
                        <Input placeholder="例如: TSP 203plus" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="开挖位置" field="kwwz">
                        <Select placeholder="请选择">
                          <Select.Option value={1}>左侧</Select.Option>
                          <Select.Option value={2}>右侧</Select.Option>
                          <Select.Option value={3}>双侧</Select.Option>
                        </Select>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              )}
              {/* 陆地声呐 method=3 */}
              {methodNum === 3 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>陆地声呐观测系统信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="探检参数" field="cxnum" rules={[{ required: true, message: '请输入探检参数' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                        <Input placeholder="" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>测点信息表</div>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<IconPlus />} onClick={handleOpenCdPointModal}>新增</Button>
                  </div>
                  <Table
                    columns={cdPointColumns}
                    data={cdPoints}
                    rowKey={(record: any, index?: number) => String(index ?? 0)}
                    pagination={false}
                    border
                    size="small"
                    noDataElement={<Empty description="暂无数据" />}
                  />
                </>
              )}
              {/* 电磁波反射 method=4 */}
              {methodNum === 4 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>电磁波反射观测系统信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="测线数量" field="cxnum" rules={[{ required: true, message: '请输入测线数量' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={99} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="设备名称" field="sbName" rules={[{ required: true, message: '请输入设备名称' }]}>
                        <Input placeholder="" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="天线工作频率" field="gzpl" rules={[{ required: true, message: '请输入天线工作频率' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>测线布置信息表</div>
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button style={{ backgroundColor: '#722ED1', color: '#fff' }}>下载</Button>
                      <Button type="primary" icon={<IconPlus />} onClick={handleOpenCxLineModal}>新增</Button>
                      <Button style={{ backgroundColor: '#722ED1', color: '#fff' }}>删除</Button>
                      <Button style={{ backgroundColor: '#722ED1', color: '#fff' }}>导入</Button>
                    </Space>
                  </div>
                  <Table
                    columns={cxLineColumns}
                    data={cxLines}
                    rowKey={(record: any, index?: number) => String(index ?? 0)}
                    pagination={{ pageSize: 10, showTotal: true }}
                    border
                    size="small"
                    noDataElement={<Empty description="暂无测线数据" />}
                  />
                </>
              )}
              {/* 高分辨直流电 method=5 */}
              {methodNum === 5 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>高分辨直流电观测系统信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="供电电极数量" 
                        field="gddjnum" 
                        rules={[{ required: true, message: '请输入供电电极数量' }]}
                        extra="单位：个，不超过2位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={99} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="测量电极测点数量" 
                        field="cldjnum" 
                        rules={[{ required: true, message: '请输入测量电极测点数量' }]}
                        extra="单位：个，不超过2位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={99} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="设备名称" 
                        field="sbName" 
                        rules={[{ required: true, message: '请输入设备名称' }]}
                        extra="如：SIR-20（不可超过20字）"
                      >
                        <Input placeholder="" maxLength={20} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="供电电压" 
                        field="gddy" 
                        rules={[{ required: true, message: '请输入供电电压' }]}
                        extra="单位：V，不超过2位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={99} suffix="V" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="供电电流" 
                        field="gddl" 
                        rules={[{ required: true, message: '请输入供电电流' }]}
                        extra="单位：mA，不超过3位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} suffix="mA" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>电极距掌子面距离表</div>
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<IconPlus />} onClick={handleOpenDjPointModal}>新增</Button>
                  </div>
                  <Table
                    columns={djPointColumns}
                    data={djPoints}
                    rowKey={(record: any, index?: number) => String(index ?? 0)}
                    pagination={false}
                    border
                    size="small"
                    noDataElement={<Empty description="暂无数据" />}
                  />
                </>
              )}
              {/* 瞬变电磁 method=6 */}
              {methodNum === 6 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>瞬变电磁参数信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="采集装置类型" 
                        field="sbdcType" 
                        rules={[{ required: true, message: '请选择采集装置类型' }]}
                      >
                        <Select placeholder="请选择">
                          {Object.entries(SBDC_TYPE_MAP).map(([k, v]) => (
                            <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="发射框位置里程" 
                        field="fskwzlc" 
                        rules={[{ required: true, message: '请输入发射框位置里程' }]}
                        extra="单位：m，保留2位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={2} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="发射框长" 
                        field="fskc" 
                        rules={[{ required: true, message: '请输入发射框长' }]}
                        extra="单位：m，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="发射框宽" 
                        field="fskk" 
                        rules={[{ required: true, message: '请输入发射框宽' }]}
                        extra="单位：m，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="激发线圈匝数" 
                        field="jfxqzs" 
                        rules={[{ required: true, message: '请输入激发线圈匝数' }]}
                        extra="单位：个，不超过3位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="接收框长" 
                        field="jskc" 
                        rules={[{ required: true, message: '请输入接收框长' }]}
                        extra="单位：m，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="接收框宽" 
                        field="jskk" 
                        rules={[{ required: true, message: '请输入接收框宽' }]}
                        extra="单位：m，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="接收框匝数" 
                        field="jskzs" 
                        rules={[{ required: true, message: '请输入接收框匝数' }]}
                        extra="单位：个，不超过3位整数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" min={0} max={999} />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="接收线圈等效面积" 
                        field="jsxqdxmj" 
                        rules={[{ required: true, message: '请输入接收线圈等效面积' }]}
                        extra="单位：m²，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m²" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="收发距" 
                        field="sf"
                        extra="单位：m，保留1位小数（仅偶级装置必填）"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>设备信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="设备名称" 
                        field="sbName" 
                        rules={[{ required: true, message: '请输入设备名称' }]}
                      >
                        <Input placeholder="" maxLength={20} />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>瞬变电磁成果信息</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item 
                        label="发射频率" 
                        field="fspl" 
                        rules={[{ required: true, message: '请输入发射频率' }]}
                        extra="单位：Hz，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="Hz" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item 
                        label="供电电流" 
                        field="gddl" 
                        rules={[{ required: true, message: '请输入供电电流' }]}
                        extra="单位：A，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="A" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Form.Item 
                        label="测量时间" 
                        field="clsj" 
                        rules={[{ required: true, message: '请输入测量时间' }]}
                        extra="单位：s，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="s" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={6}>
                      <Form.Item 
                        label="盲区范围" 
                        field="mqfw" 
                        rules={[{ required: true, message: '请输入盲区范围' }]}
                        extra="单位：m，保留1位小数"
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} suffix="m" />
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={18}>
                      <Form.Item 
                        label="测线布置描述" 
                        field="cxbzms"
                      >
                        <Input placeholder="如：测线沿隧道轴线方向布置" />
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              )}
              {/* 微震监测预报 method=7 */}
              {methodNum === 7 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>描述</div>
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
                </>
              )}
              {/* 其他 method=0 */}
              {methodNum === 0 && (
                <>
                  <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>描述</div>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={12}>
                      <Form.Item label="基础信息" field="jcxx">
                        <TextArea placeholder="请输入基础信息" rows={4} maxLength={512} showWordLimit />
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
                </>
              )}
            </TabPane>

            {/* 第四个选项卡：附件及成果图 */}
            <TabPane key="attachments" title={tabTitles[3]}>
              <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>附件及成果图信息</div>
              
              {/* 其他 method=0 特有的附件布局 */}
              {methodNum === 0 ? (
                <>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="原始文件" field="originalfile">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="附件（基础报告）" field="addition">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="作业现场图序" field="images">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="观测系统布置图" field="gcsysbzt">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              ) : /* 微震监测预报 method=7 特有的附件布局 */
              methodNum === 7 ? (
                <>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="原始文件" field="originalfile">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="附件（基础报告）" field="addition">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="作业现场图序" field="images">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="观测系统布置图" field="gcsysbzt">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              ) : /* 瞬变电磁 method=6 特有的附件布局 */
              methodNum === 6 ? (
                <>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="原始文件" field="originalfile">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="附件（基础报告）" field="addition">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="作业现场照片" field="images">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="视电阻率等值线图" field="pic1">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="视电阻率曲线图" field="pic2">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="成果图" field="pic3">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              ) : /* 高分辨直流电 method=5 特有的附件布局 - 按API文档只有pic1,pic2,pic3 */
              methodNum === 5 ? (
                <>
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="原始文件" field="originalfile">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="附件（基础报告）" field="addition">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="作业现场图序" field="images">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="视电系统布置图" field="pic1">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="电势等值线图" field="pic2">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="成果图" field="pic3">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="干扰图" field="grpic">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              ) : (
                <>
                  {/* 其他方法的通用附件布局 */}
                  <Grid.Row gutter={24}>
                    <Grid.Col span={8}>
                      <Form.Item label="原始文件" field="originalfile">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="附件（基础报告）" field="addition">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="作业现场照片" field="images">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                  <Grid.Row gutter={24} style={{ marginTop: 20 }}>
                    <Grid.Col span={8}>
                      <Form.Item label="观测坐标布置图" field="pic1">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="波形图序列" field="pic2">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Form.Item label="成果图序列" field="gcxtpic">
                        <Upload listType="picture-card" limit={1} action="/">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <IconPlus />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </Grid.Col>
                  </Grid.Row>
                </>
              )}
            </TabPane>
          </Tabs>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Space size="large">
              <Button onClick={() => navigate(-1)}>取消</Button>
              <Button type="primary" icon={<IconSave />} loading={loading} onClick={handleSave}>
                保存
              </Button>
            </Space>
          </div>
        </Form>
      </div>

      {/* 分段信息新增/编辑弹窗 */}
      {/* 分段信息弹窗 - 使用通用组件 */}
      <SegmentModal
        visible={segmentModalVisible}
        onCancel={() => setSegmentModalVisible(false)}
        onOk={handleConfirmSegment}
        editingData={editingSegment}
        defaultDkname={form.getFieldValue('dkname') || 'DK'}
      />

      {/* 电磁波反射 - 测线布置信息新增/编辑弹窗 */}
      <Modal
        title={editingCxLineIndex !== null ? '编辑测线布置信息' : '新增测线布置信息'}
        visible={cxLineModalVisible}
        onOk={handleConfirmCxLine}
        onCancel={() => setCxLineModalVisible(false)}
        okText="确认"
        cancelText="取消"
        style={{ width: 600 }}
      >
        <Form form={cxLineForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Grid.Row gutter={16}>
            <Grid.Col span={24}>
              <Form.Item label="测线序号" field="cxxh" rules={[{ required: true, message: '请输入测线序号' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="" min={1} />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item label="起点X坐标" field="qdzbx" rules={[{ required: true, message: '请输入起点X坐标' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="" />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="起点Y坐标" field="qdzby" rules={[{ required: true, message: '请输入起点Y坐标' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="" />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item label="终点X坐标" field="zdzbx" rules={[{ required: true, message: '请输入终点X坐标' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="" />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="终点Y坐标" field="zdzby" rules={[{ required: true, message: '请输入终点Y坐标' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="" />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
        </Form>
      </Modal>

      {/* 陆地声呐 - 测点信息新增/编辑弹窗 */}
      <Modal
        title={editingCdPointIndex !== null ? '编辑测点信息' : '新增测点信息'}
        visible={cdPointModalVisible}
        onOk={handleConfirmCdPoint}
        onCancel={() => setCdPointModalVisible(false)}
        okText="确认"
        cancelText="取消"
        style={{ width: 500 }}
      >
        <Form form={cdPointForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item 
            label="测点序号" 
            field="cdxh" 
            rules={[{ required: true, message: '请输入测点序号' }]}
            extra="序号由1开始递增"
          >
            <InputNumber style={{ width: '100%' }} placeholder="" min={1} />
          </Form.Item>
          <Form.Item 
            label="距拱顶距离" 
            field="jgdjl" 
            rules={[
              { required: true, message: '请输入距拱顶距离' },
              { type: 'number', max: 99.9, message: '整数位不能超过2位' }
            ]}
            extra="保留1位小数，整数位不超过2位（单位：m）"
          >
            <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} max={99.9} />
          </Form.Item>
          <Form.Item 
            label="距左线距离" 
            field="jzxjl" 
            rules={[
              { required: true, message: '请输入距左线距离' },
              { type: 'number', max: 99.9, message: '整数位不能超过2位' }
            ]}
            extra="保留1位小数，整数位不超过2位（单位：m）"
          >
            <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} max={99.9} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 高分辨直流电 - 电极距掌子面距离新增/编辑弹窗 */}
      <Modal
        title={editingDjPointIndex !== null ? '编辑电极信息' : '新增电极信息'}
        visible={djPointModalVisible}
        onOk={handleConfirmDjPoint}
        onCancel={() => setDjPointModalVisible(false)}
        okText="确认"
        cancelText="取消"
        style={{ width: 500 }}
      >
        <Form form={djPointForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item 
            label="电极序号" 
            field="djxh" 
            rules={[{ required: true, message: '请输入电极序号' }]}
          >
            <Input style={{ width: '100%' }} placeholder="例如: DJ001" />
          </Form.Item>
          <Form.Item 
            label="类型" 
            field="gfbzldResultinfoType" 
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value={1}>供电电极</Select.Option>
              <Select.Option value={2}>测量电极</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            label="距掌子面距离" 
            field="jzzmjl" 
            rules={[{ required: true, message: '请输入距掌子面距离' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="" precision={1} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default GeologyForecastCreatePage;
