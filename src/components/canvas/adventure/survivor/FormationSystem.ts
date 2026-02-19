import { EnemyTier } from './types'
import { EnemyVariantId } from './EnemyVariants'

/**
 * Formation System
 * Defines spawn patterns and group behaviors for enemies
 */

export type FormationId =
    | 'random' // 무작위 스폰 (기본)
    | 'circle' // 원형 포위
    | 'line' // 직선 행렬
    | 'v_shape' // V자 형태
    | 'pincer' // 양쪽에서 협공
    | 'wave' // 파도처럼 밀려옴
    | 'spiral' // 나선형
    | 'cluster' // 뭉쳐서 스폰
    | 'cross' // 십자 형태
    | 'diamond' // 다이아몬드 형태

export interface SpawnPoint {
    offsetX: number // 중심점 기준 X 오프셋
    offsetY: number // 중심점 기준 Y 오프셋
    delay?: number // 스폰 지연 (초)
    variant?: EnemyVariantId // 특정 변종 지정
    tier?: EnemyTier // 특정 티어 지정
}

export interface FormationDef {
    id: FormationId
    name: string

    // 포메이션 설정
    enemyCount: { min: number; max: number } // 적 수 범위
    spawnRadius: number // 스폰 반경 (플레이어 기준)

    // 동적 스폰 포인트 생성
    generatePoints: (
        count: number,
        centerX: number,
        centerY: number,
        playerX: number,
        playerY: number,
        radius: number
    ) => SpawnPoint[]

    // 특수 설정
    approach?: 'simultaneous' | 'sequential' | 'wave' // 접근 방식
    maintainFormation?: boolean // 포메이션 유지 여부

    // 스폰 조건
    minGameTime?: number
    minEnemyCount?: number // 최소 기존 적 수 (없으면 스폰)
    cooldown: number // 재사용 대기시간
    weight: number // 선택 가중치
}

/**
 * Formation definitions
 */
export const FORMATIONS: Record<FormationId, FormationDef> = {
    random: {
        id: 'random',
        name: '무작위',
        enemyCount: { min: 1, max: 3 },
        spawnRadius: 400,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2
                const dist = radius * (0.8 + Math.random() * 0.4)
                points.push({
                    offsetX: Math.cos(angle) * dist,
                    offsetY: Math.sin(angle) * dist,
                })
            }
            return points
        },
        cooldown: 0,
        weight: 10,
    },

    circle: {
        id: 'circle',
        name: '포위',
        enemyCount: { min: 6, max: 12 },
        spawnRadius: 350,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const angleStep = (Math.PI * 2) / count
            const startAngle = Math.random() * Math.PI * 2

            for (let i = 0; i < count; i++) {
                const angle = startAngle + angleStep * i
                points.push({
                    offsetX: Math.cos(angle) * radius,
                    offsetY: Math.sin(angle) * radius,
                    delay: i * 0.05, // 순차적으로 나타남
                })
            }
            return points
        },
        approach: 'simultaneous',
        maintainFormation: false,
        minGameTime: 60,
        cooldown: 15,
        weight: 5,
    },

    line: {
        id: 'line',
        name: '직선',
        enemyCount: { min: 5, max: 10 },
        spawnRadius: 400,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            // 플레이어 반대 방향에서 직선으로
            const angleToPlayer = Math.atan2(playerY - centerY, playerX - centerX)
            const spawnAngle = angleToPlayer + Math.PI // 반대편
            const lineWidth = 200
            const spacing = lineWidth / (count - 1 || 1)

            const perpAngle = spawnAngle + Math.PI / 2
            const startOffset = -lineWidth / 2

            for (let i = 0; i < count; i++) {
                const linePos = startOffset + spacing * i
                points.push({
                    offsetX: Math.cos(spawnAngle) * radius + Math.cos(perpAngle) * linePos,
                    offsetY: Math.sin(spawnAngle) * radius + Math.sin(perpAngle) * linePos,
                })
            }
            return points
        },
        approach: 'wave',
        minGameTime: 45,
        cooldown: 10,
        weight: 6,
    },

    v_shape: {
        id: 'v_shape',
        name: 'V자',
        enemyCount: { min: 5, max: 9 },
        spawnRadius: 400,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const angleToPlayer = Math.atan2(playerY - centerY, playerX - centerX)
            const spawnAngle = angleToPlayer + Math.PI
            const vAngle = Math.PI / 6 // V자 각도 (30도)

            // 가운데 리더
            points.push({
                offsetX: Math.cos(spawnAngle) * radius,
                offsetY: Math.sin(spawnAngle) * radius,
                variant: 'charger', // 리더는 돌진자
            })

            // 양쪽 날개
            const wingCount = Math.floor((count - 1) / 2)
            for (let i = 1; i <= wingCount; i++) {
                const dist = radius + i * 30
                // 왼쪽
                points.push({
                    offsetX: Math.cos(spawnAngle + vAngle * i * 0.3) * dist,
                    offsetY: Math.sin(spawnAngle + vAngle * i * 0.3) * dist,
                    delay: i * 0.1,
                })
                // 오른쪽
                points.push({
                    offsetX: Math.cos(spawnAngle - vAngle * i * 0.3) * dist,
                    offsetY: Math.sin(spawnAngle - vAngle * i * 0.3) * dist,
                    delay: i * 0.1,
                })
            }
            return points
        },
        approach: 'simultaneous',
        minGameTime: 90,
        cooldown: 20,
        weight: 4,
    },

    pincer: {
        id: 'pincer',
        name: '협공',
        enemyCount: { min: 6, max: 10 },
        spawnRadius: 380,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const angleToPlayer = Math.atan2(playerY - centerY, playerX - centerX)
            const halfCount = Math.floor(count / 2)

            // 왼쪽 그룹
            const leftAngle = angleToPlayer + Math.PI + Math.PI / 3
            for (let i = 0; i < halfCount; i++) {
                const spread = (i - halfCount / 2) * 25
                points.push({
                    offsetX:
                        Math.cos(leftAngle) * radius + Math.cos(leftAngle + Math.PI / 2) * spread,
                    offsetY:
                        Math.sin(leftAngle) * radius + Math.sin(leftAngle + Math.PI / 2) * spread,
                    delay: i * 0.05,
                })
            }

            // 오른쪽 그룹
            const rightAngle = angleToPlayer + Math.PI - Math.PI / 3
            for (let i = 0; i < count - halfCount; i++) {
                const spread = (i - (count - halfCount) / 2) * 25
                points.push({
                    offsetX:
                        Math.cos(rightAngle) * radius + Math.cos(rightAngle + Math.PI / 2) * spread,
                    offsetY:
                        Math.sin(rightAngle) * radius + Math.sin(rightAngle + Math.PI / 2) * spread,
                    delay: i * 0.05,
                })
            }
            return points
        },
        approach: 'simultaneous',
        minGameTime: 120,
        cooldown: 25,
        weight: 3,
    },

    wave: {
        id: 'wave',
        name: '파도',
        enemyCount: { min: 8, max: 15 },
        spawnRadius: 450,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const angleToPlayer = Math.atan2(playerY - centerY, playerX - centerX)
            const spawnAngle = angleToPlayer + Math.PI
            const waveWidth = 300
            const waveRows = 3
            const enemiesPerRow = Math.ceil(count / waveRows)

            for (let row = 0; row < waveRows; row++) {
                const rowCount = Math.min(enemiesPerRow, count - row * enemiesPerRow)
                const rowRadius = radius + row * 50
                const spacing = waveWidth / (rowCount - 1 || 1)
                const perpAngle = spawnAngle + Math.PI / 2

                for (let i = 0; i < rowCount; i++) {
                    const linePos = -waveWidth / 2 + spacing * i
                    points.push({
                        offsetX: Math.cos(spawnAngle) * rowRadius + Math.cos(perpAngle) * linePos,
                        offsetY: Math.sin(spawnAngle) * rowRadius + Math.sin(perpAngle) * linePos,
                        delay: row * 0.3,
                    })
                }
            }
            return points
        },
        approach: 'wave',
        minGameTime: 150,
        cooldown: 30,
        weight: 3,
    },

    spiral: {
        id: 'spiral',
        name: '나선',
        enemyCount: { min: 8, max: 16 },
        spawnRadius: 300,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const startAngle = Math.random() * Math.PI * 2
            const turns = 1.5 // 나선 회전 수

            for (let i = 0; i < count; i++) {
                const progress = i / count
                const angle = startAngle + progress * Math.PI * 2 * turns
                const dist = radius * (0.6 + progress * 0.6)
                points.push({
                    offsetX: Math.cos(angle) * dist,
                    offsetY: Math.sin(angle) * dist,
                    delay: i * 0.1,
                })
            }
            return points
        },
        approach: 'sequential',
        minGameTime: 180,
        cooldown: 25,
        weight: 3,
    },

    cluster: {
        id: 'cluster',
        name: '뭉치기',
        enemyCount: { min: 4, max: 8 },
        spawnRadius: 350,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const angle = Math.random() * Math.PI * 2
            const clusterRadius = 40

            for (let i = 0; i < count; i++) {
                const localAngle = Math.random() * Math.PI * 2
                const localDist = Math.random() * clusterRadius
                points.push({
                    offsetX: Math.cos(angle) * radius + Math.cos(localAngle) * localDist,
                    offsetY: Math.sin(angle) * radius + Math.sin(localAngle) * localDist,
                    delay: Math.random() * 0.2,
                })
            }
            return points
        },
        approach: 'simultaneous',
        minGameTime: 30,
        cooldown: 8,
        weight: 7,
    },

    cross: {
        id: 'cross',
        name: '십자',
        enemyCount: { min: 8, max: 12 },
        spawnRadius: 400,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const perArm = Math.floor(count / 4)
            const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]

            for (const baseAngle of angles) {
                for (let i = 0; i < perArm; i++) {
                    const dist = radius - i * 40
                    points.push({
                        offsetX: Math.cos(baseAngle) * dist,
                        offsetY: Math.sin(baseAngle) * dist,
                        delay: i * 0.1,
                    })
                }
            }
            return points
        },
        approach: 'simultaneous',
        minGameTime: 210,
        cooldown: 30,
        weight: 2,
    },

    diamond: {
        id: 'diamond',
        name: '다이아몬드',
        enemyCount: { min: 8, max: 12 },
        spawnRadius: 350,
        generatePoints: (count, centerX, centerY, playerX, playerY, radius) => {
            const points: SpawnPoint[] = []
            const perSide = Math.floor(count / 4)
            const corners = [
                { x: 0, y: -1 }, // 위
                { x: 1, y: 0 }, // 오른쪽
                { x: 0, y: 1 }, // 아래
                { x: -1, y: 0 }, // 왼쪽
            ]

            for (let side = 0; side < 4; side++) {
                const start = corners[side]
                const end = corners[(side + 1) % 4]

                for (let i = 0; i < perSide; i++) {
                    const t = i / perSide
                    const x = start.x + (end.x - start.x) * t
                    const y = start.y + (end.y - start.y) * t
                    points.push({
                        offsetX: x * radius,
                        offsetY: y * radius,
                        delay: (side * perSide + i) * 0.05,
                    })
                }
            }
            return points
        },
        approach: 'simultaneous',
        minGameTime: 240,
        cooldown: 35,
        weight: 2,
    },
}

/**
 * Formation Spawner - manages formation spawning
 */
export class FormationSpawner {
    private cooldowns: Map<FormationId, number> = new Map()
    private pendingSpawns: Array<{
        point: SpawnPoint
        centerX: number
        centerY: number
        tier: EnemyTier
        formationId: FormationId
        spawnTime: number
    }> = []

    /**
     * Update cooldowns
     */
    update(deltaSeconds: number): void {
        for (const [id, cooldown] of this.cooldowns) {
            if (cooldown > 0) {
                this.cooldowns.set(id, cooldown - deltaSeconds)
            }
        }
    }

    /**
     * Get pending spawns that are ready
     */
    getPendingSpawns(currentTime: number): Array<{
        point: SpawnPoint
        centerX: number
        centerY: number
        tier: EnemyTier
        formationId: FormationId
    }> {
        const ready = this.pendingSpawns.filter((s) => currentTime >= s.spawnTime)
        this.pendingSpawns = this.pendingSpawns.filter((s) => currentTime < s.spawnTime)
        return ready
    }

    /**
     * Get available formations based on game state
     */
    getAvailableFormations(gameTime: number, currentEnemyCount: number): FormationDef[] {
        return Object.values(FORMATIONS).filter((formation) => {
            // Check min game time
            if (formation.minGameTime && gameTime < formation.minGameTime) {
                return false
            }

            // Check cooldown
            const cooldown = this.cooldowns.get(formation.id) ?? 0
            if (cooldown > 0) {
                return false
            }

            // Check min enemy count (for formations that only trigger when few enemies)
            if (
                formation.minEnemyCount !== undefined &&
                currentEnemyCount > formation.minEnemyCount
            ) {
                return false
            }

            return true
        })
    }

    /**
     * Select a random formation based on weights
     */
    selectFormation(availableFormations: FormationDef[]): FormationDef {
        if (availableFormations.length === 0) {
            return FORMATIONS.random
        }

        const totalWeight = availableFormations.reduce((sum, f) => sum + f.weight, 0)
        let random = Math.random() * totalWeight

        for (const formation of availableFormations) {
            random -= formation.weight
            if (random <= 0) {
                return formation
            }
        }

        return availableFormations[availableFormations.length - 1]
    }

    /**
     * Spawn a formation
     * Returns spawn points for immediate spawning, queues delayed spawns
     */
    spawnFormation(
        formation: FormationDef,
        playerX: number,
        playerY: number,
        gameTime: number,
        tier: EnemyTier = 'small'
    ): SpawnPoint[] {
        const count =
            formation.enemyCount.min +
            Math.floor(Math.random() * (formation.enemyCount.max - formation.enemyCount.min + 1))

        // Center point for formation (around player)
        const centerX = playerX
        const centerY = playerY

        const points = formation.generatePoints(
            count,
            centerX,
            centerY,
            playerX,
            playerY,
            formation.spawnRadius
        )

        // Set cooldown
        this.cooldowns.set(formation.id, formation.cooldown)

        // Separate immediate and delayed spawns
        const immediate: SpawnPoint[] = []

        for (const point of points) {
            if (point.delay && point.delay > 0) {
                this.pendingSpawns.push({
                    point,
                    centerX,
                    centerY,
                    tier: point.tier ?? tier,
                    formationId: formation.id,
                    spawnTime: gameTime + point.delay,
                })
            } else {
                immediate.push(point)
            }
        }

        return immediate
    }

    /**
     * Force a specific formation (for events/bosses)
     */
    forceFormation(formationId: FormationId): FormationDef {
        return FORMATIONS[formationId] ?? FORMATIONS.random
    }

    /**
     * Reset all cooldowns
     */
    reset(): void {
        this.cooldowns.clear()
        this.pendingSpawns = []
    }
}
