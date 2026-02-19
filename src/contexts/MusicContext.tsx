import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { musicManager, type MusicTrack } from '../services/MusicManager'

const MUSIC_ENABLED_KEY = 'wobble-music-enabled'
const MUSIC_VOLUME_KEY = 'wobble-music-volume'

interface MusicContextValue {
    isMusicEnabled: boolean
    volume: number
    currentTrack: MusicTrack | null
    toggleMusic: () => void
    setVolume: (volume: number) => void
    switchTrack: (track: MusicTrack) => void
    markUserInteracted: () => void
}

const MusicContext = createContext<MusicContextValue | null>(null)

export function MusicProvider({ children }: { children: ReactNode }) {
    const [isMusicEnabled, setIsMusicEnabled] = useState(() => {
        const saved = localStorage.getItem(MUSIC_ENABLED_KEY)
        return saved === null ? true : saved === 'true'
    })

    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem(MUSIC_VOLUME_KEY)
        return saved === null ? 0.5 : parseFloat(saved)
    })

    const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)

    // Sync volume with MusicManager
    useEffect(() => {
        musicManager.setVolume(volume)
    }, [volume])

    // Sync enabled state with MusicManager
    useEffect(() => {
        musicManager.setEnabled(isMusicEnabled)
        localStorage.setItem(MUSIC_ENABLED_KEY, String(isMusicEnabled))
    }, [isMusicEnabled])

    useEffect(() => {
        localStorage.setItem(MUSIC_VOLUME_KEY, String(volume))
    }, [volume])

    const toggleMusic = useCallback(() => {
        setIsMusicEnabled((prev) => !prev)
    }, [])

    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(Math.max(0, Math.min(1, newVolume)))
    }, [])

    const switchTrack = useCallback((track: MusicTrack) => {
        musicManager.switchTrack(track)
        setCurrentTrack(track)
    }, [])

    const markUserInteracted = useCallback(() => {
        musicManager.markUserInteracted()
    }, [])

    return (
        <MusicContext.Provider
            value={{
                isMusicEnabled,
                volume,
                currentTrack,
                toggleMusic,
                setVolume,
                switchTrack,
                markUserInteracted,
            }}
        >
            {children}
        </MusicContext.Provider>
    )
}

export function useMusic() {
    const context = useContext(MusicContext)
    if (!context) {
        throw new Error('useMusic must be used within MusicProvider')
    }
    return context
}
