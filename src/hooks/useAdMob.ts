import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    AdMob,
    BannerAdOptions,
    BannerAdSize,
    BannerAdPosition,
    BannerAdPluginEvents,
    AdMobBannerSize,
} from '@capacitor-community/admob';

// Test Ad Unit IDs
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716';

interface UseAdMobReturn {
    isInitialized: boolean;
    isBannerVisible: boolean;
    showBanner: () => Promise<void>;
    hideBanner: () => Promise<void>;
    isNative: boolean;
}

export function useAdMob(): UseAdMobReturn {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (!isNative) return;

        const initializeAdMob = async () => {
            try {
                await AdMob.initialize({
                    initializeForTesting: true,
                });
                setIsInitialized(true);
                console.log('AdMob initialized successfully');
            } catch (error) {
                console.error('AdMob initialization failed:', error);
            }
        };

        initializeAdMob();

        // Set up event listeners
        const loadedListener = AdMob.addListener(
            BannerAdPluginEvents.Loaded,
            () => {
                console.log('Banner ad loaded');
            }
        );

        const failedListener = AdMob.addListener(
            BannerAdPluginEvents.FailedToLoad,
            (error) => {
                console.error('Banner ad failed to load:', error);
            }
        );

        const openedListener = AdMob.addListener(
            BannerAdPluginEvents.Opened,
            () => {
                console.log('Banner ad opened');
            }
        );

        const closedListener = AdMob.addListener(
            BannerAdPluginEvents.Closed,
            () => {
                console.log('Banner ad closed');
            }
        );

        return () => {
            loadedListener.then(l => l.remove());
            failedListener.then(l => l.remove());
            openedListener.then(l => l.remove());
            closedListener.then(l => l.remove());
        };
    }, [isNative]);

    const showBanner = useCallback(async () => {
        if (!isNative || !isInitialized) return;

        try {
            const adId = Capacitor.getPlatform() === 'ios'
                ? TEST_BANNER_ID_IOS
                : TEST_BANNER_ID_ANDROID;

            const options: BannerAdOptions = {
                adId,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                isTesting: true,
            };

            await AdMob.showBanner(options);
            setIsBannerVisible(true);
            console.log('Banner shown');
        } catch (error) {
            console.error('Failed to show banner:', error);
        }
    }, [isNative, isInitialized]);

    const hideBanner = useCallback(async () => {
        if (!isNative) return;

        try {
            await AdMob.hideBanner();
            setIsBannerVisible(false);
            console.log('Banner hidden');
        } catch (error) {
            console.error('Failed to hide banner:', error);
        }
    }, [isNative]);

    return {
        isInitialized,
        isBannerVisible,
        showBanner,
        hideBanner,
        isNative,
    };
}
