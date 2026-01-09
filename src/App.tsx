import { GameScreen } from './components/screens/GameScreen'
import { MusicProvider } from './contexts/MusicContext'
import './index.css'
import './styles/global.css'

function App() {
    return (
        <MusicProvider>
            <GameScreen />
        </MusicProvider>
    )
}

export default App
