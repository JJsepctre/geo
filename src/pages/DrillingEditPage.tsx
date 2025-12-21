import { useState, useEffect } from 'react'
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
  Table,
  Modal,
  Upload
} from '@arco-design/web-react'
import { IconLeft, IconSave, IconPlus } from '@arco-design/web-react/icon'
import apiAdapter from '../services/apiAdapter'
import realAPI from '../services/realAPI'
import SegmentModal, { SegmentData } from '../components/SegmentModal'

const { TextArea } = Input
const TabPane = Tabs.TabPane
const { Row, Col } = Grid

function DrillingEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  
  const method = searchParams.get('method')
  const siteId = searchParams.get('siteId')
  
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [originalData, setOriginalData] = useState<any>(null) // 保存原始数据
  
  // 钻孔数据列表
  const [zkList, setZkList] = useState<any[]>([])
  const [zkModalVisible, setZkModalVisible] = useState(false)
  const [currentZk, setCurrentZk] = useState<any>(null)
  const [zkForm] = Form.useForm()

  // 钻孔记录列表（弹窗内）
  const [zkRecordList, setZkRecordList] = useState<any[]>([])
  const [zkRecordModalVisible, setZkRecordModalVisible] = useState(false)
  const [zkRecordForm] = Form.useForm()

  // 地层信息列表（弹窗内）
  const [dcInfoList, setDcInfoList] = useState<any[]>([])
  const [dcInfoModalVisible, setDcInfoModalVisible] = useState(false)
  const [dcInfoForm] = Form.useForm()
  const [editingDcInfoIndex, setEditingDcInfoIndex] = useState<number | null>(null)

  // 分段信息（预报结果）列表
  const [forecastList, setForecastList] = useState<any[]>([])
  const [forecastModalVisible, setForecastModalVisible] = useState(false)

  // 文件上传状态
  const [additionFile, setAdditionFile] = useState<File | null>(null)  // 附件（编辑报告）
  const [imagesFile, setImagesFile] = useState<File | null>(null)      // 作业现场照片
  const [uploading, setUploading] = useState(false)
  const [existingAddition, setExistingAddition] = useState<string>('')  // 已有附件URL
  const [existingImages, setExistingImages] = useState<string>('')      // 已有图片URL
  const [currentForecast, setCurrentForecast] = useState<any>(null)

  // 获取详情数据
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      
      // 新增模式，不需要调用详情接口
      const isNew = id === 'new'
      if (isNew) {
        // 设置默认值
        form.setFieldsValue({
          method: method === '14' ? 14 : 13,
          dkname: 'DK',
          siteId: siteId,
        })
        console.log('📝 [钻探法] 新增模式，跳过详情接口')
        return
      }
      
      setLoading(true)
      try {
        // 尝试从路由状态获取
        if (location.state?.record) {
          const data = location.state.record
          form.setFieldsValue(data)
          
          // 设置钻孔列表
          const isJspk = method === '14'
          // 加深炮孔使用 ztfJspkVOList，超前水平钻使用 cqspzZkzzVOList
          const zkData = isJspk 
            ? (data.ztfJspkVOList || data.jspkDataVOList || data.jspkDataDTOList) 
            : (data.cqspzZkzzVOList || data.cqspzZkzzDTOList)
          if (zkData) {
            setZkList(zkData)
            console.log('📊 [编辑页] 从路由状态加载钻孔数据:', zkData)
          }
          
          // 设置分段信息列表（预报结果）
          if (data.ybjgVOList) {
            setForecastList(data.ybjgVOList)
            console.log('📊 [编辑页] 从路由状态加载分段信息:', data.ybjgVOList)
          }
        }
        
        // 调用详情接口
        const detail = await apiAdapter.getDrillingDetail(id, method)
        console.log('📥 [编辑页] 详情接口返回完整数据:', detail)
        console.log('📥 [编辑页] 详情接口返回的钻孔相关字段:', {
          ztfJspkVOList: detail?.ztfJspkVOList,
          jspkDataVOList: detail?.jspkDataVOList,
          jspkZkzzVOList: detail?.jspkZkzzVOList,
          cqspzZkzzVOList: detail?.cqspzZkzzVOList,
        })
        if (detail) {
          // 里程拆分：将 dkilo 拆分为 dkiloKm 和 dkiloM
          let dkiloKm, dkiloM;
          if (detail.dkilo !== undefined && detail.dkilo !== null) {
            dkiloKm = Math.floor(detail.dkilo / 1000);
            dkiloM = detail.dkilo % 1000;
          }
          const formData = { ...detail, dkiloKm, dkiloM };
          form.setFieldsValue(formData)
          setOriginalData(detail) // 保存原始数据
          
          // 设置钻孔列表
          const isJspk = method === '14'
          // 加深炮孔使用 ztfJspkVOList，超前水平钻使用 cqspzZkzzVOList
          const zkData = isJspk 
            ? (detail.ztfJspkVOList || detail.jspkDataVOList || detail.jspkZkzzVOList) 
            : detail.cqspzZkzzVOList
          if (zkData) {
            setZkList(zkData)
            console.log('📊 [编辑页] 从API加载钻孔数据:', zkData)
          }
          
          // 设置分段信息列表（预报结果）
          if (detail.ybjgVOList) {
            setForecastList(detail.ybjgVOList)
            console.log('📊 [编辑页] 从API加载分段信息:', detail.ybjgVOList)
          }
          
          // 设置已有文件
          if (detail.addition) {
            setExistingAddition(detail.addition)
            console.log('📎 [编辑页] 已有附件:', detail.addition)
          }
          if (detail.images) {
            setExistingImages(detail.images)
            console.log('🖼️ [编辑页] 已有图片:', detail.images)
          }
        }
      } catch (error) {
        console.error('❌ 获取详情失败:', error)
        Message.error('获取详情数据失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDetail()
  }, [id, method, siteId, location.state, form])

  const handleBack = () => {
    if (siteId) {
      navigate(`/forecast/geology/${siteId}`)
    } else {
      navigate(-1)
    }
  }

  const handleSave = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()
      
      setSaving(true)
      
      const isNew = id === 'new'
      
      // 获取当前预报方法（从URL参数）
      const currentMethod = parseInt(method || '13', 10)  // 默认超前水平钻(13)
      
      // 里程合并：将 dkiloKm 和 dkiloM 合并为 dkilo
      const dkilo = (values.dkiloKm || 0) * 1000 + (values.dkiloM || 0);
      
      // 合并原始数据和表单修改的数据，确保未修改的字段保留原值
      const isJspkMethod = currentMethod === 14
      // 清理原始数据中的列表字段，避免覆盖用户修改的数据
      const cleanOriginalData = { ...originalData }
      delete cleanOriginalData.ybjgVOList
      delete cleanOriginalData.ybjgDTOList
      delete cleanOriginalData.cqspzZkzzVOList
      delete cleanOriginalData.cqspzZkzzDTOList
      delete cleanOriginalData.jspkDataVOList
      delete cleanOriginalData.jspkDataDTOList
      delete cleanOriginalData.ztfJspkVOList
      
      const submitData = {
        ...cleanOriginalData,  // 先用清理后的原始数据
        ...values,        // 再用表单值覆盖（用户修改的部分）
        dkilo,            // 使用合并后的里程值
        // 编辑时使用原始数据的 PK 值，新增时为 null
        ybPk: isNew ? null : (originalData?.ybPk || originalData?.cqspzPk || originalData?.jspkPk || null),
        // 超前水平钻字段
        cqspzPk: isNew ? null : (originalData?.cqspzPk || null),
        cqspzId: isNew ? null : (originalData?.cqspzId || null),
        // 加深炮孔字段
        jspkPk: isNew ? null : (originalData?.jspkPk || null),
        jspkId: isNew ? null : (originalData?.jspkId || null),
        siteId: siteId || originalData?.siteId,
        method: currentMethod,  // 钻探法：13=超前水平钻，14=加深炮孔
        kwtype: currentMethod === 13 ? 1 : 2,  // 1=超前水平钻，2=加深炮孔
        // 根据 method 使用不同的钻孔列表字段名
        ...(isJspkMethod 
          ? { jspkDataDTOList: zkList }  // 加深炮孔
          : { cqspzZkzzDTOList: zkList }  // 超前水平钻
        ),
        // 分段信息列表 - 新增时不发送pk/id字段
        ybjgDTOList: forecastList.map(item => {
          // 基础数据字段（不含pk/id）
          const baseData: any = {
            dkname: item.dkname || 'DK',
            sdkilo: item.sdkilo,
            sdkiloEnd: item.sdkiloEnd,
            edkilo: item.edkilo,
            edkiloEnd: item.edkiloEnd,
            ybjgTime: item.ybjgTime,
            risklevel: item.risklevel || '',
            wylevel: item.wylevel,
            grade: item.grade,
            dzjb: item.dzjb,  // 保留dzjb字段，API层会转换为grade
            jlresult: item.jlresult || ''
          };
          // 只有编辑已有记录时才发送pk/id字段
          if (item.ybjgPk) {
            baseData.ybjgPk = item.ybjgPk;
            baseData.ybjgId = item.ybjgId || item.ybjgPk;
            baseData.ybPk = item.ybPk;
          }
          return baseData;
        }),
      }
      
      console.log('📊 [钻探法] forecastList:', forecastList)
      // 清理临时字段
      delete submitData.dkiloKm;
      delete submitData.dkiloM;
      
      console.log('📤 [钻探法] 提交数据:', submitData, '是否新增:', isNew, 'method:', currentMethod)
      
      let result
      if (isNew) {
        // 新增模式调用create接口
        result = await apiAdapter.createDrilling(submitData)
      } else {
        // 编辑模式调用update接口
        result = await apiAdapter.updateDrilling(id!, submitData)
      }
      
      if (result?.success) {
        Message.success(isNew ? '新增成功' : '保存成功')
        handleBack()
      } else {
        Message.error(isNew ? '新增失败' : '保存失败')
      }
    } catch (error) {
      console.error('❌ 保存失败:', error)
      Message.error('保存失败，请检查表单')
    } finally {
      setSaving(false)
    }
  }

  // 添加/编辑钻孔
  const handleAddZk = () => {
    setCurrentZk(null)
    zkForm.resetFields()
    // 清空钻孔记录和地层信息列表
    setZkRecordList([])
    setDcInfoList([])
    setZkModalVisible(true)
  }

  const handleEditZk = (record: any, index: number) => {
    setCurrentZk({ ...record, index })
    zkForm.setFieldsValue(record)
    // 加载已有的钻孔记录和地层信息
    setZkRecordList(record.cqspzZkzzZtjlbDTOList || record.cqspzZkzzZtjlbVOList || [])
    setDcInfoList(record.cqspzZkzzDcxxDTOList || record.cqspzZkzzDcxxVOList || [])
    setZkModalVisible(true)
  }

  const handleDeleteZk = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条钻孔数据吗？',
      onOk: () => {
        const newList = [...zkList]
        newList.splice(index, 1)
        setZkList(newList)
        Message.success('删除成功')
      }
    })
  }

  const handleZkModalOk = async () => {
    try {
      await zkForm.validate()
      const values = zkForm.getFieldsValue()
      
      // 构建完整的钻孔数据，包含钻孔记录和地层信息
      const zkData = {
        ...values,
        // 钻孔记录列表
        cqspzZkzzZtjlbDTOList: zkRecordList.map(record => ({
          ...record,
          cqspzZkzzZtjlbPk: record.cqspzZkzzZtjlbPk || null,
          cqspzZkzzZtjlbId: record.cqspzZkzzZtjlbId || null,
          cqspzZkzzPk: record.cqspzZkzzPk || null,
        })),
        // 地层信息列表
        cqspzZkzzDcxxDTOList: dcInfoList.map(info => ({
          ...info,
          cqspzZkzzDcxxPk: info.cqspzZkzzDcxxPk || null,
          cqspzZkzzDcxxId: info.cqspzZkzzDcxxId || null,
          cqspzZkzzPk: info.cqspzZkzzPk || null,
        })),
      }
      
      if (currentZk && currentZk.index !== undefined) {
        // 编辑
        const newList = [...zkList]
        newList[currentZk.index] = zkData
        setZkList(newList)
      } else {
        // 新增
        setZkList([...zkList, zkData])
      }
      
      // 清空临时列表
      setZkRecordList([])
      setDcInfoList([])
      setZkModalVisible(false)
      Message.success(currentZk ? '修改成功' : '添加成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 添加/编辑预报数据（分段信息）
  const handleAddForecast = () => {
    setCurrentForecast(null)
    setForecastModalVisible(true)
  }

  const handleEditForecast = (record: any, index: number) => {
    setCurrentForecast({ ...record, index })
    setForecastModalVisible(true)
  }

  const handleDeleteForecast = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条预报数据吗？',
      onOk: () => {
        const newList = [...forecastList]
        newList.splice(index, 1)
        setForecastList(newList)
        Message.success('删除成功')
      }
    })
  }

  // 分段信息保存回调（来自SegmentModal组件）
  const handleForecastModalOk = (data: SegmentData) => {
    if (currentForecast && currentForecast.index !== undefined) {
      // 编辑
      const newList = [...forecastList]
      newList[currentForecast.index] = { ...newList[currentForecast.index], ...data }
      setForecastList(newList)
      Message.success('修改成功')
    } else {
      // 新增 - PK字段设为null，后端会自动生成
      setForecastList([...forecastList, { ...data, ybjgPk: null, ybjgId: null, ybPk: null }])
      Message.success('添加成功')
    }
    setForecastModalVisible(false)
  }

  // 钻孔数据表格列
  const isJspk = method === '14'
  const zkColumns = isJspk ? [
    { title: '编号', dataIndex: 'index', width: 80, render: (_: any, __: any, index: number) => index + 1 },
    { title: '钻孔位置', dataIndex: 'zkwz', width: 150 },
    { title: '外插角', dataIndex: 'wcj', width: 100 },
    { title: '钻孔长度', dataIndex: 'zkcd', width: 100 },
    { title: '钻探情况及预报地质描述', dataIndex: 'dzqkjs', ellipsis: true },
    {
      title: '操作',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button size="small" type="text" onClick={() => handleEditZk(zkList[index], index)}>编辑</Button>
          <Button size="small" type="text" status="danger" onClick={() => handleDeleteZk(index)}>删除</Button>
        </Space>
      )
    }
  ] : [
    { title: '编号', dataIndex: 'index', width: 80, render: (_: any, __: any, index: number) => index + 1 },
    { title: '钻孔位置', dataIndex: 'kwbh', width: 150 },
    { title: '外插角', dataIndex: 'kwpjangle', width: 100 },
    { title: '钻孔长度', dataIndex: 'jgdjl', width: 100 },
    { title: '钻探情况及预报地质描述', dataIndex: 'zjcode', ellipsis: true },
    {
      title: '操作',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button size="small" type="text" onClick={() => handleEditZk(zkList[index], index)}>编辑</Button>
          <Button size="small" type="text" status="danger" onClick={() => handleDeleteZk(index)}>删除</Button>
        </Space>
      )
    }
  ]

  // 超前水平钻信息表列 - 字段对应 cqspzZkzzDTOList
  const cqspzColumns = [
    { title: '序号', dataIndex: 'index', width: 60, align: 'center' as const, render: (_: any, __: any, index: number) => index + 1 },
    { 
      title: '开始时间', 
      dataIndex: 'kssj', 
      width: 160, 
      align: 'center' as const,
      render: (time: string) => time ? time.replace('T', ' ').substring(0, 19) : '-'
    },
    { 
      title: '结束时间', 
      dataIndex: 'jssj', 
      width: 160, 
      align: 'center' as const,
      render: (time: string) => time ? time.replace('T', ' ').substring(0, 19) : '-'
    },
    { title: '距掌面距离', dataIndex: 'jgdjl', width: 100, align: 'center' as const },
    { title: '距中心线距离', dataIndex: 'jzxxjl', width: 110, align: 'center' as const },
    { title: '开孔立面角度', dataIndex: 'kwljangle', width: 110, align: 'center' as const },
    { title: '开孔倾角角度', dataIndex: 'kwpjangle', width: 110, align: 'center' as const },
    { title: '钻孔直径', dataIndex: 'zkzj', width: 90, align: 'center' as const },
    { title: '钻机型号', dataIndex: 'zjcode', width: 120, align: 'center' as const },
    {
      title: '操作',
      width: 100,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button size="small" type="text" style={{ color: '#165DFF' }} onClick={() => handleEditZk(zkList[index], index)}>编辑</Button>
          <Button size="small" type="text" status="danger" onClick={() => handleDeleteZk(index)}>删除</Button>
        </Space>
      )
    }
  ]

  // 加深炮孔信息表列 - 字段对应 jspkDataDTOList
  const jspkColumns = [
    { title: '编号', dataIndex: 'index', width: 60, align: 'center' as const, render: (_: any, __: any, index: number) => index + 1 },
    { title: '钻孔位置', dataIndex: 'zkwz', width: 120, align: 'center' as const },
    { title: '外插角', dataIndex: 'wcj', width: 100, align: 'center' as const },
    { title: '钻孔长度', dataIndex: 'zkcd', width: 100, align: 'center' as const },
    { title: '钻探情况及预报地质描述', dataIndex: 'dzqkjs', ellipsis: true },
    {
      title: '操作',
      width: 100,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button size="small" type="text" style={{ color: '#165DFF' }} onClick={() => handleEditZk(zkList[index], index)}>编辑</Button>
          <Button size="small" type="text" status="danger" onClick={() => handleDeleteZk(index)}>删除</Button>
        </Space>
      )
    }
  ]

  const methodName = method === '14' ? '加深炮孔' : method === '13' ? '超前水平钻' : '钻探法'

  // 围岩等级映射
  const rockGradeMap = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ']
  
  // 风险类别映射（数字转中文）
  const riskLevelMap: Record<string, string> = {
    '1': '低风险',
    '2': '中风险',
    '3': '高风险',
    '4': '极高风险'
  }
  
  // 风险类别颜色映射
  const riskColorMap: Record<string, string> = {
    '低风险': '#00b42a',
    '中风险': '#ff7d00',
    '高风险': '#f53f3f',
    '极高风险': '#d91ad9'
  }



  // 预报数据表格列（分段信息）
  const forecastColumns = [
    { title: '序号', dataIndex: 'index', width: 60, align: 'center' as const, render: (_: any, __: any, index: number) => index + 1 },
    { title: '里程冠号', dataIndex: 'dkname', width: 100, align: 'center' as const },
    { title: '开始里程值', dataIndex: 'sdkilo', width: 110, align: 'center' as const },
    { title: '结束里程值', dataIndex: 'edkilo', width: 110, align: 'center' as const },
    { 
      title: '生成时间', 
      dataIndex: 'ybjgTime', 
      width: 160,
      align: 'center' as const,
      render: (time: string) => time ? time.replace('T', ' ').substring(0, 16) : '-'
    },
    { 
      title: '风险类别', 
      dataIndex: 'risklevel', 
      width: 80,
      align: 'center' as const,
      render: (val: string) => val || '-'
    },
    { 
      title: '地质类型', 
      dataIndex: 'grade', 
      width: 80,
      align: 'center' as const,
      render: (val: number, record: any) => {
        // 优先使用 dzjb（用户在表单中选择的字符串），如果没有则使用 grade（后端返回的数字）
        // grade: 0=绿色, 1=红色, 2=黄色
        const colorMapByGrade: Record<number, { bg: string; text: string; label: string }> = {
          0: { bg: '#52c41a', text: '#fff', label: '绿色' },
          1: { bg: '#ff4d4f', text: '#fff', label: '红色' },
          2: { bg: '#faad14', text: '#fff', label: '黄色' },
        }
        const colorMapByDzjb: Record<string, { bg: string; text: string; label: string }> = {
          'green': { bg: '#52c41a', text: '#fff', label: '绿色' },
          'yellow': { bg: '#faad14', text: '#fff', label: '黄色' },
          'red': { bg: '#ff4d4f', text: '#fff', label: '红色' },
        }
        // 优先使用 dzjb（前端表单选择的值），其次使用 grade（后端返回的值）
        let config = null
        if (record.dzjb && colorMapByDzjb[record.dzjb]) {
          config = colorMapByDzjb[record.dzjb]
        } else if (val !== undefined && val !== null && colorMapByGrade[val]) {
          config = colorMapByGrade[val]
        }
        if (config) {
          return <span style={{ backgroundColor: config.bg, color: config.text, padding: '2px 8px', borderRadius: 4 }}>{config.label}</span>
        }
        return '-'
      }
    },
    { 
      title: '围岩等级', 
      dataIndex: 'wylevel', 
      width: 80,
      align: 'center' as const,
      render: (val: number) => {
        if (val) {
          const grade = rockGradeMap[val - 1] || val
          return `${grade}`
        }
        return '-'
      }
    },
    { title: '预报结论', dataIndex: 'jlresult', ellipsis: true, width: 300 },
    {
      title: '操作',
      width: 100,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button size="small" type="text" style={{ color: '#165DFF' }} onClick={() => handleEditForecast(forecastList[index], index)}>
            <span style={{ fontSize: 16 }}>✎</span>
          </Button>
          <Button size="small" type="text" status="danger" onClick={() => handleDeleteForecast(index)}>
            <span style={{ fontSize: 16 }}>🗑</span>
          </Button>
        </Space>
      )
    }
  ]

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
        <span>{methodName}编辑</span>
        <Button 
          type="text" 
          icon={<IconLeft style={{ fontSize: 18 }} />} 
          style={{ color: '#1D2129' }}
          onClick={handleBack}
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 4px 4px' }}>
        <Spin loading={loading} style={{ width: '100%' }}>
          <Tabs activeTab={activeTab} onChange={setActiveTab} type="card">
            {/* 基本信息 Tab */}
            <TabPane key="basic" title="基本信息及其他信息">
              <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  基本信息
                </div>
                
                {/* 第1行：预报方法、预报时间 */}
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="预报方法" field="method" rules={[{ required: true, message: '请选择预报方法' }]}>
                      <Select placeholder="超前水平钻" disabled>
                        <Select.Option value={13}>超前水平钻</Select.Option>
                        <Select.Option value={14}>加深炮孔</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime placeholder="2023-08-01 09:14:00" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第2行：里程冠号、掌子面里程、预报长度 */}
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="DK" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="dkiloKm" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber placeholder="180" style={{ width: 100 }} precision={0} min={0} />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkiloM" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber placeholder="972" style={{ width: 100 }} precision={0} min={0} max={999} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="预报长度" 
                      field="ybLength" 
                      rules={[{ required: true, message: '请输入预报长度' }]}
                      extra="单位:m，保留2位小数，整数位不超过5位"
                    >
                      <InputNumber placeholder="-23.20" style={{ width: '100%' }} precision={2} max={99999.99} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第3行：检测人信息 */}
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="检测人" field="testname">
                      <Input placeholder="敖国永" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="检测人身份证" field="testno" rules={[{ required: true, message: '请输入检测人身份证' }]}>
                      <Input placeholder="533024199801133515" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="检测人电话" field="testtel">
                      <Input placeholder="18213407370" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第4行：复核人信息 */}
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="复核人" field="monitorname">
                      <Input placeholder="张益明" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno" rules={[{ required: true, message: '请输入复核人身份证' }]}>
                      <Input placeholder="530325199712231139" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel">
                      <Input placeholder="18325641258" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第5行：监理工程师信息 */}
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname" rules={[{ required: true, message: '请输入监理工程师' }]}>
                      <Input placeholder="孙继亮" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno" rules={[{ required: true, message: '请输入监理身份证' }]}>
                      <Input placeholder="510802196611280755" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel">
                      <Input placeholder="13981208498" />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  margin: '32px 0 24px',
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  详细描述
                </div>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="预报综合结论" field="conclusionyb">
                      <TextArea 
                        placeholder="本次超前钻探做1孔,23.2m，根据钻进速度描述如下:DK713+973.2～DK713+950段钻进速度快，钻速变化大，属砂岩泥岩，岩体较软，钻孔时推出少量黄色泥浆；超前钻探表明主要为全风化至弱风化泥岩粉砂土，节理裂隙较发育，岩体较破碎，裂隙间充填..." 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 150 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea 
                        placeholder="该段岩体主要为全风化至弱风化泥岩粉砂土，需加强超前预报预警，施工中做好超前支护，初期支护措施，并做好防水措施，加强围岩监测，防止掉块，防块和围岩失稳，施工过程中采用合理的施工程序检测，确保施工安全。" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 150 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="交班单位描述" field="jbdwms">
                      <TextArea 
                        placeholder="请输入交班单位描述" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="备注" field="remark">
                      <TextArea 
                        placeholder="请输入备注" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </TabPane>

            {/* 分段信息及下次超前地质预报 Tab */}
            <TabPane key="forecast" title="分段信息及下次超前地质预报">
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<IconPlus />} onClick={handleAddForecast}>
                    添加
                  </Button>
                </div>
                
                <Table
                  columns={forecastColumns}
                  data={forecastList.map((item, idx) => ({ ...item, _index: idx }))}
                  rowKey={(record: any) => `forecast-${record._index}`}
                  pagination={{ pageSize: 10 }}
                  border
                />

                {/* 下次超前地质预报 - 已隐藏 */}
              </div>
            </TabPane>

            {/* 钻孔信息表 Tab - 根据method显示不同内容 */}
            <TabPane key="drilling" title={method === '14' ? '钻孔信息' : '超前水平钻信息表'}>
              <div style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  {method === '14' ? '加深炮孔钻孔位信息表' : '超前水平钻孔位信息'}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<IconPlus />} onClick={handleAddZk}>
                    新增
                  </Button>
                </div>
                
                <Table
                  columns={method === '14' ? jspkColumns : cqspzColumns}
                  data={zkList.map((item, idx) => ({ ...item, _index: idx }))}
                  rowKey={(record: any) => `zk-${record._index}`}
                  pagination={{ pageSize: 10 }}
                  border
                />
              </div>
            </TabPane>

            {/* 附件及图片上传 Tab */}
            <TabPane key="upload" title="附件及图片上传">
              <div style={{ marginTop: 20, padding: '0 20px' }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  marginBottom: 24,
                  padding: '12px 0',
                  textAlign: 'center',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  附件及图片管理信息
                </div>

                {/* 附件（编辑报告） */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ color: '#f53f3f', marginRight: 2 }}>*</span>
                  <span style={{ width: 120 }}>附件（编辑报告）：</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    {/* 已有附件或新选择的附件预览 */}
                    <div style={{ 
                      width: 60, 
                      height: 70, 
                      border: '1px solid #e5e6eb', 
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ fontSize: 28, color: '#165DFF' }}>📄</div>
                      <div style={{ fontSize: 10, color: '#86909c', marginTop: 4, maxWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {additionFile ? additionFile.name : (existingAddition ? existingAddition.substring(0, 10) + '...' : '无文件')}
                      </div>
                    </div>
                    <Upload
                      autoUpload={false}
                      accept=".doc,.docx,.pdf"
                      showUploadList={false}
                      onChange={(fileList) => {
                        if (fileList.length > 0) {
                          const file = fileList[fileList.length - 1].originFile
                          if (file) {
                            setAdditionFile(file)
                            console.log('📎 附件已选择:', file.name)
                          }
                        }
                      }}
                    >
                      <div style={{ 
                        width: 60, 
                        height: 70, 
                        border: '1px dashed #c9cdd4', 
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#fff'
                      }}>
                        <div style={{ fontSize: 18, color: '#86909c' }}>↑</div>
                        <div style={{ fontSize: 12, color: '#165DFF' }}>{additionFile ? '重选' : '选择'}</div>
                      </div>
                    </Upload>
                    {additionFile && (
                      <Button size="small" type="text" status="danger" onClick={() => setAdditionFile(null)}>
                        清除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 作业现场照片 */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ color: '#f53f3f', marginRight: 2 }}>*</span>
                  <span style={{ width: 120 }}>作业现场照片：</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    {/* 已有图片或新选择的图片预览 */}
                    <div style={{ 
                      width: 60, 
                      height: 70, 
                      border: '1px solid #e5e6eb', 
                      borderRadius: 4,
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {imagesFile ? (
                        <img 
                          src={URL.createObjectURL(imagesFile)} 
                          alt="预览" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : existingImages ? (
                        <img 
                          src={existingImages} 
                          alt="已有图片" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 11, color: '#86909c' }}>无图片</span>
                      )}
                    </div>
                    <Upload
                      autoUpload={false}
                      accept="image/*"
                      showUploadList={false}
                      onChange={(fileList) => {
                        if (fileList.length > 0) {
                          const file = fileList[fileList.length - 1].originFile
                          if (file) {
                            setImagesFile(file)
                            console.log('🖼️ 图片已选择:', file.name)
                          }
                        }
                      }}
                    >
                      <div style={{ 
                        width: 60, 
                        height: 70, 
                        border: '1px dashed #c9cdd4', 
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#fff'
                      }}>
                        <div style={{ fontSize: 18, color: '#86909c' }}>↑</div>
                        <div style={{ fontSize: 12, color: '#165DFF' }}>{imagesFile ? '重选' : '选择'}</div>
                      </div>
                    </Upload>
                    {imagesFile && (
                      <Button size="small" type="text" status="danger" onClick={() => setImagesFile(null)}>
                        清除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 提交按钮 */}
                <div style={{ textAlign: 'right', marginTop: 20 }}>
                  <Button 
                    type="primary" 
                    loading={uploading}
                    disabled={!additionFile && !imagesFile}
                    onClick={async () => {
                      if (!originalData?.ybPk) {
                        Message.warning('请先保存基本信息后再上传文件')
                        return
                      }
                      if (!additionFile && !imagesFile) {
                        Message.warning('请选择要上传的文件')
                        return
                      }
                      
                      setUploading(true)
                      try {
                        const result = await realAPI.uploadDrillingFile(originalData.ybPk, {
                          siteId: siteId || originalData.siteId || '',
                          images: imagesFile,
                          addition: additionFile,
                        })
                        
                        if (result.success) {
                          Message.success('文件上传成功')
                          // 清除已上传的文件状态
                          if (additionFile) {
                            setExistingAddition(additionFile.name)
                            setAdditionFile(null)
                          }
                          if (imagesFile) {
                            setExistingImages(URL.createObjectURL(imagesFile))
                            setImagesFile(null)
                          }
                        } else {
                          Message.error(result.message || '文件上传失败')
                        }
                      } catch (error: any) {
                        console.error('❌ 文件上传异常:', error)
                        Message.error(error?.message || '文件上传失败')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  >
                    上传文件
                  </Button>
                </div>
              </div>
            </TabPane>
          </Tabs>

          {/* 底部按钮 */}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleBack}>取消</Button>
              <Button type="primary" icon={<IconSave />} loading={saving} onClick={handleSave}>
                保存
              </Button>
            </Space>
          </div>
        </Spin>
      </div>

      {/* 钻孔编辑弹窗 - 根据method显示不同内容 */}
      <Modal
        title="详情"
        visible={zkModalVisible}
        onOk={handleZkModalOk}
        onCancel={() => {
          setZkModalVisible(false)
          // 关闭弹窗时清空临时数据
          setZkRecordList([])
          setDcInfoList([])
        }}
        style={{ width: method === '14' ? 600 : 900 }}
        okText="确定"
        cancelText="取消"
      >
        {method === '14' ? (
          /* 加深炮孔 - 简单表单 */
          <Form form={zkForm} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item 
                  label="钻孔位置" 
                  field="zkwz" 
                  rules={[{ required: true, message: '请输入钻孔位置' }]}
                >
                  <Input placeholder="请输入钻孔位置" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="外插角" 
                  field="wcj" 
                  rules={[{ required: true, message: '请输入外插角' }]}
                  extra="单位:℃，保留1位小数，整数位不超过3位"
                >
                  <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={1} max={999.9} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="钻孔长度" 
                  field="zkcd" 
                  rules={[{ required: true, message: '请输入钻孔长度' }]}
                  extra="单位:m，保留2位小数，整数位不超过2位"
                >
                  <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} max={99.99} min={0} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item 
                  label="钻探情况及预报地质描述" 
                  field="dzqkjs"
                  rules={[{ required: true, message: '请输入钻探情况及预报地质描述' }]}
                >
                  <Input placeholder="请输入钻探情况及预报地质描述" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          /* 超前水平钻 - 带选项卡的复杂表单 */
          <Tabs defaultActiveTab="basic" type="text">
            {/* 基本信息选项卡 */}
            <TabPane key="basic" title="基本信息">
              <Form form={zkForm} layout="vertical" style={{ marginTop: 16 }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="开始时间" field="kssj" rules={[{ required: true, message: '请选择开始时间' }]}>
                      <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="结束时间" field="jssj" rules={[{ required: true, message: '请选择结束时间' }]}>
                      <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="距掌面距离" field="jgdjl" rules={[{ 
                      validator: (value, callback) => {
                        if (value === undefined || value === null || value === '') callback('请输入距掌面距离')
                        else callback()
                      }
                    }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="距中心线距离" field="jzxxjl" rules={[{ 
                      validator: (value, callback) => {
                        if (value === undefined || value === null || value === '') callback('请输入距中心线距离')
                        else callback()
                      }
                    }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="开孔立面角度" field="kwljangle" rules={[{ 
                      validator: (value, callback) => {
                        if (value === undefined || value === null || value === '') callback('请输入开孔立面角度')
                        else callback()
                      }
                    }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="开孔倾角角度" field="kwpjangle" rules={[{ 
                      validator: (value, callback) => {
                        if (value === undefined || value === null || value === '') callback('请输入开孔倾角角度')
                        else callback()
                      }
                    }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="钻孔直径" field="zkzj" rules={[{ 
                      validator: (value, callback) => {
                        if (value === undefined || value === null || value === '') callback('请输入钻孔直径')
                        else callback()
                      }
                    }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="钻机型号" field="zjcode" rules={[{ required: true, message: '请输入钻机型号' }]}>
                      <Input placeholder="请输入" />
                    </Form.Item>
                  </Col>
                </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="孔位坐标序列" field="kwzbxl">
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  {/* 圆形图示区域 */}
                  <div style={{ 
                    border: '1px solid #e5e6eb', 
                    borderRadius: 4, 
                    padding: 16, 
                    textAlign: 'center',
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <span style={{ position: 'absolute', top: 8, left: 16, fontSize: 12, color: '#86909c' }}>0</span>
                    <span style={{ position: 'absolute', top: 8, right: 16, fontSize: 12, color: '#86909c' }}>400</span>
                    <span style={{ position: 'absolute', bottom: 8, left: 16, fontSize: 12, color: '#86909c' }}>400</span>
                    <div style={{ 
                      width: 150, 
                      height: 150, 
                      border: '2px solid #165DFF', 
                      borderRadius: '50%' 
                    }} />
                  </div>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="备注" field="remark">
                    <Input placeholder="无" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="是否取芯" field="sfqx" rules={[{ 
                    validator: (value, callback) => {
                      if (value === undefined || value === null || value === '') callback('请选择是否取芯')
                      else callback()
                    }
                  }]}>
                    <Select placeholder="请选择">
                      <Select.Option value={0}>不取芯</Select.Option>
                      <Select.Option value={1}>取芯</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item label="孔口示意图" field="kkwzsyt">
                    <Upload
                      action="/api/v1/ztf/cqspz/upload"
                      accept="image/*"
                      listType="picture-card"
                      limit={1}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, color: '#86909c' }}>+</div>
                        <div style={{ fontSize: 12, color: '#86909c', marginTop: 4 }}>上传</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          {/* 钻孔记录选项卡 */}
          <TabPane key="record" title="钻孔记录">
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Button type="outline">下载</Button>
                  <Button type="primary" icon={<IconPlus />} onClick={() => {
                    zkRecordForm.resetFields()
                    setZkRecordModalVisible(true)
                  }}>
                    新增
                  </Button>
                  <Button type="outline">导入</Button>
                </Space>
              </div>
              
              <Table
                columns={[
                  { title: '开始时间', dataIndex: 'kssj', width: 140, align: 'center' as const, render: (t: string) => t ? t.replace('T', ' ').substring(0, 19) : '-' },
                  { title: '结束时间', dataIndex: 'jssj', width: 140, align: 'center' as const, render: (t: string) => t ? t.replace('T', ' ').substring(0, 19) : '-' },
                  { title: '钻孔深度', dataIndex: 'zksd', width: 90, align: 'center' as const },
                  { title: '钻孔压力', dataIndex: 'zkpressure', width: 90, align: 'center' as const },
                  { title: '转速', dataIndex: 'zkspeed', width: 70, align: 'center' as const },
                  { title: '孔内水压', dataIndex: 'kwwaterpre', width: 90, align: 'center' as const },
                  { title: '孔内水量', dataIndex: 'kwwaterspe', width: 90, align: 'center' as const },
                  { title: '孔位坐标序列', dataIndex: 'kwzbxl', width: 110, align: 'center' as const },
                  { title: '钻进情况及地质情况描述', dataIndex: 'dzms', ellipsis: true },
                  {
                    title: '操作',
                    width: 80,
                    align: 'center' as const,
                    render: (_: any, __: any, index: number) => (
                      <Button 
                        size="small" 
                        type="text" 
                        status="danger" 
                        onClick={() => {
                          const newList = [...zkRecordList]
                          newList.splice(index, 1)
                          setZkRecordList(newList)
                        }}
                      >
                        删除
                      </Button>
                    )
                  }
                ]}
                data={zkRecordList.map((item, idx) => ({ ...item, _idx: idx }))}
                rowKey={(record: any) => `record-${record._idx}`}
                pagination={false}
                border
                noDataElement={
                  <div style={{ padding: 40, textAlign: 'center', color: '#86909c' }}>
                    暂无数据
                  </div>
                }
              />
            </div>
          </TabPane>

          {/* 地层信息选项卡 */}
          <TabPane key="layer" title="地层信息">
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<IconPlus />} onClick={() => {
                  dcInfoForm.resetFields()
                  setEditingDcInfoIndex(null)
                  setDcInfoModalVisible(true)
                }}>
                  新增
                </Button>
              </div>
              
              <Table
                columns={[
                  { 
                    title: '地层代号', 
                    dataIndex: 'dcdh', 
                    width: 120, 
                    align: 'center' as const,
                    render: (val: number) => {
                      const dcdhMap: Record<number, string> = {
                        1: '全新世Qh', 2: '晚Q₃', 3: '中Q₂', 4: '早Q₁',
                        5: '上新世N₂', 6: '中新世N₁', 7: '渐新世E₃', 8: '始新世E₂', 9: '古新世E₁',
                        10: '晚白垩世K₂', 11: '晚白垩世K₂', 12: '晚白垩世K₂', 13: '晚白垩世K₂', 14: '晚白垩世K₂', 15: '晚白垩世K₂',
                        16: '早白垩世K₁', 17: '早白垩世K₁', 18: '早白垩世K₁', 19: '早白垩世K₁', 20: '早白垩世K₁', 21: '早白垩世K₁',
                        22: '晚侏罗世J₃', 23: '晚侏罗世J₃', 24: '晚侏罗世J₃',
                        25: '中侏罗世J₂', 26: '中侏罗世J₂', 27: '中侏罗世J₂',
                        28: '早侏罗世J₁', 29: '早侏罗世J₁', 30: '早侏罗世J₁', 31: '早侏罗世J₁',
                        32: '晚三叠世T₃', 33: '晚三叠世T₃', 34: '晚三叠世T₃',
                        35: '中三叠世T₂', 36: '中三叠世T₂',
                        37: '早三叠世T₁', 38: '早三叠世T₁', 39: '早三叠世T₁',
                        40: '晚二叠世P₂', 41: '晚二叠世P₂',
                        42: '早二叠世P₁', 43: '早二叠世P₁', 44: '早二叠世P₁',
                        45: '晚石炭世C₂', 46: '晚石炭世C₂',
                        47: '早石炭世C₁', 48: '早石炭世C₁', 49: '早石炭世C₁', 50: '早石炭世C₁', 51: '早石炭世C₁',
                        52: '晚泥盆世D₃', 53: '晚泥盆世D₃',
                        54: '中泥盆世D₂', 55: '中泥盆世D₂',
                        56: '早泥盆世D₁', 57: '早泥盆世D₁', 58: '早泥盆世D₁', 59: '早泥盆世D₁',
                        60: '晚志留世S₃', 61: '晚志留世S₃',
                        62: '中志留世S₂',
                        63: '早志留世S₁', 64: '早志留世S₁', 65: '早志留世S₁',
                        66: '钱塘江世O₃', 67: '钱塘江世O₃',
                        68: '艾家山世O₃', 69: '艾家山世O₃',
                        70: '扬子世O₂', 71: '扬子世O₂',
                        72: '宜昌世O₁', 73: '宜昌世O₁',
                        74: '晚寒武世∈₃', 75: '晚寒武世∈₃',
                        76: '中寒武世∈₂', 77: '中寒武世∈₂', 78: '中寒武世∈₂',
                        79: '早寒武世∈₁', 80: '早寒武世∈₁', 81: '早寒武世∈₁', 82: '早寒武世∈₁', 83: '早寒武世∈₁',
                        84: '晚震旦世Z₂', 85: '晚震旦世Z₂',
                        86: '早震旦世Z₁', 87: '早震旦世Z₁',
                        88: '南华纪Nh', 89: '青白口纪Qb', 90: '蓟县纪Jx', 91: '长城纪Ch', 92: '滹沱纪Ht',
                        93: '新太古代Ar₃', 94: '新太古代Ar₃', 95: '中太古代Ar₂', 96: '古太古代Ar₁', 97: '始太古代Ar₀',
                        98: '冥古宙HD'
                      }
                      return dcdhMap[val] || val || '-'
                    }
                  },
                  { title: '底层里程值', dataIndex: 'dclc', width: 120, align: 'center' as const },
                  { title: '分层厚度', dataIndex: 'fchd', width: 100, align: 'center' as const },
                  { title: '出水位置', dataIndex: 'cslcz', width: 100, align: 'center' as const },
                  { title: '出水量', dataIndex: 'csl', width: 90, align: 'center' as const },
                  { title: '采样位置', dataIndex: 'cywz', width: 100, align: 'center' as const },
                  { title: '工程地质简述', dataIndex: 'gcdzjj', ellipsis: true },
                  {
                    title: '操作',
                    width: 120,
                    align: 'center' as const,
                    render: (_: any, record: any, index: number) => (
                      <Space>
                        <Button 
                          size="small" 
                          type="text" 
                          onClick={() => {
                            // 编辑地层信息
                            dcInfoForm.setFieldsValue(record)
                            setEditingDcInfoIndex(index)
                            setDcInfoModalVisible(true)
                          }}
                        >
                          编辑
                        </Button>
                        <Button 
                          size="small" 
                          type="text" 
                          status="danger" 
                          onClick={() => {
                            const newList = [...dcInfoList]
                            newList.splice(index, 1)
                            setDcInfoList(newList)
                          }}
                        >
                          删除
                        </Button>
                      </Space>
                    )
                  }
                ]}
                data={dcInfoList.map((item, idx) => ({ ...item, _idx: idx }))}
                rowKey={(record: any) => `layer-${record._idx}`}
                pagination={false}
                border
                noDataElement={
                  <div style={{ padding: 40, textAlign: 'center', color: '#86909c' }}>
                    暂无数据
                  </div>
                }
              />
            </div>
          </TabPane>
        </Tabs>
        )}
      </Modal>

      {/* 分段信息新增/编辑弹窗 - 使用通用组件 */}
      <SegmentModal
        visible={forecastModalVisible}
        onCancel={() => setForecastModalVisible(false)}
        onOk={handleForecastModalOk}
        editingData={currentForecast}
        defaultDkname={form.getFieldValue('dkname') || 'DK'}
      />

      {/* 钻孔记录新增弹窗 */}
      <Modal
        title="详情"
        visible={zkRecordModalVisible}
        onOk={async () => {
          try {
            const values = await zkRecordForm.validate()
            // 格式化日期
            let kssj = values.kssj
            let jssj = values.jssj
            if (kssj && typeof kssj === 'object' && kssj.format) {
              kssj = kssj.format('YYYY-MM-DDTHH:mm:ss')
            }
            if (jssj && typeof jssj === 'object' && jssj.format) {
              jssj = jssj.format('YYYY-MM-DDTHH:mm:ss')
            }
            const recordData = { ...values, kssj, jssj }
            setZkRecordList([...zkRecordList, recordData])
            setZkRecordModalVisible(false)
            Message.success('添加成功')
          } catch (e) {
            // 验证失败
          }
        }}
        onCancel={() => setZkRecordModalVisible(false)}
        okText="确定"
        cancelText="取消"
        style={{ width: 800 }}
      >
        <Form form={zkRecordForm} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="开始时间" field="kssj" rules={[{ required: true, message: '请选择开始时间' }]}>
                <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" field="jssj" rules={[{ required: true, message: '请选择结束时间' }]}>
                <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item 
                label="钻孔深度" 
                field="zksd" 
                rules={[{ required: true, message: '请输入钻孔深度' }]}
                extra="单位:m，保留2位小数，整数位不超过2位"
              >
                <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} max={99.99} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="钻孔压力" 
                field="zkpressure" 
                rules={[{ required: true, message: '请输入钻孔压力' }]}
                extra="单位:mPa，保留2位小数，整数位不超过5位"
              >
                <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} max={99999.99} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="转速" 
                field="zkspeed" 
                rules={[{ required: true, message: '请输入转速' }]}
                extra="单位:转/分，保留2位小数"
              >
                <InputNumber placeholder="如55.5" style={{ width: '100%' }} precision={2} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                label="孔内水压" 
                field="kwwaterpre" 
                rules={[{ required: true, message: '请输入孔内水压' }]}
                extra="单位:mPa，保留2位小数，整数位不超过5位，无水填0"
              >
                <InputNumber placeholder="无水填0" style={{ width: '100%' }} precision={2} max={99999.99} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="孔内水量" 
                field="kwwaterspe" 
                rules={[{ required: true, message: '请输入孔内水量' }]}
                extra="单位:m³/h，保留2位小数，整数位不超过5位，无水填0"
              >
                <InputNumber placeholder="无水填0" style={{ width: '100%' }} precision={2} max={99999.99} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item 
                label="钻进情况及地质情况描述" 
                field="dzms" 
                rules={[{ required: true, message: '请输入描述' }]}
                extra="文字描述"
              >
                <Input placeholder="请输入钻进特征及地质情况简述" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="孔位坐标序列" field="kwzbxl" rules={[{ required: true, message: '请输入孔位坐标序列' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={16}>
              {/* 圆形图示区域 */}
              <div style={{ 
                border: '1px solid #e5e6eb', 
                borderRadius: 4, 
                padding: 16, 
                textAlign: 'center',
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <span style={{ position: 'absolute', top: 8, left: 16, fontSize: 12, color: '#86909c' }}>0</span>
                <span style={{ position: 'absolute', top: 8, right: 16, fontSize: 12, color: '#86909c' }}>400</span>
                <span style={{ position: 'absolute', bottom: 8, left: 16, fontSize: 12, color: '#86909c' }}>400</span>
                <div style={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px solid #165DFF', 
                  borderRadius: '50%' 
                }} />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 地层信息新增/编辑弹窗 */}
      <Modal
        title={editingDcInfoIndex !== null ? "编辑地层信息" : "新增地层信息"}
        visible={dcInfoModalVisible}
        onOk={async () => {
          try {
            const values = await dcInfoForm.validate()
            console.log('📤 地层信息表单值:', values)
            // 确保数值保留两位小数
            const formattedValues = {
              ...values,
              dclc: values.dclc !== undefined ? Number(Number(values.dclc).toFixed(2)) : undefined,
              fchd: values.fchd !== undefined ? Number(Number(values.fchd).toFixed(2)) : undefined,
              cslcz: values.cslcz !== undefined ? Number(Number(values.cslcz).toFixed(2)) : undefined,
              csl: values.csl !== undefined ? Number(Number(values.csl).toFixed(2)) : undefined,
            }
            console.log('📤 格式化后地层信息:', formattedValues)
            
            if (editingDcInfoIndex !== null) {
              // 编辑模式
              const newList = [...dcInfoList]
              newList[editingDcInfoIndex] = formattedValues
              setDcInfoList(newList)
              Message.success('修改成功')
            } else {
              // 新增模式
              setDcInfoList([...dcInfoList, formattedValues])
              Message.success('添加成功')
            }
            setDcInfoModalVisible(false)
            setEditingDcInfoIndex(null)
            dcInfoForm.resetFields()
          } catch (e: any) {
            console.error('❌ 地层信息表单验证失败:', e)
            Message.error('请填写必填项')
          }
        }}
        onCancel={() => {
          setDcInfoModalVisible(false)
          setEditingDcInfoIndex(null)
          dcInfoForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
        style={{ width: 700 }}
      >
        <Form form={dcInfoForm} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                label="地层代号" 
                field="dcdh" 
                rules={[{ required: true, message: '请选择地层代号' }]}
              >
                <Select 
                  placeholder="请选择地层代号" 
                  showSearch
                  allowClear
                  filterOption={(inputValue, option) => 
                    option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                  }
                >
                  {/* 地层代号选项 - 根据表A.10地层代号数据项 */}
                  <Select.Option value={1}>Qh-全新世</Select.Option>
                  <Select.Option value={2}>Q3-晚更新世(晚Q₃)</Select.Option>
                  <Select.Option value={3}>Q2-中更新世(中Q₂)</Select.Option>
                  <Select.Option value={4}>Q1-早更新世(早Q₁)</Select.Option>
                  <Select.Option value={5}>N2-上新世</Select.Option>
                  <Select.Option value={6}>N1-中新世</Select.Option>
                  <Select.Option value={7}>E3-渐新世</Select.Option>
                  <Select.Option value={8}>E2-始新世</Select.Option>
                  <Select.Option value={9}>E1-古新世</Select.Option>
                  <Select.Option value={10}>K2-晚白垩世</Select.Option>
                  <Select.Option value={11}>K2-晚白垩世</Select.Option>
                  <Select.Option value={12}>K2-晚白垩世</Select.Option>
                  <Select.Option value={13}>K2-晚白垩世</Select.Option>
                  <Select.Option value={14}>K2-晚白垩世</Select.Option>
                  <Select.Option value={15}>K2-晚白垩世</Select.Option>
                  <Select.Option value={16}>K1-早白垩世</Select.Option>
                  <Select.Option value={17}>K1-早白垩世</Select.Option>
                  <Select.Option value={18}>K1-早白垩世</Select.Option>
                  <Select.Option value={19}>K1-早白垩世</Select.Option>
                  <Select.Option value={20}>K1-早白垩世</Select.Option>
                  <Select.Option value={21}>K1-早白垩世</Select.Option>
                  <Select.Option value={22}>J3-晚侏罗世</Select.Option>
                  <Select.Option value={23}>J3-晚侏罗世</Select.Option>
                  <Select.Option value={24}>J3-晚侏罗世</Select.Option>
                  <Select.Option value={25}>J2-中侏罗世</Select.Option>
                  <Select.Option value={26}>J2-中侏罗世</Select.Option>
                  <Select.Option value={27}>J2-中侏罗世</Select.Option>
                  <Select.Option value={28}>J1-早侏罗世</Select.Option>
                  <Select.Option value={29}>J1-早侏罗世</Select.Option>
                  <Select.Option value={30}>J1-早侏罗世</Select.Option>
                  <Select.Option value={31}>J1-早侏罗世</Select.Option>
                  <Select.Option value={32}>T3-晚三叠世</Select.Option>
                  <Select.Option value={33}>T3-晚三叠世</Select.Option>
                  <Select.Option value={34}>T3-晚三叠世</Select.Option>
                  <Select.Option value={35}>T2-中三叠世</Select.Option>
                  <Select.Option value={36}>T2-中三叠世</Select.Option>
                  <Select.Option value={37}>T1-早三叠世</Select.Option>
                  <Select.Option value={38}>T1-早三叠世</Select.Option>
                  <Select.Option value={39}>T1-早三叠世</Select.Option>
                  <Select.Option value={40}>P2-晚二叠世</Select.Option>
                  <Select.Option value={41}>P2-晚二叠世</Select.Option>
                  <Select.Option value={42}>P1-早二叠世</Select.Option>
                  <Select.Option value={43}>P1-早二叠世</Select.Option>
                  <Select.Option value={44}>P1-早二叠世</Select.Option>
                  <Select.Option value={45}>C2-晚石炭世</Select.Option>
                  <Select.Option value={46}>C2-晚石炭世</Select.Option>
                  <Select.Option value={47}>C1-早石炭世</Select.Option>
                  <Select.Option value={48}>C1-早石炭世</Select.Option>
                  <Select.Option value={49}>C1-早石炭世</Select.Option>
                  <Select.Option value={50}>C1-早石炭世</Select.Option>
                  <Select.Option value={51}>C1-早石炭世</Select.Option>
                  <Select.Option value={52}>D3-晚泥盆世</Select.Option>
                  <Select.Option value={53}>D3-晚泥盆世</Select.Option>
                  <Select.Option value={54}>D2-中泥盆世</Select.Option>
                  <Select.Option value={55}>D2-中泥盆世</Select.Option>
                  <Select.Option value={56}>D1-早泥盆世</Select.Option>
                  <Select.Option value={57}>D1-早泥盆世</Select.Option>
                  <Select.Option value={58}>D1-早泥盆世</Select.Option>
                  <Select.Option value={59}>D1-早泥盆世</Select.Option>
                  <Select.Option value={60}>S3-晚志留世</Select.Option>
                  <Select.Option value={61}>S3-晚志留世</Select.Option>
                  <Select.Option value={62}>S2-中志留世</Select.Option>
                  <Select.Option value={63}>S1-早志留世</Select.Option>
                  <Select.Option value={64}>S1-早志留世</Select.Option>
                  <Select.Option value={65}>S1-早志留世</Select.Option>
                  <Select.Option value={66}>O3-钱塘江世</Select.Option>
                  <Select.Option value={67}>O3-钱塘江世</Select.Option>
                  <Select.Option value={68}>O3-艾家山世</Select.Option>
                  <Select.Option value={69}>O3-艾家山世</Select.Option>
                  <Select.Option value={70}>O2-扬子世</Select.Option>
                  <Select.Option value={71}>O2-扬子世</Select.Option>
                  <Select.Option value={72}>O1-宜昌世</Select.Option>
                  <Select.Option value={73}>O1-宜昌世</Select.Option>
                  <Select.Option value={74}>∈3-晚寒武世</Select.Option>
                  <Select.Option value={75}>∈3-晚寒武世</Select.Option>
                  <Select.Option value={76}>∈2-中寒武世</Select.Option>
                  <Select.Option value={77}>∈2-中寒武世</Select.Option>
                  <Select.Option value={78}>∈2-中寒武世</Select.Option>
                  <Select.Option value={79}>∈1-早寒武世</Select.Option>
                  <Select.Option value={80}>∈1-早寒武世</Select.Option>
                  <Select.Option value={81}>∈1-早寒武世</Select.Option>
                  <Select.Option value={82}>∈1-早寒武世</Select.Option>
                  <Select.Option value={83}>∈1-早寒武世</Select.Option>
                  <Select.Option value={84}>Z2-晚震旦世</Select.Option>
                  <Select.Option value={85}>Z2-晚震旦世</Select.Option>
                  <Select.Option value={86}>Z1-早震旦世</Select.Option>
                  <Select.Option value={87}>Z1-早震旦世</Select.Option>
                  <Select.Option value={88}>Nh-南华纪</Select.Option>
                  <Select.Option value={89}>Qb-青白口纪</Select.Option>
                  <Select.Option value={90}>Jx-蓟县纪</Select.Option>
                  <Select.Option value={91}>Ch-长城纪</Select.Option>
                  <Select.Option value={92}>Ht-滹沱纪</Select.Option>
                  <Select.Option value={93}>Ar3-新太古代</Select.Option>
                  <Select.Option value={94}>Ar3-新太古代</Select.Option>
                  <Select.Option value={95}>Ar2-中太古代</Select.Option>
                  <Select.Option value={96}>Ar1-古太古代</Select.Option>
                  <Select.Option value={97}>Ar0-始太古代</Select.Option>
                  <Select.Option value={98}>HD-冥古宙</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="底层里程值" 
                field="dclc" 
                rules={[{ 
                  validator: (value, callback) => {
                    if (value === undefined || value === null || value === '') {
                      callback('请输入底层里程值')
                    } else {
                      callback()
                    }
                  }
                }]}
                extra="单位:m，保留2位小数。例如DK215+763.32则上传215763.32"
              >
                <InputNumber 
                  placeholder="如215763.32" 
                  style={{ width: '100%' }} 
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                label="分层厚度" 
                field="fchd" 
                extra="单位:m，保留2位小数，整数位不超过2位"
              >
                <InputNumber 
                  placeholder="请输入" 
                  style={{ width: '100%' }} 
                  precision={2}
                  max={99.99}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="出水位置" 
                field="cslcz" 
                rules={[{ 
                  validator: (value, callback) => {
                    if (value === undefined || value === null || value === '') {
                      callback('请输入出水位置')
                    } else {
                      callback()
                    }
                  }
                }]}
                extra="单位:m，保留2位小数。无出水时上传0"
              >
                <InputNumber 
                  placeholder="无出水填0" 
                  style={{ width: '100%' }} 
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                label="出水量" 
                field="csl" 
                extra="单位:m³/h，保留2位小数，整数位不超过5位"
              >
                <InputNumber 
                  placeholder="请输入" 
                  style={{ width: '100%' }} 
                  precision={2}
                  max={99999.99}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="采样位置" 
                field="cywz"
                extra="采用文字描述"
              >
                <Input placeholder="请输入采样位置描述" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item 
                label="工程地质简述" 
                field="gcdzjj"
                extra="如：灰岩、泥土、其他，不超过15字"
              >
                <Input placeholder="如：灰岩、泥土、其他" maxLength={15} showWordLimit />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default DrillingEditPage
