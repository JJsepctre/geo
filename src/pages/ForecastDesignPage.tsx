import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, DatePicker, Form, Grid, Input, InputNumber, Message, Modal, Select, Space, Table } from '@arco-design/web-react'
import { IconEdit, IconDelete } from '@arco-design/web-react/icon'
import apiAdapter from '../services/apiAdapter'

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
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ForecastRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
    } = {
      page,
      pageSize,
      method: values.method,
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
    const startMileageParts = record.startMileage.match(/(\d+)\+(\d+)/)
    const startMileageMain = startMileageParts ? parseInt(startMileageParts[1]) : 0
    const startMileageSub = startMileageParts ? parseInt(startMileageParts[2]) : 0
    
    addForm.setFieldsValue({
      rockGrade: 'IV', // 默认围岩等级
      mileagePrefix: record.mileagePrefix || 'DK',
      startMileageMain,
      startMileageSub,
      length: record.length,
      author: record.author || '一分部',
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

  const openImport = () => {
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
      const submitData = {
        id: editingRecord.id,
        rockGrade: values.rockGrade,
        mileagePrefix: values.mileagePrefix,
        startMileage,
        length: values.length,
        author: values.author,
        modifyReason: values.modifyReason,
      }
      
      // 这里应该调用更新API，暂时使用创建API
      await apiAdapter.createForecastDesign(submitData)
      Message.success('修改成功')
      setEditVisible(false)
      setEditingRecord(null)
      addForm.resetFields()
      fetchList()
    } catch (error) {
      console.error('修改设计围岩失败:', error)
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
      

      <Form form={form} layout="vertical" onSubmit={fetchList} style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="预报方法" field="method">
              <Select placeholder="请选择" allowClear options={methodOptions} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label="创建时间" field="createdAt">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Form.Item label=" " colon={false} style={{ marginTop: 20, marginBottom: 0 }}>
              <Space>
                <Button type="primary" onClick={fetchList}>
                  查询
                </Button>
                <Button onClick={() => { form.resetFields(); setPage(1); fetchList() }}>重置</Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => Message.info('请联系后端提供模板下载地址')}>下载模板</Button>
          <Button onClick={openImport}>导入</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          <Button type="primary" onClick={() => setAddVisible(true)}>新增</Button>
          <Button status="danger" disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>批量删除</Button>
        </Space>
      </Form>

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
        title="修改设计围岩"
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="围岩等级" field="rockGrade" rules={[{ required: true, message: '请选择围岩等级' }]}>
                <Select placeholder="请选择" options={[
                  { label: 'I', value: 'I' },
                  { label: 'II', value: 'II' },
                  { label: 'III', value: 'III' },
                  { label: 'IV', value: 'IV' },
                  { label: 'V', value: 'V' },
                  { label: 'VI', value: 'VI' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="里程冠号" field="mileagePrefix" rules={[{ required: true, message: '请输入里程冠号' }]}>
                <Input placeholder="DK" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="开始里程" required>
                <Space style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                  <Form.Item 
                    field="startMileageMain" 
                    noStyle
                    rules={[{ required: true, message: '请输入' }]}
                  >
                    <InputNumber placeholder="713" style={{ width: '120px' }} />
                  </Form.Item>
                  <span style={{ margin: '0 8px' }}>+</span>
                  <Form.Item 
                    field="startMileageSub" 
                    noStyle
                    rules={[{ required: true, message: '请输入' }]}
                  >
                    <InputNumber placeholder="485" style={{ width: '120px' }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="预报长度" field="length" rules={[{ required: true, message: '请输入预报长度' }]}>
                <InputNumber placeholder="-205.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="填写人" field="author" rules={[{ required: true, message: '请选择填写人' }]}>
                <Select placeholder="请选择" options={[
                  { label: '一分部', value: '一分部' },
                  { label: '二分部', value: '二分部' },
                  { label: '三分部', value: '三分部' },
                  { label: '其他', value: '其他' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="修改原因说明" field="modifyReason" rules={[{ required: true, message: '请输入修改原因说明' }]}>
            <Input.TextArea placeholder="请输入修改原因" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ForecastDesignPage


