/**
 * RunMapGenerator.ts - Linear map generation for Wobblediver runs
 *
 * Generates a simple linear progression of stages, each with
 * a unique seed for deterministic gimmick generation.
 */

import { SeededRandom } from '@/utils/SeededRandom'
import {
    RunMap,
    RunLength,
    MapNode,
    createNodeId,
} from './RunMapTypes'

/**
 * Static map generator class
 */
export class RunMapGenerator {
    /**
     * Generate a linear run map
     */
    static generate(runSeed: number, maxDepth: RunLength): RunMap {
        const { nodes, startNodeIds } = this.generateLegacy(runSeed, maxDepth)

        return {
            runSeed,
            maxDepth,
            nodes,
            startNodeIds,
        }
    }

    /**
     * Legacy: Generate map with old node structure for compatibility
     */
    static generateLegacy(runSeed: number, maxDepth: RunLength): {
        nodes: Record<string, MapNode>
        startNodeIds: string[]
    } {
        const nodes: Record<string, MapNode> = {}

        for (let depth = 1; depth <= maxDepth; depth++) {
            const nodeId = createNodeId(depth, 0)
            const stageSeed = SeededRandom.createStageSeed(runSeed, depth)
            const nextNodeId = depth < maxDepth ? createNodeId(depth + 1, 0) : null

            nodes[nodeId] = {
                id: nodeId,
                depth,
                column: 0,
                type: 'normal',
                connections: nextNodeId ? [nextNodeId] : [],
                visited: false,
                stageSeed,
            }
        }

        return {
            nodes,
            startNodeIds: [createNodeId(1, 0)],
        }
    }
}
