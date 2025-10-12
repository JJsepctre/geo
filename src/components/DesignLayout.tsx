import React, { PropsWithChildren } from 'react'
import DesignTabs from './DesignTabs'

function DesignLayout(props: PropsWithChildren<{}>) {
  const { children } = props
  return (
    <div>
      <div style={{ height: 44, background: '#A18AFF', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', padding: '0 16px', color: '#fff' }}>
        XXXXX
      </div>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 40px' }}>
        <DesignTabs />
        <div style={{ marginTop: 12 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default DesignLayout


