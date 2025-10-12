import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HelloPage from '../pages/HelloPage'
import GeoPointSearch from '../pages/GeoPoint/GeoPointSearch'
import ForecastDesignPage from '../pages/ForecastDesignPage'
import ForecastRockPage from '../pages/ForecastRockPage'
import ForecastGeologyPage from '../pages/ForecastGeologyPage'
import DesignLayout from '../components/DesignLayout'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
    <div>
      <h1>Hello World222</h1>
      <Link to="about">About Us</Link>
      <br />
      <Link to="geo-search">工点搜索 (原版)</Link>
      <br />
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
  }
])

export default router