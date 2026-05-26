import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastProvider } from './components/ui/Toast'

const EditorView = lazy(() => import('./views/EditorView'))
const PreviewView = lazy(() => import('./views/PreviewView'))

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<EditorView />} />
          <Route path="/preview" element={<PreviewView />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  )
}
