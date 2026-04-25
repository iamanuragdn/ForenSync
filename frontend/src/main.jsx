import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './bones/registry.js'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
)
