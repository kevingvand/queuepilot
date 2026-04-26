import { Shell } from './features/shell/Shell'
import { ApiProvider } from './hooks/ApiProvider'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'

export function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </ApiProvider>
    </ThemeProvider>
  )
}
