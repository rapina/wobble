/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __DEV_BUILD__: boolean

interface ImportMetaEnv {
    readonly VITE_AD_TESTING: string
    readonly VITE_ADMOB_BANNER_ANDROID: string
    readonly VITE_ADMOB_BANNER_IOS: string
    readonly VITE_ADMOB_REWARD_ANDROID: string
    readonly VITE_ADMOB_REWARD_IOS: string
    readonly VITE_ADMOB_TEST_DEVICES: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
