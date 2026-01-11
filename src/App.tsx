import { MainScreen } from './components/screens/MainScreen.tsx'
import { MusicProvider } from './contexts/MusicContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AchievementToast } from './components/ui/AchievementToast'
import './index.css'
import './styles/global.css'

function App() {
    return (
        <ErrorBoundary>
            <MusicProvider>
                <MainScreen />
                <AchievementToast />
            </MusicProvider>
        </ErrorBoundary>
    )
}

export default App
