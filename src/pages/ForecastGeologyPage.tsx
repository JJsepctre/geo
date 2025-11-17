import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Select, 
  DatePicker, 
  Space, 
  Table, 
  Empty,
  Message,
  Spin,
  Modal,
  Upload,
  Tabs,
  Form,
  Input,
  InputNumber
} from '@arco-design/web-react'
import { IconLeft } from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import apiAdapter from '../services/apiAdapter'

const { TabPane } = Tabs
const { TextArea } = Input

// 地质预报记录类型
type GeologyForecastRecord = {
  id: string
  method: string
  time: string
  mileage: string
  length: string
  status: string
  uploadTip: string
}

function ForecastGeologyPage() {
  const navigate = useNavigate()
  // 详情弹窗状态
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<GeologyForecastRecord | null>(null)
  
  // 编辑弹窗状态
  const [editVisible, setEditVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GeologyForecastRecord | null>(null)
  const [activeTab, setActiveTab] = useState('1')
  const [editForm] = Form.useForm()
  
  // 上传弹窗状态
  const [uploadVisible, setUploadVisible] = useState(false)
  const [uploadingRecord, setUploadingRecord] = useState<GeologyForecastRecord | null>(null)

  // 查看详情
  const handleViewDetail = (record: GeologyForecastRecord) => {
    setSelectedRecord(record)
    setDetailVisible(true)
    Message.info(`查看详情：${record.method}`)
  }

  // 修改
  const handleEdit = (record: GeologyForecastRecord) => {
    setEditingRecord(record)
    // 解析里程数据（例如 "DK713+485"）
    const mileageMatch = record.mileage.match(/([A-Z]+)?(\d+)\+(\d+)/)
    const mileagePrefix = mileageMatch?.[1] || 'DK'
    const mileageMain = mileageMatch?.[2] || '713'
    const mileageSub = mileageMatch?.[3] || '485'
    
    // 解析长度（例如 "100m"）
    const length = parseFloat(record.length.replace('m', '')) || 0
    
    // 设置表单初始值
    editForm.setFieldsValue({
      // 基本信息
      rockGrade: 'IV',
      mileagePrefix,
      startMileageMain: parseInt(mileageMain),
      startMileageSub: parseInt(mileageSub),
      length,
      author: '一分部',
      modifyReason: '',
      // 地表信息（其他地表信息）
      surfaceStratumDescription: '',        // 地层岩性描述
      surfaceKarstDescription: '',          // 地表岩溶描述
      surfaceSpecialGeologyDescription: '', // 特殊地质产状描述
      surfaceTunnelDescription: '',         // 人为坑道描述
      surfaceGeologyAssessment: ''          // 地质评定
    })
    
    setActiveTab('1')
    setEditVisible(true)
  }

  // 复制
  const handleCopy = (record: GeologyForecastRecord) => {
    Modal.confirm({
      title: '确认复制',
      content: `确定要复制这条预报记录"${record.method}"吗？`,
      onOk: async () => {
        try {
          // TODO: 调用复制API
          // await copyGeologyForecast(record.id)
          Message.success('复制成功')
          // TODO: 刷新列表
          // fetchGeologyData()
        } catch (error) {
          Message.error('复制失败，请稍后重试')
        }
      }
    })
  }

  // 上传
  const handleUpload = (record: GeologyForecastRecord) => {
    setUploadingRecord(record)
    setUploadVisible(true)
  }

  // 删除
  const handleDelete = (record: GeologyForecastRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条预报记录"${record.method}"吗？此操作不可恢复。`,
      okButtonProps: {
        status: 'danger'
      },
      onOk: async () => {
        try {
          // TODO: 调用删除API
          // await deleteGeologyForecast(record.id)
          Message.success('删除成功')
          // TODO: 刷新列表
          // fetchGeologyData()
        } catch (error) {
          Message.error('删除失败，请稍后重试')
        }
      }
    })
  }

  // 编辑确认
  const handleEditOk = async () => {
    try {
      const values = await editForm.validate()
      
      // 基本信息 - 合并开始里程
      const startMileage = `${values.mileagePrefix}${values.startMileageMain}+${values.startMileageSub}`
      
      const submitData = {
        id: editingRecord?.id,
        // 基本信息
        basicInfo: {
          rockGrade: values.rockGrade,
          mileagePrefix: values.mileagePrefix,
          startMileage,
          length: values.length,
          author: values.author,
          modifyReason: values.modifyReason
        },
        // 地表信息
        surfaceInfo: {
          stratumDescription: values.surfaceStratumDescription,        // 地层岩性描述
          karstDescription: values.surfaceKarstDescription,            // 地表岩溶描述
          specialGeologyDescription: values.surfaceSpecialGeologyDescription, // 特殊地质产状描述
          tunnelDescription: values.surfaceTunnelDescription,          // 人为坑道描述
          geologyAssessment: values.surfaceGeologyAssessment           // 地质评定
        }
      }
      
      console.log('提交编辑数据:', submitData)
      
      // TODO: 调用API更新
      Message.success('修改成功')
      setEditVisible(false)
      setEditingRecord(null)
      editForm.resetFields()
      // 刷新列表
      fetchGeologyData()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 编辑取消
  const handleEditCancel = () => {
    setEditVisible(false)
    setEditingRecord(null)
    editForm.resetFields()
    setActiveTab('1')
  }

  // 上传文件处理
  const handleFileUpload = (fileList: any[]) => {
    if (fileList.length > 0) {
      Message.loading('正在上传...')
      // TODO: 实现文件上传逻辑
      setTimeout(() => {
        Message.success('上传成功')
        setUploadVisible(false)
      }, 1000)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '预报方法',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: '预报时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '掌子面里程',
      dataIndex: 'mileage',
      key: 'mileage',
    },
    {
      title: '预报长度',
      dataIndex: 'length',
      key: 'length',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '上传提示',
      dataIndex: 'uploadTip',
      key: 'uploadTip',
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: GeologyForecastRecord) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#165dff' }}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#165dff' }}
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#165dff' }}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#00b42a' }}
            onClick={() => handleUpload(record)}
          >
            上传
          </Button>
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#ff4d4f' }}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const [selectedMethod, setSelectedMethod] = useState('物探法')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GeologyForecastRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const methods = ['物探法', '掌子面素描', '洞身素描', '钻探法', '地表补充']

  // 获取地质预报数据
  const fetchGeologyData = async () => {
    setLoading(true)
    try {
      // 这里暂时使用 Mock 数据，因为没有工点ID
      // 实际应该从路由参数或上下文中获取 workPointId
      const mockWorkPointId = '1'
      
      console.log('🔍 [ForecastGeologyPage] 获取地质预报数据, workPointId:', mockWorkPointId)
      
      const result = await apiAdapter.getWorkPointGeologyForecast(mockWorkPointId, {
        page,
        pageSize
      })
      
      console.log('✅ [ForecastGeologyPage] 地质预报数据:', result)
      
      // 转换数据格式
      const geologyData: GeologyForecastRecord[] = result.list.map((item: any) => ({
        id: item.id || String(Math.random()),
        method: item.method || selectedMethod,
        time: item.createdAt || new Date().toISOString().split('T')[0],
        mileage: item.startMileage || 'DK713+000',
        length: `${item.length || 0}m`,
        status: '已完成',
        uploadTip: '已上传'
      }))
      
      setData(geologyData)
      setTotal(result.total)
      
      if (geologyData.length > 0) {
        Message.success(`加载了 ${geologyData.length} 条地质预报数据`)
      } else {
        Message.info('暂无地质预报数据')
      }
    } catch (error) {
      console.error('❌ [ForecastGeologyPage] 获取地质预报数据失败:', error)
      Message.error('获取地质预报数据失败')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGeologyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, selectedMethod])

  return (
    <div>
        {/* 顶部信息栏 */}
        <div style={{ 
          height: 44,
          background: 'linear-gradient(90deg, #A18AFF 0%, #8B7AE6 100%)', 
          borderRadius: 6,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          color: '#fff',
          fontSize: '14px'
        }}>
          <span>设计预报 / 人员信息 / 地质点/DK713+920/DK713+920/设计地质信息</span>
          <Button 
            type="text" 
            icon={<IconLeft />}
            style={{ color: '#fff' }}
            onClick={() => navigate('/hello')}
          >
            返回
          </Button>
        </div>

        {/* 探测方法选项卡 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space size="medium" wrap>
            {methods.map(method => (
              <Button
                key={method}
                type={selectedMethod === method ? 'primary' : 'outline'}
                onClick={() => setSelectedMethod(method)}
              >
                {method}
              </Button>
            ))}
          </Space>
        </Card>

        {/* 筛选条件 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space size="large">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>预报方法：</span>
              <Select
                placeholder="请选择预报方法"
                style={{ width: 200 }}
                allowClear
              >
                <Select.Option value="方法1">方法1</Select.Option>
                <Select.Option value="方法2">方法2</Select.Option>
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>预报时间：</span>
              <DatePicker style={{ width: 200 }} placeholder="请选择日期" />
            </div>

            <Button type="primary" icon={<span>🔍</span>}>
              查询
            </Button>
            <Button icon={<span>🔄</span>}>
              重置
            </Button>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space>
            <Button type="primary" icon={<span>📥</span>}>
              下载模板
            </Button>
            <Button type="primary" icon={<span>📤</span>}>
              导入
            </Button>
            <Button type="primary" icon={<span>➕</span>}>
              新增
            </Button>
            <Button type="primary" status="danger" icon={<span>🗑️</span>}>
              批量删除
            </Button>
          </Space>
        </Card>

        {/* 数据表格 */}
        <Card>
          <Spin loading={loading}>
            <Table
              columns={columns}
              data={data}
              pagination={{
                total,
                current: page,
                pageSize,
                showTotal: true,
                onChange: (pageNumber, pageSize) => {
                  setPage(pageNumber)
                  setPageSize(pageSize)
                },
              }}
              noDataElement={<Empty description="暂无数据" />}
              scroll={{ x: 1200 }}
            />
          </Spin>
        </Card>

        {/* 详情查看弹窗 */}
        <Modal
          title="地质预报详情"
          visible={detailVisible}
          onOk={() => setDetailVisible(false)}
          onCancel={() => setDetailVisible(false)}
          style={{ width: 800 }}
          okText="确定"
          cancelText="取消"
        >
          {selectedRecord && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '24px',
                fontSize: '14px'
              }}>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>预报方法</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.method}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>预报时间</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.time}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>掌子面里程</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.mileage}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>预报长度</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.length}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>状态</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.status}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>上传提示</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.uploadTip}</div>
                </div>
                <div>
                  <div style={{ color: '#86909c', marginBottom: '8px' }}>记录ID</div>
                  <div style={{ color: '#1d2129', fontWeight: 500 }}>{selectedRecord.id}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e6eb' }}>
                <div style={{ color: '#86909c', marginBottom: '12px' }}>备注信息</div>
                <div style={{ color: '#1d2129', lineHeight: 1.6 }}>
                  暂无备注信息
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* 上传文件弹窗 */}
        <Modal
          title="上传文件"
          visible={uploadVisible}
          onOk={() => setUploadVisible(false)}
          onCancel={() => setUploadVisible(false)}
          style={{ width: 600 }}
          okText="确定"
          cancelText="取消"
        >
          {uploadingRecord && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#86909c', marginBottom: '8px' }}>当前记录</div>
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#f7f8fa', 
                  borderRadius: '6px',
                  color: '#1d2129'
                }}>
                  <div><strong>预报方法：</strong>{uploadingRecord.method}</div>
                  <div style={{ marginTop: '8px' }}><strong>掌子面里程：</strong>{uploadingRecord.mileage}</div>
                </div>
              </div>

              <div>
                <div style={{ color: '#86909c', marginBottom: '12px' }}>选择文件</div>
                <Upload
                  drag
                  multiple
                  onChange={(fileList) => {
                    console.log('文件列表:', fileList)
                  }}
                  tip="支持格式：.xlsx, .xls, .pdf, .doc, .docx"
                >
                  <div style={{ 
                    padding: '40px',
                    textAlign: 'center',
                    color: '#86909c'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
                    <div style={{ fontSize: '14px' }}>
                      点击或拖拽文件到此区域上传
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#c9cdd4' }}>
                      支持单个或批量上传
                    </div>
                  </div>
                </Upload>
              </div>
            </div>
          )}
        </Modal>

        {/* 编辑弹窗 */}
        <Modal
          title="修改设计围岩"
          visible={editVisible}
          onOk={handleEditOk}
          onCancel={handleEditCancel}
          style={{ width: 1000 }}
          okText="确定"
          cancelText="取消"
        >
          <Tabs activeTab={activeTab} onChange={setActiveTab} type="line">
            {/* 基本信息选项卡 */}
            <TabPane key="1" title="基本信息">
              <Form
                form={editForm}
                layout="vertical"
                style={{ padding: '20px 0' }}
                autoComplete="off"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  {/* 围岩等级 */}
                  <Form.Item
                    label="围岩等级"
                    field="rockGrade"
                    rules={[{ required: true, message: '请选择围岩等级' }]}
                  >
                    <Select placeholder="请选择围岩等级">
                      <Select.Option value="I">I</Select.Option>
                      <Select.Option value="II">II</Select.Option>
                      <Select.Option value="III">III</Select.Option>
                      <Select.Option value="IV">IV</Select.Option>
                      <Select.Option value="V">V</Select.Option>
                      <Select.Option value="VI">VI</Select.Option>
                    </Select>
                  </Form.Item>

                  {/* 里程冠号 */}
                  <Form.Item
                    label="里程冠号"
                    field="mileagePrefix"
                    rules={[{ required: true, message: '请输入里程冠号' }]}
                  >
                    <Input placeholder="DK" />
                  </Form.Item>
                </div>

                {/* 开始里程 */}
                <Form.Item label="开始里程" required>
                  <Space>
                    <Form.Item
                      field="startMileageMain"
                      noStyle
                      rules={[{ required: true, message: '请输入' }]}
                    >
                      <InputNumber placeholder="713" style={{ width: '150px' }} />
                    </Form.Item>
                    <span style={{ fontSize: '16px', color: '#1d2129' }}>+</span>
                    <Form.Item
                      field="startMileageSub"
                      noStyle
                      rules={[{ required: true, message: '请输入' }]}
                    >
                      <InputNumber placeholder="485" style={{ width: '150px' }} />
                    </Form.Item>
                  </Space>
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  {/* 预报长度 */}
                  <Form.Item
                    label="预报长度"
                    field="length"
                    rules={[{ required: true, message: '请输入预报长度' }]}
                  >
                    <InputNumber placeholder="-205.00" style={{ width: '100%' }} />
                  </Form.Item>

                  {/* 填写人 */}
                  <Form.Item
                    label="填写人"
                    field="author"
                    rules={[{ required: true, message: '请选择填写人' }]}
                  >
                    <Select placeholder="请选择填写人">
                      <Select.Option value="一分部">一分部</Select.Option>
                      <Select.Option value="二分部">二分部</Select.Option>
                      <Select.Option value="三分部">三分部</Select.Option>
                      <Select.Option value="其他">其他</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* 修改原因说明 */}
                <Form.Item
                  label="修改原因说明"
                  field="modifyReason"
                  rules={[{ required: true, message: '请输入修改原因说明' }]}
                >
                  <TextArea
                    placeholder="请输入修改原因"
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Form>
            </TabPane>

            {/* 地表信息选项卡 */}
            <TabPane key="2" title="地表信息">
              <div style={{ 
                padding: '20px 0',
                borderTop: '1px solid #e5e6eb',
                marginTop: '10px'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#1d2129', 
                  fontWeight: 500,
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e5e6eb'
                }}>
                  其他地表信息
                </div>
                
                <Form
                  form={editForm}
                  layout="vertical"
                  autoComplete="off"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    {/* 地层岩性描述 */}
                    <Form.Item
                      label="地层岩性描述"
                      field="surfaceStratumDescription"
                      rules={[
                        { required: true, message: '请输入地层岩性描述' },
                        { maxLength: 256, message: '最多256个字符' }
                      ]}
                    >
                      <TextArea
                        placeholder="文字描述（必填）"
                        rows={4}
                        maxLength={256}
                        showWordLimit
                        style={{ resize: 'none' }}
                      />
                    </Form.Item>

                    {/* 地表岩溶描述 */}
                    <Form.Item
                      label="地表岩溶描述"
                      field="surfaceKarstDescription"
                      rules={[
                        { required: true, message: '请输入地表岩溶描述' },
                        { maxLength: 256, message: '最多256个字符' }
                      ]}
                    >
                      <TextArea
                        placeholder="文字描述（必填）"
                        rows={4}
                        maxLength={256}
                        showWordLimit
                        style={{ resize: 'none' }}
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    {/* 特殊地质产状描述 */}
                    <Form.Item
                      label="特殊地质产状描述"
                      field="surfaceSpecialGeologyDescription"
                      rules={[
                        { required: true, message: '请输入特殊地质产状描述' },
                        { maxLength: 256, message: '最多256个字符' }
                      ]}
                    >
                      <TextArea
                        placeholder="文字描述（必填）"
                        rows={4}
                        maxLength={256}
                        showWordLimit
                        style={{ resize: 'none' }}
                      />
                    </Form.Item>

                    {/* 人为坑道描述 */}
                    <Form.Item
                      label="人为坑道描述"
                      field="surfaceTunnelDescription"
                      rules={[
                        { required: true, message: '请输入人为坑道描述' },
                        { maxLength: 256, message: '最多256个字符' }
                      ]}
                    >
                      <TextArea
                        placeholder="文字描述（必填）"
                        rows={4}
                        maxLength={256}
                        showWordLimit
                        style={{ resize: 'none' }}
                      />
                    </Form.Item>
                  </div>

                  {/* 地质评定 */}
                  <Form.Item
                    label="地质评定"
                    field="surfaceGeologyAssessment"
                    rules={[
                      { required: true, message: '请输入地质评定' },
                      { maxLength: 256, message: '最多256个字符' }
                    ]}
                  >
                    <TextArea
                      placeholder="文字描述（必填）"
                      rows={4}
                      maxLength={256}
                      showWordLimit
                      style={{ resize: 'none' }}
                    />
                  </Form.Item>
                </Form>
              </div>
            </TabPane>

            {/* 分段信息选项卡 */}
            <TabPane key="3" title="分段信息">
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#86909c' }}>
                分段信息功能开发中...
              </div>
            </TabPane>

            {/* 图片上传选项卡 */}
            <TabPane key="4" title="图片上传">
              <div style={{ padding: '20px 0' }}>
                <Upload
                  drag
                  multiple
                  accept="image/*"
                  onChange={(fileList) => {
                    console.log('图片列表:', fileList)
                  }}
                  tip="支持格式：.jpg, .png, .gif"
                >
                  <div style={{ 
                    padding: '40px',
                    textAlign: 'center',
                    color: '#86909c'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                    <div style={{ fontSize: '14px' }}>
                      点击或拖拽图片到此区域上传
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#c9cdd4' }}>
                      支持单个或批量上传
                    </div>
                  </div>
                </Upload>
              </div>
            </TabPane>
          </Tabs>
        </Modal>
    </div>
  )
}

export default ForecastGeologyPage

