import React from 'react'
import { 
  Card, 
  Button, 
  Select, 
  DatePicker, 
  Space, 
  Table, 
  Empty,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography
} from '@arco-design/web-react'
import { IconUser, IconDown } from '@arco-design/web-react/icon'

const { Header, Content } = Layout
const { Text } = Typography
const { RangePicker } = DatePicker

// 模拟数据
const mockData = [
  {
    id: '1',
    name: '大庆山隧道进出口明洞',
    code: '大庆-IN-MD',
    length: '+65m',
    type: '明洞',
    risk: '中风险',
  },
  {
    id: '2',
    name: '大庆山隧道进出口洞门',
    code: '大庆-IN-GATE',
    length: '+12m',
    type: '洞门',
    risk: '中风险',
  },
  {
    id: '3',
    name: '大庆山隧道进出口小里程段',
    code: '大庆-IN-S',
    length: '-435m',
    type: '隧道段',
    risk: '高风险',
  },
  {
    id: '4',
    name: '大庆山隧道主洞Ⅰ段',
    code: '大庆-MAIN-1',
    length: '+856m',
    type: '主洞段',
    risk: '中风险',
  },
  {
    id: '5',
    name: '大庆山隧道主洞Ⅱ段',
    code: '大庆-MAIN-2',
    length: '+1205m',
    type: '主洞段',
    risk: '高风险',
  },
  {
    id: '6',
    name: '大庆山隧道主洞Ⅲ段',
    code: '大庆-MAIN-3',
    length: '+932m',
    type: '主洞段',
    risk: '低风险',
  },
  {
    id: '7',
    name: '大庆山隧道横通道Ⅰ#',
    code: '大庆-CROSS-1',
    length: '+28m',
    type: '横通道',
    risk: '中风险',
  },
]

// 表格列定义
const columns = [
  {
    title: '工点名称',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record: any) => (
      <div style={{ padding: '12px 0' }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 500, 
          color: '#1d2129',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            backgroundColor: '#ff4d4f', 
            borderRadius: '50%',
            display: 'inline-block'
          }} />
          {name}
        </div>
        <div style={{ 
          fontSize: '13px', 
          color: '#86909c',
          display: 'flex',
          gap: '16px'
        }}>
          <span>里程: {record.code}</span>
          <span>长度: {record.length}</span>
          <span>类型: {record.type}</span>
          <span style={{ 
            color: record.risk === '高风险' ? '#ff4d4f' : record.risk === '中风险' ? '#ff7d00' : '#00b42a'
          }}>
            {record.risk}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: '操作',
    dataIndex: 'operation',
    key: 'operation',
    width: 200,
    align: 'center' as const,
    render: () => (
      <Space>
        <Button type="text" size="small" style={{ color: '#165dff' }}>
          取消查询
        </Button>
        <Button type="text" size="small" style={{ color: '#165dff' }}>
          查顶
        </Button>
      </Space>
    ),
  },
]

function ForecastComprehensivePage() {
  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { key: 'logout', label: '退出登录' },
  ]

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        backgroundColor: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #e8e9ea',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#1d2129', fontSize: '20px', fontWeight: 600 }}>
            超前地质预报
          </h3>
          <Menu
            mode="horizontal"
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none',
              marginLeft: '60px'
            }}
            defaultSelectedKeys={['geology']}
          >
            <Menu.Item key="home">首页</Menu.Item>
            <Menu.Item key="geology">地质预报</Menu.Item>
          </Menu>
        </div>
        
        <Dropdown 
          droplist={
            <Menu>
              {userMenuItems.map(item => (
                <Menu.Item key={item.key}>{item.label}</Menu.Item>
              ))}
            </Menu>
          }
        >
          <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '6px' }}>
            <Avatar size={32} style={{ backgroundColor: '#165dff' }}>
              <IconUser />
            </Avatar>
            <Text>admin</Text>
            <IconDown />
          </Space>
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', backgroundColor: '#f7f8fa' }}>
        {/* 面包屑导航 */}
        <div style={{ 
          padding: '16px 24px', 
          backgroundColor: '#7c5cfc', 
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#fff',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>站前3标/青龙山隧道/青龙山隧道出口明洞</span>
          <Button 
            type="text" 
            icon={<span style={{ color: '#fff' }}>↩</span>}
            style={{ color: '#fff' }}
          >
          </Button>
        </div>

        {/* 筛选条件 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space size="large" wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>处置类型：</span>
              <Select
                placeholder="请选择处置类型"
                style={{ width: 200 }}
                allowClear
              >
                <Select.Option value="类型1">类型1</Select.Option>
                <Select.Option value="类型2">类型2</Select.Option>
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>处置状态：</span>
              <Select
                placeholder="请选择处置状态"
                style={{ width: 200 }}
                allowClear
              >
                <Select.Option value="状态1">状态1</Select.Option>
                <Select.Option value="状态2">状态2</Select.Option>
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>预报时间：</span>
              <RangePicker 
                style={{ width: 300 }} 
                placeholder={['开始日期', '结束日期']}
              />
            </div>

            <Button type="primary" icon={<span>🔍</span>}>
              查询
            </Button>
            <Button icon={<span>🔄</span>}>
              重置
            </Button>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space>
            <Button type="primary" icon={<span>➕</span>}>
              新增
            </Button>
          </Space>
        </Card>

        {/* 数据表格 */}
        <Card>
          <Table
            columns={columns}
            data={mockData}
            pagination={{
              total: mockData.length,
              pageSize: 10,
              showTotal: true,
              showJumper: true,
            }}
            noDataElement={<Empty description="暂无数据" />}
            rowKey="id"
            border={{
              wrapper: true,
              cell: true,
            }}
          />
        </Card>
      </Content>
    </Layout>
  )
}

export default ForecastComprehensivePage
