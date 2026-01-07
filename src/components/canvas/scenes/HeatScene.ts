import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

export class HeatScene extends BaseScene {
    declare private hotBlob: Blob;
    declare private coldBlob: Blob;
    declare private arrowGraphics: Graphics;
    declare private particleGraphics: Graphics;
    declare private time: number;
    declare private heatParticles: { x: number; y: number; progress: number }[];

    protected setup(): void {
        this.time = 0;
        this.heatParticles = [];
        this.arrowGraphics = new Graphics();
        this.container.addChild(this.arrowGraphics);

        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        // Hot object (left - 에너지 전달자)
        this.hotBlob = new Blob({
            size: 70,
            color: 0xff4757,
            shape: 'circle',
            expression: 'hot',
            glowIntensity: 0.4,
            glowColor: 0xff4757,
        });
        this.hotBlob.setPosition(this.width * 0.25, this.centerY);
        this.container.addChild(this.hotBlob);

        // Cold object (right - 에너지 수신자)
        this.coldBlob = new Blob({
            size: 60,
            color: 0x4ecdc4,
            shape: 'square',
            expression: 'happy',
        });
        this.coldBlob.setPosition(this.width * 0.75, this.centerY);
        this.container.addChild(this.coldBlob);
    }

    protected onVariablesChange(): void {
        const Th = this.variables['Th'] || 100;
        const Tc = this.variables['Tc'] || 20;

        this.hotBlob.updateOptions({
            size: 50 + Th * 0.2,
            glowIntensity: Math.min(Th / 200, 0.8),
        });
        this.coldBlob.updateOptions({ size: 50 + Tc * 0.2 });
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        const Th = this.variables['Th'] || 100;
        const Tc = this.variables['Tc'] || 20;
        const heatFlow = (Th - Tc) * 0.01;

        // Emit heat particles
        if (Math.random() < heatFlow * 0.1) {
            this.heatParticles.push({
                x: this.width * 0.25 + 40,
                y: this.centerY + (Math.random() - 0.5) * 40,
                progress: 0,
            });
        }

        // Update particles
        this.heatParticles.forEach((p) => {
            p.progress += 0.02 * delta;
            p.x = this.width * 0.25 + 40 + p.progress * (this.width * 0.5 - 80);
        });
        this.heatParticles = this.heatParticles.filter((p) => p.progress < 1);

        this.hotBlob.updateOptions({
            wobblePhase: this.time * 2,
            scaleX: 1 + Math.sin(this.time * 3) * 0.05,
        });
        this.coldBlob.updateOptions({ wobblePhase: this.time });

        this.drawHeatFlow();
        this.drawParticles();
    }

    private drawHeatFlow(): void {
        const g = this.arrowGraphics;
        g.clear();

        const startX = this.width * 0.25 + 50;
        const endX = this.width * 0.75 - 50;
        const y = this.centerY;

        // Arrow shaft
        g.moveTo(startX, y);
        g.lineTo(endX, y);
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.5 });

        // Arrow head
        g.moveTo(endX, y);
        g.lineTo(endX - 15, y - 10);
        g.moveTo(endX, y);
        g.lineTo(endX - 15, y + 10);
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.5 });
    }

    private drawParticles(): void {
        const g = this.particleGraphics;
        g.clear();

        this.heatParticles.forEach((p) => {
            const opacity = 1 - p.progress;
            g.circle(p.x, p.y, 5);
            g.fill({ color: 0xff6b6b, alpha: opacity });
        });
    }
}
