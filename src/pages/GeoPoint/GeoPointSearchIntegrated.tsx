import React, { useState } from 'react';
import { Button, Card, Input, Table, Typography, Space, Menu, Grid, Spin, Message } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import DetectionChart from '../../components/DetectionChart';
import apiAdapter from '../../services/apiAdapter';
import './GeoPointSearch.css';

const { Title } = Typography;
const { Row, Col } = Grid;

// 工点数据类型
interface WorkPointItem {
  id: string;
  name: string;
  mileage: string;
  length: number;
}

// Tab视图类型
type ViewName = 'designForecast' | 'designRock' | 'designGeology';

// 表格数据行类型
interface TableDataRow {
  id: string;
  createdAt: string;
  method?: string; // Optional for designGeology
  startMileage: string;
  endMileage?: string; // Optional for designGeology
  length: number;
  minBurialDepth?: number;
  designTimes?: number;
  // New fields for Design Geology (按照第二张图片的列结构)
  geologyType?: string; // 地质类型
  geologyInfluence?: string; // 地应力影响度
  revise?: string; // 修改原因
  status?: string; // 状态代码
  statusText?: string; // 状态文本
  // New fields for Design Rock
  rockGrade?: string; // 围岩等级
  dkilo?: number; // 里程公里数
  wydj?: number; // 围岩等级数字
  username?: string; // 填写人账号
}

const GeoPointSearchIntegrated: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  
  // 工点列表（从GeoForecastPage或后端获取）
  const [workPoints] = useState<WorkPointItem[]>([
    { id: 'wp-1', name: '赵庄隧道DK487+449~+504明挖段', mileage: 'DK487+449-DK487+504', length: 55 },
    { id: 'wp-2', name: '赵庄隧道出口明洞', mileage: 'DK487+505-DK487+512', length: 7 },
    { id: 'wp-3', name: '赵庄隧道主洞段', mileage: 'DK487+520-DK487+545', length: 25 }
  ]);

  // 菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  
  // 每个工点的选中Tab
  const [selectedViewMap, setSelectedViewMap] = useState<Record<string, ViewName>>({});
  
  // 每个工点的探测数据
  const [detectionDataMap, setDetectionDataMap] = useState<Record<string, any>>({});
  
  // 每个工点的表格数据
  const [tableDataMap, setTableDataMap] = useState<Record<string, TableDataRow[]>>({});
  
  // 每个工点的表格总数
  const [tableTotalMap, setTableTotalMap] = useState<Record<string, number>>({});
  
  // 每个工点的分页信息
  const [tablePaginationMap, setTablePaginationMap] = useState<Record<string, { page: number; pageSize: number }>>({});
  
  // 加载状态
  const [loadingDetection, setLoadingDetection] = useState<Record<string, boolean>>({});
  const [loadingTable, setLoadingTable] = useState<Record<string, boolean>>({});

  // 获取工点的选中Tab
  const getSelectedView = (workPointId: string): ViewName => {
    return selectedViewMap[workPointId] || 'designForecast';
  };

  // 设置工点的选中Tab
  const setSelectedViewFor = (workPointId: string, view: ViewName) => {
    setSelectedViewMap(prev => ({ ...prev, [workPointId]: view }));
    // 切换Tab时加载对应的表格数据
    loadTableData(workPointId, view);
  };

  // 获取工点的分页信息
  const getTablePagination = (workPointId: string) => {
    return tablePaginationMap[workPointId] || { page: 1, pageSize: 10 };
  };

  // 加载探测数据
  const loadDetectionData = async (workPointId: string) => {
    setLoadingDetection(prev => ({ ...prev, [workPointId]: true }));
    try {
      const data = await apiAdapter.getGeoPointDetectionData(workPointId);
      setDetectionDataMap(prev => ({ ...prev, [workPointId]: data }));
    } catch (error) {
      console.error('加载探测数据失败:', error);
      Message.error('加载探测数据失败');
    } finally {
      setLoadingDetection(prev => ({ ...prev, [workPointId]: false }));
    }
  };

  // 加载表格数据
  const loadTableData = async (workPointId: string, view: ViewName, page: number = 1, pageSize: number = 10) => {
    setLoadingTable(prev => ({ ...prev, [workPointId]: true }));
    try {
      let result: { list: any[]; total: number };
      
      // 根据Tab类型调用不同的API
      if (view === 'designForecast') {
        result = await apiAdapter.getWorkPointDesignInfo(workPointId, { page, pageSize });
      } else if (view === 'designRock') {
        result = await apiAdapter.getWorkPointDesignRock(workPointId, { page, pageSize });
      } else if (view === 'designGeology') {
        result = await apiAdapter.getWorkPointDesignGeology(workPointId, { 
          page, 
          pageSize, 
          statusFilter: 'all' // 工点搜索显示所有状态的数据
        });
      } else { // Fallback, e.g., for old 'geology' tab, now 'designForecast' for data consistency
        result = await apiAdapter.getWorkPointGeologyForecast(workPointId, { page, pageSize });
      }
      
      setTableDataMap(prev => ({ ...prev, [workPointId]: result.list }));
      setTableTotalMap(prev => ({ ...prev, [workPointId]: result.total }));
      setTablePaginationMap(prev => ({ ...prev, [workPointId]: { page, pageSize } }));
    } catch (error) {
      console.error('加载表格数据失败:', error);
      Message.error('加载表格数据失败');
      setTableDataMap(prev => ({ ...prev, [workPointId]: [] }));
      setTableTotalMap(prev => ({ ...prev, [workPointId]: 0 }));
    } finally {
      setLoadingTable(prev => ({ ...prev, [workPointId]: false }));
    }
  };

  // 当菜单展开时加载数据
  const handleMenuOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    
    // 找到新展开的工点
    const newOpenKeys = keys.filter(key => !openKeys.includes(key));
    newOpenKeys.forEach(workPointId => {
      // 加载探测数据
      if (!detectionDataMap[workPointId]) {
        loadDetectionData(workPointId);
      }
      // 加载表格数据
      if (!tableDataMap[workPointId]) {
        loadTableData(workPointId, getSelectedView(workPointId));
      }
    });
  };

  // 搜索处理
  const handleSearch = () => {
    console.log('搜索:', searchValue);
    // TODO: 实现搜索功能
  };

  // 表格列定义
  const getTableColumns = (workPointId: string, view: ViewName) => {
    // 使用 any[] 避免与 Table 内部列类型约束冲突，专注在渲染结构
    const baseColumns: any[] = [];

    if (view === 'designForecast') { // 设计预报Tab的列 (Original '设计信息' with new name)
      baseColumns.push(
        { title: '创建时间', dataIndex: 'createdAt', width: 160 },
        { title: '预报方法', dataIndex: 'method', width: 120 },
        {
          title: '开始 - 结束里程',
          render: (_: any, record: TableDataRow) => `${record.startMileage} - ${record.endMileage}`,
          width: 220,
        },
        { title: '预报长度(m)', dataIndex: 'length', width: 120 },
        { title: '最小埋深(m)', dataIndex: 'minBurialDepth', width: 120 },
        { title: '预报设计次数', dataIndex: 'designTimes', width: 140 },
        {
          title: '操作',
          render: () => (
            <Space>
              <Button type="text" icon={<></>}>
                <img src="/path/to/edit-icon.svg" alt="编辑" style={{ width: 20, height: 20 }} />
              </Button>
            </Space>
          ),
          width: 100,
        }
      );
    } else if (view === 'designRock') { // 设计围岩Tab的列
      baseColumns.push(
        { title: '创建时间', dataIndex: 'createdAt', width: 160 },
        {
          title: '里程',
          render: (_: any, record: TableDataRow) => `${record.dkilo}`,
          width: 120,
        },
        { title: '围岩等级', dataIndex: 'rockGrade', width: 120 }, // Assuming rockGrade for display
        { title: '长度', dataIndex: 'length', width: 80 },
        { title: '修改原因', dataIndex: 'revise', width: 150 },
        { title: '填写人', dataIndex: 'username', width: 100 },
        {
          title: '操作',
          render: () => (
            <Space>
              <Button type="text" icon={<></>}>
                <img src="/path/to/edit-icon.svg" alt="编辑" style={{ width: 20, height: 20 }} />
              </Button>
              <Button type="text" icon={<></>}>
                <img src="/path/to/delete-icon.svg" alt="删除" style={{ width: 20, height: 20 }} />
              </Button>
            </Space>
          ),
          width: 100,
        }
      );
    } else if (view === 'designGeology') { // 设计地质Tab的列 (按照第二张图片重新设计)
      baseColumns.push(
        { title: '地质类型', dataIndex: 'geologyType', width: 120 },
        { title: '创建时间', dataIndex: 'createdAt', width: 160 },
        { title: '地应力影响度', dataIndex: 'geologyInfluence', width: 120 },
        {
          title: '开始-结束里程',
          render: (_: any, record: TableDataRow) => `${record.startMileage} - ${record.endMileage}`,
          width: 220,
        },
        { title: '预报长度', dataIndex: 'length', width: 120 },
        { 
          title: '状态', 
          render: (_: any, record: TableDataRow) => (
            <span style={{ 
              color: record.status === 'editing' ? '#ff7d00' : '#00b42a',
              fontWeight: 500 
            }}>
              {record.statusText || '未知'}
            </span>
          ), 
          width: 100 
        },
        {
          title: '操作',
          render: (_: any, record: TableDataRow) => (
            <Space>
              <Button type="text" size="small" style={{ color: '#165DFF' }}>
                详情
              </Button>
              <Button type="text" size="small" style={{ color: '#165DFF' }}>
                修改
              </Button>
            </Space>
          ),
          width: 120,
        }
      );
    } else { // Keep original geology forecast for now, assuming user meant different thing.
      baseColumns.push(
        { title: '预报方法', dataIndex: 'method', width: 120 },
        { title: '预报时间', dataIndex: 'createdAt', width: 160 },
        {
          title: '掌子面前缘',
          dataIndex: 'startMileage', // 假设掌子面前缘对应startMileage
          width: 150,
        },
        { title: '长度', dataIndex: 'length', width: 80 },
        {
          title: '状态',
          render: () => '已上传', // 暂时硬编码为“已上传”
          width: 100,
        },
        {
          title: '操作',
          render: () => (
            <Space>
              <Button type="text" icon={<></>}>
                <img src="/path/to/edit-icon.svg" alt="编辑" style={{ width: 20, height: 20 }} />
              </Button>
            </Space>
          ),
          width: 100,
        }
      );
    }
    return baseColumns;
  };

  // 获取Tab标签文本
  const getTabLabel = (view: ViewName) => {
    switch (view) {
      case 'designForecast': return '设计预报';
      case 'designRock': return '设计围岩';
      case 'designGeology': return '设计地质';
      default: return '';
    }
  };

  // 处理表格分页变化
  const handleTablePageChange = (workPointId: string, page: number, pageSize: number) => {
    loadTableData(workPointId, getSelectedView(workPointId), page, pageSize);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 头部搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="center">
          <Col span={12}>
            <Title heading={4} style={{ margin: 0 }}>工点搜索</Title>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Input
                placeholder="输入名称或桩号"
                value={searchValue}
                onChange={setSearchValue}
                style={{ width: 300 }}
                suffix={<IconSearch />}
              />
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={() => setSearchValue('')}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 工点列表菜单 */}
      <Menu
        mode="vertical"
        openKeys={openKeys}
        onClickSubMenu={(key, keys) => handleMenuOpenChange(keys)}
        style={{ 
          marginBottom: 16,
          border: '1px solid #e5e6eb',
          borderRadius: '6px'
        }}
        className="tunnel-menu"
      >
        {workPoints.map((workPoint, index) => (
          <Menu.SubMenu 
            key={workPoint.id}
            title={
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '8px 0'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  {workPoint.name}
                </span>
                <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                  <span>里程: {workPoint.mileage}</span>
                  <span>工点长度: {workPoint.length}m</span>
                </div>
              </div>
            }
          >
            <div style={{ padding: '0 24px 24px 24px' }}>
              
              {/* 三个Tab按钮 */}
              <div style={{ marginBottom: 24 }}>
                <Space>
                  <Button 
                    type={getSelectedView(workPoint.id) === 'designForecast' ? 'primary' : 'outline'}
                    onClick={() => setSelectedViewFor(workPoint.id, 'designForecast')}
                  >
                    设计预报
                  </Button>
                  <Button 
                    type={getSelectedView(workPoint.id) === 'designRock' ? 'primary' : 'outline'}
                    onClick={() => setSelectedViewFor(workPoint.id, 'designRock')}
                  >
                    设计围岩
                  </Button>
                  <Button 
                    type={getSelectedView(workPoint.id) === 'designGeology' ? 'primary' : 'outline'}
                    onClick={() => setSelectedViewFor(workPoint.id, 'designGeology')}
                  >
                    设计地质
                  </Button>
                </Space>
              </div>

              {/* ECharts探测图表 */}
              <div style={{ marginBottom: 32 }}>
                <Title heading={5} style={{ marginBottom: 16, fontSize: '16px' }}>探测信息图</Title>
                <Spin loading={loadingDetection[workPoint.id] || false}>
                  {detectionDataMap[workPoint.id] ? (
                    <DetectionChart data={{
                      detectionMethods: detectionDataMap[workPoint.id].detectionMethods || [],
                      detectionDetails: detectionDataMap[workPoint.id].detectionDetails || {}
                    }} />
                  ) : (
                    <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 8 }}>
                      加载中...
                    </div>
                  )}
                </Spin>
              </div>

              {/* 当前选中Tab的数据表格 */}
              <div style={{ marginTop: 32 }}>
                <Title heading={5} style={{ marginBottom: 16, fontSize: '16px' }}>
                  {getTabLabel(getSelectedView(workPoint.id))}数据列表
                </Title>
                <Spin loading={loadingTable[workPoint.id] || false}>
                  <Table
                    rowKey="id"
                    columns={getTableColumns(workPoint.id, getSelectedView(workPoint.id))}
                    data={tableDataMap[workPoint.id] || []}
                    pagination={{
                      current: getTablePagination(workPoint.id).page,
                      pageSize: getTablePagination(workPoint.id).pageSize,
                      total: tableTotalMap[workPoint.id] || 0,
                      showTotal: true,
                      onChange: (page, pageSize) => handleTablePageChange(workPoint.id, page, pageSize)
                    }}
                    noDataElement={
                      <div style={{ 
                        padding: '60px', 
                        textAlign: 'center', 
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        暂无数据
                      </div>
                    }
                    size="default"
                    stripe
                    border={{
                      wrapper: true,
                      cell: true
                    }}
                  />
                </Spin>
              </div>
            </div>
          </Menu.SubMenu>
        ))}
      </Menu>
    </div>
  );
};

export default GeoPointSearchIntegrated;
