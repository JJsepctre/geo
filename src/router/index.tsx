import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HelloPage from '../pages/HelloPage'
import GeoPointSearch from '../pages/GeoPoint/GeoPointSearch'
import GeoPointSearchIntegrated from '../pages/GeoPoint/GeoPointSearchIntegrated'
import ForecastDesignPage from '../pages/ForecastDesignPage'
import ForecastRockPage from '../pages/ForecastRockPage'
import ForecastGeologyPage from '../pages/ForecastGeologyPage'
import ForecastComprehensivePage from '../pages/ForecastComprehensivePage'
import DesignLayout from '../components/DesignLayout'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
    <div>
      <h1>地质预报管理系统</h1>
      <Link to="hello">主页面（隧道工点管理）</Link>
      <br />
      <Link to="geo-search">工点搜索（原版 - 硬编码Mock）</Link>
      <br />
      <Link to="geo-search-integrated">工点搜索（集成版 - 真实API）✨ 推荐</Link>
      <br />
      <Link to="forecast/design">预报设计管理</Link>
    </div>
    )
  },
  {
    path: '/about',
    element: <div>About</div>
  },
  {
    path: '/hello',
    element: <HelloPage />
  },
  {
    path: 'geo-search',
    element: <GeoPointSearch />
  },
  {
    path: 'geo-search-integrated',
    element: <GeoPointSearchIntegrated />
  },
  {
    path: 'forecast/design',
    element: (
      <DesignLayout>
        <ForecastDesignPage />
      </DesignLayout>
    )
  },
  {
    path: 'forecast/rock',
    element: <ForecastRockPage />
  },
  {
    path: 'forecast/geology',
    element: <ForecastGeologyPage />
  },
  {
    path: 'forecast/comprehensive',
    element: <ForecastComprehensivePage />
  }
])

export default router