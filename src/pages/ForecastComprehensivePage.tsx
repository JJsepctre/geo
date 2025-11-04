import React, { useState } from 'react'
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
  Typography,
  Message
} from '@arco-design/web-react'
import { IconUser, IconDown } from '@arco-design/web-react/icon'

const { Header, Content } = Layout
const { Text } = Typography
const { RangePicker } = DatePicker

// 模拟数据
const mockData = [
  {
    id: '2185727',
    recordCode: '2185727',
    disposalType: '综合结论',
    createTime: '2022-04-12 17:38:30',
    status: '已处置',
  },
  {
    id: '2185656',
    recordCode: '2185656',
    disposalType: '综合结论',
    createTime: '2022-04-12 17:00:33',
    status: '已处置',
  },
  {
    id: '2185445',
    recordCode: '2185445',
    disposalType: '综合结论',
    createTime: '2022-04-12 16:45:22',
    status: '已处置',
  },
  {
    id: '2185234',
    recordCode: '2185234',
    disposalType: '综合结论',
    createTime: '2022-04-12 16:20:15',
    status: '已处置',
  },
  {
    id: '2185023',
    recordCode: '2185023',
    disposalType: '综合结论',
    createTime: '2022-04-12 15:55:48',
    status: '已处置',
  },
]

function ForecastComprehensivePage() {
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null)

  // 查看详情 - 展开/收起行
  const handleViewDetail = (record: any) => {
    if (expandedRowKey === record.id) {
      setExpandedRowKey(null) // 如果已展开，则收起
    } else {
      setExpandedRowKey(record.id) // 展开该行
    }
  }

  // 将数据转换为包含展开行的数组
  const getTableData = () => {
    const result: any[] = []
    mockData.forEach(record => {
      result.push(record)
      if (expandedRowKey === record.id) {
        // 添加展开行
        result.push({
          id: `${record.id}-expanded`,
          isExpandedRow: true,
          parentRecord: record,
        })
      }
    })
    return result
  }

  // 表格列定义
  const columns = [
    {
      title: '分段记录码',
      dataIndex: 'recordCode',
      key: 'recordCode',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isExpandedRow) {
          return {
            children: (
              <div style={{ 
                padding: '24px',
                background: '#f7f8fa',
                borderRadius: '8px',
                margin: '8px 0'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: '#1d2129'
                }}>
                  处置情况
                </div>
                
                {/* 处置情况表格 */}
                <Table
                  columns={[
                    {
                      title: '处置状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 200,
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createTime',
                      key: 'createTime',
                      width: 300,
                    },
                    {
                      title: '操作',
                      dataIndex: 'operation',
                      key: 'operation',
                      width: 150,
                      align: 'center' as const,
                      render: () => (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="8" r="1.5" fill="#86909c"/>
                          <circle cx="8" cy="12" r="1.5" fill="#86909c"/>
                          <circle cx="8" cy="4" r="1.5" fill="#86909c"/>
                        </svg>
                      ),
                    },
                  ]}
                  data={[]}
                  pagination={false}
                  noDataElement={<Empty description="暂无数据" />}
                  border={{
                    wrapper: true,
                    cell: true,
                  }}
                  style={{ background: '#fff' }}
                />
              </div>
            ),
            props: {
              colSpan: 5, // 跨越所有列
            },
          }
        }
        return record.recordCode
      },
    },
    {
      title: '处置类型',
      dataIndex: 'disposalType',
      key: 'disposalType',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isExpandedRow) {
          return {
            props: {
              colSpan: 0, // 被第一列合并
            },
          }
        }
        return record.disposalType
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 200,
      render: (_: any, record: any) => {
        if (record.isExpandedRow) {
          return {
            props: {
              colSpan: 0, // 被第一列合并
            },
          }
        }
        return record.createTime
      },
    },
    {
      title: '处置状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isExpandedRow) {
          return {
            props: {
              colSpan: 0, // 被第一列合并
            },
          }
        }
        return record.status
      },
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (record.isExpandedRow) {
          return {
            props: {
              colSpan: 0, // 被第一列合并
            },
          }
        }
        return (
          <Button 
            type="text" 
            size="small" 
            style={{ color: '#722ED1' }}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
        )
      },
    },
  ]

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
            data={getTableData()}
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
