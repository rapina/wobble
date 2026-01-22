/**
 * MusicManager - Background music system with crossfade support and audio analysis
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

// Audio analysis band ranges (for equalizer-like visualization)
export interface AudioBands {
    bass: number // 0-1, low frequencies (20-250Hz)
    mid: number // 0-1, mid frequencies (250-2000Hz)
    high: number // 0-1, high frequencies (2000-20000Hz)
    overall: number // 0-1, overall level
}

class MusicManager {
    private audioElements: Map<MusicTrack, HTMLAudioElement> = new Map()
    private currentTrack: MusicTrack | null = null
    private masterVolume: number = 0.5
    private isEnabled: boolean = true
    private fadeIntervals: Map<MusicTrack, number> = new Map()
    private hasUserInteracted: boolean = false

    // Audio analysis
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private sourceNodes: Map<MusicTrack, MediaElementAudioSourceNode> = new Map()
    private frequencyData: Uint8Array<ArrayBuffer> | null = null
    private isAnalyserConnected: boolean = false

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
     * Also starts playing if a track is set but paused
     */
    markUserInteracted(): void {
        console.log('[Music] markUserInteracted called', {
            alreadyInteracted: this.hasUserInteracted,
            isEnabled: this.isEnabled,
            currentTrack: this.currentTrack,
        })

        if (this.hasUserInteracted) return // Already marked

        this.hasUserInteracted = true

        // Start playing current track if enabled but paused
        if (this.isEnabled && this.currentTrack) {
            const audio = this.audioElements.get(this.currentTrack)
            console.log('[Music] markUserInteracted - checking audio', {
                hasAudio: !!audio,
                paused: audio?.paused,
            })
            if (audio && audio.paused) {
                console.log('[Music] markUserInteracted - starting fadeIn')
                this.fadeIn(this.currentTrack)
            }
        }
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
        console.log('[Music] setEnabled called', {
            enabled,
            currentTrack: this.currentTrack,
            hasUserInteracted: this.hasUserInteracted,
        })
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
            console.log('[Music] setEnabled - resuming', { paused: audio?.paused })
            audio?.play().catch((e) => console.log('[Music] setEnabled - play failed', e))
        }
    }

    /**
     * Switch to a different track with crossfade
     */
    async switchTrack(track: MusicTrack): Promise<void> {
        console.log('[Music] switchTrack called', {
            track,
            currentTrack: this.currentTrack,
            isEnabled: this.isEnabled,
            hasUserInteracted: this.hasUserInteracted,
        })

        // Same track but not playing? Start it
        if (track === this.currentTrack) {
            console.log('[Music] switchTrack - same track')
            if (this.isEnabled && this.hasUserInteracted) {
                const audio = this.audioElements.get(track)
                console.log('[Music] switchTrack - same track check', {
                    hasAudio: !!audio,
                    paused: audio?.paused,
                })
                if (audio && audio.paused) {
                    console.log('[Music] switchTrack - starting fadeIn for same track')
                    await this.fadeIn(track)
                }
            }
            return
        }

        const previousTrack = this.currentTrack
        this.currentTrack = track

        // Connect new track to analyser if available
        if (this.audioContext && this.analyser) {
            this.connectTrackToAnalyser(track)
        }

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
        console.log('[Music] fadeIn called', { track })
        const audio = this.audioElements.get(track)
        const config = TRACKS[track]
        if (!audio) {
            console.log('[Music] fadeIn - no audio element')
            return
        }

        // Clear any existing fade for this track
        this.clearFade(track)

        const targetVolume = this.masterVolume * config.volumeScale
        audio.volume = 0

        console.log('[Music] fadeIn - attempting play', { targetVolume })
        try {
            await audio.play()
            console.log('[Music] fadeIn - play succeeded')
        } catch (e) {
            // Autoplay blocked, will retry on next user interaction
            console.log('[Music] fadeIn - play FAILED', e)
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
     * Initialize audio analyser for visualization
     * Must be called after user interaction (click/tap)
     */
    initializeAnalyser(): void {
        if (this.audioContext) return // Already initialized

        try {
            this.audioContext = new AudioContext()
            this.analyser = this.audioContext.createAnalyser()
            this.analyser.fftSize = 256 // Smaller for faster response
            this.analyser.smoothingTimeConstant = 0.7 // Smooth transitions
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

            // Connect analyser to destination
            this.analyser.connect(this.audioContext.destination)

            // Connect current track if playing
            if (this.currentTrack) {
                this.connectTrackToAnalyser(this.currentTrack)
            }
        } catch (e) {
            console.warn('Failed to initialize audio analyser:', e)
        }
    }

    /**
     * Connect a track's audio element to the analyser
     */
    private connectTrackToAnalyser(track: MusicTrack): void {
        if (!this.audioContext || !this.analyser) return

        const audio = this.audioElements.get(track)
        if (!audio) return

        // Check if already connected
        if (this.sourceNodes.has(track)) return

        try {
            const source = this.audioContext.createMediaElementSource(audio)
            source.connect(this.analyser)
            this.sourceNodes.set(track, source)
            this.isAnalyserConnected = true
        } catch (e) {
            // Source might already be created - this is fine
            console.warn('Could not connect track to analyser:', e)
        }
    }

    /**
     * Get current audio frequency bands (call this every frame for visualization)
     */
    getAudioBands(): AudioBands {
        const defaultBands: AudioBands = { bass: 0, mid: 0, high: 0, overall: 0 }

        if (!this.analyser || !this.frequencyData || !this.isEnabled) {
            return defaultBands
        }

        // Resume audio context if suspended
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume()
        }

        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData)

        const bufferLength = this.frequencyData.length
        if (bufferLength === 0) return defaultBands

        // Calculate band averages
        // FFT size 256 = 128 bins, each bin = sampleRate/256 Hz
        // Assuming 44100Hz: each bin ~172Hz
        // Bass: bins 0-3 (~0-700Hz)
        // Mid: bins 4-15 (~700-2700Hz)
        // High: bins 16-64 (~2700Hz+)

        let bassSum = 0
        let midSum = 0
        let highSum = 0
        let overallSum = 0

        const bassEnd = Math.min(4, bufferLength)
        const midEnd = Math.min(16, bufferLength)
        const highEnd = Math.min(64, bufferLength)

        for (let i = 0; i < bassEnd; i++) {
            bassSum += this.frequencyData[i]
        }
        for (let i = bassEnd; i < midEnd; i++) {
            midSum += this.frequencyData[i]
        }
        for (let i = midEnd; i < highEnd; i++) {
            highSum += this.frequencyData[i]
        }
        for (let i = 0; i < bufferLength; i++) {
            overallSum += this.frequencyData[i]
        }

        // Normalize to 0-1 range
        const bass = bassSum / (bassEnd * 255)
        const mid = midSum / ((midEnd - bassEnd) * 255)
        const high = highSum / ((highEnd - midEnd) * 255)
        const overall = overallSum / (bufferLength * 255)

        return {
            bass: Math.min(1, bass * 1.5), // Boost bass slightly
            mid: Math.min(1, mid * 1.2),
            high: Math.min(1, high * 1.1),
            overall: Math.min(1, overall * 1.3),
        }
    }

    /**
     * Check if analyser is ready
     */
    isAnalyserReady(): boolean {
        return this.isAnalyserConnected && this.analyser !== null
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

        // Clean up audio context
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
        this.analyser = null
        this.sourceNodes.clear()
        this.frequencyData = null
        this.isAnalyserConnected = false
    }
}

// Singleton instance
export const musicManager = new MusicManager()
