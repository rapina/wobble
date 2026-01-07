import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativePurchases, Product, Transaction } from '@capgo/native-purchases';
import { usePurchaseStore } from '@/stores/purchaseStore';

const REMOVE_ADS_PRODUCT_ID = 'remove_ads';

interface UseInAppPurchaseReturn {
    isNative: boolean;
    product: Product | null;
    isLoading: boolean;
    error: string | null;
    loadProduct: () => Promise<void>;
    purchaseRemoveAds: () => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
    const isNative = Capacitor.isNativePlatform();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setAdFree } = usePurchaseStore();

    const checkPurchaseStatus = useCallback((transactions: Transaction[]): boolean => {
        const removeAdsPurchase = transactions.find(
            (t) => t.productIdentifier === REMOVE_ADS_PRODUCT_ID
        );

        if (removeAdsPurchase) {
            setAdFree(true);
            return true;
        }
        return false;
    }, [setAdFree]);

    const loadProduct = useCallback(async () => {
        if (!isNative) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await NativePurchases.getProducts({
                productIdentifiers: [REMOVE_ADS_PRODUCT_ID],
            });

            if (result.products.length > 0) {
                setProduct(result.products[0]);
            }
        } catch (err) {
            console.error('Failed to load product:', err);
            setError('Failed to load product');
        } finally {
            setIsLoading(false);
        }
    }, [isNative]);

    const purchaseRemoveAds = useCallback(async (): Promise<boolean> => {
        if (!isNative) return false;

        setIsLoading(true);
        setError(null);

        try {
            const transaction = await NativePurchases.purchaseProduct({
                productIdentifier: REMOVE_ADS_PRODUCT_ID,
            });

            if (transaction && transaction.transactionId) {
                setAdFree(true);
                return true;
            }
            return false;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
            console.error('Purchase failed:', err);
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isNative, setAdFree]);

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        if (!isNative) return false;

        setIsLoading(true);
        setError(null);

        try {
            // First restore purchases from the store
            await NativePurchases.restorePurchases();

            // Then get the list of purchases
            const result = await NativePurchases.getPurchases();
            const hasRemoveAds = checkPurchaseStatus(result.purchases);
            return hasRemoveAds;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Restore failed';
            console.error('Restore failed:', err);
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isNative, checkPurchaseStatus]);

    return {
        isNative,
        product,
        isLoading,
        error,
        loadProduct,
        purchaseRemoveAds,
        restorePurchases,
    };
}
