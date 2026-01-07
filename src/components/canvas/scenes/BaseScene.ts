import { Application, Container, Ticker, Graphics } from 'pixi.js';
import { pixiColors } from '../../../utils/pixiHelpers';

let sceneIdCounter = 0;

// Grid animation directions
type GridDirection = 'diagonal' | 'up' | 'down' | 'left' | 'right';

export abstract class BaseScene {
    protected app: Application;
    public container: Container;
    protected ticker: Ticker;
    protected width: number;
    protected height: number;
    protected background: Graphics;
    protected gridOverlay: Graphics;
    protected variables: Record<string, number> = {};

    // Grid animation state
    private gridOffsetX = 0;
    private gridOffsetY = 0;
    private gridSpeed = 0.25;
    private gridDirection: GridDirection = 'diagonal';
    private gridSize = 40;
    private gridColor = 0x2d3748;
    private gridAlpha = 0.15;

    private boundAnimate: (ticker: Ticker) => void;
    protected sceneId: string;
    private _destroyed = false;

    constructor(app: Application) {
        const counter = ++sceneIdCounter;
        const instanceId = Math.random().toString(36).substring(2, 6);
        this.sceneId = `${counter}-${instanceId}`;

        this.app = app;
        this.container = new Container();
        this.ticker = app.ticker;
        this.width = app.screen.width;
        this.height = app.screen.height;

        // Create background
        this.background = new Graphics();
        this.drawBackground();
        this.container.addChild(this.background);

        // Create grid overlay
        this.gridOverlay = new Graphics();
        this.container.addChild(this.gridOverlay);

        // Bind animate function with destroy check
        this.boundAnimate = (ticker: Ticker) => {
            if (this._destroyed) {
                // Stale callback from destroyed scene - remove it safely
                try {
                    this.ticker.remove(this.boundAnimate);
                } catch {
                    // Ticker may already be destroyed
                }
                return;
            }
            this.updateGrid(ticker);
            this.animate(ticker);
        };

        // Setup scene
        this.setup();

        // Start animation loop
        this.ticker.add(this.boundAnimate);
    }

    protected drawBackground(): void {
        this.background.clear();
        this.background.rect(0, 0, this.width, this.height);
        this.background.fill(pixiColors.backgroundDark);
    }

    private updateGrid(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const speed = this.gridSpeed * delta;

        // Update offset based on direction
        switch (this.gridDirection) {
            case 'diagonal':
                this.gridOffsetX += speed;
                this.gridOffsetY += speed;
                break;
            case 'up':
                this.gridOffsetY -= speed;
                break;
            case 'down':
                this.gridOffsetY += speed;
                break;
            case 'left':
                this.gridOffsetX -= speed;
                break;
            case 'right':
                this.gridOffsetX += speed;
                break;
        }

        // Wrap offsets to prevent overflow
        this.gridOffsetX = this.gridOffsetX % this.gridSize;
        this.gridOffsetY = this.gridOffsetY % this.gridSize;

        this.drawGrid();
    }

    private drawGrid(): void {
        const g = this.gridOverlay;
        g.clear();

        const size = this.gridSize;
        const startX = -size + (this.gridOffsetX % size);
        const startY = -size + (this.gridOffsetY % size);

        // Draw vertical lines
        for (let x = startX; x <= this.width + size; x += size) {
            // Calculate fade based on distance from edges
            const distFromEdge = Math.min(Math.max(x, 0), Math.max(this.width - x, 0));
            const edgeFade = Math.min(distFromEdge / 40, 1);

            g.moveTo(x, 0);
            g.lineTo(x, this.height);
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 });
        }

        // Draw horizontal lines
        for (let y = startY; y <= this.height + size; y += size) {
            const distFromEdge = Math.min(Math.max(y, 0), Math.max(this.height - y, 0));
            const edgeFade = Math.min(distFromEdge / 40, 1);

            g.moveTo(0, y);
            g.lineTo(this.width, y);
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 });
        }

        // Draw corner intersection dots
        for (let x = startX; x <= this.width + size; x += size) {
            for (let y = startY; y <= this.height + size; y += size) {
                // Edge fade
                const distFromEdgeX = Math.min(Math.max(x, 0), Math.max(this.width - x, 0));
                const distFromEdgeY = Math.min(Math.max(y, 0), Math.max(this.height - y, 0));
                const edgeFade = Math.min(Math.min(distFromEdgeX, distFromEdgeY) / 50, 1);

                const alpha = 0.2 * edgeFade;

                if (alpha > 0.03 && x > 0 && x < this.width && y > 0 && y < this.height) {
                    g.circle(x, y, 1.5);
                    g.fill({ color: 0x4a5568, alpha });
                }
            }
        }

        // Corner shadows for depth
        this.drawCornerShadows(g);
    }

    private drawCornerShadows(g: Graphics): void {
        // Draw subtle corner gradients using filled triangles
        const cornerSize = 80;
        const alpha = 0.15;

        // Top-left corner
        g.moveTo(0, 0);
        g.lineTo(cornerSize, 0);
        g.lineTo(0, cornerSize);
        g.closePath();
        g.fill({ color: 0x000000, alpha: alpha * 0.5 });

        // Top-right corner
        g.moveTo(this.width, 0);
        g.lineTo(this.width - cornerSize, 0);
        g.lineTo(this.width, cornerSize);
        g.closePath();
        g.fill({ color: 0x000000, alpha: alpha * 0.5 });

        // Bottom-left corner
        g.moveTo(0, this.height);
        g.lineTo(cornerSize, this.height);
        g.lineTo(0, this.height - cornerSize);
        g.closePath();
        g.fill({ color: 0x000000, alpha: alpha * 0.5 });

        // Bottom-right corner
        g.moveTo(this.width, this.height);
        g.lineTo(this.width - cornerSize, this.height);
        g.lineTo(this.width, this.height - cornerSize);
        g.closePath();
        g.fill({ color: 0x000000, alpha: alpha * 0.5 });
    }

    /**
     * Initialize scene elements (called once)
     */
    protected abstract setup(): void;

    /**
     * Animation loop (called every frame)
     */
    protected abstract animate(ticker: Ticker): void;

    /**
     * Update scene with new variable values
     */
    public update(variables: Record<string, number>): void {
        this.variables = { ...variables };
        this.onVariablesChange();
    }

    /**
     * Called when variables change (override in subclasses)
     */
    protected onVariablesChange(): void {
        // Override in subclasses
    }

    /**
     * Handle resize
     */
    public resize(): void {
        this.width = this.app.screen.width;
        this.height = this.app.screen.height;
        this.drawBackground();
        this.drawGrid();
        this.onResize();
    }

    /**
     * Called on resize (override in subclasses)
     */
    protected onResize(): void {
        // Override in subclasses
    }

    /**
     * Cleanup scene
     */
    public destroy(): void {
        this._destroyed = true;
        try {
            if (this.ticker && this.boundAnimate) {
                this.ticker.remove(this.boundAnimate);
            }
        } catch {
            // Ticker may already be destroyed
        }
        try {
            this.container.destroy({ children: true });
        } catch {
            // Container may already be destroyed
        }
    }

    /**
     * Get center X of the scene
     */
    protected get centerX(): number {
        return this.width / 2;
    }

    /**
     * Get center Y of the scene
     */
    protected get centerY(): number {
        return this.height / 2;
    }
}
