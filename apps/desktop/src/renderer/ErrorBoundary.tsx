import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          background: '#1a1a1a',
          color: '#ff6b6b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'monospace',
          padding: '20px',
        }}>
          <h1>⚠️ Application Error</h1>
          <p style={{ marginTop: '20px', whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '800px' }}>
            {this.state.error?.toString()}
          </p>
          <p style={{ marginTop: '20px', color: '#888', fontSize: '12px' }}>Check DevTools console for full stack trace</p>
        </div>
      )
    }

    return this.props.children
  }
}
