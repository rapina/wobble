import { Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '../hooks/useMusic';

export function MusicToggle() {
    const { isMusicEnabled, toggleMusic } = useMusic();

    return (
        <button
            onClick={toggleMusic}
            className="relative h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{
                background: '#374244',
                border: '2px solid #1a1a1a',
                boxShadow: '0 3px 0 #1a1a1a',
            }}
            aria-label={isMusicEnabled ? 'Mute music' : 'Unmute music'}
        >
            {isMusicEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
            ) : (
                <VolumeX className="w-5 h-5 text-white/50" />
            )}
        </button>
    );
}
