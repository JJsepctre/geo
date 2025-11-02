import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HomePage from '../pages/HomePage'
import HelloPage from '../pages/HelloPage'
import GeoPointSearch from '../pages/GeoPoint/GeoPointSearch'
import GeoPointSearchIntegrated from '../pages/GeoPoint/GeoPointSearchIntegrated'
import ForecastDesignPage from '../pages/ForecastDesignPage'
import ForecastRockPage from '../pages/ForecastRockPage'
import ForecastGeologyPage from '../pages/ForecastGeologyPage'
import ForecastComprehensivePage from '../pages/ForecastComprehensivePage'
import DesignLayout from '../components/DesignLayout'
import ApiTestPage from '../pages/ApiTestPage'
import SwaggerAnalyzer from '../pages/SwaggerAnalyzer'
import BusinessDataPage from '../pages/BusinessDataPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/home',
    element: <HomePage />
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
  },
  {
    path: 'api-test',
    element: <ApiTestPage />
  },
  {
    path: 'swagger-analyzer',
    element: <SwaggerAnalyzer />
  },
  {
    path: 'business-data',
    element: <BusinessDataPage />
  }
])

export default router