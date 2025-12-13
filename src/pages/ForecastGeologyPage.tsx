import React, { useState, useEffect, useRef } from 'react'
import { IconLeft } from '@arco-design/web-react/icon'
import {
  Card,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Message,
  Modal,
  Form,
  Input,
  InputNumber,
  Grid,
  Spin,
  Empty
} from '@arco-design/web-react'
import { useNavigate, useLocation } from 'react-router-dom'
import realAPI from '../services/realAPI'
import OperationButtons from '../components/OperationButtons'

const { TextArea } = Input
const { Row, Col } = Grid
const { RangePicker } = DatePicker

// 地质分类映射
const GEOLOGY_TYPE_MAP: Record<number, string> = {
  1: '岩溶发育度',
  2: '瓦斯影响度',
  3: '地应力影响度',
  4: '涌水涌泥程度',
  5: '断层稳定程度'
}

// 地质信息分级映射
const GEOLOGY_LEVEL_MAP: Record<number, string> = {
  1: '轻微',
  2: '较轻',
  3: '中等',
  4: '严重'
}

// 设计地质记录类型 - 匹配API返回的Sjdz对象
type DesignGeologyRecord = {
  sjdzPk: number           // 设计地质主键
  sjdzId: number           // 设计地质ID
  siteId: string           // 工点ID (API返回string类型)
  method: number           // 地质分类 (1-岩溶发育度, 2-瓦斯影响度, 3-地应力影响度, 4-涌水涌泥程度, 5-断层稳定程度)
  dzxxfj?: number          // 地质信息分级 (1-轻微, 2-较轻, 3-中等, 4-严重)
  dkname: string           // 里程冠号
  dkilo: number            // 起始里程
  sjdzLength: number       // 预报长度
  revise?: string          // 修改原因
  username?: string        // 填写人账号
  gmtCreate?: string       // 创建时间
  gmtModified?: string     // 修改时间
}

function ForecastGeologyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 从URL参数或路由状态中获取工点ID
  const initialSiteId = (location.state as any)?.workPointId || new URLSearchParams(location.search).get('siteId') || '';
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DesignGeologyRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [siteId, setSiteId] = useState(initialSiteId)
  
  // 表格选择状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // 筛选表单
  const [filterForm] = Form.useForm()
  
  // 新增/编辑弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DesignGeologyRecord | null>(null)
  const [modalForm] = Form.useForm()

  // 表格列定义
  const columns = [
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      width: 180,
      render: (val: string) => val ? val.replace('T', ' ').substring(0, 19) : '-',
    },
    {
      title: '地质分类',
      dataIndex: 'method',
      width: 120,
      render: (val: number) => GEOLOGY_TYPE_MAP[val] || '-',
    },
    {
      title: '地质信息分级',
      dataIndex: 'dzxxfj',
      width: 120,
      render: (val: number) => GEOLOGY_LEVEL_MAP[val] || '-',
    },
    {
      title: '开始-结束里程',
      dataIndex: 'mileageRange',
      width: 280,
      render: (_: any, record: DesignGeologyRecord) => {
        const startKilo = `${record.dkname}${Math.floor(record.dkilo)}+${((record.dkilo % 1) * 1000).toFixed(0).padStart(3, '0')}`
        const endKiloValue = record.dkilo + record.sjdzLength / 1000
        const endKilo = `${record.dkname}${Math.floor(endKiloValue)}+${((endKiloValue % 1) * 1000).toFixed(0).padStart(3, '0')}`
        return `${startKilo} - ${endKilo}`
      },
    },
    {
      title: '预报长度',
      dataIndex: 'sjdzLength',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'operations',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: DesignGeologyRecord) => (
        <Space>
          <Button
            type="text"
            size="small"
            style={{ padding: 4 }}
            onClick={() => handleEdit(record)}
          >
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 28, 
              height: 28, 
              borderRadius: 6,
              backgroundColor: '#7c5cfc',
              color: '#fff'
            }}>
              ✏️
            </span>
          </Button>
          <Button
            type="text"
            size="small"
            style={{ padding: 4 }}
            onClick={() => handleDelete(record)}
          >
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 28, 
              height: 28, 
              borderRadius: 6,
              backgroundColor: '#7c5cfc',
              color: '#fff'
            }}>
              🗑️
            </span>
          </Button>
        </Space>
      ),
    },
  ]

  // 获取设计地质数据
  const fetchGeologyData = async () => {
    if (!siteId) {
      console.warn('⚠️ [ForecastGeologyPage] siteId为空，无法获取数据')
      Message.warning('工点ID为空，请从正确的页面进入')
      return
    }
    
    const filterValues = filterForm.getFieldsValue()
    
    // 处理日期范围
    let begin: string | undefined
    let end: string | undefined
    if (filterValues.createdAt && Array.isArray(filterValues.createdAt)) {
      begin = filterValues.createdAt[0]?.format('YYYY-MM-DDTHH:mm:ss')
      end = filterValues.createdAt[1]?.format('YYYY-MM-DDTHH:mm:ss')
    }
    
    const params = {
      siteId: siteId,
      pageNum: page,
      pageSize,
      method: filterValues.method,
      begin,
      end
    }
    
    setLoading(true)
    try {
      console.log('🔍 [ForecastGeologyPage] 获取设计地质数据, 参数:', params)
      
      const result = await realAPI.getDesignGeologies(params)
      
      console.log('✅ [ForecastGeologyPage] API返回结果:', result)
      console.log('🔍 [ForecastGeologyPage] 结果类型:', typeof result)
      console.log('🔍 [ForecastGeologyPage] 结果的所有键:', result ? Object.keys(result) : 'null')
      console.log('🔍 [ForecastGeologyPage] records数组:', result?.records)
      console.log('🔍 [ForecastGeologyPage] records长度:', result?.records?.length)
      console.log('🔍 [ForecastGeologyPage] total:', result?.total)
      
      const records = result.records || []
      const total = result.total || 0
      
      console.log('📊 [ForecastGeologyPage] 设置数据: records数量=', records.length, 'total=', total)
      
      setData(records as unknown as DesignGeologyRecord[])
      setTotal(total)
      
      if (records.length === 0) {
        console.log('ℹ️ [ForecastGeologyPage] 没有数据返回')
      } else {
        console.log('✅ [ForecastGeologyPage] 第一条数据示例:', records[0])
      }
    } catch (error) {
      console.error('❌ [ForecastGeologyPage] 获取设计地质数据失败:', error)
      Message.error('获取设计地质数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGeologyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  // 操作处理函数
  const handleEdit = (record: DesignGeologyRecord) => {
    setEditingRecord(record)
    // dkilo是米数，需要转换为公里和米
    const kiloMain = Math.floor(record.dkilo / 1000)
    const kiloSub = record.dkilo % 1000
    modalForm.setFieldsValue({
      method: record.method,
      dzxxfj: record.dzxxfj,
      dkname: record.dkname,
      startMileageMain: kiloMain,
      startMileageSub: kiloSub,
      sjdzLength: record.sjdzLength,
      username: record.username,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: DesignGeologyRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await realAPI.deleteDesignGeology(String(record.sjdzPk))
          Message.success('删除成功')
          fetchGeologyData()
        } catch (error) {
          Message.error('删除失败')
        }
      },
    })
  }

  const handleAdd = () => {
    setEditingRecord(null)
    modalForm.resetFields()
    setModalVisible(true)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await modalForm.validate()
      
      // 计算里程数字（米数）：公里*1000 + 米
      const dkilo = (values.startMileageMain || 0) * 1000 + (values.startMileageSub || 0)
      
      if (editingRecord) {
        // 更新时的数据格式
        const updateData = {
          sjdzPk: editingRecord.sjdzPk,
          sdPk: editingRecord.sjdzPk,
          dkname: values.dkname,
          dkilo: dkilo,
          method: values.method,
          sjdzLength: values.sjdzLength,
          dzxxfj: values.dzxxfj,
          remark: values.remark || '',
        }
        
        console.log('📤 [设计地质] 更新数据:', updateData)
        await realAPI.updateDesignGeology(String(editingRecord.sjdzPk), updateData)
        Message.success('更新成功')
      } else {
        // 新增时的数据格式 - 根据API参数
        const createData = {
          bdPk: 1,
          sdPk: 1,
          dkname: values.dkname,
          dkilo: dkilo,
          method: values.method,
          sjdzLength: values.sjdzLength,
          dzxxfj: values.dzxxfj,
          remark: values.remark || '',
        }
        
        console.log('📤 [设计地质] 创建数据:', createData)
        await realAPI.createDesignGeology(createData as any)
        Message.success('创建成功')
      }

      setModalVisible(false)
      setEditingRecord(null)
      modalForm.resetFields()
      fetchGeologyData()
    } catch (error) {
      console.error('❌ [设计地质] 提交失败:', error)
      const errorMsg = error instanceof Error ? error.message : '提交失败'
      Message.error(errorMsg)
    }
  }

  const handleDownloadTemplate = () => {
    Message.info('正在下载模板...')
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Message.info(`导入文件: ${file.name}`)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请先选择要删除的记录')
      return
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => realAPI.deleteDesignGeology(id)))
          Message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchGeologyData()
        } catch (error) {
          Message.error('批量删除失败')
        }
      },
    })
  }

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
        <span>设计预报 / 人员信息 / 地质点/DK713+920/DK713+920/设计地质</span>
        <Button 
          type="text" 
          icon={<IconLeft />} 
          style={{ color: '#fff' }}
          onClick={() => navigate('/geo-forecast')}
        >
          返回
        </Button>
      </div>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: '16px' }}>
        <Form form={filterForm} autoComplete="off" layout="inline">
          <Form.Item label="地质分类" field="method" style={{ marginRight: 24 }}>
            <Select
              placeholder="请选择地质分类"
              allowClear
              style={{ width: 180 }}
            >
              {Object.entries(GEOLOGY_TYPE_MAP).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>{value}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="创建时间" field="createdAt" style={{ marginRight: 24 }}>
            <RangePicker format="YYYY-MM-DD" style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<span>🔍</span>} onClick={fetchGeologyData}>
                查询
              </Button>
              <Button onClick={() => { filterForm.resetFields(); fetchGeologyData() }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <OperationButtons
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onAdd={handleAdd}
        onClear={handleBatchDelete}
        selectedCount={selectedRowKeys.length}
        clearDisabled={selectedRowKeys.length === 0}
      />

      {/* 数据表格 */}
      <Card>
        <Spin loading={loading}>
          <Table
            columns={columns}
            data={data}
            rowKey="sjdzPk"
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedRowKeys) => {
                setSelectedRowKeys(selectedRowKeys as string[])
              },
            }}
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
            noDataElement={<Empty description="暂无设计地质数据" />}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* 隐藏的文件上传input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '修改设计地质' : '新增设计地质'}
        visible={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          modalForm.resetFields()
        }}
        style={{ width: 650 }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={modalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="地质分类"
                field="method"
                rules={[{ required: true, message: '请选择地质分类' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(GEOLOGY_TYPE_MAP).map(([key, value]) => (
                    <Select.Option key={key} value={Number(key)}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="信息分级"
                field="dzxxfj"
                rules={[{ required: true, message: '请选择信息分级' }]}
              >
                <Select placeholder="请选择">
                  {Object.entries(GEOLOGY_LEVEL_MAP).map(([key, value]) => (
                    <Select.Option key={key} value={Number(key)}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="里程冠号"
                field="dkname"
                rules={[{ required: true, message: '请输入里程冠号' }]}
                initialValue="DK"
              >
                <Input placeholder="DK" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="开始里程" required>
                <Space>
                  <Form.Item field="startMileageMain" noStyle rules={[{ required: true, message: '请输入' }]}>
                    <InputNumber placeholder="713" min={0} step={1} precision={0} style={{ width: 100 }} />
                  </Form.Item>
                  <span>+</span>
                  <Form.Item field="startMileageSub" noStyle rules={[{ required: true, message: '请输入' }]}>
                    <InputNumber placeholder="375" min={0} max={999} step={1} precision={0} style={{ width: 100 }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="预报长度(m)"
                field="sjdzLength"
                rules={[{ required: true, message: '请输入预报长度' }]}
              >
                <InputNumber 
                  placeholder="25.00" 
                  style={{ width: '100%' }} 
                  min={0.01}
                  max={99999999.99}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="填写人"
                field="username"
                rules={[{ required: true, message: '请选择填写人' }]}
              >
                <Select placeholder="请选择">
                  <Select.Option value="admin">admin</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ForecastGeologyPage
