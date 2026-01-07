import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface EnergyParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    color: number;
}

interface LightRay {
    angle: number;
    length: number;
    speed: number;
}

export class MassEnergyScene extends BaseScene {
    declare private massBlob: Blob;
    declare private particleGraphics: Graphics;
    declare private glowGraphics: Graphics;
    declare private formulaGraphics: Graphics;
    declare private speedGraphics: Graphics;
    declare private particles: EnergyParticle[];
    declare private lightRays: LightRay[];
    declare private time: number;
    declare private isConverting: boolean;
    declare private conversionProgress: number;
    declare private shockwaveRadius: number;
    declare private energyReleased: number;

    protected setup(): void {
        this.particles = [];
        this.lightRays = [];
        this.time = 0;
        this.isConverting = false;
        this.conversionProgress = 0;
        this.shockwaveRadius = 0;
        this.energyReleased = 0;

        // Initialize light rays
        for (let i = 0; i < 16; i++) {
            this.lightRays.push({
                angle: (i / 16) * Math.PI * 2,
                length: 0.5 + Math.random() * 0.5,
                speed: 0.8 + Math.random() * 0.4,
            });
        }

        // Glow (behind everything)
        this.glowGraphics = new Graphics();
        this.container.addChild(this.glowGraphics);

        // Speed of light indicator
        this.speedGraphics = new Graphics();
        this.container.addChild(this.speedGraphics);

        // Particles
        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        // Formula visualization
        this.formulaGraphics = new Graphics();
        this.container.addChild(this.formulaGraphics);

        // Mass blob
        this.massBlob = new Blob({
            size: 70,
            color: pixiColors.mass,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: pixiColors.energy,
        });
        this.massBlob.setPosition(this.centerX, this.centerY);
        this.container.addChild(this.massBlob);
    }

    protected onVariablesChange(): void {
        const m = this.variables['m'] || 1;
        this.massBlob.updateOptions({ size: 50 + m * 20 });
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;

        const m = this.variables['m'] || 1;
        const c = 3e8; // Speed of light
        const E = m * c * c; // E = mc²

        // Normalized energy for visualization (scale down the huge number)
        const energyLevel = Math.log10(E) / 20;

        // Periodic conversion animation (longer cycle)
        const cycleTime = this.time % 6;
        const wasConverting = this.isConverting;
        this.isConverting = cycleTime > 2.5 && cycleTime < 5;

        // Trigger shockwave on conversion start
        if (this.isConverting && !wasConverting) {
            this.shockwaveRadius = 0;
            this.energyReleased = 0;
        }

        if (this.isConverting) {
            this.conversionProgress = Math.min(1, (cycleTime - 2.5) / 2);
            this.shockwaveRadius += delta * 8;
            this.energyReleased = this.conversionProgress;

            // Emit energy particles explosively
            const emitRate = 0.3 + this.conversionProgress * 0.5;
            if (Math.random() < emitRate) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5 + this.conversionProgress * 3;
                const colors = [0xffff00, 0xff8800, 0xffffff, 0xff4444];
                this.particles.push({
                    x: this.centerX + (Math.random() - 0.5) * 20,
                    y: this.centerY + (Math.random() - 0.5) * 20,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    size: 3 + Math.random() * 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
            }

            // Light-speed particles (photons)
            if (Math.random() < 0.2) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: this.centerX,
                    y: this.centerY,
                    vx: Math.cos(angle) * 15, // Very fast
                    vy: Math.sin(angle) * 15,
                    life: 0.6,
                    size: 2,
                    color: 0xffffff,
                });
            }
        } else {
            this.conversionProgress = Math.max(0, this.conversionProgress - dt * 0.5);
            this.shockwaveRadius = 0;
        }

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= 0.015;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update light rays
        this.lightRays.forEach(ray => {
            ray.length = 0.5 + 0.5 * Math.sin(this.time * ray.speed * 4 + ray.angle);
        });

        // Mass blob shrinks during conversion, shows massive energy release
        const shrinkFactor = 1 - this.conversionProgress * 0.5;
        const pulseIntensity = this.isConverting ? 0.15 : 0.05;
        const pulse = 1 + Math.sin(this.time * 8) * pulseIntensity * this.conversionProgress;

        let expression: BlobExpression = 'happy';
        if (this.conversionProgress > 0.7) {
            expression = 'excited';
        } else if (this.conversionProgress > 0.3) {
            expression = 'surprised';
        }

        this.massBlob.updateOptions({
            wobblePhase: this.time * (2 + this.conversionProgress * 5),
            glowIntensity: 0.3 + this.conversionProgress * 0.7,
            scaleX: shrinkFactor * pulse,
            scaleY: shrinkFactor * pulse,
            expression,
            size: (50 + m * 20) * shrinkFactor,
        });

        this.drawGlow(energyLevel);
        this.drawSpeedOfLight();
        this.drawParticles();
        this.drawFormulaVisualization(m, energyLevel);
    }

    private drawGlow(energyLevel: number): void {
        const g = this.glowGraphics;
        g.clear();

        // Base glow
        for (let i = 4; i >= 0; i--) {
            const radius = 60 + i * 20 + this.conversionProgress * 30;
            const alpha = (0.1 + this.conversionProgress * 0.2) * (1 - i * 0.15);
            g.circle(this.centerX, this.centerY, radius);
            g.fill({ color: pixiColors.energy, alpha });
        }

        // Shockwave during conversion
        if (this.shockwaveRadius > 0 && this.shockwaveRadius < 200) {
            g.circle(this.centerX, this.centerY, this.shockwaveRadius);
            g.stroke({
                color: 0xffffff,
                width: 3,
                alpha: Math.max(0, 1 - this.shockwaveRadius / 200),
            });

            // Secondary shockwave
            if (this.shockwaveRadius > 30) {
                g.circle(this.centerX, this.centerY, this.shockwaveRadius - 30);
                g.stroke({
                    color: pixiColors.energy,
                    width: 2,
                    alpha: Math.max(0, 0.5 - this.shockwaveRadius / 200),
                });
            }
        }

        // Light rays during conversion
        if (this.conversionProgress > 0.2) {
            this.lightRays.forEach(ray => {
                const innerR = 40;
                const outerR = innerR + 60 * ray.length * this.conversionProgress;
                const x1 = this.centerX + Math.cos(ray.angle) * innerR;
                const y1 = this.centerY + Math.sin(ray.angle) * innerR;
                const x2 = this.centerX + Math.cos(ray.angle) * outerR;
                const y2 = this.centerY + Math.sin(ray.angle) * outerR;

                g.moveTo(x1, y1);
                g.lineTo(x2, y2);
                g.stroke({
                    color: 0xffffcc,
                    width: 2 + ray.length * 2,
                    alpha: this.conversionProgress * 0.6 * ray.length,
                });
            });
        }
    }

    private drawSpeedOfLight(): void {
        const g = this.speedGraphics;
        g.clear();

        // c² visualization - speed of light squared indicator
        const indicatorX = this.width - 70;
        const indicatorY = this.height - 50;

        // Background panel
        g.roundRect(indicatorX - 35, indicatorY - 25, 70, 50, 8);
        g.fill({ color: 0x1a1a2e, alpha: 0.8 });

        // c symbol with superscript 2
        g.circle(indicatorX - 10, indicatorY, 15);
        g.fill({ color: 0x4a9eff, alpha: 0.3 + this.conversionProgress * 0.3 });

        // "²" indicator
        g.circle(indicatorX + 8, indicatorY - 8, 8);
        g.fill({ color: 0xff8844, alpha: 0.4 + this.conversionProgress * 0.4 });

        // Speed bar (showing c is massive)
        const barWidth = 50;
        const barHeight = 6;
        g.roundRect(indicatorX - 25, indicatorY + 12, barWidth, barHeight, 2);
        g.fill({ color: 0x333344 });

        // Filled portion (always full since c is constant)
        g.roundRect(indicatorX - 25, indicatorY + 12, barWidth, barHeight, 2);
        g.fill({ color: 0x4a9eff, alpha: 0.8 });

        // Light speed pulses
        if (this.conversionProgress > 0) {
            const pulseX = indicatorX - 25 + (this.time * 50) % barWidth;
            g.circle(pulseX, indicatorY + 15, 4);
            g.fill({ color: 0xffffff, alpha: this.conversionProgress * 0.8 });
        }
    }

    private drawParticles(): void {
        const g = this.particleGraphics;
        g.clear();

        this.particles.forEach(p => {
            // Trail
            const trailLength = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 3;
            const angle = Math.atan2(p.vy, p.vx);
            g.moveTo(p.x, p.y);
            g.lineTo(p.x - Math.cos(angle) * trailLength, p.y - Math.sin(angle) * trailLength);
            g.stroke({ color: p.color, width: p.size * p.life * 0.5, alpha: p.life * 0.3 });

            // Particle glow
            g.circle(p.x, p.y, p.size * 1.5 * p.life);
            g.fill({ color: p.color, alpha: p.life * 0.3 });

            // Particle core
            g.circle(p.x, p.y, p.size * p.life);
            g.fill({ color: p.color, alpha: p.life });

            // Bright center for photons
            if (p.color === 0xffffff) {
                g.circle(p.x, p.y, p.size * 0.5 * p.life);
                g.fill({ color: 0xffffff, alpha: p.life });
            }
        });
    }

    private drawFormulaVisualization(m: number, energyLevel: number): void {
        const g = this.formulaGraphics;
        g.clear();

        const formulaX = 30;
        const formulaY = 30;

        // Background panel
        g.roundRect(formulaX - 10, formulaY - 10, 100, 60, 8);
        g.fill({ color: 0x1a1a2e, alpha: 0.8 });

        // E = mc² visual representation
        // E box
        const eSize = 20 + this.energyReleased * 30;
        g.roundRect(formulaX, formulaY, eSize, 20, 4);
        g.fill({ color: pixiColors.energy, alpha: 0.6 + this.energyReleased * 0.3 });

        // = sign
        g.moveTo(formulaX + eSize + 8, formulaY + 7);
        g.lineTo(formulaX + eSize + 18, formulaY + 7);
        g.moveTo(formulaX + eSize + 8, formulaY + 13);
        g.lineTo(formulaX + eSize + 18, formulaY + 13);
        g.stroke({ color: 0xffffff, width: 2 });

        // m box (shrinks during conversion)
        const mSize = (15 + m * 3) * (1 - this.conversionProgress * 0.5);
        const mX = formulaX + eSize + 25;
        g.roundRect(mX, formulaY + 2, mSize, 16, 3);
        g.fill({ color: pixiColors.mass, alpha: 0.7 });

        // c² boxes (two small boxes to represent c × c)
        const cX = mX + mSize + 5;
        g.roundRect(cX, formulaY, 12, 12, 2);
        g.fill({ color: 0x4a9eff, alpha: 0.6 });
        g.roundRect(cX + 14, formulaY, 12, 12, 2);
        g.fill({ color: 0x4a9eff, alpha: 0.6 });

        // Multiplication dots
        g.circle(mX + mSize + 2, formulaY + 10, 2);
        g.fill(0xffffff);
        g.circle(cX + 12, formulaY + 6, 2);
        g.fill(0xffffff);

        // Energy release arrow
        if (this.energyReleased > 0.3) {
            const arrowY = formulaY + 35;
            g.moveTo(formulaX + 10, arrowY);
            g.lineTo(formulaX + 10 + this.energyReleased * 60, arrowY);
            g.lineTo(formulaX + 5 + this.energyReleased * 60, arrowY - 5);
            g.moveTo(formulaX + 10 + this.energyReleased * 60, arrowY);
            g.lineTo(formulaX + 5 + this.energyReleased * 60, arrowY + 5);
            g.stroke({ color: pixiColors.energy, width: 2, alpha: this.energyReleased });
        }
    }
}
