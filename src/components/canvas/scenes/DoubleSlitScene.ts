import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';

export class DoubleSlitScene extends BaseScene {
    declare private barrierGraphics: Graphics;
    declare private waveGraphics: Graphics;
    declare private patternGraphics: Graphics;
    declare private time: number;

    protected setup(): void {
        this.time = 0;

        this.barrierGraphics = new Graphics();
        this.container.addChild(this.barrierGraphics);

        this.waveGraphics = new Graphics();
        this.container.addChild(this.waveGraphics);

        this.patternGraphics = new Graphics();
        this.container.addChild(this.patternGraphics);
    }

    protected onVariablesChange(): void {
        this.drawBarrier();
        this.drawPattern();
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.04;

        this.drawWaves();
    }

    private drawBarrier(): void {
        const g = this.barrierGraphics;
        g.clear();

        const d = this.variables['d'] || 0.5;
        const barrierX = this.width * 0.3;
        const slitGap = Math.max(15, d * 30);

        // Barrier with two slits
        g.rect(barrierX - 4, this.centerY - 100, 8, 100 - slitGap / 2 - 5);
        g.fill({ color: 0x444444, alpha: 0.9 });

        g.rect(barrierX - 4, this.centerY - slitGap / 2 + 5, 8, slitGap - 10);
        g.fill({ color: 0x444444, alpha: 0.9 });

        g.rect(barrierX - 4, this.centerY + slitGap / 2 + 5, 8, 100 - slitGap / 2 - 5);
        g.fill({ color: 0x444444, alpha: 0.9 });

        // Highlight slits
        g.rect(barrierX - 2, this.centerY - slitGap / 2 - 3, 4, 6);
        g.fill({ color: 0x87ceeb, alpha: 0.8 });
        g.rect(barrierX - 2, this.centerY + slitGap / 2 - 3, 4, 6);
        g.fill({ color: 0x87ceeb, alpha: 0.8 });
    }

    private drawWaves(): void {
        const g = this.waveGraphics;
        g.clear();

        const lambda = this.variables['λ'] || 550;
        const d = this.variables['d'] || 0.5;
        const barrierX = this.width * 0.3;
        const slitGap = Math.max(15, d * 30);
        const color = this.wavelengthToColor(lambda);

        // Incoming plane waves
        for (let i = 0; i < 6; i++) {
            const x = barrierX - 20 - i * 15 + (this.time * 20) % 15;
            if (x > 20 && x < barrierX - 10) {
                g.moveTo(x, this.centerY - 80);
                g.lineTo(x, this.centerY + 80);
                g.stroke({ color, width: 2, alpha: 0.5 - i * 0.06 });
            }
        }

        // Circular waves from each slit
        const slit1Y = this.centerY - slitGap / 2;
        const slit2Y = this.centerY + slitGap / 2;

        for (let r = 0; r < 6; r++) {
            const radius = 15 + r * 20 + (this.time * 15) % 20;
            if (radius < 150) {
                const alpha = 0.4 - r * 0.05;

                // From slit 1
                g.arc(barrierX + 4, slit1Y, radius, -Math.PI / 2, Math.PI / 2);
                g.stroke({ color, width: 1.5, alpha });

                // From slit 2
                g.arc(barrierX + 4, slit2Y, radius, -Math.PI / 2, Math.PI / 2);
                g.stroke({ color, width: 1.5, alpha });
            }
        }
    }

    private drawPattern(): void {
        const g = this.patternGraphics;
        g.clear();

        const lambda = this.variables['λ'] || 550;
        const dx = this.variables['Δx'] || 2.2;
        const screenX = this.width * 0.85;
        const screenHeight = 160;
        const color = this.wavelengthToColor(lambda);

        // Screen
        g.rect(screenX - 3, this.centerY - screenHeight / 2, 6, screenHeight);
        g.fill({ color: 0x222222, alpha: 0.9 });

        // Interference pattern
        const fringeSpacing = Math.max(8, dx * 15);
        const numFringes = Math.floor(screenHeight / fringeSpacing);

        for (let i = -numFringes; i <= numFringes; i++) {
            const y = this.centerY + i * fringeSpacing;
            if (y > this.centerY - screenHeight / 2 && y < this.centerY + screenHeight / 2) {
                // Intensity decreases with distance from center
                const intensity = Math.max(0.2, 1 - Math.abs(i) * 0.15);
                const size = 4 + (1 - Math.abs(i) * 0.1) * 3;

                g.circle(screenX, y, size);
                g.fill({ color, alpha: intensity });
            }
        }
    }

    private wavelengthToColor(wavelength: number): number {
        if (wavelength < 450) return 0x9400d3;
        if (wavelength < 495) return 0x0000ff;
        if (wavelength < 570) return 0x00ff00;
        if (wavelength < 590) return 0xffff00;
        if (wavelength < 620) return 0xff7f00;
        return 0xff0000;
    }
}
