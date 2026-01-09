import { useEffect, useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import {
    AdMob,
    BannerAdOptions,
    BannerAdSize,
    BannerAdPosition,
    BannerAdPluginEvents,
    AdMobBannerSize,
} from '@capacitor-community/admob'

// 테스트 모드 여부 (환경변수로 제어)
export const IS_AD_TESTING = import.meta.env.VITE_AD_TESTING === 'true'

// Test Ad Unit IDs
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111'
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716'

// Production Ad Unit IDs (TODO: 실제 ID로 교체)
const PROD_BANNER_ID_ANDROID = 'ca-app-pub-XXXXX/YYYYY'
const PROD_BANNER_ID_IOS = 'ca-app-pub-XXXXX/YYYYY'

interface UseAdMobReturn {
    isInitialized: boolean
    isBannerVisible: boolean
    showBanner: () => Promise<void>
    hideBanner: () => Promise<void>
    isNative: boolean
}

export function useAdMob(): UseAdMobReturn {
    const [isInitialized, setIsInitialized] = useState(false)
    const [isBannerVisible, setIsBannerVisible] = useState(false)
    const isNative = Capacitor.isNativePlatform()

    useEffect(() => {
        if (!isNative) return

        const initializeAdMob = async () => {
            try {
                await AdMob.initialize({
                    initializeForTesting: IS_AD_TESTING,
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

    return {
        isInitialized,
        isBannerVisible,
        showBanner,
        hideBanner,
        isNative,
    }
}
