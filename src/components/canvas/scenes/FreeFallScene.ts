import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression } from '../Blob';

interface TrailPoint {
    x: number;
    y: number;
    alpha: number;
    size: number;
}

interface LandingParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

type FallPhase = 'ready' | 'falling' | 'landed';

export class FreeFallScene extends BaseScene {
    declare private fallingBlob: Blob;
    declare private groundGraphics: Graphics;
    declare private skyGraphics: Graphics;
    declare private effectGraphics: Graphics;
    declare private trail: TrailPoint[];
    declare private landingParticles: LandingParticle[];
    declare private animationTime: number;
    declare private phase: FallPhase;
    declare private phaseTime: number;
    declare private fallStartY: number;
    declare private groundY: number;

    protected setup(): void {
        this.animationTime = 0;
        this.trail = [];
        this.landingParticles = [];
        this.phase = 'ready';
        this.phaseTime = 0;
        this.fallStartY = 50;
        this.groundY = this.height - 50;

        // Sky background
        this.skyGraphics = new Graphics();
        this.container.addChild(this.skyGraphics);

        // Ground
        this.groundGraphics = new Graphics();
        this.container.addChild(this.groundGraphics);

        // Effects
        this.effectGraphics = new Graphics();
        this.container.addChild(this.effectGraphics);

        // Falling blob
        this.fallingBlob = new Blob({
            size: 32,
            color: 0xf39c12,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0xf39c12,
        });
        this.fallingBlob.setPosition(this.centerX, this.fallStartY);
        this.container.addChild(this.fallingBlob);

        this.drawSky();
        this.drawGround();
    }

    protected onVariablesChange(): void {
        this.animationTime = 0;
        this.trail = [];
        this.landingParticles = [];
        this.phase = 'ready';
        this.phaseTime = 0;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.phaseTime += delta * 0.016;

        const g = this.variables['g'] || 9.8;
        const maxT = this.variables['t'] || 3;
        const maxH = 0.5 * g * maxT * maxT;

        // Dynamic cycle time based on fall duration
        const readyTime = 0.5;
        const fallDuration = maxT * 0.4; // Scale fall animation time
        const landedTime = 0.8;
        const totalCycle = readyTime + fallDuration + landedTime;

        this.animationTime += delta * 0.02;
        const cycleTime = this.animationTime % totalCycle;

        const fallDistance = this.groundY - this.fallStartY - 15;
        let currentY: number;
        let velocity: number;

        if (cycleTime < readyTime) {
            // Ready phase - waiting at top
            this.phase = 'ready';
            currentY = this.fallStartY;
            velocity = 0;
        } else if (cycleTime < readyTime + fallDuration) {
            // Falling phase
            const fallProgress = (cycleTime - readyTime) / fallDuration;
            const t = fallProgress * maxT;
            const h = 0.5 * g * t * t;
            const normalizedH = Math.min(h / Math.max(maxH, 1), 1);

            currentY = this.fallStartY + normalizedH * fallDistance;
            velocity = g * t;

            if (this.phase !== 'falling') {
                this.phase = 'falling';
                this.phaseTime = 0;
            }

            // Add trail
            this.trail.push({
                x: this.centerX,
                y: currentY,
                alpha: 1,
                size: 3 + velocity * 0.05,
            });
        } else {
            // Landed phase
            if (this.phase !== 'landed') {
                this.createLandingParticles();
                this.phase = 'landed';
                this.phaseTime = 0;
            }
            currentY = this.groundY - 15;
            velocity = 0;
        }

        // Update trail
        this.trail.forEach((p) => {
            p.alpha -= 0.02 * delta;
            p.size *= 0.97;
        });
        this.trail = this.trail.filter((p) => p.alpha > 0);

        // Update landing particles
        this.landingParticles.forEach((p) => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 0.12 * delta;
            p.life -= 0.025 * delta;
        });
        this.landingParticles = this.landingParticles.filter((p) => p.life > 0);

        // Update blob
        this.fallingBlob.setPosition(this.centerX, currentY);
        this.updateBlobAppearance(velocity, g, maxT);

        // Draw
        this.drawEffects(fallDistance, velocity, g, maxT);
    }

    private updateBlobAppearance(velocity: number, g: number, maxT: number): void {
        let expression: BlobExpression = 'happy';
        let scaleX = 1;
        let scaleY = 1;

        const maxVelocity = g * maxT;
        const velocityRatio = velocity / Math.max(maxVelocity, 1);

        switch (this.phase) {
            case 'ready':
                expression = 'happy';
                scaleY = 1 + Math.sin(this.phaseTime * 6) * 0.03;
                break;
            case 'falling':
                expression = velocityRatio > 0.5 ? 'surprised' : 'excited';
                // Stretch based on velocity
                const stretch = Math.min(velocityRatio * 0.4, 0.35);
                scaleY = 1 + stretch;
                scaleX = 1 - stretch * 0.4;
                break;
            case 'landed':
                expression = this.phaseTime < 0.25 ? 'surprised' : 'happy';
                // Squash on landing, then recover
                if (this.phaseTime < 0.15) {
                    scaleY = 0.6;
                    scaleX = 1.4;
                } else if (this.phaseTime < 0.3) {
                    const recover = (this.phaseTime - 0.15) / 0.15;
                    scaleY = 0.6 + recover * 0.4;
                    scaleX = 1.4 - recover * 0.4;
                }
                break;
        }

        this.fallingBlob.updateOptions({
            wobblePhase: this.animationTime * 3,
            expression,
            scaleX,
            scaleY,
            showSpeedLines: this.phase === 'falling' && velocityRatio > 0.3,
            speedDirection: Math.PI / 2 + Math.PI, // pointing up (opposite of fall)
            glowIntensity: 0.2 + velocityRatio * 0.3,
        });
    }

    private createLandingParticles(): void {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = 1.5 + Math.random() * 2.5;
            this.landingParticles.push({
                x: this.centerX,
                y: this.groundY - 10,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle)) * speed * 1.2,
                life: 1,
                size: 2 + Math.random() * 3,
            });
        }
    }

    private drawSky(): void {
        const g = this.skyGraphics;
        g.clear();

        // Sky
        g.rect(0, 0, this.width, this.groundY);
        g.fill({ color: 0x1a1a2e, alpha: 0.3 });

        // Clouds
        const cloudY = 30;
        g.ellipse(50, cloudY, 25, 12);
        g.ellipse(70, cloudY - 5, 20, 10);
        g.ellipse(40, cloudY + 3, 18, 10);
        g.fill({ color: 0xffffff, alpha: 0.15 });

        g.ellipse(this.width - 60, cloudY + 10, 22, 11);
        g.ellipse(this.width - 45, cloudY + 5, 18, 9);
        g.fill({ color: 0xffffff, alpha: 0.12 });
    }

    private drawGround(): void {
        const g = this.groundGraphics;
        g.clear();

        // Ground
        g.rect(0, this.groundY, this.width, this.height - this.groundY);
        g.fill({ color: 0x3d5c2e, alpha: 0.9 });

        // Ground line
        g.moveTo(0, this.groundY);
        g.lineTo(this.width, this.groundY);
        g.stroke({ color: 0x5a8a47, width: 3, alpha: 0.8 });

        // Grass
        for (let x = 8; x < this.width; x += 20) {
            const h = 4 + Math.random() * 5;
            g.moveTo(x, this.groundY);
            g.lineTo(x + 2, this.groundY - h);
            g.stroke({ color: 0x6ab04c, width: 2, alpha: 0.5 });
        }
    }

    private drawEffects(fallDistance: number, velocity: number, g: number, maxT: number): void {
        const gr = this.effectGraphics;
        gr.clear();

        // Trail with glow
        this.trail.forEach((p) => {
            gr.circle(p.x, p.y, p.size * 1.5);
            gr.fill({ color: 0xf39c12, alpha: p.alpha * 0.2 });
            gr.circle(p.x, p.y, p.size * 0.6);
            gr.fill({ color: 0xffd93d, alpha: p.alpha * 0.6 });
        });

        // Landing particles
        this.landingParticles.forEach((p) => {
            gr.circle(p.x, p.y, p.size * p.life);
            gr.fill({ color: 0x6ab04c, alpha: p.life * 0.8 });
        });

        // Height ruler on right side
        const rulerX = this.width - 25;
        gr.moveTo(rulerX, this.fallStartY);
        gr.lineTo(rulerX, this.groundY);
        gr.stroke({ color: 0xffffff, width: 2, alpha: 0.2 });

        // Ruler ticks
        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
            const y = this.fallStartY + (fallDistance * i) / tickCount;
            gr.moveTo(rulerX - 5, y);
            gr.lineTo(rulerX + 5, y);
            gr.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        }

        // Current height marker
        if (this.phase === 'falling') {
            const blobY = this.fallingBlob.y;
            gr.moveTo(rulerX - 8, blobY);
            gr.lineTo(rulerX + 8, blobY);
            gr.stroke({ color: 0xf39c12, width: 3, alpha: 0.8 });
        }

        // Gravity arrow (g indicator)
        const arrowX = this.centerX + 50;
        const arrowY = this.centerY - 20;
        const arrowLen = 35;

        gr.moveTo(arrowX, arrowY);
        gr.lineTo(arrowX, arrowY + arrowLen);
        gr.stroke({ color: 0xe74c3c, width: 3, alpha: 0.6 });

        // Arrow head
        gr.moveTo(arrowX, arrowY + arrowLen);
        gr.lineTo(arrowX - 6, arrowY + arrowLen - 8);
        gr.stroke({ color: 0xe74c3c, width: 3, alpha: 0.6 });
        gr.moveTo(arrowX, arrowY + arrowLen);
        gr.lineTo(arrowX + 6, arrowY + arrowLen - 8);
        gr.stroke({ color: 0xe74c3c, width: 3, alpha: 0.6 });

        // g label circle
        gr.circle(arrowX, arrowY - 12, 10);
        gr.fill({ color: 0xe74c3c, alpha: 0.3 });

        // Phase indicator
        const phaseColors: Record<FallPhase, number> = {
            ready: 0x888888,
            falling: 0xf39c12,
            landed: 0x6ab04c,
        };
        gr.circle(this.width - 15, 15, 5);
        gr.fill({ color: phaseColors[this.phase], alpha: 0.6 });
    }
}
