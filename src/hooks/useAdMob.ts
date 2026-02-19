import { useEffect, useState, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import {
    AdMob,
    BannerAdOptions,
    BannerAdSize,
    BannerAdPosition,
    BannerAdPluginEvents,
    RewardAdOptions,
    RewardAdPluginEvents,
    AdMobRewardItem,
} from '@capacitor-community/admob'

// 테스트 모드 여부 (환경변수로 제어)
export const IS_AD_TESTING = import.meta.env.VITE_AD_TESTING === 'true'

// Ad Unit IDs from environment variables
const BANNER_ID_ANDROID = import.meta.env.VITE_ADMOB_BANNER_ANDROID || ''
const BANNER_ID_IOS = import.meta.env.VITE_ADMOB_BANNER_IOS || ''
const REWARD_ID_ANDROID = import.meta.env.VITE_ADMOB_REWARD_ANDROID || ''
const REWARD_ID_IOS = import.meta.env.VITE_ADMOB_REWARD_IOS || ''

// Test Device IDs from environment variables (comma-separated)
const TEST_DEVICE_IDS = (import.meta.env.VITE_ADMOB_TEST_DEVICES || '')
    .split(',')
    .map((id: string) => id.trim())
    .filter(Boolean)

// Module-level singleton state - shared across all hook instances
let globalInitialized = false
let globalInitPromise: Promise<void> | null = null
let globalListenersSetUp = false

// Module-level callbacks for reward ads - survives React lifecycle
let globalRewardCallback: (() => void) | null = null
let globalFailCallback: (() => void) | null = null
let globalLoadingChangeCallback: ((loading: boolean) => void) | null = null

function setupGlobalRewardListeners(): void {
    if (globalListenersSetUp) return
    globalListenersSetUp = true

    console.log('[AD-DEBUG] Setting up global reward listeners, events:', JSON.stringify(RewardAdPluginEvents))

    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('[AD-DEBUG] EVENT: Reward ad loaded')
    })

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
        console.error('[AD-DEBUG] EVENT: Reward ad failed to load:', JSON.stringify(error))
        globalLoadingChangeCallback?.(false)
        if (globalFailCallback) {
            globalFailCallback()
            globalFailCallback = null
        }
        globalRewardCallback = null
    })

    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        console.log('[AD-DEBUG] EVENT: User rewarded:', JSON.stringify(reward))
        if (globalRewardCallback) {
            globalRewardCallback()
            globalRewardCallback = null
        }
        globalFailCallback = null
    })

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('[AD-DEBUG] EVENT: Reward ad dismissed')
        globalLoadingChangeCallback?.(false)
    })

    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
        console.error('[AD-DEBUG] EVENT: Reward ad failed to show:', JSON.stringify(error))
        globalLoadingChangeCallback?.(false)
        if (globalFailCallback) {
            globalFailCallback()
            globalFailCallback = null
        }
        globalRewardCallback = null
    })

    console.log('[AD-DEBUG] Global reward ad listeners set up complete')
}

function ensureAdMobInitialized(): Promise<void> {
    if (globalInitialized) return Promise.resolve()
    if (globalInitPromise) return globalInitPromise

    console.log('[AD-DEBUG] ensureAdMobInitialized: starting initialization...')

    // AdMob.initialize() can hang on page reload when the native SDK is already initialized.
    // Add a timeout: if it doesn't resolve in 5 seconds, assume native SDK is ready.
    const initWithTimeout = Promise.race([
        AdMob.initialize({
            initializeForTesting: IS_AD_TESTING,
            ...(IS_AD_TESTING && TEST_DEVICE_IDS.length > 0 && { testingDevices: TEST_DEVICE_IDS }),
        }),
        new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('[AD-DEBUG] ensureAdMobInitialized: timeout reached, assuming native SDK already initialized')
                resolve()
            }, 5000)
        }),
    ])

    globalInitPromise = initWithTimeout
        .then(() => {
            globalInitialized = true
            console.log('[AD-DEBUG] AdMob initialized successfully')
            setupGlobalRewardListeners()
        })
        .catch((error) => {
            globalInitPromise = null // 실패 시 재시도 허용
            console.error('[AD-DEBUG] AdMob initialization failed:', error)
        })

    return globalInitPromise
}

interface UseAdMobReturn {
    isInitialized: boolean
    isBannerVisible: boolean
    isRewardAdLoading: boolean
    showBanner: () => Promise<void>
    hideBanner: () => Promise<void>
    showRewardAd: (onRewarded: () => void, onFailed?: () => void) => Promise<void>
    isNative: boolean
    // Web simulation
    webSimulationActive: boolean
    completeWebSimulation: () => void
    cancelWebSimulation: () => void
}

export function useAdMob(): UseAdMobReturn {
    const [isInitialized, setIsInitialized] = useState(globalInitialized)
    const [isBannerVisible, setIsBannerVisible] = useState(false)
    const [isRewardAdLoading, setIsRewardAdLoading] = useState(false)
    const [webSimulationActive, setWebSimulationActive] = useState(false)
    const isNative = Capacitor.isNativePlatform()

    // Web simulation callbacks
    const webRewardCallbackRef = useRef<(() => void) | null>(null)
    const webFailCallbackRef = useRef<(() => void) | null>(null)

    // Register this hook instance's loading state setter as the global callback
    useEffect(() => {
        if (!isNative) return
        globalLoadingChangeCallback = setIsRewardAdLoading
        return () => {
            if (globalLoadingChangeCallback === setIsRewardAdLoading) {
                globalLoadingChangeCallback = null
            }
        }
    }, [isNative])

    useEffect(() => {
        if (!isNative) return

        // 싱글톤 초기화 후 로컬 state 동기화
        ensureAdMobInitialized().then(() => {
            setIsInitialized(true)
        })

        // Banner listeners (per-instance, less critical)
        const loadedListener = AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            console.log('Banner ad loaded')
        })

        const failedListener = AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
            console.error('Banner ad failed to load:', error)
        })

        const openedListener = AdMob.addListener(BannerAdPluginEvents.Opened, () => {
            console.log('Banner ad opened')
        })

        const closedListener = AdMob.addListener(BannerAdPluginEvents.Closed, () => {
            console.log('Banner ad closed')
        })

        // Reward ad listeners are set up at module level (setupGlobalRewardListeners)
        // to survive React StrictMode double-mount and component re-renders

        return () => {
            loadedListener.then((l) => l.remove())
            failedListener.then((l) => l.remove())
            openedListener.then((l) => l.remove())
            closedListener.then((l) => l.remove())
        }
    }, [isNative])

    const showBanner = useCallback(async () => {
        if (!isNative || !isInitialized) return

        try {
            const isIOS = Capacitor.getPlatform() === 'ios'
            const adId = isIOS ? BANNER_ID_IOS : BANNER_ID_ANDROID

            const options: BannerAdOptions = {
                adId,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                isTesting: IS_AD_TESTING,
            }

            await AdMob.showBanner(options)
            setIsBannerVisible(true)
            console.log('Banner shown, testing:', IS_AD_TESTING)
        } catch (error) {
            console.error('Failed to show banner:', error)
        }
    }, [isNative, isInitialized])

    const hideBanner = useCallback(async () => {
        if (!isNative) return

        try {
            await AdMob.hideBanner()
            setIsBannerVisible(false)
            console.log('Banner hidden')
        } catch (error) {
            console.error('Failed to hide banner:', error)
        }
    }, [isNative])

    // Web simulation functions
    const completeWebSimulation = useCallback(() => {
        if (webRewardCallbackRef.current) {
            webRewardCallbackRef.current()
            webRewardCallbackRef.current = null
        }
        webFailCallbackRef.current = null
        setWebSimulationActive(false)
    }, [])

    const cancelWebSimulation = useCallback(() => {
        if (webFailCallbackRef.current) {
            webFailCallbackRef.current()
        }
        webRewardCallbackRef.current = null
        webFailCallbackRef.current = null
        setWebSimulationActive(false)
    }, [])

    const showRewardAd = useCallback(
        async (onRewarded: () => void, onFailed?: () => void) => {
            // 웹에서는 시뮬레이션 UI 표시
            if (!isNative) {
                console.log('Web: Starting reward ad simulation')
                webRewardCallbackRef.current = onRewarded
                webFailCallbackRef.current = onFailed || null
                setWebSimulationActive(true)
                return
            }

            // 초기화 안됐으면 대기 후 재확인
            console.log('[AD-DEBUG] showRewardAd: globalInitialized=', globalInitialized, 'globalListenersSetUp=', globalListenersSetUp)
            if (!globalInitialized) {
                console.log('[AD-DEBUG] showRewardAd: AdMob not yet initialized, waiting...')
                await ensureAdMobInitialized()
            }

            if (!globalInitialized) {
                console.error('[AD-DEBUG] showRewardAd: AdMob initialization failed, calling onFailed')
                onFailed?.()
                return
            }

            console.log('[AD-DEBUG] showRewardAd: setting loading=true, globalListenersSetUp=', globalListenersSetUp)
            setIsRewardAdLoading(true)
            globalRewardCallback = onRewarded
            globalFailCallback = onFailed || null

            try {
                const isIOS = Capacitor.getPlatform() === 'ios'
                const adId = isIOS ? REWARD_ID_IOS : REWARD_ID_ANDROID

                const options: RewardAdOptions = {
                    adId,
                    isTesting: IS_AD_TESTING,
                }

                console.log('[AD-DEBUG] showRewardAd: calling prepareRewardVideoAd with adId:', adId, 'isTesting:', IS_AD_TESTING)

                // prepareRewardVideoAd can hang silently on some devices/SDK versions.
                // Add a 10-second timeout to prevent infinite loading.
                const prepareWithTimeout = Promise.race([
                    AdMob.prepareRewardVideoAd(options),
                    new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error('prepareRewardVideoAd timeout (10s)')), 10000)
                    }),
                ])

                const loadInfo = await prepareWithTimeout
                console.log('[AD-DEBUG] showRewardAd: prepareRewardVideoAd resolved:', JSON.stringify(loadInfo))
                console.log('[AD-DEBUG] showRewardAd: calling showRewardVideoAd')
                await AdMob.showRewardVideoAd()
                console.log('[AD-DEBUG] showRewardAd: showRewardVideoAd resolved')
            } catch (error) {
                console.error('[AD-DEBUG] showRewardAd: CAUGHT ERROR:', error)
                setIsRewardAdLoading(false)
                onFailed?.()
            }
        },
        [isNative]
    )

    return {
        isInitialized,
        isBannerVisible,
        isRewardAdLoading,
        showBanner,
        hideBanner,
        showRewardAd,
        isNative,
        // Web simulation
        webSimulationActive,
        completeWebSimulation,
        cancelWebSimulation,
    }
}
