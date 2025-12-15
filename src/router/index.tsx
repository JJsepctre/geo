import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HomePage from '../pages/HomePage'
import GeoForecastPage from '../pages/GeoForecastPage'
import LoginPage from '../pages/LoginPage'
import GeoPointSearch from '../pages/GeoPoint/GeoPointSearch'
import GeoPointSearchIntegrated from '../pages/GeoPoint/GeoPointSearchIntegrated'
import ForecastDesignPage from '../pages/ForecastDesignPage'
import ForecastRockPage from '../pages/ForecastRockPage'
import ForecastGeologyPage from '../pages/ForecastGeologyPage'
import GeologyForecastPage from '../pages/GeologyForecastPage'
import ForecastEditRouter from '../pages/ForecastEditRouter'
import ForecastDetailRouter from '../pages/ForecastDetailRouter'
import ForecastComprehensivePage from '../pages/ForecastComprehensivePage'
import WorkPointDetailPage from '../pages/WorkPointDetailPage'
import DesignLayout from '../components/DesignLayout'
import ApiTestPage from '../pages/ApiTestPage'
import SwaggerAnalyzer from '../pages/SwaggerAnalyzer'
import BusinessDataPage from '../pages/BusinessDataPage'
import UserManagementPage from '../pages/UserManagementPage'
import AdminPage from '../pages/admin/AdminPage'
import ProtectedRoute from '../components/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/about',
    element: (
      <ProtectedRoute>
        <div>About</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/geo-forecast',
    element: (
      <ProtectedRoute>
        <GeoForecastPage />
      </ProtectedRoute>
    )
  },
  {
    path: 'geo-search',
    element: (
      <ProtectedRoute>
        <GeoPointSearch />
      </ProtectedRoute>
    )
  },
  {
    path: 'geo-search-integrated',
    element: (
      <ProtectedRoute>
        <GeoPointSearchIntegrated />
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/design',
    element: (
      <ProtectedRoute>
        <DesignLayout>
          <ForecastDesignPage />
        </DesignLayout>
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/rock',
    element: (
      <ProtectedRoute>
        <DesignLayout>
          <ForecastRockPage />
        </DesignLayout>
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/geology',
    element: (
      <ProtectedRoute>
        <GeologyForecastPage />
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/geology/:workPointId',
    element: (
      <ProtectedRoute>
        <GeologyForecastPage />
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/geology/edit/:type/:id',
    element: (
      <ProtectedRoute>
        <ForecastEditRouter />
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/geology/detail/:type/:id',
    element: (
      <ProtectedRoute>
        <ForecastDetailRouter />
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/design-geology',
    element: (
      <ProtectedRoute>
        <DesignLayout>
          <ForecastGeologyPage />
        </DesignLayout>
      </ProtectedRoute>
    )
  },
  {
    path: 'forecast/comprehensive',
    element: (
      <ProtectedRoute>
        <ForecastComprehensivePage />
      </ProtectedRoute>
    )
  },
  {
    path: 'workpoint/:workPointId',
    element: (
      <ProtectedRoute>
        <DesignLayout>
          <WorkPointDetailPage />
        </DesignLayout>
      </ProtectedRoute>
    )
  },
  {
    path: 'api-test',
    element: (
      <ProtectedRoute>
        <ApiTestPage />
      </ProtectedRoute>
    )
  },
  {
    path: 'swagger-analyzer',
    element: (
      <ProtectedRoute>
        <SwaggerAnalyzer />
      </ProtectedRoute>
    )
  },
  {
    path: 'business-data',
    element: (
      <ProtectedRoute>
        <BusinessDataPage />
      </ProtectedRoute>
    )
  },
  {
    path: 'user-management',
    element: <UserManagementPage />
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    )
  }
])

export default router