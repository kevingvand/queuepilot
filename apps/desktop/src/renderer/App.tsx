import { Shell } from './features/shell/Shell'
import { ApiProvider } from './hooks/ApiProvider'
import { ThemeProvider } from './contexts/ThemeContext'

export function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <Shell />
      </ApiProvider>
    </ThemeProvider>
  )
}
