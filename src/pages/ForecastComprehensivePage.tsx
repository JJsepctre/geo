import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Empty,
  Message,
  Modal,
  Form,
  Input,
  Upload,
  Link,
  Drawer
} from '@arco-design/web-react'
import { IconLeft, IconPlus, IconDownload } from '@arco-design/web-react/icon'
import { useNavigate, useLocation } from 'react-router-dom'
import realAPI from '../services/realAPI'
import SegmentModal from '../components/SegmentModal'

const { RangePicker } = DatePicker
const { TextArea } = Input

// 处置类型选项
const disposalTypeOptions = [
  { label: '综合结论', value: '综合结论' }
]

// 处置状态选项
const disposalStatusOptions = [
  { label: '已处置', value: 1 },
  { label: '未处置', value: 0 }
]

function ForecastComprehensivePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 筛选条件
  const [disposalType, setDisposalType] = useState<string | undefined>(undefined)
  const [disposalStatus, setDisposalStatus] = useState<number | undefined>(undefined)
  const [dateRange, setDateRange] = useState<string[]>([])

  // 新增弹窗
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()
  
  // 分段信息弹窗
  const [segmentModalVisible, setSegmentModalVisible] = useState(false)
  const [segments, setSegments] = useState<any[]>([])
  const [editingSegment, setEditingSegment] = useState<any>(null)

  // 处置弹窗（已处置状态）
  const [disposalModalVisible, setDisposalModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [disposalList, setDisposalList] = useState<any[]>([])
  
  // 处置抽屉（未处置状态）
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [drawerDisposalList, setDrawerDisposalList] = useState<any[]>([])
  
  // 新增处置弹窗（未处置状态用 - 综合结论处置）
  const [addDisposalVisible, setAddDisposalVisible] = useState(false)
  const [disposalForm] = Form.useForm()
  
  // 新增处置内容弹窗（已处置状态用 - 处置内容详情）
  const [addContentVisible, setAddContentVisible] = useState(false)
  const [contentForm] = Form.useForm()

  // 获取URL参数
  const searchParams = new URLSearchParams(location.search)
  const _siteId = searchParams.get('siteId') // 保留以备后用

  // 加载数据
  const fetchData = async (page = 1, size = 10) => {
    setLoading(true)
    try {
      const params: any = { pageNum: page, pageSize: size }
      if (disposalStatus !== undefined) params.warndealflag = disposalStatus
      if (dateRange.length === 2) {
        params.begin = dateRange[0]
        params.end = dateRange[1]
      }

      const res = await realAPI.getComprehensiveConclusionList(params)
      console.log('✅ [ForecastComprehensivePage] 获取数据:', res)

      if (res && res.data && res.data.zhjlIPage) {
        const pageData = res.data.zhjlIPage
        setData(pageData.records || [])
        setTotal(pageData.total || 0)
      } else if (res && res.records) {
        setData(res.records || [])
        setTotal(res.total || 0)
      } else {
        setData([])
        setTotal(0)
      }
    } catch (error) {
      console.error('❌ 加载数据失败:', error)
      Message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(currentPage, pageSize)
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(1, pageSize)
  }

  const handleReset = () => {
    setDisposalType(undefined)
    setDisposalStatus(undefined)
    setDateRange([])
    setCurrentPage(1)
    fetchData(1, pageSize)
  }

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
    fetchData(page, size)
  }

  // 打开处置情况抽屉（从底部弹出）
  const handleOpenDrawer = async (record: any) => {
    setSelectedRecord(record)
    setDrawerVisible(true)
    
    // 调用真实API获取处置情况数据
    try {
      const res = await realAPI.getZhjlCzinfo(record.zhjlPk)
      console.log('✅ [处置情况] 获取数据:', res)
      if (res && Array.isArray(res)) {
        setDrawerDisposalList(res.map((item: any, index: number) => ({
          id: item.czinfoPk || index + 1,
          warndealflag: item.handleresult,
          gmtCreate: item.handletime || item.gmtCreate,
          readPerson: item.liableusername,
          dealGroup: item.handlecontent
        })))
      } else if (res && res.data && Array.isArray(res.data)) {
        setDrawerDisposalList(res.data.map((item: any, index: number) => ({
          id: item.czinfoPk || index + 1,
          warndealflag: item.handleresult,
          gmtCreate: item.handletime || item.gmtCreate,
          readPerson: item.liableusername,
          dealGroup: item.handlecontent
        })))
      } else {
        setDrawerDisposalList([])
      }
    } catch (error) {
      console.error('❌ 获取处置情况失败:', error)
      setDrawerDisposalList([])
    }
  }
  
  // 打开综合结论处置详情弹窗（从抽屉里的操作按钮点击）
  const handleOpenDisposalModal = async (record: any) => {
    // 调用真实API获取处置内容数据
    try {
      const res = await realAPI.getZhjlCzinfo(selectedRecord?.zhjlPk)
      console.log('✅ [处置内容] 获取数据:', res)
      if (res && Array.isArray(res)) {
        setDisposalList(res.map((item: any, index: number) => ({
          id: item.czinfoPk || index + 1,
          fdjlm: item.subsectionId || selectedRecord?.zhjlPk,
          czTime: item.handletime || item.gmtCreate,
          czrName: item.liableusername,
          czrIdCard: item.liableuserno,
          czrPhone: item.liableuserphone,
          czContent: item.handlecontent,
          attachment: !!item.addition
        })))
      } else if (res && res.data && Array.isArray(res.data)) {
        setDisposalList(res.data.map((item: any, index: number) => ({
          id: item.czinfoPk || index + 1,
          fdjlm: item.subsectionId || selectedRecord?.zhjlPk,
          czTime: item.handletime || item.gmtCreate,
          czrName: item.liableusername,
          czrIdCard: item.liableuserno,
          czrPhone: item.liableuserphone,
          czContent: item.handlecontent,
          attachment: !!item.addition
        })))
      } else {
        setDisposalList([])
      }
    } catch (error) {
      console.error('❌ 获取处置内容失败:', error)
      setDisposalList([])
    }
    setDisposalModalVisible(true)
  }
  
  // 新增处置
  const handleAddDisposal = () => {
    disposalForm.resetFields()
    setAddDisposalVisible(true)
  }
  
  // 提交处置（综合结论处置）
  const handleDisposalSubmit = async () => {
    try {
      const values = await disposalForm.validate()
      console.log('📤 [处置] 提交数据:', values)
      
      // 调用真实API创建处置 - 使用ISO格式日期
      const handletime = new Date().toISOString()
      
      const res = await realAPI.createZhjlCzinfo({
        zhjlPk: selectedRecord?.zhjlPk,
        handletype: 0,
        handleresult: values.dealStatus,
        subsectionId: String(selectedRecord?.zhjlPk || ''),
        handlecontent: values.dealGroup,
        addition: '',
        handletime: handletime,
        liableusername: values.readPerson,
        liableuserno: '',
        liableuserphone: ''
      })
      
      console.log('✅ [处置] 创建结果:', res)
      
      if (res) {
        Message.success('添加成功')
        setAddDisposalVisible(false)
        // 刷新处置情况列表
        handleOpenDrawer(selectedRecord)
      } else {
        Message.error('添加失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      Message.error('请填写完整信息')
    }
  }
  
  // 新增处置内容（已处置状态用）
  const handleAddContent = () => {
    contentForm.resetFields()
    setAddContentVisible(true)
  }
  
  // 提交处置内容
  const handleContentSubmit = async () => {
    try {
      const values = await contentForm.validate()
      console.log('📤 [处置内容] 提交数据:', values)
      
      // 处理日期格式 - 转换为ISO格式
      let handletime = ''
      if (values.czTime) {
        if (typeof values.czTime === 'string') {
          handletime = new Date(values.czTime).toISOString()
        } else if (values.czTime.toDate) {
          handletime = values.czTime.toDate().toISOString()
        } else if (values.czTime.format) {
          handletime = new Date(values.czTime.format('YYYY-MM-DD HH:mm:ss')).toISOString()
        }
      }
      
      // 调用真实API创建处置内容
      const res = await realAPI.createZhjlCzinfo({
        zhjlPk: selectedRecord?.zhjlPk,
        handletype: 0,
        handleresult: 1, // 已处置
        subsectionId: String(values.fdjlm),
        handlecontent: values.czContent,
        addition: '',
        handletime: handletime,
        liableusername: values.czrName,
        liableuserno: values.czrIdCard,
        liableuserphone: values.czrPhone
      })
      
      console.log('✅ [处置内容] 创建结果:', res)
      
      if (res) {
        Message.success('添加成功')
        setAddContentVisible(false)
        // 刷新处置内容列表
        handleOpenDisposalModal(selectedRecord)
      } else {
        Message.error('添加失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      Message.error('请填写完整信息')
    }
  }

  // 新增
  const handleAdd = () => {
    addForm.resetFields()
    setSegments([])
    setAddModalVisible(true)
  }

  // 新增分段
  const handleAddSegment = () => {
    setEditingSegment(null)
    setSegmentModalVisible(true)
  }

  // 分段提交
  const handleSegmentSubmit = (segmentData: any) => {
    if (editingSegment) {
      // 编辑
      setSegments(segments.map((s, i) => 
        i === editingSegment.index ? { ...segmentData, index: i } : s
      ))
    } else {
      // 新增
      setSegments([...segments, { ...segmentData, index: segments.length }])
    }
    setSegmentModalVisible(false)
  }

  // 删除分段
  const handleDeleteSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index))
  }

  // 提交新增
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validate()
      
      // 构建提交数据
      const submitData = {
        ...values,
        segments
      }
      
      console.log('📤 [综合结论] 提交数据:', submitData)
      
      // TODO: 调用API创建
      Message.success('创建成功')
      setAddModalVisible(false)
      fetchData(currentPage, pageSize)
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  // 表格列定义
  const columns = [
    { 
      title: '分段记录码', 
      dataIndex: 'zhjlPk', 
      width: 150 
    },
    { 
      title: '处置类型', 
      dataIndex: 'disposalType', 
      width: 150, 
      render: () => '综合结论' 
    },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      width: 200,
      render: (val: string) => (val ? val.replace('T', ' ').substring(0, 19) : '-')
    },
    {
      title: '处置状态',
      dataIndex: 'warndealflag',
      width: 120,
      render: (val: number) => (
        <span style={{ color: val === 1 ? '#00b42a' : '#ff7d00' }}>
          {val === 1 ? '已处置' : '未处置'}
        </span>
      )
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: any) => (
        <Button 
          type="text" 
          size="small" 
          style={{ padding: 4 }} 
          onClick={() => handleOpenDrawer(record)}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#7c5cfc',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            📋
          </span>
        </Button>
      )
    }
  ]
  
  // 抽屉里的处置情况表格列
  const drawerColumns = [
    { 
      title: '处置状态', 
      dataIndex: 'warndealflag', 
      render: (val: number) => (
        <span style={{ color: val === 1 ? '#00b42a' : '#ff7d00' }}>
          {val === 1 ? '已处置' : '未处置'}
        </span>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'gmtCreate', 
      render: (val: string) => val ? val.replace('T', ' ').substring(0, 19) : '-'
    },
    {
      title: '操作',
      width: 100,
      render: (_: any, record: any) => {
        // 已处置的记录不显示操作按钮
        if (record.warndealflag === 1) {
          return '-'
        }
        return (
          <Button 
            type="text" 
            size="small" 
            style={{ padding: 4 }}
            onClick={() => handleOpenDisposalModal(record)}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: '#7c5cfc',
                color: '#fff'
              }}
            >
              📋
            </span>
          </Button>
        )
      }
    }
  ]

  // 处置内容表格列（无操作列）
  const disposalContentColumns = [
    { title: '序号', dataIndex: 'id', width: 60 },
    { title: '分段记录码', dataIndex: 'fdjlm', width: 100 },
    { title: '处置时间', dataIndex: 'czTime', width: 160 },
    { title: '处置人姓名', dataIndex: 'czrName', width: 100 },
    { title: '处置人身份证', dataIndex: 'czrIdCard', width: 180 },
    { title: '处置人电话', dataIndex: 'czrPhone', width: 130 },
    { title: '处置内容', dataIndex: 'czContent', width: 120 },
    { 
      title: '附件', 
      dataIndex: 'attachment', 
      width: 80,
      render: (val: boolean) => val ? (
        <Link icon={<IconDownload />} style={{ color: '#7c5cfc' }} />
      ) : '-'
    }
  ]



  // 分段信息表格列
  const segmentColumns = [
    { title: '序号', dataIndex: 'index', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: '里程冠号', dataIndex: 'dkname', width: 100 },
    { title: '开始里程', dataIndex: 'sdkilo', width: 120, render: (v: number, r: any) => `${r.dkname || ''}${v || 0}+${r.sdkiloEnd || 0}` },
    { title: '结束里程', dataIndex: 'edkilo', width: 120, render: (v: number, r: any) => `${r.dkname || ''}${v || 0}+${r.edkiloEnd || 0}` },
    { title: '生产时间', dataIndex: 'ybjgTime', width: 150 },
    { title: '风险类别', dataIndex: 'risklevel', width: 100 },
    { title: '地质级别', dataIndex: 'dzjb', width: 80 },
    { title: '围岩等级', dataIndex: 'wylevel', width: 80 },
    { title: '预报结论', dataIndex: 'jlresult', width: 150, ellipsis: true },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: any, index: number) => (
        <Space>
          <Button type="text" size="mini" onClick={() => {
            setEditingSegment({ ...record, index })
            setSegmentModalVisible(true)
          }}>编辑</Button>
          <Button type="text" size="mini" status="danger" onClick={() => handleDeleteSegment(index)}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f6f7' }}>
      {/* 顶部紫色导航条 */}
      <div
        style={{
          height: 48,
          background: '#7c5cfc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          color: '#fff'
        }}
      >
        <span style={{ fontSize: 14 }}>
          站前1标/罗家庄隧道D2K679+850-D2K685+110/罗家庄隧道出口斜井小里程方向
        </span>
        <Button
          type="text"
          icon={<IconLeft style={{ color: '#fff' }} />}
          style={{ color: '#fff' }}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
      </div>

      <div style={{ padding: '16px 24px' }}>
        {/* 筛选条件 */}
        <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
          <Space size="large" wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#86909c' }}>处置类型：</span>
              <Select
                placeholder="请选处置类型"
                style={{ width: 160 }}
                allowClear
                value={disposalType}
                onChange={setDisposalType}
              >
                {disposalTypeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#86909c' }}>处置状态：</span>
              <Select
                placeholder="请选择处置状态"
                style={{ width: 160 }}
                allowClear
                value={disposalStatus}
                onChange={setDisposalStatus}
              >
                {disposalStatusOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#86909c' }}>预报时间：</span>
              <RangePicker
                style={{ width: 280 }}
                placeholder={['开始日期', '结束日期']}
                onChange={(_, dateString) => setDateRange(dateString as unknown as string[])}
              />
            </div>

            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Card>

        {/* 新增按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<IconPlus />}
            style={{ backgroundColor: '#7c5cfc', borderColor: '#7c5cfc' }}
            onClick={handleAdd}
          >
            新增
          </Button>
        </div>

        {/* 数据表格 */}
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            loading={loading}
            columns={columns}
            data={data}
            pagination={{
              total: total,
              current: currentPage,
              pageSize: pageSize,
              showTotal: true,
              showJumper: true,
              sizeCanChange: true,
              pageSizeChangeResetCurrent: true,
              onChange: handlePageChange
            }}
            noDataElement={<Empty description="暂无数据" />}
            rowKey="zhjlPk"
            stripe
          />
        </Card>
      </div>

      {/* 新增综合结论弹窗 */}
      <Modal
        title="新增综合结论"
        visible={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalVisible(false)}
        style={{ width: 900 }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="预报方法" field="method" rules={[{ required: true, message: '请选择预报方法' }]}>
            <Select placeholder="请选择预报方法">
              <Select.Option value="1">地震波反射法</Select.Option>
              <Select.Option value="2">瞬变电磁法</Select.Option>
              <Select.Option value="3">地质雷达法</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="安全" field="safety" rules={[{ required: true, message: '请选择' }]}>
            <Select placeholder="请选择">
              <Select.Option value="1">安全</Select.Option>
              <Select.Option value="0">不安全</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="综合预报结论" field="conclusion">
            <TextArea placeholder="文字描述" maxLength={1024} showWordLimit rows={4} />
          </Form.Item>

          <Form.Item label="附件">
            <Upload action="/" listType="picture-card" limit={1}>
              <div style={{ textAlign: 'center' }}>
                <IconPlus />
                <div>上传</div>
              </div>
            </Upload>
          </Form.Item>

          {/* 分段信息 */}
          <div style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12,
              padding: '8px 12px',
              backgroundColor: '#f7f8fa',
              borderRadius: 4
            }}>
              <span style={{ fontWeight: 500 }}>分段信息</span>
              <Button 
                type="primary" 
                size="small" 
                icon={<IconPlus />}
                style={{ backgroundColor: '#7c5cfc', borderColor: '#7c5cfc' }}
                onClick={handleAddSegment}
              >
                新增
              </Button>
            </div>
            
            <Table
              columns={segmentColumns}
              data={segments}
              rowKey="index"
              pagination={false}
              size="small"
              noDataElement={<Empty description="暂无分段信息" />}
              scroll={{ x: 1000 }}
            />
          </div>
        </Form>
      </Modal>

      {/* 分段信息弹窗 */}
      <SegmentModal
        visible={segmentModalVisible}
        onCancel={() => setSegmentModalVisible(false)}
        onOk={handleSegmentSubmit}
        editingData={editingSegment}
      />

      {/* 综合结论处置弹窗 */}
      <Modal
        title="综合结论处置"
        visible={disposalModalVisible}
        onCancel={() => setDisposalModalVisible(false)}
        footer={
          <Button onClick={() => setDisposalModalVisible(false)}>关闭</Button>
        }
        style={{ width: 900 }}
      >
        {/* 顶部信息 - 使用表格布局对齐 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '200px 1fr', 
          gap: '12px 40px',
          marginBottom: 16
        }}>
          <div>
            <span style={{ color: '#86909c' }}>已阅人员：</span>
            <span style={{ color: '#1d2129' }}>淮永清</span>
          </div>
          <div>
            <span style={{ color: '#86909c' }}>处置班组：</span>
            <span style={{ color: '#1d2129' }}>与原设计一样</span>
          </div>
          <div>
            <span style={{ color: '#f53f3f' }}>* </span>
            <span style={{ color: '#86909c' }}>处置状态：</span>
            <span style={{ color: '#1d2129' }}>已处置</span>
          </div>
        </div>

        {/* 处置内容区域标题 */}
        <div style={{ 
          backgroundColor: '#f7f8fa', 
          padding: '10px 16px',
          marginBottom: 16,
          borderLeft: '3px solid #7c5cfc'
        }}>
          <span style={{ fontWeight: 500, color: '#1d2129' }}>处置内容</span>
        </div>

        {/* 新增按钮 - 新增处置内容 */}
        <div style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<IconPlus />}
            size="small"
            style={{ backgroundColor: '#7c5cfc', borderColor: '#7c5cfc' }}
            onClick={handleAddContent}
          >
            新增
          </Button>
        </div>

        {/* 处置内容表格 */}
        <Table
          columns={disposalContentColumns}
          data={disposalList}
          rowKey="id"
          pagination={{ 
            pageSize: 5, 
            simple: true,
            showTotal: true
          }}
          size="small"
          scroll={{ x: 1100 }}
        />
      </Modal>

      {/* 新增处置弹窗（综合结论处置） */}
      <Modal
        title="综合结论处置"
        visible={addDisposalVisible}
        onOk={handleDisposalSubmit}
        onCancel={() => setAddDisposalVisible(false)}
        style={{ width: 600 }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={disposalForm} layout="vertical">
          {/* 第一行：已阅人员、处置班组 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item 
              label="已阅人员"
              field="readPerson" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请选择已阅人员' }]}
            >
              <Select placeholder="请选择已阅人员...">
                <Select.Option value="淮永清">淮永清</Select.Option>
                <Select.Option value="张三">张三</Select.Option>
                <Select.Option value="李四">李四</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item 
              label="处置班组"
              field="dealGroup" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请选择处置班组' }]}
            >
              <Select placeholder="请选择">
                <Select.Option value="与原设计一样">与原设计一样</Select.Option>
                <Select.Option value="班组1">班组1</Select.Option>
                <Select.Option value="班组2">班组2</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* 第二行：处置状态 */}
          <Form.Item 
            label="处置状态"
            field="dealStatus" 
            rules={[{ required: true, message: '请选择处置状态' }]}
          >
            <Select placeholder="请选择">
              <Select.Option value={1}>已处置</Select.Option>
              <Select.Option value={0}>未处置</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 底部抽屉 - 处置情况 */}
      <Drawer
        title={null}
        visible={drawerVisible}
        placement="bottom"
        height={300}
        footer={null}
        onCancel={() => setDrawerVisible(false)}
        headerStyle={{ display: 'none' }}
        bodyStyle={{ padding: 0 }}
        getPopupContainer={() => document.body}
      >
        <div style={{ padding: '16px 24px' }}>
          <div style={{ 
            fontSize: 14, 
            color: '#1d2129', 
            marginBottom: 16,
            fontWeight: 500
          }}>
            处置情况
          </div>
          
          {/* 新增处置按钮 - 仅未处置状态显示 */}
          {selectedRecord?.warndealflag !== 1 && (
            <div style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                icon={<IconPlus />}
                size="small"
                style={{ backgroundColor: '#7c5cfc', borderColor: '#7c5cfc' }}
                onClick={handleAddDisposal}
              >
                新增处置
              </Button>
            </div>
          )}
          
          <Table
            columns={drawerColumns}
            data={drawerDisposalList}
            rowKey="id"
            pagination={false}
            size="small"
            noDataElement={<Empty description="暂无数据" />}
          />
        </div>
      </Drawer>

      {/* 新增处置内容弹窗（已处置状态用） */}
      <Modal
        title="新增处置内容"
        visible={addContentVisible}
        onOk={handleContentSubmit}
        onCancel={() => setAddContentVisible(false)}
        style={{ width: 700 }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={contentForm} layout="vertical">
          {/* 第一行：分段记录码、处置时间 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item 
              label="分段记录码"
              field="fdjlm" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请选择分段记录码' }]}
            >
              <Select placeholder="请选择">
                {selectedRecord && (
                  <Select.Option value={selectedRecord.zhjlPk}>{selectedRecord.zhjlPk}</Select.Option>
                )}
              </Select>
            </Form.Item>
            <Form.Item 
              label="处置时间"
              field="czTime" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请选择处置时间' }]}
            >
              <DatePicker showTime placeholder="请选择日期" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* 第二行：处置人姓名、处置人身份、处置人电话 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item 
              label="处置人姓名"
              field="czrName" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入处置人姓名' }]}
            >
              <Input placeholder="" />
            </Form.Item>
            <Form.Item 
              label="处置人身份"
              field="czrIdCard" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入处置人身份' }]}
            >
              <Input placeholder="" />
            </Form.Item>
            <Form.Item 
              label="处置人电话"
              field="czrPhone" 
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入处置人电话' }]}
            >
              <Input placeholder="" />
            </Form.Item>
          </div>

          {/* 第三行：处置内容、附件 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item 
              label="处置内容"
              field="czContent" 
              style={{ flex: 2 }}
              rules={[{ required: true, message: '请输入处置内容' }]}
            >
              <TextArea placeholder="" maxLength={100} showWordLimit rows={4} />
            </Form.Item>
            <Form.Item 
              label="附件" 
              field="attachment"
              style={{ flex: 1 }}
            >
              <Upload 
                action="/" 
                listType="picture-card" 
                limit={1}
                accept="image/*"
              >
                <div style={{ textAlign: 'center' }}>
                  <IconPlus />
                  <div>上传</div>
                </div>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ForecastComprehensivePage
