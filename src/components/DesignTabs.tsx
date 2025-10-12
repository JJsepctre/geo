import React, { useMemo } from 'react'
import { Tabs } from '@arco-design/web-react'
import { useLocation, useNavigate } from 'react-router-dom'

const TabPane = Tabs.TabPane

function DesignTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey = useMemo(() => {
    if (location.pathname.includes('/forecast/design')) return 'design'
    if (location.pathname.includes('/forecast/rock')) return 'rock'
    if (location.pathname.includes('/forecast/geology')) return 'geology'
    return 'design'
  }, [location.pathname])

  return (
    <Tabs activeTab={activeKey} onChange={(key) => {
      if (key === 'design') navigate('/forecast/design')
      if (key === 'rock') navigate('/forecast/rock')
      if (key === 'geology') navigate('/forecast/geology')
    }} type="card-gutter" style={{ background: '#fff', padding: 8, borderRadius: 6 }}>
      <TabPane key="design" title="设计预报" />
      <TabPane key="rock" title="设计围岩" />
      <TabPane key="geology" title="设计地质" />
    </Tabs>
  )
}

export default DesignTabs


