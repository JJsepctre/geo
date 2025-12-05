import React, { useEffect, useState } from 'react'
import { Button, Card, Space, Table, Tabs } from '@arco-design/web-react'
import { IconLeft } from '@arco-design/web-react/icon'
import { useNavigate, useParams } from 'react-router-dom'
import apiAdapter from '../services/apiAdapter'

const { TabPane } = Tabs

type ForecastMethod = {
  id: string
  method: string
  time: string
  mileage: string
  count: number
  status: string
}

function WorkPointDetailPage() {
  const navigate = useNavigate()
  const { workPointId } = useParams<{ workPointId: string }>()
  const [activeTab, setActiveTab] = useState('design')
  const [loading, setLoading] = useState(false)
  const [forecastMethods, setForecastMethods] = useState<ForecastMethod[]>([])

  // Mock数据 - 实际应该从API获取
  const workPointInfo = {
    name: 'DK713+920-天王山隧道西侧',
    startMileage: 'DK713+890',
    endMileage: 'DK713+950',
    length: '工点长度:60'
  }

  const methods = [
    { name: '基于面素描', key: 'face-sketch' },
    { name: '掌子面素描', key: 'palm-sketch' },
    { name: '物探法', key: 'geophysical' },
    { name: '钻探法', key: 'drilling' },
    { name: '地质分析法', key: 'geological' }
  ]

  useEffect(() => {
    fetchForecastMethods()
  }, [workPointId])

  const fetchForecastMethods = async () => {
    setLoading(true)
    try {
      // Mock数据
      const mockData: ForecastMethod[] = [
        {
          id: '1',
          method: '基于面素描',
          time: '2024-01-23 15:00:00',
          mileage: 'DK713+521.20',
          count: 0,
          status: '编辑中'
        },
        {
          id: '2',
          method: '基于面素描',
          time: '2024-01-23 15:00:00',
          mileage: 'DK713+521.20',
          count: 0,
          status: '编辑中'
        },
        {
          id: '3',
          method: '基于面素描',
          time: '2023-09-20 22:35:00',
          mileage: 'DK713+825.80',
          count: 0,
          status: '编辑中'
        }
      ]
      setForecastMethods(mockData)
    } catch (error) {
      console.error('获取预报方法失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '预报方法', dataIndex: 'method', width: 150 },
    { title: '时间编辑', dataIndex: 'time', width: 180 },
    { title: '掌子面里程', dataIndex: 'mileage', width: 150 },
    { title: '字数', dataIndex: 'count', width: 100 },
    { title: '状态', dataIndex: 'status', width: 120 },
    {
      title: '操作',
      width: 200,
      render: () => (
        <Space>
          <Button type="text" size="small">查</Button>
          <Button type="text" size="small">改</Button>
          <Button type="text" size="small">删</Button>
        </Space>
      )
    }
  ]

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
        <span>← {workPointInfo.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span>里程:{workPointInfo.startMileage}-{workPointInfo.endMileage}</span>
          <span>{workPointInfo.length}</span>
          <Button 
            type="text" 
            icon={<IconLeft />} 
            style={{ color: '#fff' }}
            onClick={() => navigate('/geo-forecast')}
          >
            返回
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Card style={{ marginBottom: '16px' }}>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <TabPane key="design" title="设计信息">
            <div style={{ padding: '20px', textAlign: 'center', color: '#86909c' }}>
              设计信息功能开发中...
            </div>
          </TabPane>
          <TabPane key="forecast" title="地质预报">
            <div style={{ padding: '20px', textAlign: 'center', color: '#86909c' }}>
              地质预报功能开发中...
            </div>
          </TabPane>
          <TabPane key="summary" title="综合信息">
            <div style={{ padding: '20px', textAlign: 'center', color: '#86909c' }}>
              综合信息功能开发中...
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 探测信息图表 */}
      <Card title="探测信息图" style={{ marginBottom: '16px' }}>
        <div style={{ 
          height: 200, 
          background: '#f7f8fa', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#86909c'
        }}>
          探测信息时间线图表（待实现）
        </div>
      </Card>

      {/* 预报方法列表 */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space>
            {methods.map(method => (
              <Button 
                key={method.key}
                type="outline"
              >
                {method.name}
              </Button>
            ))}
            <Button type="text" style={{ marginLeft: 'auto' }}>
              MORE
            </Button>
          </Space>
        </div>

        <Table
          loading={loading}
          columns={columns}
          data={forecastMethods}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default WorkPointDetailPage
