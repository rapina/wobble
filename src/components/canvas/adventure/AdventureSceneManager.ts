import { Application } from 'pixi.js'
import { AdventureScene, AdventureSceneOptions } from './AdventureScene'
import { PhysicsSurvivorScene } from './PhysicsSurvivorScene'

type AdventureSceneConstructor = new (
    app: Application,
    options?: AdventureSceneOptions
) => AdventureScene

// Map level IDs to their scene classes
const sceneMap: Record<string, AdventureSceneConstructor> = {
    'physics-survivor': PhysicsSurvivorScene,
}

/**
 * Get the scene class for a given level ID
 */
export function getAdventureSceneClass(levelId: string): AdventureSceneConstructor | null {
    return sceneMap[levelId] || null
}

/**
 * Create an adventure scene instance for a given level
 */
export function createAdventureScene(
    levelId: string,
    app: Application,
    options?: AdventureSceneOptions
): AdventureScene | null {
    const SceneClass = getAdventureSceneClass(levelId)
    if (!SceneClass) {
        console.warn(`No adventure scene found for level: ${levelId}`)
        return null
    }
    return new SceneClass(app, options)
}

/**
 * Check if a level has an adventure scene
 */
export function hasAdventureScene(levelId: string): boolean {
    return levelId in sceneMap
}
