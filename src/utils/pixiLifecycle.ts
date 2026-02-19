// Shared global counter for coordinating PixiJS app lifecycle
// This prevents race conditions when multiple PixiJS apps are being created/destroyed
export let activeDestroyCount = 0

export function incrementDestroyCount() {
    activeDestroyCount++
}

export function decrementDestroyCount() {
    activeDestroyCount--
}

export async function waitForDestroys(): Promise<void> {
    if (activeDestroyCount > 0) {
        return new Promise<void>((resolve) => {
            const checkDestroy = () => {
                if (activeDestroyCount === 0) {
                    resolve()
                } else {
                    setTimeout(checkDestroy, 20)
                }
            }
            checkDestroy()
        })
    }
}
