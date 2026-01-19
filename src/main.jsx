import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
window.Buffer = Buffer
globalThis.Buffer = Buffer
window.process = process
globalThis.process = process

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

