import { Application, Container, Ticker, Graphics } from 'pixi.js';
import { pixiColors } from '../../../utils/pixiHelpers';

let sceneIdCounter = 0;

export abstract class BaseScene {
    protected app: Application;
    public container: Container;
    protected ticker: Ticker;
    protected width: number;
    protected height: number;
    protected background: Graphics;
    protected variables: Record<string, number> = {};

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
