import { Component, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ErrorBoundaryProps {
    children: ReactNode
    onReset?: () => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null })
        this.props.onReset?.()
    }

    handleGoHome = (): void => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                    onGoHome={this.handleGoHome}
                />
            )
        }

        return this.props.children
    }
}

interface ErrorFallbackProps {
    error: Error | null
    onRetry: () => void
    onGoHome: () => void
}

function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#1a1520',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                padding: '20px',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                }}
            >
                :(
            </div>
            <h1
                style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: '#e74c3c',
                }}
            >
                {lang === 'ko'
                    ? '오류가 발생했습니다'
                    : lang === 'ja'
                      ? 'エラーが発生しました'
                      : 'Something went wrong'}
            </h1>
            <p
                style={{
                    fontSize: '14px',
                    color: '#888888',
                    marginBottom: '24px',
                    textAlign: 'center',
                    maxWidth: '300px',
                }}
            >
                {lang === 'ko'
                    ? '앱에서 예기치 않은 오류가 발생했습니다.'
                    : lang === 'ja'
                      ? 'アプリで予期しないエラーが発生しました。'
                      : 'The app encountered an unexpected error.'}
            </p>

            {import.meta.env.DEV && error && (
                <pre
                    style={{
                        fontSize: '10px',
                        color: '#e74c3c',
                        backgroundColor: '#2a2030',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        maxWidth: '300px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {error.message}
                </pre>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                }}
            >
                <button
                    onClick={onRetry}
                    style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        backgroundColor: '#2ecc71',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    {lang === 'ko' ? '다시 시도' : lang === 'ja' ? 'もう一度' : 'Try Again'}
                </button>
                <button
                    onClick={onGoHome}
                    style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        backgroundColor: '#5dade2',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    {lang === 'ko' ? '홈으로' : lang === 'ja' ? 'ホームへ' : 'Go Home'}
                </button>
            </div>
        </div>
    )
}

export function ErrorBoundary({ children, onReset }: ErrorBoundaryProps) {
    return <ErrorBoundaryClass onReset={onReset}>{children}</ErrorBoundaryClass>
}
