/**
 * MusicManager - Background music system with crossfade support
 */

export type MusicTrack = 'main' | 'survivor'

interface TrackConfig {
    src: string
    volumeScale: number // Scale factor for this track's volume (0-1)
}

const TRACKS: Record<MusicTrack, TrackConfig> = {
    main: {
        src: '/assets/bg.mp3',
        volumeScale: 0.1, // Background music is quieter
    },
    survivor: {
        src: '/assets/Depths of the Glitch.mp3',
        volumeScale: 0.15, // Survivor music slightly louder
    },
}

const FADE_DURATION = 1000 // 1 second fade

class MusicManager {
    private audioElements: Map<MusicTrack, HTMLAudioElement> = new Map()
    private currentTrack: MusicTrack | null = null
    private masterVolume: number = 0.5
    private isEnabled: boolean = true
    private fadeIntervals: Map<MusicTrack, number> = new Map()
    private hasUserInteracted: boolean = false

    constructor() {
        // Pre-create audio elements for all tracks
        for (const [track, config] of Object.entries(TRACKS) as [MusicTrack, TrackConfig][]) {
            const audio = new Audio(config.src)
            audio.loop = true
            audio.volume = 0
            audio.preload = 'auto'
            this.audioElements.set(track, audio)
        }
    }

    /**
     * Mark that user has interacted (required for autoplay)
     */
    markUserInteracted(): void {
        this.hasUserInteracted = true
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume))

        // Update current track's volume immediately if not fading
        if (this.currentTrack && !this.fadeIntervals.has(this.currentTrack)) {
            const audio = this.audioElements.get(this.currentTrack)
            const config = TRACKS[this.currentTrack]
            if (audio) {
                audio.volume = this.masterVolume * config.volumeScale
            }
        }
    }

    /**
     * Enable or disable music
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled

        if (!enabled) {
            // Pause current track
            if (this.currentTrack) {
                const audio = this.audioElements.get(this.currentTrack)
                audio?.pause()
            }
        } else if (this.currentTrack && this.hasUserInteracted) {
            // Resume current track
            const audio = this.audioElements.get(this.currentTrack)
            audio?.play().catch(() => {})
        }
    }

    /**
     * Switch to a different track with crossfade
     */
    async switchTrack(track: MusicTrack): Promise<void> {
        if (track === this.currentTrack) return

        const previousTrack = this.currentTrack
        this.currentTrack = track

        // Start fade out of previous track (if any)
        if (previousTrack) {
            this.fadeOut(previousTrack)
        }

        // Start fade in of new track
        if (this.isEnabled && this.hasUserInteracted) {
            await this.fadeIn(track)
        }
    }

    /**
     * Fade in a track
     */
    private async fadeIn(track: MusicTrack): Promise<void> {
        const audio = this.audioElements.get(track)
        const config = TRACKS[track]
        if (!audio) return

        // Clear any existing fade for this track
        this.clearFade(track)

        const targetVolume = this.masterVolume * config.volumeScale
        audio.volume = 0

        try {
            await audio.play()
        } catch {
            // Autoplay blocked, will retry on next user interaction
            return
        }

        const steps = 20
        const stepDuration = FADE_DURATION / steps
        const volumeStep = targetVolume / steps
        let currentStep = 0

        return new Promise((resolve) => {
            const interval = window.setInterval(() => {
                currentStep++
                audio.volume = Math.min(volumeStep * currentStep, targetVolume)

                if (currentStep >= steps) {
                    this.clearFade(track)
                    audio.volume = targetVolume
                    resolve()
                }
            }, stepDuration)

            this.fadeIntervals.set(track, interval)
        })
    }

    /**
     * Fade out a track
     */
    private fadeOut(track: MusicTrack): void {
        const audio = this.audioElements.get(track)
        if (!audio) return

        // Clear any existing fade for this track
        this.clearFade(track)

        const startVolume = audio.volume
        const steps = 20
        const stepDuration = FADE_DURATION / steps
        const volumeStep = startVolume / steps
        let currentStep = 0

        const interval = window.setInterval(() => {
            currentStep++
            audio.volume = Math.max(startVolume - volumeStep * currentStep, 0)

            if (currentStep >= steps) {
                this.clearFade(track)
                audio.pause()
                audio.currentTime = 0
                audio.volume = 0
            }
        }, stepDuration)

        this.fadeIntervals.set(track, interval)
    }

    /**
     * Clear fade interval for a track
     */
    private clearFade(track: MusicTrack): void {
        const interval = this.fadeIntervals.get(track)
        if (interval) {
            window.clearInterval(interval)
            this.fadeIntervals.delete(track)
        }
    }

    /**
     * Pause all music (for app going to background)
     */
    pauseAll(): void {
        for (const audio of this.audioElements.values()) {
            audio.pause()
        }
    }

    /**
     * Resume current track (for app coming to foreground)
     */
    resume(): void {
        if (this.isEnabled && this.currentTrack && this.hasUserInteracted) {
            const audio = this.audioElements.get(this.currentTrack)
            audio?.play().catch(() => {})
        }
    }

    /**
     * Get current track
     */
    getCurrentTrack(): MusicTrack | null {
        return this.currentTrack
    }

    /**
     * Clean up all audio elements
     */
    destroy(): void {
        for (const [track] of this.audioElements) {
            this.clearFade(track)
        }
        for (const audio of this.audioElements.values()) {
            audio.pause()
            audio.src = ''
        }
        this.audioElements.clear()
    }
}

// Singleton instance
export const musicManager = new MusicManager()
