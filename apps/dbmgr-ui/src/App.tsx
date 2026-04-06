import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DbmgrUiPage } from './pages/DbmgrUiPage'
import { EntitiesPage } from './pages/EntitiesPage'
import { IndexerPage } from './pages/IndexerPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DbmgrUiPage />} />
        <Route path="/indexers" element={<IndexerPage />} />
        <Route path="/entities" element={<EntitiesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
