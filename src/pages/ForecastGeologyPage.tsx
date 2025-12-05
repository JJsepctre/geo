import React, { useState, useEffect } from 'react'
import { IconLeft } from '@arco-design/web-react/icon' 
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
  Form,
  Input,
  InputNumber
} from '@arco-design/web-react'
import { useNavigate, useLocation } from 'react-router-dom'
import realAPI from '../services/realAPI'
import OperationButtons from '../components/OperationButtons'

const { TextArea } = Input

// 设计地质记录类型
type DesignGeologyRecord = {
  sjdzPk: number           // 设计地质主键
  sjdzId: number           // 设计地质ID
  sitePk: number           // 工点主键
  method: number           // 方法代码
  dkname: string           // 里程冠号
  dkilo: number            // 里程公里数
  sjdzLength: number       // 长度
  revise?: string          // 修改原因
  username: string         // 填写人账号
  gmtCreate: string        // 创建时间
  gmtModified: string      // 修改时间
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
  
  // 新增弹窗状态
  const [addVisible, setAddVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 编辑弹窗状态
  const [editVisible, setEditVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DesignGeologyRecord | null>(null)
  const [editForm] = Form.useForm()

  // 表格列定义
  const columns = [
    {
      title: '设计地质ID',
      dataIndex: 'sjdzId',
      key: 'sjdzId',
      width: 120,
    },
    {
      title: '里程冠号',
      dataIndex: 'dkname',
      key: 'dkname',
      width: 100,
    },
    {
      title: '里程(km)',
      dataIndex: 'dkilo',
      key: 'dkilo',
      width: 120,
      render: (val: number) => val ? val.toFixed(3) : '-',
    },
    {
      title: '长度(m)',
      dataIndex: 'sjdzLength',
      key: 'sjdzLength',
      width: 100,
    },
    {
      title: '方法代码',
      dataIndex: 'method',
      key: 'method',
      width: 100,
    },
    {
      title: '填写人',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      width: 160,
      render: (val: string) => val ? new Date(val).toLocaleString() : '-',
    },
    {
      title: '修改原因',
      dataIndex: 'revise',
      key: 'revise',
      ellipsis: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: DesignGeologyRecord) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#165dff' }}
            onClick={() => handleEdit(record)}
          >
            编辑
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

  // 获取设计地质数据
  const fetchGeologyData = async () => {
    setLoading(true)
    try {
      console.log('🔍 [ForecastGeologyPage] 获取设计地质数据, siteId:', siteId)
      
      const result = await realAPI.getDesignGeologies({
        sitePk: siteId ? parseInt(siteId) : undefined,
        pageNum: page,
        pageSize
      })
      
      console.log('✅ [ForecastGeologyPage] 设计地质数据:', result)
      
      setData((result.records || []) as unknown as DesignGeologyRecord[])
      setTotal(result.total || 0)
      
      if (result.records && result.records.length > 0) {
        Message.success(`加载了 ${result.records.length} 条设计地质数据`)
      } else {
        Message.info('暂无设计地质数据')
      }
    } catch (error) {
      console.error('❌ [ForecastGeologyPage] 获取设计地质数据失败:', error)
      Message.error('获取设计地质数据失败')
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
    editForm.setFieldsValue({
      dkname: record.dkname,
      dkilo: record.dkilo,
      sjdzLength: record.sjdzLength,
      method: record.method,
      revise: record.revise,
      username: record.username
    })
    setEditVisible(true)
  }

  const handleDelete = (record: DesignGeologyRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设计地质记录"${record.sjdzId}"吗？此操作不可恢复。`,
      okButtonProps: {
        status: 'danger'
      },
      onOk: async () => {
        try {
          // 调用删除API
          await realAPI.deleteDesignGeology(String(record.sjdzPk))
          Message.success('删除成功')
          fetchGeologyData()
        } catch (error) {
          Message.error('删除失败，请稍后重试')
        }
      }
    })
  }

  // 操作按钮处理函数
  const handleDownloadTemplate = async () => {
    try {
      // 调用下载模板API
      const blob = await realAPI.downloadDesignGeologyTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '设计地质导入模板.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      Message.success('模板下载成功')
    } catch (error) {
      Message.error('模板下载失败')
    }
  }

  const handleImport = () => {
    Message.info('导入功能开发中')
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddVisible(true)
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请先选择要删除的记录')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？此操作不可恢复。`,
      okButtonProps: {
        status: 'danger'
      },
      onOk: async () => {
        try {
          Message.success(`批量删除成功：${selectedRowKeys.length} 条记录`)
          
          // 执行批量删除
          await realAPI.batchDeleteDesignGeologies(selectedRowKeys)
          
          setSelectedRowKeys([])
          fetchGeologyData()
        } catch (error) {
          Message.error('批量删除失败，请稍后重试')
        }
      }
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
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <span>方法代码：</span>
          <Select 
            placeholder="请选择方法代码"
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value={1}>方法1</Select.Option>
            <Select.Option value={2}>方法2</Select.Option>
            <Select.Option value={3}>方法3</Select.Option>
          </Select>
          
          <span>创建时间：</span>
          <DatePicker.RangePicker />
          
          <Button type="primary" icon={<span>🔍</span>}>
            查询
          </Button>
          <Button icon={<span>🔄</span>}>
            重置
          </Button>
        </Space>
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

      {/* 新增弹窗 */}
      <Modal
        title="新增设计地质"
        visible={addVisible}
        onOk={async () => {
          try {
            const values = await addForm.validate()
            console.log('新增设计地质:', values)
            Message.success('新增成功')
            setAddVisible(false)
            fetchGeologyData()
          } catch (error) {
            Message.error('新增失败，请检查输入')
          }
        }}
        onCancel={() => setAddVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
            <Input placeholder="如 DK" />
          </Form.Item>
          <Form.Item label="里程(km)" field="dkilo" rules={[{ required: true, message: '请输入里程' }]}>
            <InputNumber placeholder="如 713.920" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="长度(m)" field="sjdzLength" rules={[{ required: true, message: '请输入长度' }]}>
            <InputNumber placeholder="长度" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="方法代码" field="method" rules={[{ required: true, message: '请选择方法代码' }]}>
            <Select placeholder="请选择方法代码">
              <Select.Option value={1}>方法1</Select.Option>
              <Select.Option value={2}>方法2</Select.Option>
              <Select.Option value={3}>方法3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="填写人" field="username" rules={[{ required: true, message: '请输入填写人' }]}>
            <Input placeholder="填写人账号" />
          </Form.Item>
          <Form.Item label="修改原因" field="revise">
            <TextArea placeholder="修改原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑设计地质"
        visible={editVisible}
        onOk={async () => {
          try {
            const values = await editForm.validate()
            console.log('编辑设计地质:', values)
            Message.success('编辑成功')
            setEditVisible(false)
            fetchGeologyData()
          } catch (error) {
            Message.error('编辑失败，请检查输入')
          }
        }}
        onCancel={() => setEditVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
            <Input placeholder="如 DK" />
          </Form.Item>
          <Form.Item label="里程(km)" field="dkilo" rules={[{ required: true, message: '请输入里程' }]}>
            <InputNumber placeholder="如 713.920" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="长度(m)" field="sjdzLength" rules={[{ required: true, message: '请输入长度' }]}>
            <InputNumber placeholder="长度" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="方法代码" field="method" rules={[{ required: true, message: '请选择方法代码' }]}>
            <Select placeholder="请选择方法代码">
              <Select.Option value={1}>方法1</Select.Option>
              <Select.Option value={2}>方法2</Select.Option>
              <Select.Option value={3}>方法3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="填写人" field="username" rules={[{ required: true, message: '请输入填写人' }]}>
            <Input placeholder="填写人账号" />
          </Form.Item>
          <Form.Item label="修改原因" field="revise">
            <TextArea placeholder="修改原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ForecastGeologyPage
