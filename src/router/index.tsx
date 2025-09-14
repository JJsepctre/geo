import React from 'react'
import {createBrowserRouter, Link} from 'react-router-dom'
import HelloPage from '../pages/HelloPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
    <div>
      <h1>Hello World222</h1>
      <Link to="about">About Us</Link>
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
  }
])

export default router