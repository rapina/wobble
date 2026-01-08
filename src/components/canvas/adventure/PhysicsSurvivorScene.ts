import { Application, Container, Graphics, Text, TextStyle, Ticker, FederatedPointerEvent } from 'pixi.js';
import { AdventureScene, AdventureSceneOptions,  } from './AdventureScene';
import { Wobble } from '../Wobble';
import { Perk, getRandomPerks, formatPerkEffect } from './perks';
import { BalatroFilter } from '../filters/BalatroFilter';
import { useCollectionStore } from '@/stores/collectionStore';

// Game state type
type GameState = 'playing' | 'perk-selection' | 'game-over';

interface Projectile {
    graphics: Graphics;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    damage: number;
    bounces: number;
    maxBounces: number;
}

interface Enemy {
    graphics: Container;
    wobble?: Wobble;
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    speed: number;
    mass: number;
    size: number;
}

interface TextEffect {
    timer: number;
    text: Text;
}

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
    private stats = {
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

    // Projectiles & Enemies
    private projectiles: Projectile[] = [];
    private enemies: Enemy[] = [];

    // Fire system
    private fireRate = 0.5; // seconds between shots
    private fireTimer = 0;
    private projectileSpeed = 8;
    private projectileSize = 8;

    // Enemy spawn
    private spawnRate = 2; // seconds between spawns
    private spawnTimer = 0;
    private enemySpeed = 1.5;
    private enemySize = 25;

    // Effects
    private textEffects: TextEffect[] = [];
    private hitEffects: { x: number; y: number; timer: number; graphics: Graphics }[] = [];

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

    // Touch/drag movement (1:1 position mapping)
    private isDragging = false;
    private dragStartX = 0;      // Touch start position
    private dragStartY = 0;
    private playerStartX = 0;    // Player position when drag started
    private playerStartY = 0;

    // Background system - corrupted physics world
    declare private bgContainer: Container;
    declare private cracksGraphics: Graphics;
    declare private glitchGraphics: Graphics;
    declare private formulaSymbols: { text: Text; baseX: number; baseY: number; broken: boolean; phase: number }[];
    private glitchTimer = 0;
    private restorationLevel = 0; // 0 to 1 based on perks collected

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

        // Cracks and glitch graphics
        this.cracksGraphics = new Graphics();
        this.bgContainer.addChild(this.cracksGraphics);

        this.glitchGraphics = new Graphics();
        this.bgContainer.addChild(this.glitchGraphics);

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

        // Initialize formula symbols array
        this.formulaSymbols = [];
    }

    // Override background to create corrupted world effect
    protected drawBackground(): void {
        this.background.clear();
        // Dark corrupted background with slight purple/red tint
        this.background.rect(0, 0, this.width, this.height);
        this.background.fill(0x0d0a14); // Very dark purple-black

        // Add subtle gradient effect
        const gradient = new Graphics();
        gradient.rect(0, 0, this.width, this.height);
        gradient.fill({ color: 0x1a0a20, alpha: 0.5 });
        this.bgContainer.addChild(gradient);

        // Create floating formula symbols
        this.createFormulaSymbols();
    }

    private createFormulaSymbols(): void {
        // Physics formulas to display as floating symbols
        const formulas = ['F=ma', 'E=mc²', 'p=mv', 'KE=½mv²', 'F=kx', 'PV=nRT', 'v=fλ', 'F=G(m₁m₂)/r²'];

        for (let i = 0; i < 12; i++) {
            const formula = formulas[i % formulas.length];
            const style = new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14 + Math.random() * 8,
                fill: 0x3d2a4d,
                fontWeight: 'bold',
            });

            const text = new Text({ text: formula, style });
            text.anchor.set(0.5);
            const baseX = Math.random() * this.width;
            const baseY = Math.random() * this.height;
            text.position.set(baseX, baseY);
            text.alpha = 0.15 + Math.random() * 0.15;

            this.bgContainer.addChild(text);
            this.formulaSymbols.push({
                text,
                baseX,
                baseY,
                broken: true,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    private updateBackground(delta: number): void {
        this.glitchTimer += delta / 60;

        // Calculate restoration level based on active perks (max 10 perks = fully restored)
        this.restorationLevel = Math.min(1, this.activePerks.length / 8);

        // Update cracks (fade out as restoration increases)
        this.drawCracks();

        // Update glitch effect (less frequent as restoration increases)
        this.updateGlitch(delta);

        // Update floating formula symbols
        this.updateFormulaSymbols(delta);
    }

    private drawCracks(): void {
        this.cracksGraphics.clear();

        // Draw fewer cracks as restoration increases
        const crackIntensity = 1 - this.restorationLevel;
        if (crackIntensity < 0.1) return;

        const numCracks = Math.floor(8 * crackIntensity);

        for (let i = 0; i < numCracks; i++) {
            // Use deterministic positions based on index
            const startX = ((i * 137) % this.width);
            const startY = ((i * 89) % this.height);

            this.cracksGraphics.moveTo(startX, startY);

            let x = startX;
            let y = startY;
            const segments = 3 + Math.floor(Math.random() * 3);

            for (let j = 0; j < segments; j++) {
                const angle = Math.random() * Math.PI * 2;
                const length = 20 + Math.random() * 40;
                x += Math.cos(angle) * length;
                y += Math.sin(angle) * length;
                this.cracksGraphics.lineTo(x, y);
            }

            const alpha = 0.3 * crackIntensity * (0.5 + Math.sin(this.glitchTimer * 2 + i) * 0.5);
            this.cracksGraphics.stroke({ color: 0x6a3a7d, width: 2, alpha });
        }
    }

    private updateGlitch(delta: number): void {
        this.glitchGraphics.clear();

        const glitchChance = 0.15 * (1 - this.restorationLevel);
        if (Math.random() > glitchChance) return;

        // Random glitch rectangles
        const numGlitches = Math.floor(3 + Math.random() * 5);
        for (let i = 0; i < numGlitches; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const w = 10 + Math.random() * 50;
            const h = 2 + Math.random() * 8;

            const colors = [0x6a3a7d, 0x8b4a9d, 0x4a2a5d, 0x9a5aad];
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.glitchGraphics.rect(x, y, w, h);
            this.glitchGraphics.fill({ color, alpha: 0.3 + Math.random() * 0.3 });
        }
    }

    private updateFormulaSymbols(delta: number): void {
        for (const symbol of this.formulaSymbols) {
            symbol.phase += delta / 60;

            // Floating motion
            const floatX = Math.sin(symbol.phase * 0.5) * 10;
            const floatY = Math.cos(symbol.phase * 0.3) * 8;

            // Glitch displacement (less as restoration increases)
            const glitchDisplacement = (1 - this.restorationLevel) * 5;
            const glitchX = (Math.random() - 0.5) * glitchDisplacement;
            const glitchY = (Math.random() - 0.5) * glitchDisplacement;

            symbol.text.position.set(
                symbol.baseX + floatX + glitchX,
                symbol.baseY + floatY + glitchY
            );

            // Color and alpha based on restoration
            const baseAlpha = 0.15 + this.restorationLevel * 0.25;
            const flickerAlpha = symbol.broken ? Math.random() * 0.1 : 0;
            symbol.text.alpha = baseAlpha - flickerAlpha;

            // Change color as restoration increases (from dark purple to bright cyan)
            if (this.restorationLevel > 0.3) {
                const restored = this.restorationLevel;
                const r = Math.floor(0x3d + (0x5d - 0x3d) * restored);
                const g = Math.floor(0x2a + (0xad - 0x2a) * restored);
                const b = Math.floor(0x4d + (0xe2 - 0x4d) * restored);
                const color = (r << 16) | (g << 8) | b;
                symbol.text.style.fill = color;
            }
        }
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
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (this.phase === 'narration' || this.gameState !== 'playing') return;

        this.isDragging = true;
        const pos = e.getLocalPosition(this.gameContainer);
        // Store touch start position and player's current position
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.playerStartX = this.playerX;
        this.playerStartY = this.playerY;
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.isDragging || this.gameState !== 'playing') return;

        const pos = e.getLocalPosition(this.gameContainer);
        // 1:1 position mapping - move player exactly as much as finger moved
        const dx = pos.x - this.dragStartX;
        const dy = pos.y - this.dragStartY;

        this.playerX = this.playerStartX + dx;
        this.playerY = this.playerStartY + dy;

        // Keep in bounds
        const margin = 30;
        this.playerX = Math.max(margin, Math.min(this.width - margin, this.playerX));
        this.playerY = Math.max(margin, Math.min(this.height - margin, this.playerY));

        // Update player position immediately
        this.player?.position.set(this.playerX, this.playerY);
    }

    private onPointerUp(_e: FederatedPointerEvent): void {
        this.isDragging = false;
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
        // Find nearest enemy for auto-aim
        let targetX = this.playerX + 1;
        let targetY = this.playerY;
        let nearestDist = Infinity;

        for (const enemy of this.enemies) {
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                targetX = enemy.x;
                targetY = enemy.y;
            }
        }

        // Calculate direction
        const dx = targetX - this.playerX;
        const dy = targetY - this.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Apply perk stats to projectile properties
        const size = this.projectileSize * this.stats.projectileSizeMultiplier;
        const speed = this.projectileSpeed * this.stats.projectileSpeedMultiplier;
        const damage = 10 * this.stats.damageMultiplier;
        const maxBounces = this.stats.bounceCount;

        // Create projectile
        const projectile = new Graphics();
        projectile.circle(0, 0, size);
        projectile.fill(0xf5b041);
        projectile.circle(0, 0, size * 0.6);
        projectile.stroke({ color: 0xffffff, width: 2 });

        projectile.position.set(this.playerX, this.playerY);
        this.projectileContainer.addChild(projectile);

        const proj: Projectile = {
            graphics: projectile,
            x: this.playerX,
            y: this.playerY,
            vx: dirX * speed,
            vy: dirY * speed,
            mass: 1,
            damage,
            bounces: 0,
            maxBounces,
        };

        this.projectiles.push(proj);
    }

    private spawnEnemy(): void {
        // Spawn from random edge
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;

        switch (side) {
            case 0: // top
                x = Math.random() * this.width;
                y = -this.enemySize;
                break;
            case 1: // right
                x = this.width + this.enemySize;
                y = Math.random() * this.height;
                break;
            case 2: // bottom
                x = Math.random() * this.width;
                y = this.height + this.enemySize;
                break;
            default: // left
                x = -this.enemySize;
                y = Math.random() * this.height;
                break;
        }

        // Scale difficulty with time
        const difficultyMult = 1 + this.gameTime / 60;
        const health = 20 * difficultyMult;
        const speed = this.enemySpeed * (0.8 + Math.random() * 0.4);

        // Create Shadow Wobble enemy
        const wobble = new Wobble({
            size: this.enemySize,
            color: 0x1a1a1a,
            shape: 'shadow',
            expression: 'angry',
            showShadow: false,
        });
        wobble.position.set(x, y);
        this.enemyContainer.addChild(wobble);

        const enemy: Enemy = {
            graphics: wobble,
            wobble,
            x, y,
            vx: 0, vy: 0,
            health,
            maxHealth: health,
            speed,
            mass: 2,
            size: this.enemySize,
        };

        this.enemies.push(enemy);
    }

    private updateProjectiles(delta: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Move
            proj.x += proj.vx * delta;
            proj.y += proj.vy * delta;

            // Bounce off walls if projectile has bounces available (from perk)
            if (proj.bounces < proj.maxBounces) {
                if (proj.x < 0 || proj.x > this.width) {
                    proj.vx *= -0.8;
                    proj.x = Math.max(0, Math.min(this.width, proj.x));
                    proj.bounces++;
                }
                if (proj.y < 0 || proj.y > this.height) {
                    proj.vy *= -0.8;
                    proj.y = Math.max(0, Math.min(this.height, proj.y));
                    proj.bounces++;
                }
            }

            proj.graphics.position.set(proj.x, proj.y);

            // Remove if out of bounds
            const margin = 50;
            if (proj.x < -margin || proj.x > this.width + margin ||
                proj.y < -margin || proj.y > this.height + margin) {
                this.projectileContainer.removeChild(proj.graphics);
                proj.graphics.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }

    private updateEnemies(delta: number): void {
        for (const enemy of this.enemies) {
            // Move towards player
            const dx = this.playerX - enemy.x;
            const dy = this.playerY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Add velocity towards player
            const accel = 0.1 * delta;
            enemy.vx += (dx / dist) * accel * enemy.speed;
            enemy.vy += (dy / dist) * accel * enemy.speed;

            // Limit speed
            const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
            if (speed > enemy.speed) {
                enemy.vx = (enemy.vx / speed) * enemy.speed;
                enemy.vy = (enemy.vy / speed) * enemy.speed;
            }

            // Apply velocity
            enemy.x += enemy.vx * delta;
            enemy.y += enemy.vy * delta;

            // Friction on velocity from knockback
            enemy.vx *= 0.98;
            enemy.vy *= 0.98;

            enemy.graphics.position.set(enemy.x, enemy.y);

            // Animate wobble phase for Shadow enemies
            if (enemy.wobble) {
                enemy.wobble.updateOptions({
                    wobblePhase: this.animPhase,
                    lookDirection: { x: dx / dist, y: dy / dist },
                });
            }
        }
    }

    private checkCollisions(): void {
        // Projectile vs Enemy
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const proj = this.projectiles[pi];

            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const enemy = this.enemies[ei];

                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = this.projectileSize * this.stats.projectileSizeMultiplier + enemy.size / 2;

                if (dist < minDist) {
                    // Hit!
                    enemy.health -= proj.damage;

                    // Knockback (always apply, scaled by knockback stat)
                    const knockback = (proj.mass * Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy)) / enemy.mass;
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    enemy.vx += nx * knockback * 0.5 * this.stats.knockbackMultiplier;
                    enemy.vy += ny * knockback * 0.5 * this.stats.knockbackMultiplier;

                    // Hit effect
                    this.createHitEffect(proj.x, proj.y);

                    // Explosion effect if has explosionRadius
                    if (this.stats.explosionRadius > 0) {
                        this.createExplosion(proj.x, proj.y);
                    }

                    // Remove projectile (unless has bounces left)
                    if (proj.bounces >= proj.maxBounces) {
                        this.projectileContainer.removeChild(proj.graphics);
                        proj.graphics.destroy();
                        this.projectiles.splice(pi, 1);
                    } else {
                        // Bounce off enemy
                        proj.vx = nx * Math.abs(proj.vx) + nx * 2;
                        proj.vy = ny * Math.abs(proj.vy) + ny * 2;
                        proj.bounces++;
                    }

                    // Check if enemy died
                    if (enemy.health <= 0) {
                        this.enemyContainer.removeChild(enemy.graphics);
                        enemy.graphics.destroy();
                        this.enemies.splice(ei, 1);
                        this.score += 10;

                        // Unlock shadow wobble on first enemy kill
                        useCollectionStore.getState().unlockWobble('shadow');
                    }

                    break;
                }
            }
        }

        // Enemy vs Enemy (always check for separation)
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const e1 = this.enemies[i];
                const e2 = this.enemies[j];

                const dx = e2.x - e1.x;
                const dy = e2.y - e1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = e1.size / 2 + e2.size / 2;

                if (dist < minDist && dist > 0) {
                    // Separate overlapping enemies
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Relative velocity
                    const dvx = e1.vx - e2.vx;
                    const dvy = e1.vy - e2.vy;
                    const dvn = dvx * nx + dvy * ny;

                    if (dvn > 0) {
                        // Elastic collision
                        e1.vx -= dvn * nx;
                        e1.vy -= dvn * ny;
                        e2.vx += dvn * nx;
                        e2.vy += dvn * ny;
                    }

                    // Separate
                    const overlap = minDist - dist;
                    e1.x -= overlap * nx * 0.5;
                    e1.y -= overlap * ny * 0.5;
                    e2.x += overlap * nx * 0.5;
                    e2.y += overlap * ny * 0.5;
                }
            }
        }

        // Enemy vs Player
        for (const enemy of this.enemies) {
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
        for (const enemy of this.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + enemy.size / 2) {
                enemy.health -= damage;
                // Push enemies away
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                enemy.vx += nx * 5;
                enemy.vy += ny * 5;
            }
        }

        // Fade out explosion
        this.hitEffects.push({
            x, y,
            timer: 0.3,
            graphics: explosion,
        });
    }

    private createHitEffect(x: number, y: number): void {
        const effect = new Graphics();
        effect.circle(0, 0, 15);
        effect.fill({ color: 0xffffff, alpha: 0.8 });
        effect.position.set(x, y);
        this.effectContainer.addChild(effect);

        this.hitEffects.push({
            x, y,
            timer: 0.2,
            graphics: effect,
        });
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
        // Player position is updated directly in onPointerMove (1:1 mapping)
        // Here we only handle recoil effects

        // Apply recoil velocity
        this.playerX += this.playerVx * delta;
        this.playerY += this.playerVy * delta;

        // Decay recoil
        this.playerVx *= this.recoilDecay;
        this.playerVy *= this.recoilDecay;

        // Keep in bounds
        const margin = 30;
        this.playerX = Math.max(margin, Math.min(this.width - margin, this.playerX));
        this.playerY = Math.max(margin, Math.min(this.height - margin, this.playerY));

        this.player.position.set(this.playerX, this.playerY);
    }

    private gameOver(): void {
        this.gameState = 'game-over';
        this.player.updateOptions({ expression: 'worried' });

        // Notify completion (game over counts as "success" - user survived as long as they could)
        setTimeout(() => {
            this.onPlayComplete?.('success');
        }, 1500);
    }

    // Remove dead enemies
    private cleanupDeadEnemies(): void {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].health <= 0) {
                const enemy = this.enemies[i];
                this.enemyContainer.removeChild(enemy.graphics);
                enemy.graphics.destroy();
                this.enemies.splice(i, 1);
                this.score += 10;
            }
        }
    }

    protected animateIdle(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const deltaSeconds = ticker.deltaMS / 1000;
        this.animPhase += deltaSeconds;

        // Update background effects even in idle
        this.updateBackground(delta);

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
        this.updateBackground(delta);

        // Check round completion
        this.checkRoundComplete();

        // Fire projectiles (apply fireRate stat)
        this.fireTimer += deltaSeconds;
        const effectiveFireRate = this.fireRate * this.stats.fireRateMultiplier;
        if (this.fireTimer >= effectiveFireRate && this.enemies.length > 0) {
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
        this.updateEnemies(delta);
        this.checkCollisions();
        this.cleanupDeadEnemies();
        this.updateEffects(delta);

        // Update UI
        this.updateUI();

        // Player animation
        const breathe = Math.sin(this.animPhase * 3) * 0.02;
        this.player?.updateOptions({
            wobblePhase: this.animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
            expression: this.playerHealth < 30 ? 'worried' : 'happy',
        });
    }

    protected updatePreview(): void {
        // No preview needed
    }

    protected checkSuccess(): boolean {
        return true;
    }

    protected onPlayStart(): void {
        this.gameTime = 0;
        this.score = 0;
        this.currentRound = 1;
        this.roundTime = 0;
        this.playerHealth = this.maxPlayerHealth;
        this.gameState = 'playing';
        this.activePerks = [];
        this.perkChoices = [];
        this.resetStats();
        this.updateHealthBar();
        this.updateUI();
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
        // Clear projectiles
        for (const proj of this.projectiles) {
            this.projectileContainer.removeChild(proj.graphics);
            proj.graphics.destroy();
        }
        this.projectiles = [];

        // Clear enemies
        for (const enemy of this.enemies) {
            this.enemyContainer.removeChild(enemy.graphics);
            enemy.graphics.destroy();
        }
        this.enemies = [];

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

        // Reset state
        this.gameTime = 0;
        this.score = 0;
        this.currentRound = 1;
        this.roundTime = 0;
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
        this.isDragging = false;

        this.player?.position.set(this.playerX, this.playerY);
        this.player?.updateOptions({ expression: 'happy' });
        this.updateHealthBar();
        this.updateUI();
    }
}
