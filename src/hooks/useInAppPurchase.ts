import { useCallback, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { NativePurchases, Product, Transaction } from '@capgo/native-purchases'
import { usePurchaseStore } from '@/stores/purchaseStore'

const REMOVE_ADS_PRODUCT_ID = 'remove_ads'
const UNLOCK_ALL_FORMULAS_PRODUCT_ID = 'unlock_all_formulas'

interface UseInAppPurchaseReturn {
    isNative: boolean
    removeAdsProduct: Product | null
    unlockAllFormulasProduct: Product | null
    isLoading: boolean
    error: string | null
    loadProducts: () => Promise<void>
    purchaseRemoveAds: () => Promise<boolean>
    purchaseUnlockAllFormulas: () => Promise<boolean>
    restorePurchases: () => Promise<boolean>
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
    const isNative = Capacitor.isNativePlatform()
    const [removeAdsProduct, setRemoveAdsProduct] = useState<Product | null>(null)
    const [unlockAllFormulasProduct, setUnlockAllFormulasProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { setAdFree, setAllFormulasUnlocked } = usePurchaseStore()

    const checkPurchaseStatus = useCallback(
        (transactions: Transaction[]): boolean => {
            let hasAnyPurchase = false

            const removeAdsPurchase = transactions.find(
                (t) => t.productIdentifier === REMOVE_ADS_PRODUCT_ID
            )
            if (removeAdsPurchase) {
                setAdFree(true)
                hasAnyPurchase = true
            }

            const unlockAllPurchase = transactions.find(
                (t) => t.productIdentifier === UNLOCK_ALL_FORMULAS_PRODUCT_ID
            )
            if (unlockAllPurchase) {
                setAllFormulasUnlocked(true)
                hasAnyPurchase = true
            }

            // Refund detection: reset flags if purchases not found
            if (!removeAdsPurchase) {
                setAdFree(false)
            }
            if (!unlockAllPurchase) {
                setAllFormulasUnlocked(false)
            }

            return hasAnyPurchase
        },
        [setAdFree, setAllFormulasUnlocked]
    )

    const loadProducts = useCallback(async () => {
        if (!isNative) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await NativePurchases.getProducts({
                productIdentifiers: [REMOVE_ADS_PRODUCT_ID, UNLOCK_ALL_FORMULAS_PRODUCT_ID],
            })

            for (const product of result.products) {
                if (product.identifier === REMOVE_ADS_PRODUCT_ID) {
                    setRemoveAdsProduct(product)
                } else if (product.identifier === UNLOCK_ALL_FORMULAS_PRODUCT_ID) {
                    setUnlockAllFormulasProduct(product)
                }
            }
        } catch (err) {
            console.error('Failed to load products:', err)
            setError('Failed to load products')
        } finally {
            setIsLoading(false)
        }
    }, [isNative])

    const purchaseRemoveAds = useCallback(async (): Promise<boolean> => {
        if (!isNative) return false

        setIsLoading(true)
        setError(null)

        try {
            const transaction = await NativePurchases.purchaseProduct({
                productIdentifier: REMOVE_ADS_PRODUCT_ID,
            })

            if (transaction && transaction.transactionId) {
                setAdFree(true)
                return true
            }
            return false
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Purchase failed'
            console.error('Purchase failed:', err)
            setError(errorMessage)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isNative, setAdFree])

    const purchaseUnlockAllFormulas = useCallback(async (): Promise<boolean> => {
        if (!isNative) return false

        setIsLoading(true)
        setError(null)

        try {
            const transaction = await NativePurchases.purchaseProduct({
                productIdentifier: UNLOCK_ALL_FORMULAS_PRODUCT_ID,
            })

            if (transaction && transaction.transactionId) {
                setAllFormulasUnlocked(true)
                return true
            }
            return false
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Purchase failed'
            console.error('Purchase failed:', err)
            setError(errorMessage)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isNative, setAllFormulasUnlocked])

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        if (!isNative) return false

        setIsLoading(true)
        setError(null)

        try {
            // First restore purchases from the store
            await NativePurchases.restorePurchases()

            // Then get the list of purchases
            const result = await NativePurchases.getPurchases()
            const hasAnyPurchase = checkPurchaseStatus(result.purchases)
            return hasAnyPurchase
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Restore failed'
            console.error('Restore failed:', err)
            setError(errorMessage)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isNative, checkPurchaseStatus])

    return {
        isNative,
        removeAdsProduct,
        unlockAllFormulasProduct,
        isLoading,
        error,
        loadProducts,
        purchaseRemoveAds,
        purchaseUnlockAllFormulas,
        restorePurchases,
    }
}
