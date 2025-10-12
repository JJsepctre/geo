import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, DatePicker, Form, Grid, Input, InputNumber, Message, Modal, Select, Space, Table } from '@arco-design/web-react'
import http from '../utils/http'

type ForecastMethodOption = {
  label: string
  value: string
}

type ForecastRecord = {
  id: string
  createdAt: string
  method: string
  startMileage: string
  endMileage: string
  length: number
  minBurialDepth: number
  designTimes: number
}

type ListResponse = {
  list: ForecastRecord[]
  total: number
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
    const params: Record<string, unknown> = {
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
      const res = await http.get<ListResponse, ListResponse>('/forecast/designs', { params })
      setData(res.list || [])
      setTotal(res.total || 0)
    } catch (error) {
      Message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const handleDelete = async (record: ForecastRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      onOk: async () => {
        try {
          await http.delete(`/forecast/designs/${record.id}`)
          Message.success('删除成功')
          fetchList()
        } catch (error) {
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
          await http.post('/forecast/designs/batch-delete', { ids: selectedRowKeys })
          Message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchList()
        } catch (error) {
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
    const formData = new FormData()
    formData.append('file', file)
    try {
      Message.loading({ id: 'import', content: '导入中...', duration: 0 })
      await http.post('/forecast/designs/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      Message.success({ id: 'import', content: '导入成功' })
      fetchList()
    } catch (error) {
      Message.error({ id: 'import', content: '导入失败' })
    }
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validate()
      await http.post('/forecast/designs', values)
      Message.success('新增成功')
      setAddVisible(false)
      addForm.resetFields()
      fetchList()
    } catch (error) {
      // 表单校验或接口错误
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
      width: 140,
      render: (_: unknown, record: ForecastRecord) => (
        <Space>
          <Button type="text" onClick={() => handleDelete(record)}>删除</Button>
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
        onCancel={() => setAddVisible(false)}
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
    </div>
  )
}

export default ForecastDesignPage


