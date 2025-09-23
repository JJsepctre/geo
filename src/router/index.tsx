import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HelloPage from '../pages/HelloPage'
import GeoPointSearch from '../pages/GeoPoint/GeoPointSearch'

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
    path: 'about',
    element: <div>About</div>
  },
  {
    path: 'hello',
    element: <HelloPage />
  },
  {
    path: 'geo-search',
    element: <GeoPointSearch />
  }
])

export default router