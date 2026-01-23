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
    AdLoadInfo,
    AdMobRewardItem,
} from '@capacitor-community/admob'

// 테스트 모드 여부 (환경변수로 제어)
export const IS_AD_TESTING = import.meta.env.VITE_AD_TESTING === 'true'

// Test Ad Unit IDs
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111'
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716'
const TEST_REWARD_ID_ANDROID = 'ca-app-pub-3940256099942544/5224354917'
const TEST_REWARD_ID_IOS = 'ca-app-pub-3940256099942544/1712485313'

// Production Ad Unit IDs
const PROD_BANNER_ID_ANDROID = 'ca-app-pub-4114842312318190/5483532947'
const PROD_BANNER_ID_IOS = 'ca-app-pub-XXXXX/YYYYY' // TODO: iOS 배너 ID 설정
const PROD_REWARD_ID_ANDROID = 'ca-app-pub-4114842312318190/3062411404'
const PROD_REWARD_ID_IOS = 'ca-app-pub-XXXXX/ZZZZZ' // TODO: iOS 보상형 ID 설정

// Test Device IDs (MD5 hash of Android ID)
const TEST_DEVICE_IDS = [
    '397475BB1D479B892747EFED8A85E4F4', // rapina's device
]

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
    const [isInitialized, setIsInitialized] = useState(false)
    const [isBannerVisible, setIsBannerVisible] = useState(false)
    const [isRewardAdLoading, setIsRewardAdLoading] = useState(false)
    const [webSimulationActive, setWebSimulationActive] = useState(false)
    const isNative = Capacitor.isNativePlatform()

    // Callbacks for rewarded ad
    const rewardCallbackRef = useRef<(() => void) | null>(null)
    const failCallbackRef = useRef<(() => void) | null>(null)
    // Web simulation callbacks
    const webRewardCallbackRef = useRef<(() => void) | null>(null)
    const webFailCallbackRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!isNative) return

        const initializeAdMob = async () => {
            try {
                await AdMob.initialize({
                    initializeForTesting: IS_AD_TESTING,
                    testingDevices: TEST_DEVICE_IDS,
                })
                setIsInitialized(true)
                console.log('AdMob initialized successfully')
            } catch (error) {
                console.error('AdMob initialization failed:', error)
            }
        }

        initializeAdMob()

        // Set up event listeners
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

        // Reward ad listeners
        const rewardLoadedListener = AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('Reward ad loaded')
        })

        const rewardFailedListener = AdMob.addListener(
            RewardAdPluginEvents.FailedToLoad,
            (error) => {
                console.error('Reward ad failed to load:', error)
                setIsRewardAdLoading(false)
                if (failCallbackRef.current) {
                    failCallbackRef.current()
                    failCallbackRef.current = null
                }
            }
        )

        const rewardedListener = AdMob.addListener(
            RewardAdPluginEvents.Rewarded,
            (reward: AdMobRewardItem) => {
                console.log('User rewarded:', reward)
                if (rewardCallbackRef.current) {
                    rewardCallbackRef.current()
                    rewardCallbackRef.current = null
                }
            }
        )

        const rewardDismissedListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            console.log('Reward ad dismissed')
            setIsRewardAdLoading(false)
        })

        return () => {
            loadedListener.then((l) => l.remove())
            failedListener.then((l) => l.remove())
            openedListener.then((l) => l.remove())
            closedListener.then((l) => l.remove())
            rewardLoadedListener.then((l) => l.remove())
            rewardFailedListener.then((l) => l.remove())
            rewardedListener.then((l) => l.remove())
            rewardDismissedListener.then((l) => l.remove())
        }
    }, [isNative])

    const showBanner = useCallback(async () => {
        if (!isNative || !isInitialized) return

        try {
            const isIOS = Capacitor.getPlatform() === 'ios'
            const adId = IS_AD_TESTING
                ? isIOS
                    ? TEST_BANNER_ID_IOS
                    : TEST_BANNER_ID_ANDROID
                : isIOS
                  ? PROD_BANNER_ID_IOS
                  : PROD_BANNER_ID_ANDROID

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

            if (!isInitialized) {
                console.error('AdMob not initialized')
                onFailed?.()
                return
            }

            setIsRewardAdLoading(true)
            rewardCallbackRef.current = onRewarded
            failCallbackRef.current = onFailed || null

            try {
                const isIOS = Capacitor.getPlatform() === 'ios'
                const adId = IS_AD_TESTING
                    ? isIOS
                        ? TEST_REWARD_ID_IOS
                        : TEST_REWARD_ID_ANDROID
                    : isIOS
                      ? PROD_REWARD_ID_IOS
                      : PROD_REWARD_ID_ANDROID

                const options: RewardAdOptions = {
                    adId,
                    isTesting: IS_AD_TESTING,
                }

                await AdMob.prepareRewardVideoAd(options)
                await AdMob.showRewardVideoAd()
                console.log('Reward ad shown, testing:', IS_AD_TESTING)
            } catch (error) {
                console.error('Failed to show reward ad:', error)
                setIsRewardAdLoading(false)
                onFailed?.()
            }
        },
        [isNative, isInitialized]
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
