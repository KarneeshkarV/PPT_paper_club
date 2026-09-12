import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/base.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter: no server rewrite rules, so the build works on GitHub Pages and file://. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
