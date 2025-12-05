import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, DatePicker, Form, Grid, Input, InputNumber, Message, Modal, Select, Space, Table } from '@arco-design/web-react'
import { IconDelete, IconEdit, IconLeft } from '@arco-design/web-react/icon'
import { useNavigate, useLocation } from 'react-router-dom'
import apiAdapter from '../services/realAPI'
import OperationButtons from '../components/OperationButtons'

type ForecastMethodOption = {
  label: string
  value: string
}

type ForecastRecord = {
  id: string
  createdAt: string
  method: string
  rockGrade?: string      // 围岩等级（可选）
  mileagePrefix?: string  // 里程冠号（可选）
  startMileage: string
  endMileage: string
  length: number
  minBurialDepth: number
  drillingCount?: number  // 钻孔数量（可选）
  coreCount?: number      // 取芯数量（可选）
  designTimes: number
  author?: string         // 填写人（可选）
  modifyReason?: string   // 修改原因说明（可选）
}

const { Row, Col } = Grid
const RangePicker = DatePicker.RangePicker

function ForecastDesignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 从URL参数或路由状态中获取工点ID
  // 假设路由状态中传递了 workPointId
  const initialSiteId = (location.state as any)?.workPointId || new URLSearchParams(location.search).get('siteId') || '';
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ForecastRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [siteId, setSiteId] = useState(initialSiteId)
  const [form] = Form.useForm()
  const [addVisible, setAddVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ForecastRecord | null>(null)
  const [addForm] = Form.useForm()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const methodOptions: ForecastMethodOption[] = useMemo(
    () => [
      { label: '方法A', value: 'A' },
      { label: '方法B', value: 'B' },
      { label: '方法C', value: 'C' },
    ],
    []
  )

  const fetchList = async () => {
    const values = form.getFieldsValue()
    const params: {
      page: number;
      pageSize: number;
      method?: string;
      startDate?: string;
      endDate?: string;
      siteId?: string; // 添加 siteId 参数
    } = {
      page,
      pageSize,
      method: values.method,
      siteId: siteId || undefined // 如果有 siteId，传递给 API
    }
    if (values.createdAt && Array.isArray(values.createdAt)) {
      params.startDate = values.createdAt[0]?.format('YYYY-MM-DD')
      params.endDate = values.createdAt[1]?.format('YYYY-MM-DD')
    }

    setLoading(true)
    try {
      const res = await apiAdapter.getForecastDesigns(params)
      setData(res.list || [])
      setTotal(res.total || 0)
    } catch (error) {
      console.error('获取预报设计数据失败:', error)
      Message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const handleEdit = (record: ForecastRecord) => {
    setEditingRecord(record)
    // 解析开始里程（例如 "DK718+594" 或 "718+594"）
    const startMileageParts = record.startMileage.match(/(\d+)\+(\d+\.?\d*)/)
    const startMileageMain = startMileageParts ? parseInt(startMileageParts[1]) : 0
    const startMileageSub = startMileageParts ? parseFloat(startMileageParts[2]) : 0
    
    addForm.setFieldsValue({
      method: record.method,
      mileagePrefix: record.mileagePrefix || 'DK',
      startMileageMain,
      startMileageSub,
      length: record.length,
      minBurialDepth: record.minBurialDepth,
      drillingCount: record.drillingCount || 1,
      coreCount: record.coreCount || 0,
      designTimes: record.designTimes || 1,
      author: record.author || '冯文波',
      modifyReason: record.modifyReason || '',
    })
    setEditVisible(true)
  }

  const handleDelete = async (record: ForecastRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      onOk: async () => {
        try {
          await apiAdapter.deleteForecastDesign(record.id)
          Message.success('删除成功')
          fetchList()
        } catch (error) {
          console.error('删除预报设计失败:', error)
          Message.error('删除失败')
        }
      },
    })
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return
    Modal.confirm({
      title: '确认批量删除',
      content: `将删除选中的 ${selectedRowKeys.length} 条记录，是否继续？`,
      onOk: async () => {
        try {
          await apiAdapter.batchDeleteForecastDesigns(selectedRowKeys)
          Message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchList()
        } catch (error) {
          console.error('批量删除预报设计失败:', error)
          Message.error('批量删除失败')
        }
      },
    })
  }

  const handleDownloadTemplate = () => {
    // 下载空白模板文件
    // 如果后端提供了模板文件，直接下载；否则提示用户
    const templateUrl = '/templates/设计预报导入模板.xlsx'
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = '设计预报导入模板.xlsx'
    link.style.display = 'none'
    document.body.appendChild(link)
    
    link.onerror = () => {
      document.body.removeChild(link)
      // 如果模板文件不存在，创建一个简单的CSV模板
      const csvContent = 'data:text/csv;charset=utf-8,预报方法,开始里程,结束里程,预报长度,最小埋深,预报设计次数\n方法A,DK713+000,DK713+920,920,10,1'
      const encodedUri = encodeURI(csvContent)
      const csvLink = document.createElement('a')
      csvLink.setAttribute('href', encodedUri)
      csvLink.setAttribute('download', '设计预报导入模板.csv')
      csvLink.click()
    }
    
    link.click()
    try {
      document.body.removeChild(link)
    } catch (e) {
      // 忽略移除错误
    }
  }

  const handleAdd = () => {
    setAddVisible(true)
  }

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      Message.loading({ id: 'import', content: '导入中...', duration: 0 })
      await apiAdapter.importForecastDesigns(file)
      Message.success({ id: 'import', content: '导入成功' })
      fetchList()
    } catch (error) {
      console.error('导入预报设计失败:', error)
      Message.error({ id: 'import', content: '导入失败' })
    }
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validate()
      await apiAdapter.createForecastDesign(values)
      Message.success('新增成功')
      setAddVisible(false)
      addForm.resetFields()
      fetchList()
    } catch (error) {
      console.error('新增预报设计失败:', error)
      Message.error('新增失败')
    }
  }

  const handleEditOk = async () => {
    if (!editingRecord) return
    try {
      const values = await addForm.validate()
      // 合并开始里程的两个字段
      const startMileage = `${values.mileagePrefix}${values.startMileageMain}+${values.startMileageSub}`
      const endMileage = `${values.mileagePrefix}${values.startMileageMain}+${parseFloat(values.startMileageSub) + values.length}`
      
      const submitData = {
        method: values.method,
        mileagePrefix: values.mileagePrefix,
        startMileage,
        endMileage,
        length: values.length,
        minBurialDepth: values.minBurialDepth,
        drillingCount: values.drillingCount,
        coreCount: values.coreCount,
        designTimes: values.designTimes,
        author: values.author,
        modifyReason: values.modifyReason,
      }
      
      // 调用更新API
      await apiAdapter.updateForecastDesign(editingRecord.id, submitData)
      Message.success('修改成功')
      setEditVisible(false)
      setEditingRecord(null)
      addForm.resetFields()
      fetchList()
    } catch (error) {
      console.error('修改设计预报失败:', error)
      Message.error('修改失败')
    }
  }

  const columns = [
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    { title: '预报方法', dataIndex: 'method', width: 120 },
    {
      title: '开始 - 结束里程',
      render: (_: unknown, r: ForecastRecord) => `${r.startMileage} - ${r.endMileage}`,
      width: 220,
    },
    { title: '预报长度', dataIndex: 'length', width: 120 },
    { title: '最小埋深', dataIndex: 'minBurialDepth', width: 120 },
    { title: '预报设计次数', dataIndex: 'designTimes', width: 140 },
    {
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: ForecastRecord) => (
        <Space size={4}>
          <Button 
            type="text" 
            icon={<IconEdit />}
            style={{ color: '#165dff', padding: '4px 8px' }}
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            icon={<IconDelete />}
            style={{ color: '#165dff', padding: '4px 8px' }}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ]

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
        <span>设计预报 / 人员信息 / 地质点/DK713+920/DK713+920/设计预报方法</span>
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
        <Form form={form} layout="inline">
          <Form.Item label="预报方法" field="method" style={{ marginRight: 24 }}>
            <Select placeholder="请选择预报方法" allowClear options={methodOptions} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="创建时间" field="createdAt" style={{ marginRight: 24 }}>
            <RangePicker format="YYYY-MM-DD" style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<span>🔍</span>} onClick={fetchList}>
                查询
              </Button>
              <Button onClick={() => { form.resetFields(); setPage(1); fetchList() }}>重置</Button>
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
      
      {/* 隐藏的文件上传input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      {/* 数据表格 */}
      <Card>
      <Table
        rowKey="id"
        loading={loading}
        data={data}
        columns={columns}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: true,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
        noDataElement={<div style={{ padding: 48, color: '#999' }}>暂无数据</div>}
      />
      </Card>

      <Modal
        title="新增预报"
        visible={addVisible}
        onOk={handleAddOk}
        onCancel={() => {
          setAddVisible(false)
          addForm.resetFields()
        }}
        unmountOnExit
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="预报方法" field="method" rules={[{ required: true, message: '请选择预报方法' }]}>
            <Select placeholder="请选择" options={methodOptions} />
          </Form.Item>
          <Form.Item label="开始里程" field="startMileage" rules={[{ required: true, message: '请输入开始里程' }]}>
            <Input placeholder="如 DK713+000" />
          </Form.Item>
          <Form.Item label="结束里程" field="endMileage" rules={[{ required: true, message: '请输入结束里程' }]}>
            <Input placeholder="如 DK713+920" />
          </Form.Item>
          <Form.Item label="预报长度(m)" field="length" rules={[{ required: true, message: '请输入长度' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="最小埋深(m)" field="minBurialDepth" rules={[{ required: true, message: '请输入最小埋深' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="预报设计次数" field="designTimes" initialValue={1}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改设计预报"
        visible={editVisible}
        onOk={handleEditOk}
        onCancel={() => {
          setEditVisible(false)
          setEditingRecord(null)
          addForm.resetFields()
        }}
        style={{ width: '800px' }}
        unmountOnExit
      >
        <Form form={addForm} layout="vertical">
          {/* 预报方法 */}
          <Form.Item label="预报方法" field="method" rules={[{ required: true, message: '请选择预报方法' }]}>
            <Select placeholder="请选择预报方法" options={methodOptions} />
          </Form.Item>

          {/* 里程冠号 和 开始里程 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="里程冠号" field="mileagePrefix" rules={[{ required: true, message: '请输入里程冠号' }]} initialValue="DK">
                <Input placeholder="DK" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="开始里程" required>
                <Space style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                  <Form.Item 
                    field="startMileageMain" 
                    noStyle
                    rules={[{ required: true, message: '请输入' }]}
                  >
                    <InputNumber placeholder="713" min={0} style={{ width: '140px' }} />
                  </Form.Item>
                  <span style={{ margin: '0 8px' }}>+</span>
                  <Form.Item 
                    field="startMileageSub" 
                    noStyle
                    rules={[{ required: true, message: '请输入' }]}
                  >
                    <InputNumber placeholder="973.2" min={0} max={999.9} step={0.1} style={{ width: '140px' }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          {/* 预报长度 和 最小埋深 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="预报长度" field="length" rules={[{ required: true, message: '请输入预报长度' }]}>
                <InputNumber placeholder="-23.20" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最小埋深" field="minBurialDepth" rules={[{ required: true, message: '请输入最小埋深' }]}>
                <InputNumber placeholder="2.00" min={0} style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          {/* 钻孔数量 和 取芯数量 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="钻孔数量" field="drillingCount" rules={[{ required: true, message: '请输入钻孔数量' }]} initialValue={1}>
                <InputNumber placeholder="1" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="取芯数量" field="coreCount" rules={[{ required: true, message: '请输入取芯数量' }]} initialValue={0}>
                <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 设计次数 和 填写人 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="设计次数" field="designTimes" rules={[{ required: true, message: '请输入设计次数' }]} initialValue={1}>
                <InputNumber placeholder="1" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="填写人" field="author" rules={[{ required: true, message: '请选择填写人' }]}>
                <Select placeholder="请选择填写人" options={[
                  { label: '冯文波', value: '冯文波' },
                  { label: '一分部', value: '一分部' },
                  { label: '二分部', value: '二分部' },
                  { label: '三分部', value: '三分部' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* 修改原因说明 */}
          <Form.Item label="修改原因说明" field="modifyReason">
            <Input.TextArea placeholder="请输入修改原因" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ForecastDesignPage


