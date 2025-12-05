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
  Form,
  Input,
  InputNumber,
  Tabs,
  Radio,
  Grid
} from '@arco-design/web-react'
import { 
  IconLeft, 
  IconEye, 
  IconEdit, 
  IconCopy, 
  IconUpload, 
  IconDelete,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconImport,
  IconPlus
} from '@arco-design/web-react/icon'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import apiAdapter from '../services/apiAdapter'
import OperationButtons from '../components/OperationButtons'

const { TextArea } = Input
const TabPane = Tabs.TabPane
const RadioGroup = Radio.Group

// 预报方法映射
const METHOD_MAP: Record<number, string> = {
  1: '地震波反射',
  2: '水平声波剖面',
  3: '陆地声呐',
  4: '电磁波反射',
  5: '高分辨直流电',
  6: '瞬变电磁',
  7: '掌子面素描',
  8: '洞身素描',
  12: '地表补充',
  13: '超前水平钻',
  14: '加深炮孔',
}

// 里程格式化函数
const formatMileage = (val: number | string) => {
  if (!val) return '-'
  const numVal = Number(val)
  if (isNaN(numVal)) return val
  // 假设里程数据是整数（米），或者浮点数
  // 格式化为 DKxxx+xxx.xx
  // 这里假设 val 是总米数，需要根据实际业务调整
  // 简单实现：直接显示 DK + 数值
  return `DK${val}`
}

// 五个方法选项卡类型
type MethodTab = 'geophysical' | 'palmSketch' | 'tunnelSketch' | 'drilling' | 'surface'

function GeologyForecastPage() {
  const navigate = useNavigate()
  const { workPointId } = useParams<{ workPointId?: string }>()
  const [searchParams] = useSearchParams()
  
  // 从URL获取siteId，优先级：路由参数 > 查询参数
  // 注意：不再提供默认值，强制要求从URL获取正确的工点ID
  const siteId = workPointId || searchParams.get('siteId') || searchParams.get('workPointId') || ''
  
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<'all' | 'editing' | 'uploaded'>('all')
  const [filterMethod, setFilterMethod] = useState<string | undefined>(undefined)
  const [filterDate, setFilterDate] = useState<string[] | undefined>(undefined)
  
  console.log('🔍 [GeologyForecastPage] 当前工点ID:', siteId, {
    fromRoute: workPointId,
    fromQuery: searchParams.get('siteId') || searchParams.get('workPointId'),
    isEmpty: !siteId
  })
  
  // 如果没有siteId，显示提示
  if (!siteId) {
    console.warn('⚠️ [GeologyForecastPage] 缺少工点ID参数，请通过URL传递 siteId')
  }
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // 表格选择状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  
  // 新增弹窗状态
  const [addVisible, setAddVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 编辑弹窗状态 - 已移除，改用新页面
  // const [editVisible, setEditVisible] = useState(false)
  // const [editingRecord, setEditingRecord] = useState<any>(null)
  // const [editForm] = Form.useForm()

  // 五个方法选项卡状态
  const [activeTab, setActiveTab] = useState<MethodTab>('geophysical')
  
  // 各方法的数据状态
  const [geophysicalData, setGeophysicalData] = useState<any[]>([])
  const [palmSketchData, setPalmSketchData] = useState<any[]>([])
  const [tunnelSketchData, setTunnelSketchData] = useState<any[]>([])
  const [drillingData, setDrillingData] = useState<any[]>([])
  const [surfaceData, setSurfaceData] = useState<any>(null)

  // 通用列定义生成函数
  const getColumns = (type: MethodTab) => {
    const commonColumns = [
      {
        title: '预报方法',
        dataIndex: 'method',
        width: 150,
        render: (val: number) => METHOD_MAP[val] || `未知方法(${val})`
      },
      {
        title: '预报时间',
        dataIndex: 'monitordate',
        width: 180,
        render: (val: string) => val ? val.replace('T', ' ') : '-'
      },
      {
        title: '掌子面里程',
        dataIndex: 'dkilo',
        width: 150,
        render: (val: number) => formatMileage(val)
      }
    ]

    // 根据不同类型添加特定列
    let specificColumns: any[] = []
    
    if (type === 'geophysical') {
      specificColumns = [
        {
          title: '预报长度',
          dataIndex: 'ybLength',
          width: 100,
          render: (val: number) => val ? `${val}` : '-'
        }
      ]
    } else if (type === 'tunnelSketch') {
      specificColumns = [
         {
          title: '衬砌厚度',
          dataIndex: 'liningThickness',
          width: 100,
          render: (val: number) => val ? `${val}cm` : '-'
        }
      ]
    } else if (type === 'drilling') {
      specificColumns = [
        {
          title: '钻探深度',
          dataIndex: 'drillDepth',
          width: 100,
          render: (val: number) => val ? `${val}m` : '-'
        }
      ]
    }

    // 状态列（目前数据没返回状态，暂时写死或根据逻辑判断）
    const statusColumn = {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: () => (
        <span style={{ color: '#ff7d00' }}>编辑中</span>
      )
    }

    // 上传提示列
    const uploadTipColumn = {
      title: '上传提示',
      dataIndex: 'uploadTip',
      width: 120,
      render: () => '-'
    }

    // 操作列
    const operationColumn = {
      title: '操作',
      key: 'operation',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="primary"
            shape="circle"
            size="small"
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }} // 紫色
            icon={<IconEye />}
            onClick={() => handleViewDetail(record)}
          />
          <Button 
            type="primary"
            shape="circle" 
            size="small"
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="primary"
            shape="circle"
            size="small"
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
            icon={<IconCopy />}
            onClick={() => handleCopy(record)}
          />
          <Button 
            type="primary"
            shape="circle"
            size="small"
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
            icon={<IconUpload />}
            onClick={() => handleUpload(record)}
          />
          <Button 
            type="primary"
            shape="circle"
            size="small"
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    }

    return [...commonColumns, ...specificColumns, statusColumn, uploadTipColumn, operationColumn]
  }

  // 获取各方法的真实数据
  const fetchMethodData = async () => {
    setLoading(true)
    try {
      console.log('🔍 [GeologyForecastPage] 获取地质预报数据, siteId:', siteId)

      // 并行获取五种方法的数据
      const [geophysical, palmSketch, tunnelSketch, drilling, surface] = await Promise.all([
        apiAdapter.getGeophysicalList({ pageNum: 1, pageSize: 100, siteId }),
        apiAdapter.getPalmSketchList({ pageNum: 1, pageSize: 100, siteId }),
        apiAdapter.getTunnelSketchList({ pageNum: 1, pageSize: 100, siteId }),
        apiAdapter.getDrillingList({ pageNum: 1, pageSize: 100, siteId }),
        apiAdapter.getSurfaceSupplementList({ pageNum: 1, pageSize: 100, siteId })
      ])

      // 设置各方法的数据
      setGeophysicalData(geophysical.records || [])
      setPalmSketchData(palmSketch.records || [])
      setTunnelSketchData(tunnelSketch.records || [])
      setDrillingData(drilling.records || [])
      setSurfaceData(surface.records || [])

      console.log('✅ [GeologyForecastPage] 数据加载完成:', {
        geophysical: geophysical.records?.length || 0,
        palmSketch: palmSketch.records?.length || 0,
        tunnelSketch: tunnelSketch.records?.length || 0,
        drilling: drilling.records?.length || 0,
        surface: surface.records?.length || 0
      })

      Message.success('地质预报数据加载完成')
    } catch (error) {
      console.error('❌ [GeologyForecastPage] 获取地质预报数据失败:', error)
      Message.error('获取地质预报数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (siteId) {
      fetchMethodData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, page, pageSize])

  // 如果没有siteId，显示提示页面
  if (!siteId) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty
              description={
                <div>
                  <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                    缺少工点ID参数
                  </p>
                  <p style={{ color: '#86909c', marginBottom: '24px' }}>
                    请通过以下方式访问地质预报页面：
                  </p>
                  <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <p>• 带路由参数：<code>/forecast/geology/76833</code></p>
                    <p>• 带查询参数：<code>/forecast/geology?siteId=76833</code></p>
                  </div>
                </div>
              }
            />
            <Button type="primary" onClick={() => navigate('/geo-forecast')} style={{ marginTop: '24px' }}>
              返回首页选择工点
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 操作处理函数
  const handleViewDetail = async (record: any) => {
    try {
      let detail = null;
      const recordId = String(record.wtfPk || record.zzmsmPk || record.dssmPk || record.ztfPk || record.id);
      
      // 根据当前选项卡调用对应的详情API
      switch (activeTab) {
        case 'geophysical':
          detail = await apiAdapter.getGeophysicalDetail(recordId);
          break;
        case 'palmSketch':
          detail = await apiAdapter.getPalmSketchDetail(recordId);
          break;
        case 'tunnelSketch':
          detail = await apiAdapter.getTunnelSketchDetail(recordId);
          break;
        case 'drilling':
          detail = await apiAdapter.getDrillingDetail(recordId);
          break;
        default:
          Message.info('暂不支持该类型的详情查看');
          return;
      }
      
      if (detail) {
        Modal.info({
          title: '详情信息',
          content: (
            <div>
              <pre>{JSON.stringify(detail, null, 2)}</pre>
            </div>
          ),
          style: { width: 600 }
        });
      } else {
        Message.error('获取详情失败');
      }
    } catch (error) {
      console.error('查看详情失败:', error);
      Message.error('查看详情失败');
    }
  }

  const handleEdit = (record: any) => {
    console.log('🔍 [编辑] 完整记录数据:', record);
    console.log('🔍 [编辑] 记录的所有键:', Object.keys(record));
    console.log('🔍 [编辑] activeTab:', activeTab);
    
    // 根据不同类型使用不同的主键字段
    let recordId = '';
    if (activeTab === 'geophysical') {
      // 物探法：优先使用wtfPk，如果没有则使用ybPk
      recordId = String(record.wtfPk || record.ybPk || record.id);
      console.log('🔍 [编辑] 物探法 - wtfPk:', record.wtfPk, 'ybPk:', record.ybPk, '最终ID:', recordId);
    } else if (activeTab === 'palmSketch') {
      console.log('🔍 [编辑] 掌子面素描 - zzmsmPk:', record.zzmsmPk, 'ybPk:', record.ybPk, 'id:', record.id);
      recordId = String(record.zzmsmPk || record.ybPk || record.id);
      console.log('🔍 [编辑] 掌子面素描 - 最终ID:', recordId);
    } else if (activeTab === 'tunnelSketch') {
      recordId = String(record.dssmPk || record.ybPk || record.id);
    } else if (activeTab === 'drilling') {
      recordId = String(record.ztfPk || record.ybPk || record.id);
    } else {
      recordId = String(record.id);
    }
    
    const method = record.method;
    
    // 确保record中有siteId
    const recordWithSiteId = {
      ...record,
      siteId: record.siteId || siteId, // 如果record中没有siteId，使用当前页面的siteId
    };
    
    console.log('🔍 [编辑] 记录:', recordWithSiteId);
    console.log('🔍 [编辑] 使用ID:', recordId, 'activeTab:', activeTab, 'method:', method, 'siteId:', recordWithSiteId.siteId);
    
    // 导航到编辑页面
    // 路径: /forecast/geology/edit/:type/:id
    // Query: ?method=...&siteId=...
    navigate(`/forecast/geology/edit/${activeTab}/${recordId}?method=${method}&siteId=${recordWithSiteId.siteId}`, { 
      state: { record: recordWithSiteId } 
    });
  }

  const handleCopy = async (record: any) => {
    try {
      const recordId = String(record.wtfPk || record.zzmsmPk || record.dssmPk || record.ztfPk || record.id);
      let result = null;
      
      // 根据当前选项卡调用对应的复制API
      switch (activeTab) {
        case 'geophysical':
          result = await apiAdapter.copyGeophysical(recordId);
          break;
        case 'palmSketch':
        case 'tunnelSketch':
        case 'drilling':
          Message.info('该类型暂不支持复制功能');
          return;
        default:
          Message.info('暂不支持该类型的复制');
          return;
      }
      
      if (result?.success) {
        Message.success('复制成功');
        fetchMethodData(); // 刷新数据
      } else {
        Message.error('复制失败');
      }
    } catch (error) {
      console.error('复制失败:', error);
      Message.error('复制失败');
    }
  }

  const handleUpload = async (record: any) => {
    try {
      const recordId = String(record.wtfPk || record.zzmsmPk || record.dssmPk || record.ztfPk || record.id);
      let result = null;
      
      // 根据当前选项卡调用对应的上传API
      switch (activeTab) {
        case 'geophysical':
          result = await apiAdapter.uploadGeophysical(recordId);
          break;
        case 'palmSketch':
        case 'tunnelSketch':
        case 'drilling':
          Message.info('该类型暂不支持上传功能');
          return;
        default:
          Message.info('暂不支持该类型的上传');
          return;
      }
      
      if (result?.success) {
        Message.success('上传成功');
        fetchMethodData(); // 刷新数据
      } else {
        Message.error('上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      Message.error('上传失败');
    }
  }

  const handleDelete = (record: any) => {
    const recordId = String(record.wtfPk || record.zzmsmPk || record.dssmPk || record.ztfPk || record.id);
    const recordName = record.methodName || record.method || `ID: ${recordId}`;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条预报记录"${recordName}"吗？此操作不可恢复。`,
      okButtonProps: {
        status: 'danger'
      },
      onOk: async () => {
        try {
          let result = null;
          
          // 根据当前选项卡调用对应的删除API
          switch (activeTab) {
            case 'geophysical':
              result = await apiAdapter.deleteGeophysical(recordId);
              break;
            case 'palmSketch':
              result = await apiAdapter.deletePalmSketch(recordId);
              break;
            case 'tunnelSketch':
              result = await apiAdapter.deleteTunnelSketch(recordId);
              break;
            case 'drilling':
              result = await apiAdapter.deleteDrilling(recordId);
              break;
            default:
              Message.error('暂不支持该类型的删除');
              return;
          }
          
          if (result?.success) {
            Message.success('删除成功');
            fetchMethodData(); // 刷新数据
          } else {
            Message.error('删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          Message.error('删除失败，请稍后重试');
        }
      }
    })
  }

  // 操作按钮处理函数
  const handleDownloadTemplate = async () => {
    try {
      Message.success('模板下载成功')
    } catch (error) {
      Message.error('下载模板失败，请稍后重试')
    }
  }

  const handleImport = () => {
    Message.info('导入功能开发中...')
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddVisible(true)
  }

  const getFilteredData = (data: any[]) => {
    if (!data) return [];
    let result = [...data];
    
    // Filter by Method (only if item has method field and filterMethod is selected)
    if (filterMethod) {
      result = result.filter(item => {
         // If activeTab is geophysical, we enforce it.
         if (activeTab === 'geophysical' && item.method !== undefined) {
            return String(item.method) === String(filterMethod);
         }
         return true;
      });
    }
    
    // Filter by Status (editing/uploaded)
    // submitFlag: 0=editing, 1=uploaded
    if (filterStatus && filterStatus !== 'all') {
       const targetFlag = filterStatus === 'editing' ? 0 : 1;
       result = result.filter(item => {
         if (item.submitFlag !== undefined) {
            return Number(item.submitFlag) === targetFlag;
         }
         return true;
       });
    }
    
    // Filter by Date
    if (filterDate && filterDate.length === 2) {
       const [start, end] = filterDate;
       result = result.filter(item => {
          if (!item.monitordate) return false;
          return item.monitordate >= start && item.monitordate <= end;
       });
    }
    
    return result;
  }

  const handleBatchDelete = () => {
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
          setSelectedRowKeys([])
          fetchMethodData()
        } catch (error) {
          Message.error('批量删除失败，请稍后重试')
        }
      }
    })
  }

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
        <span>站前3标 / 大庆山隧道 / DK/14+996 大庆山隧道明洞小里程</span>
        <Button 
          type="text" 
          icon={<IconLeft style={{ fontSize: 18 }} />} 
          style={{ color: '#1D2129' }}
          onClick={() => navigate('/geo-forecast')}
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 4px 4px' }}>
        {/* 五个方法选项卡 */}
        <Tabs 
          activeTab={activeTab} 
          onChange={(key) => setActiveTab(key as MethodTab)}
          type="line"
          style={{ marginBottom: '20px' }}
        >
          <TabPane key="geophysical" title={`物探法`} />
          <TabPane key="palmSketch" title={`掌子面素描`} />
          <TabPane key="tunnelSketch" title={`洞身素描`} />
          <TabPane key="drilling" title={`钻探法`} />
          <TabPane key="surface" title="地表补充" />
        </Tabs>

        {/* 筛选区域 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <Space size="large">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8, color: '#4E5969' }}>预报方法:</span>
              <Select 
                placeholder="请选择预报方法" 
                style={{ width: 200 }}
                allowClear
                value={filterMethod}
                onChange={setFilterMethod}
              >
                {Object.entries(METHOD_MAP).map(([key, value]) => (
                  <Select.Option key={key} value={key}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8, color: '#4E5969' }}>预报时间:</span>
              <DatePicker.RangePicker 
                style={{ width: 260 }}
                onChange={(val) => setFilterDate(val)} 
              />
            </div>

            <Space>
              <Button type="primary" icon={<IconSearch />} onClick={fetchMethodData}>
                查询
              </Button>
              <Button icon={<IconRefresh />} onClick={() => {
                setFilterMethod(undefined)
                setFilterDate(undefined)
                fetchMethodData()
              }}>
                重置
              </Button>
            </Space>
          </Space>

          {/* 编辑中/已上传 切换开关 */}
          <RadioGroup 
            type="button" 
            value={filterStatus} 
            onChange={setFilterStatus}
          >
            <Radio value="all">全部</Radio>
            <Radio value="editing">编辑中</Radio>
            <Radio value="uploaded">已上传</Radio>
          </RadioGroup>
        </div>

        {/* 操作按钮栏 */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button type="primary" icon={<IconDownload />} onClick={handleDownloadTemplate}>
              下载模板
            </Button>
            <Button type="primary" icon={<IconImport />} onClick={handleImport}>
              导入
            </Button>
            <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
              新增
            </Button>
            <Button status="danger" icon={<IconDelete />} onClick={handleBatchDelete}>
              批量删除
            </Button>
          </Space>
        </div>

        <Spin loading={loading} style={{ width: '100%' }}>
          {activeTab === 'geophysical' && (
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as string[]),
              }}
              columns={getColumns('geophysical')}
              data={getFilteredData(geophysicalData)}
              rowKey="wtfPk"
              pagination={{
                total: getFilteredData(geophysicalData).length,
                pageSize: pageSize,
                current: page,
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                }
              }}
              noDataElement={<Empty description="暂无物探法数据" />}
            />
          )}
          
          {activeTab === 'palmSketch' && (
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as string[]),
              }}
              columns={getColumns('palmSketch')}
              data={getFilteredData(palmSketchData)}
              rowKey="zzmsmPk"
              pagination={{
                total: getFilteredData(palmSketchData).length,
                pageSize: pageSize,
                current: page,
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                }
              }}
              noDataElement={<Empty description="暂无掌子面素描数据" />}
            />
          )}
          
          {activeTab === 'tunnelSketch' && (
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as string[]),
              }}
              columns={getColumns('tunnelSketch')}
              data={getFilteredData(tunnelSketchData)}
              rowKey="dssmPk"
              pagination={{
                total: getFilteredData(tunnelSketchData).length,
                pageSize: pageSize,
                current: page,
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                }
              }}
              noDataElement={<Empty description="暂无洞身素描数据" />}
            />
          )}
          
          {activeTab === 'drilling' && (
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as string[]),
              }}
              columns={getColumns('drilling')}
              data={getFilteredData(drillingData)}
              rowKey="ztfPk"
              pagination={{
                total: getFilteredData(drillingData).length,
                pageSize: pageSize,
                current: page,
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                }
              }}
              noDataElement={<Empty description="暂无钻探法数据" />}
            />
          )}
          
          {activeTab === 'surface' && (
            <div style={{ padding: '24px' }}>
              {surfaceData && surfaceData.length > 0 ? (
                <div>
                  <pre>{JSON.stringify(surfaceData, null, 2)}</pre>
                </div>
              ) : (
                <Empty description="暂无地表补充数据" />
              )}
            </div>
          )}
        </Spin>
      </div>

      <Modal
        title="新增地质预报"
        visible={addVisible}
        onOk={() => {
          Message.success('新增成功')
          setAddVisible(false)
          fetchMethodData()
        }}
        onCancel={() => setAddVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="里程" field="dkilo" rules={[{ required: true, message: '请输入里程' }]}>
            <Input placeholder="如 DK713+521.20" />
          </Form.Item>
          <Form.Item label="监测日期" field="monitordate">
            <Input placeholder="监测日期" />
          </Form.Item>
          <Form.Item label="备注" field="addition">
            <Input placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}

export default GeologyForecastPage
