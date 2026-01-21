import { MainScreen } from './components/screens/MainScreen.tsx'
import { MusicProvider } from './contexts/MusicContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AchievementToast } from './components/ui/AchievementToast'
import { MobileFrame } from './components/MobileFrame'
import './index.css'
import './styles/global.css'

function App() {
    return (
        <ErrorBoundary>
            <MobileFrame>
                <MusicProvider>
                    <MainScreen />
                    <AchievementToast />
                </MusicProvider>
            </MobileFrame>
        </ErrorBoundary>
    )
}

export default App
