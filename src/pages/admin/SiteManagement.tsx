import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Message, Tabs, Tree } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import http from '../../utils/http'

// 工点信息
interface SiteInfoVO {
  sitename: string
  sitecode: string
  siteId: string
  startKilo: string
  stopKilo: string
  useflag: string
}

// 工作面信息
interface GzwInfoVO {
  gzwname: string
  gzwID: string
  gzwStartKilo: string
  gzwStopKilo: string
  gzwInfoVO: SiteInfoVO[]
}

// 标段-工点信息
interface BdAndGdVO {
  bdId: string
  jsdanwei: string
  sgdanwei: string
  jldanwei: string
  bdStartKilo: string
  bdStopKilo: string
  bdInfoVO: GzwInfoVO[]
}

// 工点列表项
interface Site {
  sitePk: number
  siteId: string
  siteName: string
  status?: number
  gmtCreate?: string
}

function SiteManagement() {
  const [activeTab, setActiveTab] = useState('sites')
  const [loading, setLoading] = useState(false)
  
  // 工点列表
  const [siteData, setSiteData] = useState<Site[]>([])
  const [siteTotal, setSiteTotal] = useState(0)
  const [sitePage, setSitePage] = useState(1)
  const [sitePageSize, setSitePageSize] = useState(10)
  
  // 标段-工点列表
  const [bdGdData, setBdGdData] = useState<BdAndGdVO[]>([])
  const [bdGdTotal, setBdGdTotal] = useState(0)
  const [bdGdPage, setBdGdPage] = useState(1)
  const [bdGdPageSize, setBdGdPageSize] = useState(10)

  // 获取工点列表
  const fetchSites = async () => {
    setLoading(true)
    try {
      const res = await http.get('/api/admin/gd/list', {
        params: { pageNum: sitePage, pageSize: sitePageSize }
      })
      console.log('📋 [Admin] 工点列表:', res)
      if (res.resultcode === 0 && res.data) {
        setSiteData(res.data.records || [])
        setSiteTotal(res.data.total || 0)
      }
    } catch (error) {
      console.error('获取工点列表失败:', error)
      Message.error('获取工点列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取标段-工点列表
  const fetchBdGd = async () => {
    setLoading(true)
    try {
      const res = await http.get('/api/admin/bd-gd/list', {
        params: { pageNum: bdGdPage, pageSize: bdGdPageSize }
      })
      console.log('📋 [Admin] 标段-工点列表:', res)
      if (res.resultcode === 0 && res.data) {
        setBdGdData(res.data.records || [])
        setBdGdTotal(res.data.total || 0)
      }
    } catch (error) {
      console.error('获取标段-工点列表失败:', error)
      Message.error('获取标段-工点列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'sites') {
      fetchSites()
    } else {
      fetchBdGd()
    }
  }, [activeTab, sitePage, sitePageSize, bdGdPage, bdGdPageSize])

  const siteColumns = [
    { title: '工点ID', dataIndex: 'siteId', width: 150 },
    { title: '工点名称', dataIndex: 'siteName', width: 200 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 80,
      render: (v: number) => (
        <Tag color={v === 1 ? 'green' : 'gray'}>
          {v === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'gmtCreate', 
      width: 170,
      render: (v: string) => v ? v.replace('T', ' ').substring(0, 19) : '-'
    }
  ]

  // 标段-工点表格列
  const bdGdColumns = [
    { title: '标段ID', dataIndex: 'bdId', width: 120 },
    { title: '建设单位', dataIndex: 'jsdanwei', width: 150, render: (v: string) => v || '-' },
    { title: '施工单位', dataIndex: 'sgdanwei', width: 150, render: (v: string) => v || '-' },
    { title: '监理单位', dataIndex: 'jldanwei', width: 150, render: (v: string) => v || '-' },
    { title: '起始里程', dataIndex: 'bdStartKilo', width: 120, render: (v: string) => v || '-' },
    { title: '结束里程', dataIndex: 'bdStopKilo', width: 120, render: (v: string) => v || '-' },
    { 
      title: '工作面数量', 
      dataIndex: 'bdInfoVO', 
      width: 100,
      render: (v: GzwInfoVO[]) => <Tag color="blue">{v?.length || 0}</Tag>
    },
  ]

  // 展开行渲染 - 显示工作面和工点
  const expandedRowRender = (record: BdAndGdVO) => {
    if (!record.bdInfoVO || record.bdInfoVO.length === 0) {
      return <div style={{ padding: 16, color: '#86909c' }}>暂无工作面数据</div>
    }

    return (
      <div style={{ padding: '8px 16px' }}>
        {record.bdInfoVO.map((gzw, gzwIndex) => (
          <div key={gzw.gzwID || gzwIndex} style={{ marginBottom: 16 }}>
            <div style={{ 
              fontWeight: 500, 
              marginBottom: 8, 
              padding: '8px 12px',
              backgroundColor: '#e8f3ff',
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>工作面: {gzw.gzwname || '-'}</span>
              <span style={{ color: '#86909c', fontSize: 12 }}>
                {gzw.gzwStartKilo || '-'} ~ {gzw.gzwStopKilo || '-'}
              </span>
            </div>
            
            {gzw.gzwInfoVO && gzw.gzwInfoVO.length > 0 ? (
              <Table
                size="small"
                columns={[
                  { title: '工点名称', dataIndex: 'sitename', width: 150 },
                  { title: '工点编码', dataIndex: 'sitecode', width: 120 },
                  { title: '工点ID', dataIndex: 'siteId', width: 120 },
                  { title: '起始里程', dataIndex: 'startKilo', width: 100 },
                  { title: '结束里程', dataIndex: 'stopKilo', width: 100 },
                  { 
                    title: '状态', 
                    dataIndex: 'useflag', 
                    width: 80,
                    render: (v: string) => (
                      <Tag color={v === '1' ? 'green' : 'gray'}>
                        {v === '1' ? '启用' : '禁用'}
                      </Tag>
                    )
                  },
                ]}
                data={gzw.gzwInfoVO}
                rowKey="siteId"
                pagination={false}
                style={{ marginLeft: 24 }}
              />
            ) : (
              <div style={{ padding: '8px 24px', color: '#86909c' }}>暂无工点数据</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key="sites" title="工点列表">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<IconRefresh />} onClick={fetchSites}>
              刷新
            </Button>
          </div>
          <Table
            loading={loading}
            columns={siteColumns}
            data={siteData}
            rowKey="sitePk"
            pagination={{
              current: sitePage,
              pageSize: sitePageSize,
              total: siteTotal,
              showTotal: true,
              onChange: (p, ps) => { setSitePage(p); setSitePageSize(ps) }
            }}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane key="bdgd" title="标段-工点">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<IconRefresh />} onClick={fetchBdGd}>
              刷新
            </Button>
          </div>
          <Table
            loading={loading}
            columns={bdGdColumns}
            data={bdGdData}
            rowKey="bdId"
            expandedRowRender={expandedRowRender}
            pagination={{
              current: bdGdPage,
              pageSize: bdGdPageSize,
              total: bdGdTotal,
              showTotal: true,
              onChange: (p, ps) => { setBdGdPage(p); setBdGdPageSize(ps) }
            }}
            scroll={{ x: 1000 }}
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  )
}

export default SiteManagement
