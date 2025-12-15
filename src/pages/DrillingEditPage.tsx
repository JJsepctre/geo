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

  // 分段信息（预报结果）列表
  const [forecastList, setForecastList] = useState<any[]>([])
  const [forecastModalVisible, setForecastModalVisible] = useState(false)
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
          const zkData = isJspk ? (data.jspkDataVOList || data.jspkDataDTOList) : (data.cqspzZkzzVOList || data.cqspzZkzzDTOList)
          if (zkData) {
            setZkList(zkData)
          }
          
          // 设置分段信息列表（预报结果）
          if (data.ybjgVOList) {
            setForecastList(data.ybjgVOList)
            console.log('📊 [编辑页] 从路由状态加载分段信息:', data.ybjgVOList)
          }
        }
        
        // 调用详情接口
        const detail = await apiAdapter.getDrillingDetail(id, method)
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
          const zkData = isJspk ? detail.jspkZkzzVOList : detail.cqspzZkzzVOList
          if (zkData) {
            setZkList(zkData)
          }
          
          // 设置分段信息列表（预报结果）
          if (detail.ybjgVOList) {
            setForecastList(detail.ybjgVOList)
            console.log('📊 [编辑页] 从API加载分段信息:', detail.ybjgVOList)
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
      const submitData = {
        ...originalData,  // 先用原始数据
        ...values,        // 再用表单值覆盖（用户修改的部分）
        dkilo,            // 使用合并后的里程值
        ybPk: null,       // 临时设置为null，后端修复后改回
        siteId: siteId || originalData?.siteId,
        method: currentMethod,  // 钻探法：13=超前水平钻，14=加深炮孔
        zkList
      }
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
    setZkModalVisible(true)
  }

  const handleEditZk = (record: any, index: number) => {
    setCurrentZk({ ...record, index })
    zkForm.setFieldsValue(record)
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
      
      if (currentZk && currentZk.index !== undefined) {
        // 编辑
        const newList = [...zkList]
        newList[currentZk.index] = values
        setZkList(newList)
      } else {
        // 新增
        setZkList([...zkList, values])
      }
      
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
      // 新增
      setForecastList([...forecastList, { ...data, ybjgPk: 0, ybjgId: 0, ybPk: 0 }])
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
      dataIndex: 'dzjb', 
      width: 80,
      align: 'center' as const,
      render: (val: string) => {
        const colorMap: Record<string, { bg: string; text: string; label: string }> = {
          'green': { bg: '#52c41a', text: '#fff', label: '绿色' },
          'yellow': { bg: '#faad14', text: '#fff', label: '黄色' },
          'red': { bg: '#ff4d4f', text: '#fff', label: '红色' },
        }
        const config = colorMap[val]
        if (config) {
          return <span style={{ backgroundColor: config.bg, color: config.text, padding: '2px 8px', borderRadius: 4 }}>{config.label}</span>
        }
        return val || '-'
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

                {/* 下次超前地质预报 */}
                <div style={{ 
                  marginTop: 24, 
                  padding: '16px 20px', 
                  backgroundColor: '#f7f8fa', 
                  borderRadius: 4,
                  border: '1px solid #e5e6eb'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>下次超前地质预报</span>
                  </div>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="下次预报方法" field="nextMethod">
                        <Select placeholder="请选择下次预报方法" allowClear>
                          <Select.Option value={1}>TSP</Select.Option>
                          <Select.Option value={2}>地质雷达</Select.Option>
                          <Select.Option value={3}>瞬变电磁</Select.Option>
                          <Select.Option value={4}>红外探水</Select.Option>
                          <Select.Option value={5}>掌子面素描</Select.Option>
                          <Select.Option value={6}>洞身素描</Select.Option>
                          <Select.Option value={13}>超前水平钻</Select.Option>
                          <Select.Option value={14}>加深炮孔</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="预报开始里程" field="nextStartKilo">
                        <Input placeholder="请输入预报开始里程" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
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
                      <div style={{ fontSize: 10, color: '#86909c', marginTop: 4 }}>1860675885...</div>
                    </div>
                    <Upload
                      action="/api/v1/ztf/cqspz/upload"
                      accept=".doc,.docx,.pdf"
                      showUploadList={false}
                      onChange={(fileList) => {
                        console.log('附件上传:', fileList)
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
                        <div style={{ fontSize: 12, color: '#165DFF' }}>修改</div>
                      </div>
                    </Upload>
                  </div>
                </div>

                {/* 作业现场照片 */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ color: '#f53f3f', marginRight: 2 }}>*</span>
                  <span style={{ width: 120 }}>作业现场照片：</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
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
                      <span style={{ fontSize: 11, color: '#86909c' }}>预览图</span>
                    </div>
                    <Upload
                      action="/api/v1/ztf/cqspz/upload"
                      accept="image/*"
                      showUploadList={false}
                      onChange={(fileList) => {
                        console.log('作业现场照片上传:', fileList)
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
                        <div style={{ fontSize: 12, color: '#165DFF' }}>修改</div>
                      </div>
                    </Upload>
                  </div>
                </div>

                {/* 提交按钮 */}
                <div style={{ textAlign: 'right', marginTop: 20 }}>
                  <Button type="primary">提交</Button>
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
        onCancel={() => setZkModalVisible(false)}
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
                    <Form.Item label="距掌面距离" field="jgdjl" rules={[{ required: true, message: '请输入距掌面距离' }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="距中心线距离" field="jzxxjl" rules={[{ required: true, message: '请输入距中心线距离' }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="开孔立面角度" field="kwljangle" rules={[{ required: true, message: '请输入开孔立面角度' }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="开孔倾角角度" field="kwpjangle" rules={[{ required: true, message: '请输入开孔倾角角度' }]}>
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="钻孔直径" field="zkzj" rules={[{ required: true, message: '请输入钻孔直径' }]}>
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
                  <Form.Item label="备注" field="remark" rules={[{ required: true, message: '请输入备注' }]}>
                    <Input placeholder="无" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="是否取芯" field="sfqx" rules={[{ required: true, message: '请选择是否取芯' }]}>
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
                data={zkRecordList}
                rowKey={(record: any, index?: number) => `record-${index}`}
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
                  setDcInfoModalVisible(true)
                }}>
                  新增
                </Button>
              </div>
              
              <Table
                columns={[
                  { title: '地层代号', dataIndex: 'dcdh', width: 100, align: 'center' as const },
                  { title: '底层里程值', dataIndex: 'dclc', width: 120, align: 'center' as const },
                  { title: '分层厚度', dataIndex: 'fchd', width: 100, align: 'center' as const },
                  { title: '出水位置', dataIndex: 'cslcz', width: 100, align: 'center' as const },
                  { title: '出水量', dataIndex: 'csl', width: 90, align: 'center' as const },
                  { title: '采样位置', dataIndex: 'cywz', width: 100, align: 'center' as const },
                  { title: '工程地质简述', dataIndex: 'gcdzjj', ellipsis: true },
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
                          const newList = [...dcInfoList]
                          newList.splice(index, 1)
                          setDcInfoList(newList)
                        }}
                      >
                        删除
                      </Button>
                    )
                  }
                ]}
                data={dcInfoList}
                rowKey={(record: any, index?: number) => `layer-${index}`}
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
                extra="单位:转/分，范围值如55.5-55.8"
              >
                <Input placeholder="如55.5-55.8" style={{ width: '100%' }} />
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

      {/* 地层信息新增弹窗 */}
      <Modal
        title="详情"
        visible={dcInfoModalVisible}
        onOk={async () => {
          try {
            const values = await dcInfoForm.validate()
            setDcInfoList([...dcInfoList, values])
            setDcInfoModalVisible(false)
            Message.success('添加成功')
          } catch (e) {
            // 验证失败
          }
        }}
        onCancel={() => setDcInfoModalVisible(false)}
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
                  {/* 地层代号选项 - 数据较多 */}
                  <Select.Option value="Q4al">Q4al-第四系全新统冲积层</Select.Option>
                  <Select.Option value="Q4dl">Q4dl-第四系全新统坡积层</Select.Option>
                  <Select.Option value="Q4el">Q4el-第四系全新统残积层</Select.Option>
                  <Select.Option value="Q4pl">Q4pl-第四系全新统洪积层</Select.Option>
                  <Select.Option value="Q3al">Q3al-第四系上更新统冲积层</Select.Option>
                  <Select.Option value="Q3dl">Q3dl-第四系上更新统坡积层</Select.Option>
                  <Select.Option value="Q2al">Q2al-第四系中更新统冲积层</Select.Option>
                  <Select.Option value="Q1al">Q1al-第四系下更新统冲积层</Select.Option>
                  <Select.Option value="N2">N2-上新统</Select.Option>
                  <Select.Option value="N1">N1-中新统</Select.Option>
                  <Select.Option value="E3">E3-渐新统</Select.Option>
                  <Select.Option value="E2">E2-始新统</Select.Option>
                  <Select.Option value="E1">E1-古新统</Select.Option>
                  <Select.Option value="K2">K2-白垩系上统</Select.Option>
                  <Select.Option value="K1">K1-白垩系下统</Select.Option>
                  <Select.Option value="J3">J3-侏罗系上统</Select.Option>
                  <Select.Option value="J2">J2-侏罗系中统</Select.Option>
                  <Select.Option value="J1">J1-侏罗系下统</Select.Option>
                  <Select.Option value="T3">T3-三叠系上统</Select.Option>
                  <Select.Option value="T2">T2-三叠系中统</Select.Option>
                  <Select.Option value="T1">T1-三叠系下统</Select.Option>
                  <Select.Option value="P2">P2-二叠系上统</Select.Option>
                  <Select.Option value="P1">P1-二叠系下统</Select.Option>
                  <Select.Option value="C3">C3-石炭系上统</Select.Option>
                  <Select.Option value="C2">C2-石炭系中统</Select.Option>
                  <Select.Option value="C1">C1-石炭系下统</Select.Option>
                  <Select.Option value="D3">D3-泥盆系上统</Select.Option>
                  <Select.Option value="D2">D2-泥盆系中统</Select.Option>
                  <Select.Option value="D1">D1-泥盆系下统</Select.Option>
                  <Select.Option value="S3">S3-志留系上统</Select.Option>
                  <Select.Option value="S2">S2-志留系中统</Select.Option>
                  <Select.Option value="S1">S1-志留系下统</Select.Option>
                  <Select.Option value="O3">O3-奥陶系上统</Select.Option>
                  <Select.Option value="O2">O2-奥陶系中统</Select.Option>
                  <Select.Option value="O1">O1-奥陶系下统</Select.Option>
                  <Select.Option value="∈3">∈3-寒武系上统</Select.Option>
                  <Select.Option value="∈2">∈2-寒武系中统</Select.Option>
                  <Select.Option value="∈1">∈1-寒武系下统</Select.Option>
                  <Select.Option value="Z2">Z2-震旦系上统</Select.Option>
                  <Select.Option value="Z1">Z1-震旦系下统</Select.Option>
                  <Select.Option value="Pt3">Pt3-新元古界</Select.Option>
                  <Select.Option value="Pt2">Pt2-中元古界</Select.Option>
                  <Select.Option value="Pt1">Pt1-古元古界</Select.Option>
                  <Select.Option value="Ar">Ar-太古界</Select.Option>
                  <Select.Option value="γ">γ-花岗岩</Select.Option>
                  <Select.Option value="δ">δ-闪长岩</Select.Option>
                  <Select.Option value="ν">ν-辉长岩</Select.Option>
                  <Select.Option value="β">β-玄武岩</Select.Option>
                  <Select.Option value="λ">λ-流纹�ite</Select.Option>
                  <Select.Option value="α">α-安山岩</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="底层里程值" 
                field="dclc" 
                rules={[{ required: true, message: '请输入底层里程值' }]}
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
                rules={[{ required: true, message: '请输入分层厚度' }]}
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
                rules={[{ required: true, message: '请输入出水位置' }]}
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
                rules={[{ required: true, message: '请输入出水量' }]}
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
