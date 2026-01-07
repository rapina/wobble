import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

export class FreeFallScene extends BaseScene {
    declare private fallingBlob: Blob;
    declare private groundGraphics: Graphics;
    declare private trailGraphics: Graphics;
    declare private trail: { x: number; y: number; alpha: number }[];
    declare private animationTime: number;
    declare private fallStartY: number;

    protected setup(): void {
        this.animationTime = 0;
        this.trail = [];
        this.fallStartY = 60;

        this.groundGraphics = new Graphics();
        this.container.addChild(this.groundGraphics);

        this.trailGraphics = new Graphics();
        this.container.addChild(this.trailGraphics);

        // Falling object
        this.fallingBlob = new Blob({
            size: 40,
            color: 0xf39c12,
            shape: 'circle',
            expression: 'surprised',
        });
        this.fallingBlob.setPosition(this.centerX, this.fallStartY);
        this.container.addChild(this.fallingBlob);

        this.drawGround();
    }

    protected onVariablesChange(): void {
        const g = this.variables['g'] || 9.8;

        // Reset animation when variables change significantly
        this.animationTime = 0;
        this.trail = [];
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;

        const g = this.variables['g'] || 9.8;
        const maxT = this.variables['t'] || 3;
        const maxH = 0.5 * g * maxT * maxT;

        // Animation loop
        this.animationTime += delta * 0.02;
        const cycleTime = this.animationTime % 1.5; // 1.5 second cycle
        const t = Math.min(cycleTime, 1) * maxT; // Current time in animation

        // Calculate position: h = ½gt²
        const h = 0.5 * g * t * t;
        const normalizedH = h / Math.max(maxH, 1);
        const groundY = this.height - 60;
        const fallDistance = groundY - this.fallStartY;
        const currentY = this.fallStartY + normalizedH * fallDistance;

        // Add trail point
        if (cycleTime < 1) {
            this.trail.push({
                x: this.centerX,
                y: currentY,
                alpha: 1,
            });
        }

        // Fade trail
        this.trail.forEach((p) => {
            p.alpha -= 0.02 * delta;
        });
        this.trail = this.trail.filter((p) => p.alpha > 0);

        // Update blob position
        this.fallingBlob.setPosition(this.centerX, Math.min(currentY, groundY - 20));

        // Expression changes during fall
        if (cycleTime < 0.3) {
            this.fallingBlob.updateOptions({ expression: 'surprised' });
        } else if (cycleTime < 0.8) {
            this.fallingBlob.updateOptions({ expression: 'sleepy' });
        } else if (cycleTime >= 1) {
            this.fallingBlob.updateOptions({ expression: 'happy' });
        }

        // Stretch effect based on velocity
        const velocity = g * t;
        const stretch = Math.min(velocity / 30, 0.3);
        this.fallingBlob.updateOptions({
            scaleY: 1 + stretch,
            scaleX: 1 - stretch * 0.3,
        });

        this.drawTrail();
        this.drawHeightMarker(normalizedH * fallDistance);
    }

    private drawGround(): void {
        const g = this.groundGraphics;
        g.clear();

        const groundY = this.height - 60;

        // Ground
        g.rect(0, groundY, this.width, 60);
        g.fill({ color: 0x2d5016, alpha: 0.8 });

        // Grass effect
        for (let x = 10; x < this.width; x += 15) {
            g.moveTo(x, groundY);
            g.lineTo(x - 3, groundY - 8);
            g.moveTo(x, groundY);
            g.lineTo(x + 3, groundY - 6);
            g.stroke({ color: 0x4a7c23, width: 2, alpha: 0.6 });
        }
    }

    private drawTrail(): void {
        const g = this.trailGraphics;
        g.clear();

        this.trail.forEach((p, i) => {
            g.circle(p.x, p.y, 3);
            g.fill({ color: 0xf39c12, alpha: p.alpha * 0.5 });
        });
    }

    private drawHeightMarker(h: number): void {
        const g = this.groundGraphics;

        // Height indicator line
        const groundY = this.height - 60;
        const startY = this.fallStartY;

        g.moveTo(this.width - 30, startY);
        g.lineTo(this.width - 30, groundY);
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });

        // Current height marker
        g.moveTo(this.width - 40, startY + h);
        g.lineTo(this.width - 20, startY + h);
        g.stroke({ color: 0xf39c12, width: 3, alpha: 0.8 });

        // Arrow pointing down
        g.moveTo(this.centerX + 60, this.centerY);
        g.lineTo(this.centerX + 60, this.centerY + 40);
        g.stroke({ color: 0xe74c3c, width: 3, alpha: 0.6 });
        g.moveTo(this.centerX + 60, this.centerY + 40);
        g.lineTo(this.centerX + 55, this.centerY + 30);
        g.moveTo(this.centerX + 60, this.centerY + 40);
        g.lineTo(this.centerX + 65, this.centerY + 30);
        g.stroke({ color: 0xe74c3c, width: 3, alpha: 0.6 });
    }
}
