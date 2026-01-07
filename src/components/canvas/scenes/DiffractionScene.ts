import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

interface WaveParticle {
    x: number;
    y: number;
    angle: number;
    distance: number;
}

export class DiffractionScene extends BaseScene {
    declare private lightBlob: Blob;
    declare private screenBlob: Blob;
    declare private gratingGraphics: Graphics;
    declare private waveGraphics: Graphics;
    declare private patternGraphics: Graphics;
    declare private particles: WaveParticle[];
    declare private time: number;

    protected setup(): void {
        this.time = 0;
        this.particles = [];

        this.gratingGraphics = new Graphics();
        this.container.addChild(this.gratingGraphics);

        this.waveGraphics = new Graphics();
        this.container.addChild(this.waveGraphics);

        this.patternGraphics = new Graphics();
        this.container.addChild(this.patternGraphics);

        // Light source (circle)
        this.lightBlob = new Blob({
            size: 35,
            color: 0xffffff,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.5,
            glowColor: 0xffffff,
        });
        this.lightBlob.setPosition(50, this.centerY);
        this.container.addChild(this.lightBlob);

        // Screen indicator (square)
        this.screenBlob = new Blob({
            size: 25,
            color: 0x333333,
            shape: 'square',
            expression: 'sleepy',
        });
        this.screenBlob.setPosition(this.width - 40, this.centerY);
        this.container.addChild(this.screenBlob);
    }

    protected onVariablesChange(): void {
        const lambda = this.variables['λ'] || 550;
        const color = this.wavelengthToColor(lambda);

        this.lightBlob.updateOptions({
            color,
            glowColor: color,
        });
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.03;

        const lambda = this.variables['λ'] || 550;
        const d = this.variables['d'] || 2;
        const n = this.variables['n'] || 1;
        const theta = this.variables['θ'] || 15;

        // Emit wave particles from grating slits
        const gratingX = this.width * 0.35;
        const slitSpacing = Math.max(10, d * 6);
        const numSlits = Math.floor(120 / slitSpacing);

        if (Math.random() < 0.3) {
            for (let s = 0; s < numSlits; s++) {
                const slitY = this.centerY - 60 + s * slitSpacing + slitSpacing / 2;
                // Main diffraction angles
                for (let order = 0; order <= n; order++) {
                    const angle = order === 0 ? 0 : (theta * order * Math.PI) / 180;
                    this.particles.push({
                        x: gratingX + 5,
                        y: slitY,
                        angle: angle,
                        distance: 0,
                    });
                    if (order > 0) {
                        // Negative order
                        this.particles.push({
                            x: gratingX + 5,
                            y: slitY,
                            angle: -angle,
                            distance: 0,
                        });
                    }
                }
            }
        }

        // Update particles
        this.particles.forEach((p) => {
            p.distance += 2 * delta;
            p.x = gratingX + 5 + Math.cos(p.angle) * p.distance * 3;
            p.y = p.y + Math.sin(p.angle) * 2 * delta;
        });
        this.particles = this.particles.filter((p) => p.x < this.width - 50);

        // Animate blobs
        this.lightBlob.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.sin(this.time * 5) * 0.05,
        });

        this.drawGrating(d);
        this.drawWaves(lambda);
        this.drawPattern(theta, n, lambda);
    }

    private wavelengthToColor(wavelength: number): number {
        if (wavelength < 420) return 0x8b00ff; // Violet
        if (wavelength < 470) return 0x0000ff; // Blue
        if (wavelength < 530) return 0x00ff00; // Green
        if (wavelength < 580) return 0xffff00; // Yellow
        if (wavelength < 620) return 0xff7f00; // Orange
        return 0xff0000; // Red
    }

    private drawGrating(d: number): void {
        const g = this.gratingGraphics;
        g.clear();

        const gratingX = this.width * 0.35;
        const gratingHeight = 140;
        const slitSpacing = Math.max(10, d * 6);
        const numSlits = Math.floor(gratingHeight / slitSpacing);

        // Grating background
        g.rect(gratingX - 6, this.centerY - gratingHeight / 2, 12, gratingHeight);
        g.fill({ color: 0x222222, alpha: 0.9 });

        // Slits (bright gaps)
        for (let i = 0; i < numSlits; i++) {
            const y = this.centerY - gratingHeight / 2 + i * slitSpacing + slitSpacing / 2;
            g.rect(gratingX - 6, y - 2, 12, 4);
            g.fill({ color: 0x87ceeb, alpha: 0.7 });
        }

        // Incoming light beam
        g.moveTo(70, this.centerY - 40);
        g.lineTo(gratingX - 8, this.centerY - 20);
        g.moveTo(70, this.centerY);
        g.lineTo(gratingX - 8, this.centerY);
        g.moveTo(70, this.centerY + 40);
        g.lineTo(gratingX - 8, this.centerY + 20);
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.4 });
    }

    private drawWaves(lambda: number): void {
        const g = this.waveGraphics;
        g.clear();

        const color = this.wavelengthToColor(lambda);

        // Draw wave particles
        this.particles.forEach((p) => {
            const alpha = Math.max(0, 1 - p.distance / 60);
            g.circle(p.x, p.y, 3);
            g.fill({ color, alpha: alpha * 0.7 });
        });
    }

    private drawPattern(theta: number, n: number, lambda: number): void {
        const g = this.patternGraphics;
        g.clear();

        const screenX = this.width - 35;
        const screenHeight = 160;
        const screenY = this.centerY - screenHeight / 2;

        // Screen
        g.rect(screenX - 4, screenY, 8, screenHeight);
        g.fill({ color: 0x111111, alpha: 0.9 });

        const color = this.wavelengthToColor(lambda);

        // Diffraction pattern on screen
        // Central maximum (brightest)
        g.circle(screenX, this.centerY, 10);
        g.fill({ color, alpha: 0.95 });

        // Higher order maxima
        for (let order = 1; order <= 3; order++) {
            const angleRad = (order * theta * Math.PI) / 180;
            const y = Math.tan(angleRad) * (screenX - this.width * 0.35) * 0.4;

            if (Math.abs(y) < screenHeight / 2) {
                // Intensity decreases with order
                const intensity = Math.max(0.3, 1 - order * 0.25);
                const size = 8 - order * 1.5;

                // Positive order
                g.circle(screenX, this.centerY + y, size);
                g.fill({ color, alpha: intensity });

                // Negative order
                g.circle(screenX, this.centerY - y, size);
                g.fill({ color, alpha: intensity });
            }
        }

        // Angle indicator lines
        g.moveTo(this.width * 0.35 + 10, this.centerY);
        g.lineTo(screenX - 10, this.centerY);
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });

        const thetaRad = (theta * Math.PI) / 180;
        const lineEndY = this.centerY + Math.tan(thetaRad) * (screenX - this.width * 0.35 - 20) * 0.4;
        g.moveTo(this.width * 0.35 + 10, this.centerY);
        g.lineTo(screenX - 10, lineEndY);
        g.stroke({ color, width: 2, alpha: 0.4 });

        // Angle arc
        const arcRadius = 40;
        g.arc(this.width * 0.35 + 10, this.centerY, arcRadius, 0, thetaRad);
        g.stroke({ color, width: 2, alpha: 0.5 });
    }
}
