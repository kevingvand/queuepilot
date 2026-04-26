import { Shell } from './features/shell/Shell'

export function App() {
  console.log('[App] Rendering Shell component')
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
        Debug: App loaded
      </div>
      <Shell />
    </>
  )
}
