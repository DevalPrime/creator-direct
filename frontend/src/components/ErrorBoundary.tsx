import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            padding: '24px',
            margin: '24px',
            background: '#f8d7da',
            border: '2px solid #f5c6cb',
            borderRadius: '8px',
            color: '#721c24',
          }}
        >
          <h2>Something went wrong</h2>
          <p>
            {this.state.error?.message ||
              'An unexpected error occurred. Please refresh the page.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px' }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
