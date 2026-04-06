import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: '#0f172a',
          colorTextBase: '#f8fafc',
          colorPrimary: '#6366f1',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
