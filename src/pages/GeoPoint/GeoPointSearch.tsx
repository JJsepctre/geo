import React, { useState } from 'react';
import { Button, Card, Input, Table, Tag, Typography, Space, Menu, Grid } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import DetectionChart from '../../components/DetectionChart';
import './GeoPointSearch.css';

const { Title } = Typography;
const { Row, Col } = Grid;

// 类型定义
type DetectionMethodName = '物探法' | '掌子面素描' | '洞身素描' | '钻探法' | '地表补充';

// 测试数据
const mockData = {
  detectionMethods: [
    { name: '物探法', count: 15, color: '#3B82F6' },
    { name: '掌子面素描', count: 8, color: '#8B5CF6' },
    { name: '洞身素描', count: 12, color: '#10B981' },
    { name: '钻探法', count: 6, color: '#F59E0B' },
    { name: '地表补充', count: 4, color: '#EF4444' }
  ],
  detectionDetails: {
    '物探法': [
      { method: '物探法', time: '2023-08-15', mileage: 'DK487+449.00-DK487+504.00', length: '55m', status: '已完成', operator: '张工' },
      { method: '物探法', time: '2023-08-10', mileage: 'DK487+449.00-DK487+480.00', length: '31m', status: '已完成', operator: '李工' }
    ],
    '掌子面素描': [
      { method: '掌子面素描', time: '2023-08-16', mileage: 'DK487+450.00-DK487+455.00', length: '5m', status: '已完成', operator: '刘工' },
      { method: '掌子面素描', time: '2023-08-18', mileage: 'DK487+455.00-DK487+460.00', length: '5m', status: '进行中', operator: '陈工' }
    ],
    '洞身素描': [
      { method: '洞身素描', time: '2023-08-17', mileage: 'DK487+456.00-DK487+468.00', length: '12m', status: '已完成', operator: '赵工' },
      { method: '洞身素描', time: '2023-08-20', mileage: 'DK487+468.00-DK487+480.00', length: '12m', status: '已完成', operator: '孙工' }
    ],
    '钻探法': [
      { method: '钻探法', time: '2023-08-12', mileage: 'DK487+460.00', length: '30m', status: '已完成', operator: '吴工' },
      { method: '钻探法', time: '2023-08-14', mileage: 'DK487+480.00', length: '25m', status: '已完成', operator: '马工' }
    ],
    '地表补充': [
      { method: '地表补充', time: '2023-08-08', mileage: 'DK487+449.00-DK487+504.00', length: '55m', status: '已完成', operator: '郑工' },
      { method: '地表补充', time: '2023-08-25', mileage: 'DK487+470.00-DK487+490.00', length: '20m', status: '计划中', operator: '黄工' }
    ]
  }
};

const GeoPointSearchFinal: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  // 将 selectedMethod 改为按面板维护的 map，避免点击一个面板的 tag 影响所有面板
  const [selectedMethodMap, setSelectedMethodMap] = useState<Record<string, DetectionMethodName>>({
    'main-tunnel': '物探法',
    'tunnel-1': '物探法',
    'tunnel-2': '物探法'
  });

  const getSelectedMethod = (panelKey: string) => selectedMethodMap[panelKey] || '物探法';
  const setSelectedMethodFor = (panelKey: string, method: DetectionMethodName) => {
    setSelectedMethodMap(prev => ({ ...prev, [panelKey]: method }));
  };
  // 菜单展开状态 - 使用openKeys控制
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  // 每个面板独立维护顶部三个视图按钮（设计信息/地质预报/综合分析）的选中状态
  type ViewName = 'design' | 'geology' | 'comprehensive';
  const [selectedViewMap, setSelectedViewMap] = useState<Record<string, ViewName>>({
    'main-tunnel': 'design',
    'tunnel-1': 'design',
    'tunnel-2': 'design'
  });
  const getSelectedView = (panelKey: string) => selectedViewMap[panelKey] || 'design';
  const setSelectedViewFor = (panelKey: string, v: ViewName) => {
    setSelectedViewMap(prev => ({ ...prev, [panelKey]: v }));
  };

  const handleSearch = () => {
    console.log('搜索:', searchValue);
  };

  // 表格列定义
  const getTableColumns = (method: DetectionMethodName) => {
    const columnTitle = method === '钻探法' || method === '地表补充' ? '掌子面里程' : '里程';
    
    return [
      { title: '预报方法', dataIndex: 'method', key: 'method', width: 120 },
      { title: '预报时间', dataIndex: 'time', key: 'time', width: 120 },
      { title: columnTitle, dataIndex: 'mileage', key: 'mileage', width: 200 },
      { title: '长度', dataIndex: 'length', key: 'length', width: 80 },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        width: 100,
        render: (status: string) => (
          <Tag color={status === '已完成' ? 'green' : status === '进行中' ? 'orange' : 'blue'}>
            {status}
          </Tag>
        )
      },
      { title: '操作', dataIndex: 'operator', key: 'operator', width: 100 }
    ];
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

      {/* 隧道项目菜单 - 使用 Menu 组件实现缩起内嵌菜单 */}
      <Menu
        mode="vertical"
        openKeys={openKeys}
        onClickSubMenu={(key, openKeys) => setOpenKeys(openKeys)}
        style={{ 
          marginBottom: 16,
          border: '1px solid #e5e6eb',
          borderRadius: '6px'
        }}
        className="tunnel-menu"
      >
        <Menu.SubMenu 
          key="main-tunnel" 
          title={
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 0'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                赵庄隧道DK487+449~+504明挖段
              </span>
              <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                <span>里程: DK487+449-DK487+504</span>
                <span>工点长度: 55</span>
              </div>
            </div>
          }
        >
          <div style={{ padding: '0 24px 24px 24px' }}>

            {/* 三个按钮 - 使用Arco Button组件 */}
            <div style={{ marginBottom: 24 }}>
              <Space>
                <Button 
                  type={getSelectedView('main-tunnel') === 'design' ? 'primary' : 'outline'}
                  onClick={() => setSelectedViewFor('main-tunnel', 'design')}
                >
                  设计信息
                </Button>
                <Button 
                  type={getSelectedView('main-tunnel') === 'geology' ? 'primary' : 'outline'}
                  onClick={() => setSelectedViewFor('main-tunnel', 'geology')}
                >
                  地质预报
                </Button>
                <Button 
                  type={getSelectedView('main-tunnel') === 'comprehensive' ? 'primary' : 'outline'}
                  onClick={() => setSelectedViewFor('main-tunnel', 'comprehensive')}
                >
                  综合分析
                </Button>
              </Space>
            </div>

            {/* ECharts图表区域 - 独立显示，不受选项卡影响 */}
            <div style={{ marginBottom: 32 }}>
              <Title heading={5} style={{ marginBottom: 16, fontSize: '16px' }}>探测信息图</Title>
              <DetectionChart data={{ 
                detectionMethods: mockData.detectionMethods, 
                detectionDetails: mockData.detectionDetails 
              }} />
            </div>

            {/* 探测方法按钮组 - 控制表格数据 */}
            <div style={{ 
              marginBottom: 24, 
              padding: '16px', 
              background: '#f8f9fa', 
              borderRadius: '8px'
            }}>
              <Space wrap>
                {mockData.detectionMethods.map((method) => (
                  <Button
                    key={method.name}
                    type={getSelectedMethod('main-tunnel') === method.name ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedMethodFor('main-tunnel', method.name as DetectionMethodName)}
                    style={{
                      borderRadius: '20px',
                      fontSize: '12px',
                      padding: '4px 12px'
                    }}
                  >
                    {method.name}
                  </Button>
                ))}
                <Button 
                  type="text" 
                  size="small" 
                  style={{ 
                    color: '#6366f1', 
                    marginLeft: 'auto',
                    fontWeight: 600
                  }}
                >
                  MORE
                </Button>
              </Space>
            </div>

            {/* 探测数据表格 - 受方法按钮控制 */}
              <Table
              columns={getTableColumns(getSelectedMethod('main-tunnel'))}
              data={mockData.detectionDetails[getSelectedMethod('main-tunnel')] || []}
              pagination={false}
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
          </div>
        </Menu.SubMenu>

        <Menu.SubMenu 
          key="tunnel-1" 
          title={
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 0'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                赵庄隧道出口明洞
              </span>
              <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                <span>工点长度: 7</span>
              </div>
            </div>
          }
        >
          <div style={{ padding: '20px 24px' }}>
            {/* 下拉框内搜索框 */}
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="输入名称搜索"
                suffix={<IconSearch />}
                style={{ 
                  width: '100%',
                  maxWidth: 400
                }}
                allowClear
              />
            </div>

            {/* 使用与主隧道相同的布局，但传入空数据以展示无数据状态：仅显示横纵轴、tag 区域显示暂无数据、表格仅显示表头 */}
            <div style={{ marginBottom: 24 }}>
              <Space>
                <Button 
                  type={getSelectedView('tunnel-1') === 'design' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setSelectedViewFor('tunnel-1', 'design')}
                >设计信息</Button>
                <Button 
                  type={getSelectedView('tunnel-1') === 'geology' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setSelectedViewFor('tunnel-1', 'geology')}
                >地质预报</Button>
                <Button 
                  type={getSelectedView('tunnel-1') === 'comprehensive' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setSelectedViewFor('tunnel-1', 'comprehensive')}
                >综合分析</Button>
              </Space>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Title heading={5} style={{ marginBottom: 16, fontSize: '16px' }}>探测信息图</Title>
              {/* 传入空的 detectionMethods 和 detectionDetails，DetectionChart 会只渲染坐标轴 */}
              <DetectionChart data={{ detectionMethods: [], detectionDetails: {} }} />
            </div>

            <div style={{ 
              marginBottom: 24, 
              padding: '16px', 
              background: '#f8f9fa', 
              borderRadius: '8px'
            }}>
              <Space wrap>
                {mockData.detectionMethods.map((method) => (
                  <Button
                    key={method.name}
                    type={getSelectedMethod('tunnel-1') === method.name ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedMethodFor('tunnel-1', method.name as DetectionMethodName)}
                    style={{
                      borderRadius: '20px',
                      fontSize: '12px',
                      padding: '4px 12px'
                    }}
                  >
                    {method.name}
                  </Button>
                ))}
                <Button 
                  type="text" 
                  size="small" 
                  style={{ 
                    color: '#6366f1', 
                    marginLeft: 'auto',
                    fontWeight: 600
                  }}
                >
                  MORE
                </Button>
              </Space>
              <div style={{ marginTop: 8, color: '#999', textAlign: 'center' }}>暂无数据</div>
            </div>

            {/* 只显示表头，表体为空 */}
            <Table
              columns={getTableColumns(getSelectedMethod('tunnel-1'))}
              data={[]}
              pagination={false}
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
          </div>
        </Menu.SubMenu>
        
        <Menu.SubMenu 
          key="tunnel-2" 
          title={
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 0'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                赵庄隧道出口明洞
              </span>
              <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                <span>工点长度: 25</span>
              </div>
            </div>
          }
        >
          <div style={{ padding: '20px 24px' }}>
            {/* 下拉框内搜索框 */}
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="输入名称搜索"
                suffix={<IconSearch />}
                style={{ 
                  width: '100%',
                  maxWidth: 400
                }}
                allowClear
              />
            </div>

            {/* 同上：无数据示例，保持与 tunnel-1 一致 */}
            <div style={{ marginBottom: 24 }}>
              <Space>
                  <Button 
                    type={getSelectedView('tunnel-2') === 'design' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedViewFor('tunnel-2', 'design')}
                  >设计信息</Button>
                  <Button 
                    type={getSelectedView('tunnel-2') === 'geology' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedViewFor('tunnel-2', 'geology')}
                  >地质预报</Button>
                  <Button 
                    type={getSelectedView('tunnel-2') === 'comprehensive' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedViewFor('tunnel-2', 'comprehensive')}
                  >综合分析</Button>
              </Space>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Title heading={5} style={{ marginBottom: 16, fontSize: '16px' }}>探测信息图</Title>
              <DetectionChart data={{ detectionMethods: [], detectionDetails: {} }} />
            </div>

            <div style={{ 
              marginBottom: 24, 
              padding: '16px', 
              background: '#f8f9fa', 
              borderRadius: '8px'
            }}>
              <Space wrap>
                {mockData.detectionMethods.map((method) => (
                  <Button
                    key={method.name}
                    type={getSelectedMethod('tunnel-2') === method.name ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSelectedMethodFor('tunnel-2', method.name as DetectionMethodName)}
                    style={{
                      borderRadius: '20px',
                      fontSize: '12px',
                      padding: '4px 12px'
                    }}
                  >
                    {method.name}
                  </Button>
                ))}
                <Button 
                  type="text" 
                  size="small" 
                  style={{ 
                    color: '#6366f1', 
                    marginLeft: 'auto',
                    fontWeight: 600
                  }}
                >
                  MORE
                </Button>
              </Space>
              <div style={{ marginTop: 8, color: '#999', textAlign: 'center' }}>暂无数据</div>
            </div>

            <Table
              columns={getTableColumns(getSelectedMethod('tunnel-2'))}
              data={[]}
              pagination={false}
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
          </div>
        </Menu.SubMenu>
      </Menu>
    </div>
  );
};

export default GeoPointSearchFinal;