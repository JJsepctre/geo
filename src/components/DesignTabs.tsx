import React, { useMemo } from 'react'
import { Tabs } from '@arco-design/web-react'
import { useLocation, useNavigate } from 'react-router-dom'

const TabPane = Tabs.TabPane

function DesignTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey = useMemo(() => {
    // 注意：要先匹配更具体的路径，避免被包含关系误匹配
    if (location.pathname.includes('/forecast/design-geology')) return 'geology'
    if (location.pathname.includes('/forecast/design')) return 'design'
    if (location.pathname.includes('/forecast/rock')) return 'rock'
    return 'design'
  }, [location.pathname])

  return (
    <Tabs activeTab={activeKey} onChange={(key) => {
      const search = location.search // 保留查询参数（如 siteId）
      if (key === 'design') navigate(`/forecast/design${search}`)
      if (key === 'rock') navigate(`/forecast/rock${search}`)
      if (key === 'geology') navigate(`/forecast/design-geology${search}`)
    }} type="card-gutter" style={{ background: '#fff', padding: 8, borderRadius: 6 }}>
      <TabPane key="design" title="设计预报" />
      <TabPane key="rock" title="设计围岩" />
      <TabPane key="geology" title="设计地质" />
    </Tabs>
  )
}

export default DesignTabs


