import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, DatePicker, Form, Grid, Input, InputNumber, Message, Modal, Select, Space, Table } from '@arco-design/web-react'
import { IconEdit, IconDelete, IconLeft } from '@arco-design/web-react/icon'
import { useNavigate, useLocation } from 'react-router-dom'
import realAPI, { DesignRockGrade } from '../services/realAPI'
import OperationButtons from '../components/OperationButtons'

// 页面使用的记录类型（转换后的格式）
type RockGradeRecord = {
  id: string
  createdAt: string
  siteId: string
  siteName?: string
  mileagePrefix: string
  startMileage: string
  length: number
  rockGrade: string
  modifyReason?: string
  author?: string
  bdPk?: number  // 标段主键（编辑时需要）
  sdPk?: number  // 隧道主键（编辑时需要）
  dkilo?: number // 原始里程值
  edkilo?: number // 原始结束里程值
}

const { Row, Col } = Grid
const { RangePicker } = DatePicker

function ForecastRockPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 从URL参数或路由状态中获取工点ID
  const initialSiteId = (location.state as any)?.workPointId || new URLSearchParams(location.search).get('siteId') || '';
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RockGradeRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [siteId, setSiteId] = useState(initialSiteId)
  const [form] = Form.useForm()
  const [addVisible, setAddVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RockGradeRecord | null>(null)
  const [addForm] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const rockGradeOptions = [
    { label: 'I级', value: 'I' },
    { label: 'II级', value: 'II' },
    { label: 'III级', value: 'III' },
    { label: 'IV级', value: 'IV' },
    { label: 'V级', value: 'V' },
    { label: 'VI级', value: 'VI' },
  ]

  const searchConditionOptions = [
    { label: '围岩等级', value: 'rockGrade' },
    { label: '工点ID', value: 'siteId' },
    { label: '里程', value: 'mileage' },
  ]

  // 转换API数据为页面数据格式
  const convertToRecord = (item: any): RockGradeRecord => {
    const rockGradeMap: { [key: number]: string } = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI'
    }
    
    // dkilo是总米数，如180973表示180公里973米
    // 需要转换为 公里+米 格式显示
    const totalMeters = item.dkilo || 0
    const kilometers = Math.floor(totalMeters / 1000)  // 公里数
    const meters = totalMeters % 1000                   // 米数
    
    return {
      id: String(item.sjwydjPk),
      createdAt: item.gmtCreate,
      siteId: item.siteId || String(item.sitePk) || '',
      mileagePrefix: item.dkname,
      startMileage: `${item.dkname}${kilometers}+${meters}`,  // 如 D1K180+973
      length: item.sjwydjLength,
      rockGrade: rockGradeMap[item.wydj] || 'IV',
      modifyReason: item.revise,
      author: item.username,
      bdPk: item.bdPk,    // 保存标段主键
      sdPk: item.sdPk,    // 保存隧道主键
      dkilo: item.dkilo,  // 保存原始里程值（米数）
      edkilo: item.edkilo, // 保存原始结束里程值
    }
  }

  const fetchList = async () => {
    const values = form.getFieldsValue()
    
    // 将围岩等级字符串转换为数字
    const rockGradeToNumber: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6
    }
    
    const params = {
      siteId: siteId || '',
      pageNum: page,
      pageSize,
      wydj: values.rockGrade ? rockGradeToNumber[values.rockGrade] : undefined
    }

    setLoading(true)
    try {
      const res = await realAPI.getDesignRockGrades(params)
      const convertedData = (res.records || []).map(convertToRecord)
      setData(convertedData)
      setTotal(res.total || 0)
    } catch (error) {
      console.error('获取设计围岩等级数据失败:', error)
      Message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const handleEdit = (record: RockGradeRecord) => {
    setEditingRecord(record)
    const startMileageParts = record.startMileage.match(/(\d+)\+(\d+)/)
    const startMileageMain = startMileageParts ? parseInt(startMileageParts[1]) : 0
    const startMileageSub = startMileageParts ? parseInt(startMileageParts[2]) : 0
    
    addForm.setFieldsValue({
      rockGrade: record.rockGrade,
      mileagePrefix: record.mileagePrefix || 'DK',
      startMileageMain,
      startMileageSub,
      length: record.length,
      author: record.author || '冯文波',
      modifyReason: record.modifyReason,
    })
    setEditVisible(true)
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await realAPI.deleteDesignRockGrade(id)
          Message.success('删除成功')
          fetchList()
        } catch (error) {
          console.error('删除失败:', error)
          Message.error('删除失败')
        }
      },
    })
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
          await Promise.all(selectedRowKeys.map(id => realAPI.deleteDesignRockGrade(id)))
          Message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchList()
        } catch (error) {
          console.error('批量删除失败:', error)
          Message.error('批量删除失败')
        }
      },
    })
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddVisible(true)
  }

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validate()
      
      // 将围岩等级字符串转换为数字
      const rockGradeToNumber: { [key: string]: number } = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6
      }
      
      // 计算里程数字（米数）：公里*1000 + 米
      // 如 D1K180+973 -> 180*1000 + 973 = 180973 米
      // 表单输入：startMileageMain=180（公里），startMileageSub=973.01（米，可带小数）
      const startMileageMain = parseFloat(values.startMileageMain) || 0
      const startMileageSub = parseFloat(values.startMileageSub) || 0
      const length = parseFloat(values.length) || 0
      
      // dkilo = 公里*1000 + 米，保留2位小数
      const dkilo = parseFloat((startMileageMain * 1000 + startMileageSub).toFixed(2))
      // endMileage = dkilo + length，保留2位小数
      const endMileage = parseFloat((dkilo + length).toFixed(2))
      
      console.log('🔍 [设计围岩] 里程计算:', {
        输入公里: startMileageMain,
        输入米: startMileageSub,
        计算dkilo: dkilo,
        预报长度: length,
        计算endMileage: endMileage
      })
      
      // 编辑时优先使用表单值，如果为空则使用原始记录的值
      const dkname = values.mileagePrefix || (editingRecord?.mileagePrefix) || 'DK'
      
      console.log('🔍 [设计围岩] 表单值:', values)
      console.log('🔍 [设计围岩] 编辑记录:', editingRecord)
      
      // 按照API要求的格式构造数据
      // 编辑时直接传 SjwydjUpdateDTO，不需要包装在 sjwydj 里
      const submitData = editingRecord ? {
        // 更新时的数据格式
        sjwydjPk: Number(editingRecord.id),  // 设计围岩等级主键（必填）
        bdPk: editingRecord.bdPk || 1,  // 标段主键（必填）
        sdPk: editingRecord.sdPk || 1,  // 隧道主键（必填）
        dkname: dkname,
        dkilo: dkilo,
        endMileage: endMileage,  // dkilo + length，保留2位小数
        sjwydjLength: length,
        wydj: rockGradeToNumber[values.rockGrade],
        revise: values.modifyReason || editingRecord?.modifyReason || '无',
      } : {
        // 新增时的数据格式（包装在 sjwydj 里）
        sjwydj: {
          siteId: siteId || '1',
          dkname: dkname,
          dkilo: dkilo,
          endMileage: endMileage,  // dkilo + length，保留2位小数
          sjwydjLength: length,
          wydj: rockGradeToNumber[values.rockGrade],
          revise: values.modifyReason || '无',
          username: values.author || localStorage.getItem('login') || 'admin',
          bdPk: 1,
          sdPk: 1,
        }
      }

      console.log('📤 [设计围岩] 提交数据:', submitData)

      if (editingRecord) {
        await realAPI.updateDesignRockGrade(editingRecord.id, submitData as any)
        Message.success('更新成功')
      } else {
        await realAPI.createDesignRockGrade(submitData as any)
        Message.success('创建成功')
      }

      setAddVisible(false)
      setEditVisible(false)
      setEditingRecord(null)
      addForm.resetFields()
      fetchList()
    } catch (error) {
      console.error('提交失败:', error)
      Message.error('提交失败')
    }
  }

  const columns = [
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (val: string) => val ? val.replace('T', ' ').substring(0, 19) : '-',
    },
    {
      title: '围岩等级',
      dataIndex: 'rockGrade',
      width: 100,
      render: (rockGrade: string) => (
        <span style={{ 
          color: ['I', 'II'].includes(rockGrade) ? '#00b42a' : 
                 ['III', 'IV'].includes(rockGrade) ? '#ff7d00' : '#f53f3f' 
        }}>
          {rockGrade}
        </span>
      ),
    },
    {
      title: '开始 - 结束里程',
      dataIndex: 'mileageRange',
      width: 280,
      render: (_: any, record: RockGradeRecord) => {
        const startKilo = record.startMileage || '';
        // 计算结束里程
        const dkname = record.mileagePrefix || 'D2K';
        const startMatch = startKilo.match(/(\d+)\+(\d+\.?\d*)/);
        if (startMatch && record.length) {
          const startMain = parseInt(startMatch[1]);
          const startSub = parseFloat(startMatch[2]);
          const endSub = startSub + record.length;
          const endMain = startMain + Math.floor(endSub / 1000);
          const endSubFinal = endSub % 1000;
          return `${dkname}${startMain}+${startSub.toFixed(2)} - ${dkname}${endMain}+${endSubFinal.toFixed(2)}`;
        }
        return startKilo;
      },
    },
    {
      title: '预报长度',
      dataIndex: 'length',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'operations',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: RockGradeRecord) => (
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
            onClick={() => handleDelete(record.id)}
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

  const handleDownloadTemplate = () => {
    // 下载空白模板文件
    const templateUrl = '/templates/设计围岩导入模板.xlsx'
    
    // 尝试下载模板
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = '设计围岩导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    Message.info('正在下载模板文件...')
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      Message.loading('正在导入...')
      // TODO: 调用导入接口（需要确认后端接口）
      Message.success(`导入成功: ${file.name}`)
      fetchList()
    } catch (error) {
      console.error('导入失败:', error)
      Message.error('导入失败')
    }
    
    // 清空文件选择
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue()
      
      // 获取日期范围
      let startdate = ''
      let enddate = ''
      if (values.createdAt && Array.isArray(values.createdAt)) {
        startdate = values.createdAt[0]?.format('YYYY-MM-DD') || ''
        enddate = values.createdAt[1]?.format('YYYY-MM-DD') || ''
      }
      
      if (!startdate || !enddate) {
        Message.warning('请先选择创建时间范围')
        return
      }

      // 调用导出接口（与下载模板相同）
      const url = `/api/v1/platform/download/sjwy?startdate=${startdate}&enddate=${enddate}&siteID=${siteId || 1}`
      window.open(url, '_blank')
      Message.success('开始导出...')
    } catch (error) {
      console.error('导出失败:', error)
      Message.error('导出失败')
    }
  }

  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      onOk: async () => {
        try {
          // 批量删除所有记录
          if (data.length === 0) {
            Message.warning('没有数据可清空')
            return
          }
          
          await Promise.all(data.map(item => realAPI.deleteDesignRockGrade(item.id)))
          Message.success('清空成功')
          fetchList()
        } catch (error) {
          console.error('清空失败:', error)
          Message.error('清空失败')
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
        <span>设计预报 / 人员信息 / 地质点/DK713+920/DK713+920/设计围岩等级</span>
        <Button 
          type="text" 
          icon={<IconLeft />} 
          style={{ color: '#fff' }}
          onClick={() => navigate('/geo-forecast')}
        >
          返回
        </Button>
      </div>

      {/* 隐藏的文件上传input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 筛选条件 */}
      <Card style={{ marginBottom: '16px' }}>
        <Form form={form} autoComplete="off" layout="inline">
          <Form.Item label="搜索条件" field="searchCondition" style={{ marginRight: 24 }}>
            <Select
              placeholder="请选择搜索条件"
              options={searchConditionOptions}
              allowClear
              style={{ width: 180 }}
            />
          </Form.Item>
          <Form.Item label="创建时间" field="createdAt" style={{ marginRight: 24 }}>
            <RangePicker
              format="YYYY-MM-DD"
              style={{ width: 280 }}
            />
          </Form.Item>
          <Form.Item label="地表日期" field="surfaceDate" style={{ marginRight: 24 }}>
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: 180 }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<span>🔍</span>} onClick={fetchList}>
                查询
              </Button>
              <Button onClick={() => {
                form.resetFields()
                fetchList()
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮区 */}
      <OperationButtons
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onAdd={handleAdd}
        onClear={handleClearAll}
        selectedCount={selectedRowKeys.length}
        clearDisabled={selectedRowKeys.length === 0}
      />

      {/* 数据表格 */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            共 {total} 条记录
          </div>
        </div>

        <Table
          loading={loading}
          columns={columns}
          data={data}
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selectedRowKeys) => {
              setSelectedRowKeys(selectedRowKeys as string[])
            },
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true,
            onChange: (pageNumber, pageSize) => {
              setPage(pageNumber)
              setPageSize(pageSize)
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '修改设计围岩' : '新增设计围岩'}
        visible={addVisible || editVisible}
        onOk={handleAddSubmit}
        onCancel={() => {
          setAddVisible(false)
          setEditVisible(false)
          setEditingRecord(null)
          addForm.resetFields()
        }}
        style={{ width: 800 }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          {/* 围岩等级 */}
          <Form.Item
            label="围岩等级"
            field="rockGrade"
            rules={[{ required: true, message: '请选择围岩等级' }]}
          >
            <Select
              placeholder="请选择围岩等级"
              options={rockGradeOptions}
            />
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
                    <InputNumber placeholder="713" min={0} step={1} precision={0} style={{ width: '140px' }} />
                  </Form.Item>
                  <span style={{ margin: '0 8px' }}>+</span>
                  <Form.Item 
                    field="startMileageSub" 
                    noStyle
                    rules={[{ required: true, message: '请输入' }]}
                  >
                    <InputNumber placeholder="375" min={0} max={999} step={1} precision={0} style={{ width: '140px' }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          {/* 预报长度 和 填写人 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="预报长度(m)" field="length" rules={[{ required: true, message: '请输入预报长度' }]}>
                <InputNumber placeholder="25.00" min={0.01} max={99999999.99} style={{ width: '100%' }} step={0.01} precision={2} />
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

export default ForecastRockPage


