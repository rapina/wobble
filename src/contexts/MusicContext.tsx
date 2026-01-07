import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const MUSIC_ENABLED_KEY = 'wobble-music-enabled';

interface MusicContextValue {
    isMusicEnabled: boolean;
    toggleMusic: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
    const [isMusicEnabled, setIsMusicEnabled] = useState(() => {
        const saved = localStorage.getItem(MUSIC_ENABLED_KEY);
        return saved === null ? true : saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(MUSIC_ENABLED_KEY, String(isMusicEnabled));
    }, [isMusicEnabled]);

    const toggleMusic = useCallback(() => {
        setIsMusicEnabled(prev => !prev);
    }, []);

    return (
        <MusicContext.Provider value={{ isMusicEnabled, toggleMusic }}>
            {children}
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within MusicProvider');
    }
    return context;
}
