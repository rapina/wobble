import { Share, ShareResult } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

export interface GameShareData {
    score: number
    kills: number
    time: number
    level: number
    rank: string
}

export interface ShareOptions {
    title?: string
    text: string
    url?: string
    dialogTitle?: string
}

/**
 * Check if sharing is available on the current platform
 */
export async function canShare(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        // Web: check for Web Share API
        return typeof navigator !== 'undefined' && !!navigator.share
    }
    return true
}

/**
 * Share content using native share dialog or Web Share API
 */
export async function share(options: ShareOptions): Promise<ShareResult | null> {
    try {
        if (Capacitor.isNativePlatform()) {
            return await Share.share({
                title: options.title,
                text: options.text,
                url: options.url,
                dialogTitle: options.dialogTitle,
            })
        } else if (typeof navigator !== 'undefined' && navigator.share) {
            // Web Share API fallback
            await navigator.share({
                title: options.title,
                text: options.text,
                url: options.url,
            })
            return { activityType: 'web-share' }
        }
    } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error)
    }
    return null
}

/**
 * Format time in mm:ss format
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate share text for game results
 */
export function generateGameShareText(data: GameShareData, lang: 'ko' | 'en' = 'ko'): string {
    const timeStr = formatTime(data.time)

    if (lang === 'ko') {
        return `Wobble 서바이버에서 ${data.rank} 랭크 달성!

Level ${data.level} | ${data.kills} 처치 | ${timeStr} 생존

물리 공식으로 싸우는 서바이버 게임!
#Wobble #물리게임 #서바이버`
    } else {
        return `Achieved ${data.rank} rank in Wobble Survivor!

Level ${data.level} | ${data.kills} kills | ${timeStr} survived

A survivor game powered by physics formulas!
#Wobble #PhysicsGame #Survivor`
    }
}

/**
 * Share game result
 */
export async function shareGameResult(
    data: GameShareData,
    lang: 'ko' | 'en' = 'ko'
): Promise<ShareResult | null> {
    const text = generateGameShareText(data, lang)

    return share({
        title: 'Wobble',
        text,
        url: 'https://wobble.app', // TODO: Replace with actual app store URL
        dialogTitle: lang === 'ko' ? '결과 공유하기' : 'Share Result',
    })
}
