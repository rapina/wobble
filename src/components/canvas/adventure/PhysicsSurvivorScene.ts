import { Application, Container, Graphics, Text, TextStyle, Ticker, FederatedPointerEvent } from 'pixi.js';
import { AdventureScene, AdventureSceneOptions } from './AdventureScene';
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../Wobble';
import { Perk, getRandomPerks, formatPerkEffect, perkDefinitions } from './perks';
import { BalatroFilter } from '../filters/BalatroFilter';
import { useCollectionStore } from '@/stores/collectionStore';
import {
    GameState,
    PlayerStats,
    DEFAULT_PLAYER_STATS,
    TextEffect,
    HitEffect,
    SurvivorRank,
    RANK_CONFIGS,
    getRankFromTime,
    WobbleStats,
    WOBBLE_STATS,
    PLAYABLE_CHARACTERS,
} from './survivor';
import { EnemySystem } from './survivor/EnemySystem';
import { ProjectileSystem } from './survivor/ProjectileSystem';
import { BackgroundSystem } from './survivor/BackgroundSystem';

export class PhysicsSurvivorScene extends AdventureScene {
    // Game state
    private gameTime = 0;
    private score = 0;
    private playerHealth = 100;
    private maxPlayerHealth = 100;
    private gameState: GameState = 'playing';

    // Round system
    private currentRound = 1;
    private roundTime = 0;
    private roundDuration = 30; // 30 seconds per round

    // Perk system
    private studiedFormulas: Set<string> = new Set();
    private activePerks: Perk[] = [];
    private perkChoices: Perk[] = [];
    private perkButtons: { graphics: Graphics; perk: Perk; index: number }[] = [];
    declare private perkContainer: Container;

    // Card flip animation state
    private perkCardStates: { flipped: boolean; animating: boolean; frontContainer: Container; backContainer: Container }[] = [];
    private flipAnimations: { index: number; progress: number; direction: 'toFront' | 'toBack' }[] = [];

    // Card back animation with Balatro filter
    private cardBackFilters: BalatroFilter[] = [];
    private cardAnimTime = 0;

    // Accumulated stats from perks
    private stats: PlayerStats = { ...DEFAULT_PLAYER_STATS };

    // Containers
    declare private gameContainer: Container;
    declare private projectileContainer: Container;
    declare private enemyContainer: Container;
    declare private effectContainer: Container;
    declare private uiContainer: Container;

    // Player
    declare private player: Wobble;
    private playerX = 0;
    private playerY = 0;
    private playerVx = 0;
    private playerVy = 0;
    private recoilDecay = 0.9;

    // Systems
    declare private enemySystem: EnemySystem;
    declare private projectileSystem: ProjectileSystem;
    declare private backgroundSystem: BackgroundSystem;

    // Fire system
    private fireRate = 0.5; // seconds between shots
    private fireTimer = 0;

    // Enemy spawn
    private spawnRate = 2; // seconds between spawns
    private spawnTimer = 0;

    // Effects
    private textEffects: TextEffect[] = [];
    private hitEffects: HitEffect[] = [];

    // UI
    declare private healthBar: Graphics;
    declare private healthBarBg: Graphics;
    declare private healthText: Text;
    declare private timeText: Text;
    declare private waveText: Text;
    declare private perkIconsContainer: Container;
    private perkIconGraphics: Graphics[] = [];

    // Animation
    private animPhase = 0;

    // Virtual joystick movement
    private joystickActive = false;
    private joystickCenterX = 0;
    private joystickCenterY = 0;
    private inputDirX = 0;  // Normalized input direction (-1 to 1)
    private inputDirY = 0;
    private inputMagnitude = 0;  // 0 to 1
    private readonly joystickMaxRadius = 60;  // Max drag distance from center
    private readonly playerBaseSpeed = 4;  // Base movement speed

    // Joystick visual
    declare private joystickContainer: Container;
    declare private joystickBase: Graphics;
    declare private joystickKnob: Graphics;

    // Background container
    declare private bgContainer: Container;

    // Result screen
    declare private resultContainer: Container;
    private resultAnimTime = 0;
    private resultAnimStep = 0;
    private resultDisplayedTime = 0;
    private resultDisplayedKills = 0;
    private resultRankRevealed = false;
    declare private resultTimeText: Text;
    declare private resultKillsText: Text;
    declare private resultWaveText: Text;
    declare private resultRankText: Text;
    declare private resultRankCard: Container;
    declare private resultMessageText: Text;
    declare private resultButtons: Container;

    // Character selection screen
    declare private characterSelectContainer: Container;
    private selectedCharacter: WobbleShape = 'circle';
    private characterWobbles: Map<WobbleShape, Wobble> = new Map();
    declare private characterNameText: Text;
    declare private characterDescText: Text;
    declare private characterStatsContainer: Container;
    declare private perkPreviewContainer: Container;
    declare private startButton: Container;
    private readonly baseMaxHealth = 100;

    constructor(app: Application, options?: AdventureSceneOptions) {
        super(app, options);
        // Store studied formulas from options
        if (options?.studiedFormulas) {
            this.studiedFormulas = options.studiedFormulas;
        }
    }

    protected setup(): void {
        // Background container (behind everything, but after base background)
        this.bgContainer = new Container();
        this.container.addChild(this.bgContainer);

        // Create containers
        this.gameContainer = new Container();
        this.container.addChild(this.gameContainer);

        this.enemyContainer = new Container();
        this.gameContainer.addChild(this.enemyContainer);

        this.projectileContainer = new Container();
        this.gameContainer.addChild(this.projectileContainer);

        this.effectContainer = new Container();
        this.gameContainer.addChild(this.effectContainer);

        this.uiContainer = new Container();
        this.container.addChild(this.uiContainer);

        // Perk selection container (above everything)
        this.perkContainer = new Container();
        this.perkContainer.visible = false;
        this.container.addChild(this.perkContainer);

        // Result screen container (above perk container)
        this.resultContainer = new Container();
        this.resultContainer.visible = false;
        this.container.addChild(this.resultContainer);

        // Character selection container (above result container)
        this.characterSelectContainer = new Container();
        this.characterSelectContainer.visible = false;
        this.container.addChild(this.characterSelectContainer);

        // Initialize systems
        this.backgroundSystem = new BackgroundSystem({
            bgContainer: this.bgContainer,
            width: this.width,
            height: this.height,
        });

        this.enemySystem = new EnemySystem({
            enemyContainer: this.enemyContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
            baseEnemySpeed: 1.5,
        });

        this.projectileSystem = new ProjectileSystem({
            projectileContainer: this.projectileContainer,
            effectContainer: this.effectContainer,
            width: this.width,
            height: this.height,
        });
    }

    // Override background to create corrupted world effect
    protected drawBackground(): void {
        this.backgroundSystem.initialize(this.background);
    }

    protected onInitialDraw(): void {
        // Hide the default grid - we use custom background
        this.gridOverlay.visible = false;

        // Center position
        this.playerX = this.centerX;
        this.playerY = this.centerY;

        // Create player (Wobi)
        this.player = new Wobble({
            size: 50,
            shape: 'circle',
            expression: 'happy',
            color: 0xf5b041,
            showShadow: true,
        });
        this.player.position.set(this.playerX, this.playerY);
        this.gameContainer.addChild(this.player);

        // Setup UI
        this.setupUI();

        // Setup touch controls
        this.setupInteraction();
    }

    private setupInteraction(): void {
        // Make game container interactive
        this.gameContainer.eventMode = 'static';
        this.gameContainer.hitArea = { contains: () => true };

        this.gameContainer.on('pointerdown', this.onPointerDown.bind(this));
        this.gameContainer.on('pointermove', this.onPointerMove.bind(this));
        this.gameContainer.on('pointerup', this.onPointerUp.bind(this));
        this.gameContainer.on('pointerupoutside', this.onPointerUp.bind(this));

        // Create virtual joystick visual
        this.joystickContainer = new Container();
        this.joystickContainer.visible = false;
        this.uiContainer.addChild(this.joystickContainer);

        // Joystick base (outer ring)
        this.joystickBase = new Graphics();
        this.joystickBase.circle(0, 0, this.joystickMaxRadius);
        this.joystickBase.fill({ color: 0x000000, alpha: 0.2 });
        this.joystickBase.circle(0, 0, this.joystickMaxRadius);
        this.joystickBase.stroke({ color: 0xffffff, width: 2, alpha: 0.4 });
        this.joystickContainer.addChild(this.joystickBase);

        // Joystick knob (inner circle)
        this.joystickKnob = new Graphics();
        this.joystickKnob.circle(0, 0, 20);
        this.joystickKnob.fill({ color: 0xffffff, alpha: 0.5 });
        this.joystickKnob.circle(0, 0, 20);
        this.joystickKnob.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
        this.joystickContainer.addChild(this.joystickKnob);
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (this.phase === 'narration' || this.gameState !== 'playing') return;

        const pos = e.getLocalPosition(this.gameContainer);

        // Set joystick center at touch position
        this.joystickActive = true;
        this.joystickCenterX = pos.x;
        this.joystickCenterY = pos.y;

        // Show joystick visual at touch position
        this.joystickContainer.visible = true;
        this.joystickContainer.position.set(pos.x, pos.y);
        this.joystickKnob.position.set(0, 0);

        // Reset input
        this.inputDirX = 0;
        this.inputDirY = 0;
        this.inputMagnitude = 0;
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.joystickActive || this.gameState !== 'playing') return;

        const pos = e.getLocalPosition(this.gameContainer);

        // Calculate offset from joystick center
        const dx = pos.x - this.joystickCenterX;
        const dy = pos.y - this.joystickCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate input magnitude (0-1)
        this.inputMagnitude = Math.min(1, dist / this.joystickMaxRadius);

        // Calculate normalized direction
        if (dist > 0.1) {
            this.inputDirX = dx / dist;
            this.inputDirY = dy / dist;
        } else {
            this.inputDirX = 0;
            this.inputDirY = 0;
        }

        // Update joystick knob position (clamped to max radius)
        const clampedDist = Math.min(dist, this.joystickMaxRadius);
        if (dist > 0) {
            this.joystickKnob.position.set(
                (dx / dist) * clampedDist,
                (dy / dist) * clampedDist
            );
        }
    }

    private onPointerUp(_e: FederatedPointerEvent): void {
        this.joystickActive = false;
        this.joystickContainer.visible = false;

        // Clear input direction (player will decelerate naturally)
        this.inputDirX = 0;
        this.inputDirY = 0;
        this.inputMagnitude = 0;
    }

    private setupUI(): void {
        const barWidth = this.width - 40;
        const barHeight = 10;
        const barY = 12;

        // Health bar background (full width at top)
        this.healthBarBg = new Graphics();
        this.healthBarBg.roundRect(20, barY, barWidth, barHeight, 3);
        this.healthBarBg.fill({ color: 0x1a1a1a, alpha: 0.9 });
        this.healthBarBg.roundRect(20, barY, barWidth, barHeight, 3);
        this.healthBarBg.stroke({ color: 0x333333, width: 1 });
        this.uiContainer.addChild(this.healthBarBg);

        // Health bar fill
        this.healthBar = new Graphics();
        this.uiContainer.addChild(this.healthBar);
        this.updateHealthBar();

        // HP text on the right of health bar
        const hpStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: 0xffffff,
        });
        this.healthText = new Text({ text: '100/100', style: hpStyle });
        this.healthText.anchor.set(1, 0.5);
        this.healthText.position.set(this.width - 24, barY + barHeight / 2);
        this.uiContainer.addChild(this.healthText);

        // Timer - large centered at top (MM:SS format like "08:22")
        const timerStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 28,
            fontWeight: 'bold',
            fill: 0xffffff,
            dropShadow: {
                color: 0x000000,
                blur: 4,
                distance: 2,
                angle: Math.PI / 4,
            },
        });
        this.timeText = new Text({ text: '00:30', style: timerStyle });
        this.timeText.anchor.set(0.5, 0);
        this.timeText.position.set(this.centerX, barY + barHeight + 8);
        this.uiContainer.addChild(this.timeText);

        // Wave indicator (small, below timer)
        const waveStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fill: 0xaaaaaa,
        });
        this.waveText = new Text({ text: 'Wave 1', style: waveStyle });
        this.waveText.anchor.set(0.5, 0);
        this.waveText.position.set(this.centerX, barY + barHeight + 38);
        this.uiContainer.addChild(this.waveText);

        // Perk icons container (top-left, below HP bar)
        this.perkIconsContainer = new Container();
        this.perkIconsContainer.position.set(20, barY + barHeight + 10);
        this.uiContainer.addChild(this.perkIconsContainer);
    }

    private updateHealthBar(): void {
        this.healthBar.clear();
        const barWidth = this.width - 40;
        const barHeight = 10;
        const barY = 12;
        const fillWidth = (this.playerHealth / this.maxPlayerHealth) * (barWidth - 4);
        const healthPercent = this.playerHealth / this.maxPlayerHealth;
        const color = healthPercent > 0.5 ? 0x2ecc71 : healthPercent > 0.25 ? 0xf5b041 : 0xe74c3c;
        this.healthBar.roundRect(22, barY + 2, Math.max(0, fillWidth), barHeight - 4, 2);
        this.healthBar.fill(color);

        // Update health text
        if (this.healthText) {
            this.healthText.text = `${Math.ceil(this.playerHealth)}/${this.maxPlayerHealth}`;
        }
    }

    private updateUI(): void {
        // Timer in MM:SS format
        const roundTimeLeft = Math.max(0, this.roundDuration - this.roundTime);
        const minutes = Math.floor(roundTimeLeft / 60);
        const seconds = Math.floor(roundTimeLeft % 60);
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Wave text
        this.waveText.text = `Wave ${this.currentRound}`;

        // Update perk icons
        this.updatePerkIcons();
    }

    private updatePerkIcons(): void {
        // Clear existing icons
        this.perkIconsContainer.removeChildren();
        this.perkIconGraphics = [];

        // Create icon for each active perk
        const iconSize = 28;
        const iconGap = 4;

        this.activePerks.forEach((perk, index) => {
            const iconContainer = new Container();
            iconContainer.position.set(index * (iconSize + iconGap), 0);

            // Icon background
            const bg = new Graphics();
            bg.roundRect(0, 0, iconSize, iconSize, 4);
            bg.fill({ color: 0x1a1a1a, alpha: 0.9 });
            bg.roundRect(0, 0, iconSize, iconSize, 4);
            bg.stroke({ color: perk.definition.color, width: 2 });
            iconContainer.addChild(bg);

            // Icon emoji
            const iconStyle = new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
            });
            const iconText = new Text({ text: perk.definition.icon, style: iconStyle });
            iconText.anchor.set(0.5);
            iconText.position.set(iconSize / 2, iconSize / 2);
            iconContainer.addChild(iconText);

            this.perkIconsContainer.addChild(iconContainer);
        });
    }

    private showPerkSelection(): void {
        this.gameState = 'perk-selection';
        this.perkContainer.visible = true;

        // Clear previous
        this.perkContainer.removeChildren();
        this.perkButtons = [];
        this.perkCardStates = [];
        this.flipAnimations = [];
        this.cardBackFilters = [];
        this.cardAnimTime = 0;

        // Get 3 random perks (always returns exactly 3)
        this.perkChoices = getRandomPerks(this.studiedFormulas, 3);

        // Fully opaque background with gradient-like layers
        const bg = new Graphics();
        bg.rect(0, 0, this.width, this.height);
        bg.fill(0x1a2e1a);
        this.perkContainer.addChild(bg);

        // Add decorative pattern overlay
        const pattern = new Graphics();
        for (let i = 0; i < 8; i++) {
            const alpha = 0.03 + (i % 2) * 0.02;
            pattern.circle(
                Math.random() * this.width,
                Math.random() * this.height,
                30 + Math.random() * 50
            );
            pattern.fill({ color: 0x3d5c3d, alpha });
        }
        this.perkContainer.addChild(pattern);

        // Vignette effect
        const vignette = new Graphics();
        vignette.rect(0, 0, this.width, this.height);
        vignette.fill({ color: 0x000000, alpha: 0.3 });
        this.perkContainer.addChild(vignette);

        // Title banner background
        const bannerBg = new Graphics();
        bannerBg.roundRect(this.centerX - 140, 35, 280, 75, 12);
        bannerBg.fill({ color: 0x2d4a2d, alpha: 0.9 });
        bannerBg.roundRect(this.centerX - 140, 35, 280, 75, 12);
        bannerBg.stroke({ color: 0x5a8a5a, width: 2 });
        this.perkContainer.addChild(bannerBg);

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 22,
            fontWeight: 'bold',
            fill: 0xffd700,
            dropShadow: {
                color: 0x000000,
                blur: 4,
                distance: 2,
            },
        });
        const title = new Text({ text: `물리 법칙 복구!`, style: titleStyle });
        title.anchor.set(0.5);
        title.position.set(this.centerX, 58);
        this.perkContainer.addChild(title);

        const subtitle = new Text({
            text: '카드를 탭하여 확인하세요',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0xccddcc,
            })
        });
        subtitle.anchor.set(0.5);
        subtitle.position.set(this.centerX, 88);
        this.perkContainer.addChild(subtitle);

        // Perk cards - narrower and taller for mobile
        const cardWidth = 100;
        const cardHeight = 240;
        const cardGap = 14;
        const totalWidth = this.perkChoices.length * cardWidth + (this.perkChoices.length - 1) * cardGap;
        const startX = (this.width - totalWidth) / 2;
        const cardY = this.centerY - cardHeight / 2 + 20;

        this.perkChoices.forEach((perk, index) => {
            const cardCenterX = startX + index * (cardWidth + cardGap) + cardWidth / 2;

            // Create card wrapper container for flip animation
            const cardWrapper = new Container();
            cardWrapper.position.set(cardCenterX, cardY + cardHeight / 2);
            this.perkContainer.addChild(cardWrapper);

            // Create back container (shown initially)
            const backContainer = this.createCardBack(cardWidth, cardHeight, index);
            backContainer.visible = true;
            cardWrapper.addChild(backContainer);

            // Create front container (hidden initially)
            const frontContainer = this.createCardFront(perk, cardWidth, cardHeight, index);
            frontContainer.visible = false;
            cardWrapper.addChild(frontContainer);

            // Store card state
            this.perkCardStates.push({
                flipped: false,
                animating: false,
                frontContainer,
                backContainer,
            });

            // Make wrapper interactive for click handling
            cardWrapper.eventMode = 'static';
            cardWrapper.cursor = 'pointer';
            cardWrapper.hitArea = { contains: (x: number, y: number) => {
                return x >= -cardWidth / 2 && x <= cardWidth / 2 &&
                       y >= -cardHeight / 2 && y <= cardHeight / 2;
            }};
            cardWrapper.on('pointerdown', () => this.onPerkCardClick(index));

            this.perkButtons.push({ graphics: backContainer as unknown as Graphics, perk, index });
        });

        // Bottom hint
        const hintStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fill: 0x7a9a7a,
        });
        const hint = new Text({
            text: '카드를 탭하여 뒤집기',
            style: hintStyle
        });
        hint.anchor.set(0.5);
        hint.position.set(this.centerX, this.height - 40);
        this.perkContainer.addChild(hint);
    }

    private createCardBack(cardWidth: number, cardHeight: number, _index: number): Container {
        const container = new Container();

        // Card shadow
        const shadow = new Graphics();
        shadow.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 6, cardWidth, cardHeight, 14);
        shadow.fill({ color: 0x000000, alpha: 0.5 });
        container.addChild(shadow);

        // Create a container for the Balatro effect with masking
        const effectContainer = new Container();
        container.addChild(effectContainer);

        // Background rect that will have the Balatro filter
        const balatroRect = new Graphics();
        balatroRect.roundRect(-cardWidth / 2 + 3, -cardHeight / 2 + 3, cardWidth - 6, cardHeight - 6, 12);
        balatroRect.fill(0x2a1a3d);
        effectContainer.addChild(balatroRect);

        // Create and apply Balatro filter with purple colors
        const balatroFilter = new BalatroFilter({
            color1: [0.61, 0.35, 0.71, 1.0],  // #9B59B6 - Light purple
            color2: [0.42, 0.23, 0.55, 1.0],  // #6B3B8C - Purple
            color3: [0.10, 0.04, 0.15, 1.0],  // #1A0A26 - Dark purple
            spinSpeed: 5.0,
            contrast: 3.0,
            lighting: 0.3,
            spinAmount: 0.2,
            pixelFilter: 300.0,
            spinEase: 0.8,
        });
        balatroFilter.setDimensions(cardWidth, cardHeight);
        effectContainer.filters = [balatroFilter];

        // Store filter reference for animation
        this.cardBackFilters.push(balatroFilter);

        // Card border - glowing purple with multiple layers
        const border = new Graphics();
        border.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
        border.stroke({ color: 0x9b59b6, width: 3 });
        border.roundRect(-cardWidth / 2 - 1, -cardHeight / 2 - 1, cardWidth + 2, cardHeight + 2, 15);
        border.stroke({ color: 0xbb79d6, width: 1, alpha: 0.5 });
        container.addChild(border);

        // Inner border glow
        const innerGlow = new Graphics();
        innerGlow.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight - 8, 11);
        innerGlow.stroke({ color: 0x6a3a8a, width: 2, alpha: 0.4 });
        container.addChild(innerGlow);

        // Central glow circle behind question mark
        const centerGlow = new Graphics();
        centerGlow.circle(0, -20, 40);
        centerGlow.fill({ color: 0x000000, alpha: 0.4 });
        centerGlow.circle(0, -20, 32);
        centerGlow.fill({ color: 0x1a0a25, alpha: 0.6 });
        container.addChild(centerGlow);

        // Question mark
        const questionStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 52,
            fontWeight: 'bold',
            fill: 0xffd700,
            dropShadow: {
                color: 0x000000,
                blur: 8,
                distance: 0,
            },
        });
        const question = new Text({ text: '?', style: questionStyle });
        question.anchor.set(0.5);
        question.position.set(0, -20);
        container.addChild(question);

        // "Tap to reveal" text
        const tapStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fill: 0xccaaee,
        });
        const tapText = new Text({ text: '탭하여 확인', style: tapStyle });
        tapText.anchor.set(0.5);
        tapText.position.set(0, cardHeight / 2 - 24);
        container.addChild(tapText);

        return container;
    }

    private updateCardBackAnimations(delta: number): void {
        this.cardAnimTime += delta * 0.016; // Convert to roughly seconds

        // Update Balatro filter time for each card
        for (let i = 0; i < this.cardBackFilters.length; i++) {
            const filter = this.cardBackFilters[i];
            const state = this.perkCardStates[i];

            // Only animate if card is not flipped
            if (state && !state.flipped) {
                // Each card has a slightly different time offset for variety
                filter.time = this.cardAnimTime + i * 0.5;
            }
        }
    }

    private createCardFront(perk: Perk, cardWidth: number, cardHeight: number, _index: number): Container {
        const container = new Container();

        const card = new Graphics();

        // Card shadow
        card.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 6, cardWidth, cardHeight, 14);
        card.fill({ color: 0x000000, alpha: 0.5 });

        // Card background - solid color
        card.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
        card.fill(0x1e2a30);

        // Card inner area
        card.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight - 8, 11);
        card.fill(0x2d3e44);

        // Card border with perk color
        card.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
        card.stroke({ color: perk.definition.color, width: 3 });

        // Top accent bar
        card.roundRect(-cardWidth / 2 + 8, -cardHeight / 2 + 8, cardWidth - 16, 4, 2);
        card.fill(perk.definition.color);

        // Icon background circle with glow
        card.circle(0, -cardHeight / 2 + 55, 28);
        card.fill({ color: perk.definition.color, alpha: 0.15 });
        card.circle(0, -cardHeight / 2 + 55, 24);
        card.fill({ color: perk.definition.color, alpha: 0.1 });

        container.addChild(card);

        // Icon
        const iconStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 32,
        });
        const icon = new Text({ text: perk.definition.icon, style: iconStyle });
        icon.anchor.set(0.5);
        icon.position.set(0, -cardHeight / 2 + 55);
        container.addChild(icon);

        // Name (formula name)
        const nameStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 'bold',
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: cardWidth - 14,
            align: 'center',
        });
        const name = new Text({ text: perk.definition.nameKo, style: nameStyle });
        name.anchor.set(0.5, 0);
        name.position.set(0, -cardHeight / 2 + 88);
        container.addChild(name);

        // Description
        const descStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 9,
            fill: 0x90a4ae,
            wordWrap: true,
            wordWrapWidth: cardWidth - 16,
            align: 'center',
            lineHeight: 13,
        });
        const desc = new Text({ text: perk.definition.descriptionKo, style: descStyle });
        desc.anchor.set(0.5, 0);
        desc.position.set(0, -cardHeight / 2 + 112);
        container.addChild(desc);

        // Divider line
        const divider = new Graphics();
        divider.moveTo(-cardWidth / 2 + 10, -cardHeight / 2 + 155);
        divider.lineTo(cardWidth / 2 - 10, -cardHeight / 2 + 155);
        divider.stroke({ color: 0x4a5a60, width: 1 });
        container.addChild(divider);

        // Effects
        const effectStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fontWeight: 'bold',
            fill: 0x81c784,
            wordWrap: true,
            wordWrapWidth: cardWidth - 16,
            align: 'center',
            lineHeight: 15,
        });
        const effectTexts = perk.rolledEffects.map(e => formatPerkEffect(e, true)).join('\n');
        const effects = new Text({ text: effectTexts, style: effectStyle });
        effects.anchor.set(0.5, 0);
        effects.position.set(0, -cardHeight / 2 + 165);
        container.addChild(effects);

        // "Select" hint at bottom with glow effect
        const selectStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: 0xffd700,
            dropShadow: {
                color: 0xffd700,
                blur: 6,
                distance: 0,
                alpha: 0.5,
            },
        });
        const selectHint = new Text({ text: '탭하여 선택', style: selectStyle });
        selectHint.anchor.set(0.5);
        selectHint.position.set(0, cardHeight / 2 - 16);
        container.addChild(selectHint);

        return container;
    }

    private onPerkCardClick(index: number): void {
        const state = this.perkCardStates[index];
        if (!state || state.animating) return;

        if (!state.flipped) {
            // Start flip animation to reveal front
            this.startFlipAnimation(index, 'toFront');
        } else {
            // Already flipped, select this perk
            this.selectPerk(index);
        }
    }

    private startFlipAnimation(index: number, direction: 'toFront' | 'toBack'): void {
        const state = this.perkCardStates[index];
        if (!state) return;

        state.animating = true;
        this.flipAnimations.push({
            index,
            progress: 0,
            direction,
        });
    }

    private updateFlipAnimations(delta: number): void {
        const flipSpeed = 0.08; // Animation speed

        for (let i = this.flipAnimations.length - 1; i >= 0; i--) {
            const anim = this.flipAnimations[i];
            const state = this.perkCardStates[anim.index];
            if (!state) {
                this.flipAnimations.splice(i, 1);
                continue;
            }

            anim.progress += flipSpeed * delta;

            // Find the card wrapper (parent of front/back containers)
            const wrapper = state.frontContainer.parent;
            if (!wrapper) {
                this.flipAnimations.splice(i, 1);
                continue;
            }

            if (anim.progress <= 0.5) {
                // First half: shrink scale X
                const scaleX = 1 - anim.progress * 2; // 1 -> 0
                wrapper.scale.x = Math.max(0.01, scaleX);
            } else {
                // Second half: expand scale X and switch faces
                const scaleX = (anim.progress - 0.5) * 2; // 0 -> 1
                wrapper.scale.x = Math.max(0.01, scaleX);

                // Switch visibility at midpoint
                if (anim.direction === 'toFront') {
                    state.backContainer.visible = false;
                    state.frontContainer.visible = true;
                } else {
                    state.backContainer.visible = true;
                    state.frontContainer.visible = false;
                }
            }

            // Animation complete
            if (anim.progress >= 1) {
                wrapper.scale.x = 1;
                state.animating = false;
                state.flipped = anim.direction === 'toFront';
                this.flipAnimations.splice(i, 1);
            }
        }
    }

    private selectPerk(index: number): void {
        const perk = this.perkChoices[index];
        if (!perk) return;

        // Add to active perks
        this.activePerks.push(perk);

        // Apply perk effects to stats
        this.applyPerkEffects(perk);

        // Start next round
        this.startNextRound();
    }

    private applyPerkEffects(perk: Perk): void {
        for (const effect of perk.rolledEffects) {
            const multiplier = effect.isPercent ? (1 + effect.value / 100) : effect.value;

            switch (effect.stat) {
                case 'damage':
                    this.stats.damageMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
                case 'fireRate':
                    this.stats.fireRateMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
                case 'projectileSpeed':
                    this.stats.projectileSpeedMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
                case 'projectileSize':
                    this.stats.projectileSizeMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
                case 'knockback':
                    this.stats.knockbackMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
                case 'bounce':
                    this.stats.bounceCount += effect.value;
                    break;
                case 'piercing':
                    this.stats.piercingCount += effect.value;
                    break;
                case 'explosionRadius':
                    this.stats.explosionRadius += effect.value;
                    break;
                case 'moveSpeed':
                    this.stats.moveSpeedMultiplier *= effect.isPercent ? multiplier : 1;
                    break;
            }
        }
    }

    private startNextRound(): void {
        this.perkContainer.visible = false;
        this.currentRound++;
        this.roundTime = 0;
        this.gameState = 'playing';
        this.updateUI();
    }

    private checkRoundComplete(): void {
        if (this.roundTime >= this.roundDuration) {
            this.showPerkSelection();
        }
    }

    private fireProjectile(): void {
        this.projectileSystem.fire(
            this.playerX,
            this.playerY,
            this.enemySystem.enemies,
            this.stats
        );
    }

    private updateProjectiles(delta: number): void {
        this.projectileSystem.update(delta);
        this.projectileSystem.checkCollisions(
            this.enemySystem.enemies,
            this.stats,
            this.hitEffects,
            () => {
                this.score += 10;
                useCollectionStore.getState().unlockWobble('shadow');
            },
            (x, y) => this.createExplosion(x, y)
        );
    }

    private updateEnemiesAndMerges(delta: number, deltaSeconds: number): void {
        this.enemySystem.update(delta, this.playerX, this.playerY, this.animPhase);
        this.enemySystem.checkCollisions(deltaSeconds, this.hitEffects);
        this.enemySystem.updateMerges(this.gameTime, this.hitEffects);
        this.enemySystem.cleanupOverlapTracker();
        this.score += this.enemySystem.cleanupDead();
    }

    private spawnEnemy(): void {
        this.enemySystem.spawnAtEdge(this.gameTime);
    }

    // Check collisions between enemies and player
    private checkPlayerCollisions(): void {
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 25 + enemy.size / 2;

            if (dist < minDist) {
                this.playerHealth -= 1;
                this.updateHealthBar();

                // Push enemy back
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                enemy.vx += nx * 3;
                enemy.vy += ny * 3;

                if (this.playerHealth <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    private createExplosion(x: number, y: number): void {
        const radius = this.stats.explosionRadius;
        const damage = 5 * this.stats.damageMultiplier;

        // Visual effect
        const explosion = new Graphics();
        explosion.circle(0, 0, radius);
        explosion.fill({ color: 0xff6600, alpha: 0.5 });
        explosion.position.set(x, y);
        this.effectContainer.addChild(explosion);

        // Damage enemies in radius
        for (const enemy of this.enemySystem.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + enemy.size / 2) {
                enemy.health -= damage;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                enemy.vx += nx * 5;
                enemy.vy += ny * 5;
            }
        }

        this.hitEffects.push({ x, y, timer: 0.3, graphics: explosion });
    }

    private updateEffects(delta: number): void {
        // Text effects
        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            const effect = this.textEffects[i];
            effect.timer -= delta / 60;

            // Fade and rise
            effect.text.alpha = Math.min(1, effect.timer);
            effect.text.y -= delta * 0.5;

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.text);
                effect.text.destroy();
                this.textEffects.splice(i, 1);
            }
        }

        // Hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.timer -= delta / 60;

            effect.graphics.alpha = effect.timer / 0.2;
            effect.graphics.scale.set(1 + (0.2 - effect.timer) * 3);

            if (effect.timer <= 0) {
                this.effectContainer.removeChild(effect.graphics);
                effect.graphics.destroy();
                this.hitEffects.splice(i, 1);
            }
        }
    }

    private updatePlayer(delta: number): void {
        // Calculate target velocity from joystick input
        const speed = this.playerBaseSpeed * this.stats.moveSpeedMultiplier;
        const targetVx = this.inputDirX * this.inputMagnitude * speed;
        const targetVy = this.inputDirY * this.inputMagnitude * speed;

        // Smooth acceleration towards target velocity
        const accel = 0.15;
        const friction = 0.85;

        if (this.inputMagnitude > 0.1) {
            // Accelerate towards target
            this.playerVx += (targetVx - this.playerVx) * accel * delta;
            this.playerVy += (targetVy - this.playerVy) * accel * delta;
        } else {
            // Apply friction when no input
            this.playerVx *= friction;
            this.playerVy *= friction;
        }

        // Apply velocity to position
        this.playerX += this.playerVx * delta;
        this.playerY += this.playerVy * delta;

        // Keep in bounds
        const margin = 30;
        if (this.playerX < margin) {
            this.playerX = margin;
            this.playerVx = 0;
        } else if (this.playerX > this.width - margin) {
            this.playerX = this.width - margin;
            this.playerVx = 0;
        }
        if (this.playerY < margin) {
            this.playerY = margin;
            this.playerVy = 0;
        } else if (this.playerY > this.height - margin) {
            this.playerY = this.height - margin;
            this.playerVy = 0;
        }

        this.player.position.set(this.playerX, this.playerY);

        // Update player look direction based on velocity
        const velMag = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy);
        if (velMag > 0.5) {
            this.player.updateOptions({
                lookDirection: { x: this.playerVx / velMag, y: this.playerVy / velMag }
            });
        }
    }

    private gameOver(): void {
        this.gameState = 'game-over';
        this.player.updateOptions({ expression: 'dizzy' });

        // Short delay before showing result screen
        setTimeout(() => {
            this.showResult();
        }, 800);
    }

    private showResult(): void {
        this.gameState = 'result';
        this.resultAnimTime = 0;
        this.resultAnimStep = 0;
        this.resultDisplayedTime = 0;
        this.resultDisplayedKills = 0;
        this.resultRankRevealed = false;

        this.createResultUI();
        this.resultContainer.visible = true;
    }

    private createResultUI(): void {
        // Clear previous result UI
        this.resultContainer.removeChildren();

        const centerX = this.width / 2;

        // Semi-transparent background
        const bg = new Graphics();
        bg.rect(0, 0, this.width, this.height);
        bg.fill({ color: 0x0a0a14, alpha: 0.95 });
        this.resultContainer.addChild(bg);

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 32,
            fontWeight: 'bold',
            fill: 0xffffff,
            dropShadow: {
                color: 0x000000,
                blur: 8,
                distance: 2,
            },
        });
        const title = new Text({ text: 'SURVIVED!', style: titleStyle });
        title.anchor.set(0.5);
        title.position.set(centerX, 60);
        title.alpha = 0;
        this.resultContainer.addChild(title);

        // Stats container
        const statsY = 130;
        const statGap = 55;

        // Time stat
        const timeLabel = this.createStatLabel('생존 시간', centerX, statsY);
        this.resultContainer.addChild(timeLabel);

        this.resultTimeText = new Text({
            text: '00:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: 0xf5b041,
            }),
        });
        this.resultTimeText.anchor.set(0.5);
        this.resultTimeText.position.set(centerX, statsY + 28);
        this.resultTimeText.alpha = 0;
        this.resultContainer.addChild(this.resultTimeText);

        // Kills stat
        const killsLabel = this.createStatLabel('처치한 적', centerX, statsY + statGap);
        this.resultContainer.addChild(killsLabel);

        this.resultKillsText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: 0xe74c3c,
            }),
        });
        this.resultKillsText.anchor.set(0.5);
        this.resultKillsText.position.set(centerX, statsY + statGap + 28);
        this.resultKillsText.alpha = 0;
        this.resultContainer.addChild(this.resultKillsText);

        // Wave stat
        const waveLabel = this.createStatLabel('도달 웨이브', centerX, statsY + statGap * 2);
        this.resultContainer.addChild(waveLabel);

        this.resultWaveText = new Text({
            text: `Wave ${this.currentRound}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: 0x3498db,
            }),
        });
        this.resultWaveText.anchor.set(0.5);
        this.resultWaveText.position.set(centerX, statsY + statGap * 2 + 28);
        this.resultWaveText.alpha = 0;
        this.resultContainer.addChild(this.resultWaveText);

        // Perk icons row
        const perkY = statsY + statGap * 3 + 10;
        if (this.activePerks.length > 0) {
            const perkLabel = this.createStatLabel('획득한 물리 법칙', centerX, perkY);
            this.resultContainer.addChild(perkLabel);

            const iconSize = 32;
            const iconGap = 8;
            const totalWidth = this.activePerks.length * iconSize + (this.activePerks.length - 1) * iconGap;
            const startX = centerX - totalWidth / 2;

            this.activePerks.forEach((perk, i) => {
                const iconContainer = new Container();
                iconContainer.position.set(startX + i * (iconSize + iconGap) + iconSize / 2, perkY + 35);
                iconContainer.alpha = 0;
                iconContainer.scale.set(0);

                const iconBg = new Graphics();
                iconBg.roundRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 6);
                iconBg.fill({ color: 0x1a1a1a, alpha: 0.9 });
                iconBg.stroke({ color: perk.definition.color, width: 2 });
                iconContainer.addChild(iconBg);

                const iconText = new Text({
                    text: perk.definition.icon,
                    style: new TextStyle({ fontSize: 18 }),
                });
                iconText.anchor.set(0.5);
                iconContainer.addChild(iconText);

                this.resultContainer.addChild(iconContainer);
            });
        }

        // Rank card (positioned below perk icons with enough spacing)
        const rankY = this.activePerks.length > 0 ? perkY + 160 : statsY + statGap * 3 + 20;
        this.resultRankCard = new Container();
        this.resultRankCard.position.set(centerX, rankY);
        this.resultRankCard.scale.set(0);
        this.resultContainer.addChild(this.resultRankCard);

        const rank = getRankFromTime(this.gameTime);
        const rankConfig = RANK_CONFIGS[rank];

        // Rank card background
        const cardWidth = 120;
        const cardHeight = 140;
        const rankCardBg = new Graphics();
        rankCardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
        rankCardBg.fill(0x1a1a2e);
        rankCardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
        rankCardBg.stroke({ color: rankConfig.color, width: 4 });
        this.resultRankCard.addChild(rankCardBg);

        // Rank letter
        this.resultRankText = new Text({
            text: rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 72,
                fontWeight: 'bold',
                fill: rankConfig.color,
                dropShadow: {
                    color: rankConfig.color,
                    blur: 20,
                    distance: 0,
                    alpha: 0.5,
                },
            }),
        });
        this.resultRankText.anchor.set(0.5);
        this.resultRankText.position.set(0, -10);
        this.resultRankCard.addChild(this.resultRankText);

        // Rank message
        this.resultMessageText = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        });
        this.resultMessageText.anchor.set(0.5);
        this.resultMessageText.position.set(0, 45);
        this.resultRankCard.addChild(this.resultMessageText);

        // Action buttons
        this.resultButtons = new Container();
        this.resultButtons.position.set(centerX, this.height - 80);
        this.resultButtons.alpha = 0;
        this.resultContainer.addChild(this.resultButtons);

        // Retry button
        const retryBtn = this.createResultButton('다시 하기', -70, 0x3498db, () => {
            this.resultContainer.visible = false;
            this.reset();
            this.play();
        });
        this.resultButtons.addChild(retryBtn);

        // Menu button
        const menuBtn = this.createResultButton('메뉴로', 70, 0x2c3e50, () => {
            this.onPlayComplete?.('success');
        });
        this.resultButtons.addChild(menuBtn);
    }

    private createStatLabel(text: string, x: number, y: number): Text {
        const label = new Text({
            text,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0x888888,
            }),
        });
        label.anchor.set(0.5);
        label.position.set(x, y);
        return label;
    }

    private createResultButton(text: string, offsetX: number, color: number, onClick: () => void): Container {
        const btn = new Container();
        btn.position.set(offsetX, 0);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const bg = new Graphics();
        bg.roundRect(-60, -22, 120, 44, 12);
        bg.fill(color);
        btn.addChild(bg);

        const label = new Text({
            text,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        });
        label.anchor.set(0.5);
        btn.addChild(label);

        btn.on('pointerdown', onClick);

        return btn;
    }

    private animateResult(deltaSeconds: number): void {
        this.resultAnimTime += deltaSeconds;

        const children = this.resultContainer.children;

        // Step 0: Fade in title (0.0s - 0.3s)
        if (this.resultAnimTime >= 0 && this.resultAnimStep === 0) {
            const title = children[1] as Text;
            title.alpha = Math.min(1, this.resultAnimTime / 0.3);
            if (this.resultAnimTime >= 0.3) this.resultAnimStep = 1;
        }

        // Step 1: Count up time (0.3s - 0.8s)
        if (this.resultAnimTime >= 0.3 && this.resultAnimStep === 1) {
            this.resultTimeText.alpha = 1;
            const progress = Math.min(1, (this.resultAnimTime - 0.3) / 0.5);
            this.resultDisplayedTime = this.gameTime * this.easeOutQuad(progress);
            const mins = Math.floor(this.resultDisplayedTime / 60);
            const secs = Math.floor(this.resultDisplayedTime % 60);
            this.resultTimeText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            if (progress >= 1) this.resultAnimStep = 2;
        }

        // Step 2: Count up kills (0.8s - 1.2s)
        if (this.resultAnimTime >= 0.8 && this.resultAnimStep === 2) {
            this.resultKillsText.alpha = 1;
            const progress = Math.min(1, (this.resultAnimTime - 0.8) / 0.4);
            const totalKills = Math.floor(this.score / 10);
            this.resultDisplayedKills = Math.floor(totalKills * this.easeOutQuad(progress));
            this.resultKillsText.text = this.resultDisplayedKills.toString();
            if (progress >= 1) this.resultAnimStep = 3;
        }

        // Step 3: Show wave (1.2s - 1.4s)
        if (this.resultAnimTime >= 1.2 && this.resultAnimStep === 3) {
            this.resultWaveText.alpha = Math.min(1, (this.resultAnimTime - 1.2) / 0.2);
            if (this.resultAnimTime >= 1.4) this.resultAnimStep = 4;
        }

        // Step 4: Pop in perk icons (1.4s - 2.0s)
        if (this.resultAnimTime >= 1.4 && this.resultAnimStep === 4) {
            const perkStartIndex = this.activePerks.length > 0 ? 8 : -1; // After labels and texts
            if (perkStartIndex > 0) {
                for (let i = 0; i < this.activePerks.length; i++) {
                    const iconTime = 1.4 + i * 0.1;
                    if (this.resultAnimTime >= iconTime) {
                        const icon = children[perkStartIndex + i] as Container;
                        if (icon) {
                            const progress = Math.min(1, (this.resultAnimTime - iconTime) / 0.15);
                            icon.alpha = progress;
                            icon.scale.set(this.easeOutBack(progress));
                        }
                    }
                }
            }
            if (this.resultAnimTime >= 1.4 + this.activePerks.length * 0.1 + 0.2) {
                this.resultAnimStep = 5;
            }
        }

        // Step 5: Reveal rank card (2.0s - 2.5s)
        if (this.resultAnimTime >= 2.0 && this.resultAnimStep === 5) {
            const progress = Math.min(1, (this.resultAnimTime - 2.0) / 0.4);
            this.resultRankCard.scale.set(this.easeOutBack(progress));

            // Add glow pulse effect
            if (progress >= 1 && !this.resultRankRevealed) {
                this.resultRankRevealed = true;
            }
            if (this.resultAnimTime >= 2.4) this.resultAnimStep = 6;
        }

        // Step 6: Show buttons (2.4s+)
        if (this.resultAnimTime >= 2.4 && this.resultAnimStep === 6) {
            const progress = Math.min(1, (this.resultAnimTime - 2.4) / 0.3);
            this.resultButtons.alpha = progress;
            if (progress >= 1) this.resultAnimStep = 7;
        }

        // Rank card pulse animation
        if (this.resultRankRevealed) {
            const pulse = 1 + Math.sin(this.resultAnimTime * 4) * 0.03;
            this.resultRankCard.scale.set(pulse);
        }
    }

    private easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }

    private easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // === Character Selection Screen ===
    private showCharacterSelect(): void {
        this.gameState = 'character-select';
        this.createCharacterSelectUI();
        this.characterSelectContainer.visible = true;
    }

    private createCharacterSelectUI(): void {
        // Clear previous UI
        this.characterSelectContainer.removeChildren();
        this.characterWobbles.clear();

        const centerX = this.width / 2;

        // Background
        const bg = new Graphics();
        bg.rect(0, 0, this.width, this.height);
        bg.fill({ color: 0x0d0a14, alpha: 0.98 });
        this.characterSelectContainer.addChild(bg);

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xffffff,
            dropShadow: {
                color: 0x000000,
                blur: 4,
                distance: 2,
            },
        });
        const title = new Text({ text: '캐릭터 선택', style: titleStyle });
        title.anchor.set(0.5);
        title.position.set(centerX, 40);
        this.characterSelectContainer.addChild(title);

        // Character selection row
        const charY = 100;
        const charSize = 45;
        const charGap = 8;
        const totalWidth = PLAYABLE_CHARACTERS.length * charSize + (PLAYABLE_CHARACTERS.length - 1) * charGap;
        const startX = centerX - totalWidth / 2;

        PLAYABLE_CHARACTERS.forEach((shape, index) => {
            const charContainer = new Container();
            const x = startX + index * (charSize + charGap) + charSize / 2;
            charContainer.position.set(x, charY);
            charContainer.eventMode = 'static';
            charContainer.cursor = 'pointer';

            // Character wobble
            const character = WOBBLE_CHARACTERS[shape];
            const wobble = new Wobble({
                size: charSize,
                shape: shape,
                expression: 'happy',
                color: character.color,
                showShadow: false,
            });
            charContainer.addChild(wobble);
            this.characterWobbles.set(shape, wobble);

            // Selection indicator
            const selectionRing = new Graphics();
            selectionRing.circle(0, 0, charSize / 2 + 6);
            selectionRing.stroke({ color: 0xffd700, width: 3 });
            selectionRing.visible = shape === this.selectedCharacter;
            charContainer.addChildAt(selectionRing, 0);

            // Click handler
            charContainer.on('pointerdown', () => {
                this.selectCharacter(shape);
            });

            this.characterSelectContainer.addChild(charContainer);
        });

        // Character info section
        const infoY = 170;

        // Character name
        this.characterNameText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        });
        this.characterNameText.anchor.set(0.5);
        this.characterNameText.position.set(centerX, infoY);
        this.characterSelectContainer.addChild(this.characterNameText);

        // Character description
        this.characterDescText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: 0xaaaaaa,
            }),
        });
        this.characterDescText.anchor.set(0.5);
        this.characterDescText.position.set(centerX, infoY + 25);
        this.characterSelectContainer.addChild(this.characterDescText);

        // Stats container
        this.characterStatsContainer = new Container();
        this.characterStatsContainer.position.set(centerX, infoY + 60);
        this.characterSelectContainer.addChild(this.characterStatsContainer);

        // Perk preview section
        const perkY = infoY + 130;
        const perkLabel = new Text({
            text: '등장 가능한 물리 법칙',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xcccccc,
            }),
        });
        perkLabel.anchor.set(0.5);
        perkLabel.position.set(centerX, perkY);
        this.characterSelectContainer.addChild(perkLabel);

        this.perkPreviewContainer = new Container();
        this.perkPreviewContainer.position.set(centerX, perkY + 35);
        this.characterSelectContainer.addChild(this.perkPreviewContainer);

        // Start button
        this.startButton = this.createStartButton(centerX, this.height - 70);
        this.characterSelectContainer.addChild(this.startButton);

        // Initial update
        this.updateCharacterSelection();
        this.createPerkPreview();
    }

    private selectCharacter(shape: WobbleShape): void {
        if (this.selectedCharacter === shape) return;

        this.selectedCharacter = shape;
        this.updateCharacterSelection();
    }

    private updateCharacterSelection(): void {
        const character = WOBBLE_CHARACTERS[this.selectedCharacter];
        const stats = WOBBLE_STATS[this.selectedCharacter];

        // Update selection rings
        let index = 0;
        for (const [shape, wobble] of this.characterWobbles) {
            const container = wobble.parent as Container;
            const ring = container.children[0] as Graphics;
            const isSelected = shape === this.selectedCharacter;

            ring.visible = isSelected;

            // Scale animation
            const scale = isSelected ? 1.15 : 0.85;
            wobble.scale.set(scale);
            wobble.alpha = isSelected ? 1 : 0.6;

            index++;
        }

        // Update character info
        this.characterNameText.text = `${character.nameKo} (${character.name})`;
        this.characterNameText.style.fill = character.color;
        this.characterDescText.text = character.personalityKo;

        // Update stats display
        this.updateStatsDisplay(stats, character.color);
    }

    private updateStatsDisplay(stats: WobbleStats, color: number): void {
        this.characterStatsContainer.removeChildren();

        const statItems = [
            { icon: '❤️', label: '체력', value: stats.healthMultiplier },
            { icon: '⚔️', label: '데미지', value: stats.damageMultiplier },
            { icon: '🔫', label: '발사속도', value: stats.fireRateMultiplier },
            { icon: '👟', label: '이동속도', value: stats.moveSpeedMultiplier },
        ];

        const itemWidth = 70;
        const totalWidth = statItems.length * itemWidth;
        const startX = -totalWidth / 2;

        statItems.forEach((item, index) => {
            const x = startX + index * itemWidth + itemWidth / 2;

            // Icon
            const icon = new Text({
                text: item.icon,
                style: new TextStyle({ fontSize: 16 }),
            });
            icon.anchor.set(0.5);
            icon.position.set(x, 0);
            this.characterStatsContainer.addChild(icon);

            // Value
            const percent = Math.round(item.value * 100);
            const valueColor = percent > 100 ? 0x2ecc71 : percent < 100 ? 0xe74c3c : 0xffffff;
            const value = new Text({
                text: `${percent}%`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    fontWeight: 'bold',
                    fill: valueColor,
                }),
            });
            value.anchor.set(0.5);
            value.position.set(x, 22);
            this.characterStatsContainer.addChild(value);

            // Label
            const label = new Text({
                text: item.label,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fill: 0x888888,
                }),
            });
            label.anchor.set(0.5);
            label.position.set(x, 38);
            this.characterStatsContainer.addChild(label);
        });
    }

    private createPerkPreview(): void {
        this.perkPreviewContainer.removeChildren();

        const iconSize = 28;
        const iconGap = 6;
        const maxPerRow = 6;
        const perks = perkDefinitions;

        const rows = Math.ceil(perks.length / maxPerRow);

        perks.forEach((perk, index) => {
            const row = Math.floor(index / maxPerRow);
            const col = index % maxPerRow;
            const perksInRow = Math.min(maxPerRow, perks.length - row * maxPerRow);
            const rowWidth = perksInRow * iconSize + (perksInRow - 1) * iconGap;
            const rowStartX = -rowWidth / 2;

            const x = rowStartX + col * (iconSize + iconGap) + iconSize / 2;
            const y = row * (iconSize + iconGap + 5);

            const isUnlocked = this.studiedFormulas.has(perk.formulaId);

            const iconContainer = new Container();
            iconContainer.position.set(x, y);

            // Background
            const bg = new Graphics();
            bg.roundRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 6);
            if (isUnlocked) {
                bg.fill({ color: perk.color, alpha: 0.2 });
                bg.stroke({ color: perk.color, width: 2 });
            } else {
                bg.fill({ color: 0x333333, alpha: 0.5 });
                bg.stroke({ color: 0x555555, width: 1 });
            }
            iconContainer.addChild(bg);

            // Icon or question mark
            const iconText = new Text({
                text: isUnlocked ? perk.icon : '?',
                style: new TextStyle({
                    fontSize: isUnlocked ? 14 : 16,
                    fontWeight: isUnlocked ? 'normal' : 'bold',
                    fill: isUnlocked ? 0xffffff : 0x666666,
                }),
            });
            iconText.anchor.set(0.5);
            iconContainer.addChild(iconText);

            this.perkPreviewContainer.addChild(iconContainer);
        });
    }

    private createStartButton(x: number, y: number): Container {
        const btn = new Container();
        btn.position.set(x, y);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        // Button background with glow effect
        const glow = new Graphics();
        glow.roundRect(-85, -27, 170, 54, 16);
        glow.fill({ color: 0x3498db, alpha: 0.3 });
        btn.addChild(glow);

        const bg = new Graphics();
        bg.roundRect(-80, -24, 160, 48, 14);
        bg.fill(0x3498db);
        btn.addChild(bg);

        const border = new Graphics();
        border.roundRect(-80, -24, 160, 48, 14);
        border.stroke({ color: 0x5dade2, width: 2 });
        btn.addChild(border);

        // Button text
        const label = new Text({
            text: '🎮 시작하기',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        });
        label.anchor.set(0.5);
        btn.addChild(label);

        // Click handler
        btn.on('pointerdown', () => {
            this.startGameFromCharacterSelect();
        });

        return btn;
    }

    private startGameFromCharacterSelect(): void {
        // Hide character select screen
        this.characterSelectContainer.visible = false;

        // Apply character stats
        this.applyCharacterStats();

        // Update player appearance
        const character = WOBBLE_CHARACTERS[this.selectedCharacter];
        this.player.updateOptions({
            shape: this.selectedCharacter,
            color: character.color,
            expression: 'happy',
        });

        // Start the game
        this.gameTime = 0;
        this.score = 0;
        this.currentRound = 1;
        this.roundTime = 0;
        this.gameState = 'playing';
        this.updateHealthBar();
        this.updateUI();
    }

    private applyCharacterStats(): void {
        const wobbleStats = WOBBLE_STATS[this.selectedCharacter];

        // Apply health multiplier
        this.maxPlayerHealth = Math.round(this.baseMaxHealth * wobbleStats.healthMultiplier);
        this.playerHealth = this.maxPlayerHealth;

        // Apply other stats to base stats
        this.stats = {
            ...DEFAULT_PLAYER_STATS,
            damageMultiplier: wobbleStats.damageMultiplier,
            fireRateMultiplier: 1 / wobbleStats.fireRateMultiplier, // Inverse for fire rate (higher = faster)
            moveSpeedMultiplier: wobbleStats.moveSpeedMultiplier,
        };
    }

    protected animateIdle(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const deltaSeconds = ticker.deltaMS / 1000;
        this.animPhase += deltaSeconds;

        // Update background effects even in idle
        this.backgroundSystem.update(delta, this.activePerks.length);

        // Update perk card animations
        if (this.gameState === 'perk-selection') {
            // Flip animations
            if (this.flipAnimations.length > 0) {
                this.updateFlipAnimations(delta);
            }
            // Card back Balatro filter animations
            if (this.cardBackFilters.length > 0) {
                this.updateCardBackAnimations(delta);
            }
        }

        // Update result screen animations
        if (this.gameState === 'result') {
            this.animateResult(deltaSeconds);
        }

        // Update character select screen animations
        if (this.gameState === 'character-select') {
            for (const [shape, wobble] of this.characterWobbles) {
                const isSelected = shape === this.selectedCharacter;
                const breathe = Math.sin(this.animPhase * 2 + (isSelected ? 0 : Math.PI / 2)) * (isSelected ? 0.05 : 0.02);
                wobble.updateOptions({
                    wobblePhase: this.animPhase,
                    scaleX: (isSelected ? 1.15 : 0.85) * (1 + breathe),
                    scaleY: (isSelected ? 1.15 : 0.85) * (1 - breathe),
                });
            }

            // Pulse animation for start button
            if (this.startButton) {
                const pulse = 1 + Math.sin(this.animPhase * 3) * 0.03;
                this.startButton.scale.set(pulse);
            }
        }

        // Wobble breathing
        const breathe = Math.sin(this.animPhase * 2) * 0.03;
        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
        });
    }

    protected animatePlay(ticker: Ticker): void {
        // If game over or perk selection, just animate idle
        if (this.gameState !== 'playing') {
            this.animateIdle(ticker);
            return;
        }

        const delta = ticker.deltaMS / 16.67;
        const deltaSeconds = ticker.deltaMS / 1000;

        this.animPhase += deltaSeconds;
        this.gameTime += deltaSeconds;
        this.roundTime += deltaSeconds;

        // Update background effects (corruption/restoration)
        this.backgroundSystem.update(delta, this.activePerks.length);

        // Check round completion
        this.checkRoundComplete();

        // Fire projectiles (apply fireRate stat)
        this.fireTimer += deltaSeconds;
        const effectiveFireRate = this.fireRate * this.stats.fireRateMultiplier;
        if (this.fireTimer >= effectiveFireRate && this.enemySystem.enemies.length > 0) {
            this.fireProjectile();
            this.fireTimer = 0;
        }

        // Spawn enemies (faster over time)
        this.spawnTimer += deltaSeconds;
        const currentSpawnRate = Math.max(0.5, this.spawnRate - this.gameTime / 60);
        if (this.spawnTimer >= currentSpawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Update game objects (apply moveSpeed stat)
        this.updatePlayer(delta);
        this.updateProjectiles(delta);
        this.updateEnemiesAndMerges(delta, deltaSeconds);
        this.checkPlayerCollisions();
        this.updateEffects(delta);

        // Update UI
        this.updateUI();

        // Player animation with HP-based expression
        const breathe = Math.sin(this.animPhase * 3) * 0.02;
        const healthPercent = this.playerHealth / this.maxPlayerHealth;

        // Expression changes based on HP
        let expression: 'happy' | 'neutral' | 'effort' | 'worried' | 'struggle' | 'dizzy' = 'happy';
        if (healthPercent <= 0.15) {
            expression = 'dizzy';
        } else if (healthPercent <= 0.30) {
            expression = 'struggle';
        } else if (healthPercent <= 0.50) {
            expression = 'worried';
        } else if (healthPercent <= 0.70) {
            expression = 'effort';
        }

        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
            expression,
        });
    }

    protected updatePreview(): void {
        // No preview needed
    }

    protected checkSuccess(): boolean {
        return true;
    }

    protected onPlayStart(): void {
        // Reset game state
        this.activePerks = [];
        this.perkChoices = [];
        this.resetStats();

        // Show character selection screen instead of starting immediately
        this.showCharacterSelect();
    }

    private resetStats(): void {
        this.stats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            projectileSpeedMultiplier: 1,
            projectileSizeMultiplier: 1,
            knockbackMultiplier: 1,
            bounceCount: 0,
            piercingCount: 0,
            explosionRadius: 0,
            moveSpeedMultiplier: 1,
        };
    }

    protected onReset(): void {
        // Reset systems
        this.projectileSystem.reset();
        this.enemySystem.reset();
        this.backgroundSystem.reset();

        // Clear effects
        for (const effect of this.hitEffects) {
            this.effectContainer.removeChild(effect.graphics);
            effect.graphics.destroy();
        }
        this.hitEffects = [];

        for (const effect of this.textEffects) {
            this.effectContainer.removeChild(effect.text);
            effect.text.destroy();
        }
        this.textEffects = [];

        // Hide perk container
        this.perkContainer.visible = false;

        // Hide result container
        this.resultContainer.visible = false;
        this.resultAnimTime = 0;
        this.resultAnimStep = 0;
        this.resultRankRevealed = false;

        // Hide character select container
        this.characterSelectContainer.visible = false;

        // Reset selected character to default
        this.selectedCharacter = 'circle';

        // Reset state
        this.gameTime = 0;
        this.score = 0;
        this.currentRound = 1;
        this.roundTime = 0;
        this.maxPlayerHealth = this.baseMaxHealth;
        this.playerHealth = this.maxPlayerHealth;
        this.gameState = 'playing';
        this.activePerks = [];
        this.perkChoices = [];
        this.resetStats();
        this.fireTimer = 0;
        this.spawnTimer = 0;
        this.playerX = this.centerX;
        this.playerY = this.centerY;
        this.playerVx = 0;
        this.playerVy = 0;

        // Reset joystick state
        this.joystickActive = false;
        this.joystickContainer.visible = false;
        this.inputDirX = 0;
        this.inputDirY = 0;
        this.inputMagnitude = 0;

        this.player?.position.set(this.playerX, this.playerY);
        this.player?.updateOptions({ expression: 'happy' });
        this.updateHealthBar();
        this.updateUI();
    }
}
