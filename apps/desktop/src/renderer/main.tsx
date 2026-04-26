import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';

console.log('[main.tsx] Starting React initialization...')

const rootElement = document.getElementById('root')
console.log('[main.tsx] Root element:', rootElement)

if (rootElement) {
  console.log('[main.tsx] Creating React root')
  const root = ReactDOM.createRoot(rootElement)
  console.log('[main.tsx] Rendering App')
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('[main.tsx] App rendered')
} else {
  console.error('[main.tsx] Root element not found!')
}
