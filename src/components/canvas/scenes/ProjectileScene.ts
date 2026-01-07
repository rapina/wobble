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

type FlightPhase = 'ready' | 'ascending' | 'descending' | 'landed';

export class ProjectileScene extends BaseScene {
    declare private projectileBlob: Blob;
    declare private groundGraphics: Graphics;
    declare private skyGraphics: Graphics;
    declare private trajectoryGraphics: Graphics;
    declare private effectGraphics: Graphics;
    declare private trail: TrailPoint[];
    declare private landingParticles: LandingParticle[];
    declare private animationTime: number;
    declare private phase: FlightPhase;
    declare private phaseTime: number;

    // Cached calculations
    declare private startX: number;
    declare private groundY: number;
    declare private scaleX: number;
    declare private scaleY: number;
    declare private totalTime: number;

    protected setup(): void {
        this.animationTime = 0;
        this.trail = [];
        this.landingParticles = [];
        this.phase = 'ready';
        this.phaseTime = 0;
        this.groundY = this.height - 60;

        // Sky background
        this.skyGraphics = new Graphics();
        this.container.addChild(this.skyGraphics);

        // Ground
        this.groundGraphics = new Graphics();
        this.container.addChild(this.groundGraphics);

        // Trajectory preview
        this.trajectoryGraphics = new Graphics();
        this.container.addChild(this.trajectoryGraphics);

        // Effects (trail, particles)
        this.effectGraphics = new Graphics();
        this.container.addChild(this.effectGraphics);

        // Projectile blob
        this.projectileBlob = new Blob({
            size: 28,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0xff6b6b,
        });
        this.container.addChild(this.projectileBlob);

        this.drawSky();
        this.drawGround();
        this.updateCalculations();
    }

    protected onVariablesChange(): void {
        this.animationTime = 0;
        this.trail = [];
        this.landingParticles = [];
        this.phase = 'ready';
        this.phaseTime = 0;
        this.updateCalculations();
        this.drawTrajectoryPreview();
    }

    private updateCalculations(): void {
        const v = this.variables['v'] || 20;
        const theta = this.variables['θ'] || 45;
        const g = this.variables['g'] || 9.8;

        const thetaRad = (theta * Math.PI) / 180;
        const vx = v * Math.cos(thetaRad);
        const vy = v * Math.sin(thetaRad);

        this.totalTime = (2 * vy) / g;
        const R = (v * v * Math.sin(2 * thetaRad)) / g;
        const maxHeight = (vy * vy) / (2 * g);

        this.scaleX = Math.min((this.width - 60) / Math.max(R, 1), 4);
        this.scaleY = Math.min((this.height - 120) / Math.max(maxHeight, 1), 3);

        const trajectoryWidth = R * this.scaleX;
        this.startX = this.centerX - trajectoryWidth / 2;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.phaseTime += delta * 0.016;

        const v = this.variables['v'] || 20;
        const theta = this.variables['θ'] || 45;
        const g = this.variables['g'] || 9.8;

        const thetaRad = (theta * Math.PI) / 180;
        const vx = v * Math.cos(thetaRad);
        const vy = v * Math.sin(thetaRad);

        // Animation cycle - dynamic based on flight time
        this.animationTime += delta * 0.018;
        const readyTime = 0.4;
        const flightDuration = this.totalTime * 0.9; // slightly faster than real time
        const landedTime = 1.0;
        const totalCycle = readyTime + flightDuration + landedTime;
        const cycleTime = this.animationTime % totalCycle;

        let t: number;
        let screenX: number;
        let screenY: number;
        let currentVy: number;

        if (cycleTime < readyTime) {
            // Ready phase
            this.phase = 'ready';
            t = 0;
            screenX = this.startX;
            screenY = this.groundY;
            currentVy = vy;
        } else if (cycleTime < readyTime + flightDuration) {
            // Flying phase
            const flightProgress = (cycleTime - readyTime) / flightDuration;
            t = flightProgress * this.totalTime;
            const x = vx * t;
            const y = vy * t - 0.5 * g * t * t;
            currentVy = vy - g * t;

            screenX = this.startX + x * this.scaleX;
            screenY = this.groundY - Math.max(0, y) * this.scaleY;

            this.phase = currentVy > 0 ? 'ascending' : 'descending';

            // Add trail
            if (y >= 0) {
                this.trail.push({
                    x: screenX,
                    y: screenY,
                    alpha: 1,
                    size: 4 + Math.abs(currentVy) * 0.1,
                });
            }
        } else {
            // Landed phase
            if (this.phase !== 'landed') {
                this.createLandingParticles();
                this.phase = 'landed';
                this.phaseTime = 0;
            }
            t = this.totalTime;
            const R = (v * v * Math.sin(2 * thetaRad)) / g;
            screenX = this.startX + R * this.scaleX;
            screenY = this.groundY;
            currentVy = 0;
        }

        // Update trail
        this.trail.forEach((p) => {
            p.alpha -= 0.015 * delta;
            p.size *= 0.98;
        });
        this.trail = this.trail.filter((p) => p.alpha > 0);

        // Update landing particles
        this.landingParticles.forEach((p) => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 0.15 * delta; // gravity
            p.life -= 0.025 * delta;
        });
        this.landingParticles = this.landingParticles.filter((p) => p.life > 0);

        // Update blob position and appearance
        this.projectileBlob.setPosition(screenX, screenY);
        this.updateBlobAppearance(currentVy, vx, t);

        // Draw effects
        this.drawEffects();
        this.drawTrajectoryPreview();
    }

    private updateBlobAppearance(vy: number, vx: number, t: number): void {
        const speed = Math.sqrt(vx * vx + vy * vy);
        let expression: BlobExpression = 'happy';
        let scaleX = 1;
        let scaleY = 1;

        switch (this.phase) {
            case 'ready':
                expression = 'charge';
                scaleY = 0.9 + Math.sin(this.phaseTime * 8) * 0.05;
                break;
            case 'ascending':
                expression = 'excited';
                scaleY = 1.1;
                scaleX = 0.95;
                break;
            case 'descending':
                expression = 'surprised';
                scaleY = 0.95;
                scaleX = 1.05;
                break;
            case 'landed':
                expression = this.phaseTime < 0.3 ? 'surprised' : 'happy';
                scaleY = this.phaseTime < 0.2 ? 0.7 : 1;
                scaleX = this.phaseTime < 0.2 ? 1.3 : 1;
                break;
        }

        const angle = Math.atan2(-vy, vx);

        this.projectileBlob.updateOptions({
            wobblePhase: this.animationTime * 4,
            expression,
            scaleX,
            scaleY,
            showSpeedLines: this.phase === 'ascending' || this.phase === 'descending',
            speedDirection: angle + Math.PI,
            glowIntensity: 0.2 + speed * 0.01,
        });
    }

    private createLandingParticles(): void {
        const v = this.variables['v'] || 20;
        const theta = this.variables['θ'] || 45;
        const g = this.variables['g'] || 9.8;
        const thetaRad = (theta * Math.PI) / 180;
        const R = (v * v * Math.sin(2 * thetaRad)) / g;
        const landX = this.startX + R * this.scaleX;

        const count = 12 + Math.floor(v * 0.3);
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = 1.5 + Math.random() * 3;
            this.landingParticles.push({
                x: landX,
                y: this.groundY,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle)) * speed * 1.5,
                life: 1,
                size: 2 + Math.random() * 3,
            });
        }
    }

    private drawSky(): void {
        const g = this.skyGraphics;
        g.clear();

        // Sky gradient (simple)
        g.rect(0, 0, this.width, this.groundY);
        g.fill({ color: 0x1a1a2e, alpha: 0.3 });

        // Stars
        const starPositions = [
            { x: 25, y: 20 }, { x: this.width - 30, y: 35 },
            { x: 60, y: 55 }, { x: this.width - 50, y: 70 },
            { x: this.centerX - 40, y: 25 }, { x: this.centerX + 50, y: 45 },
            { x: 90, y: 85 }, { x: this.width - 80, y: 20 },
        ];
        starPositions.forEach((s) => {
            g.circle(s.x, s.y, 1.5);
            g.fill({ color: 0xffffff, alpha: 0.4 });
        });

        // Horizon glow
        g.rect(0, this.groundY - 30, this.width, 30);
        g.fill({ color: 0x4a6741, alpha: 0.2 });
    }

    private drawGround(): void {
        const g = this.groundGraphics;
        g.clear();

        // Main ground
        g.rect(0, this.groundY, this.width, this.height - this.groundY);
        g.fill({ color: 0x3d5c2e, alpha: 0.9 });

        // Ground top line
        g.moveTo(0, this.groundY);
        g.lineTo(this.width, this.groundY);
        g.stroke({ color: 0x5a8a47, width: 3, alpha: 0.8 });

        // Grass tufts
        for (let i = 0; i < this.width; i += 25) {
            const h = 4 + Math.random() * 4;
            g.moveTo(i, this.groundY);
            g.lineTo(i + 3, this.groundY - h);
            g.stroke({ color: 0x6ab04c, width: 2, alpha: 0.5 });
        }
    }

    private drawTrajectoryPreview(): void {
        const g = this.trajectoryGraphics;
        g.clear();

        const v = this.variables['v'] || 20;
        const theta = this.variables['θ'] || 45;
        const grav = this.variables['g'] || 9.8;

        const thetaRad = (theta * Math.PI) / 180;
        const vx = v * Math.cos(thetaRad);
        const vy = v * Math.sin(thetaRad);
        const R = (v * v * Math.sin(2 * thetaRad)) / grav;
        const maxHeight = (vy * vy) / (2 * grav);

        // Draw trajectory path (dotted)
        for (let i = 0; i <= 40; i++) {
            const t = (i / 40) * this.totalTime;
            const x = vx * t;
            const y = vy * t - 0.5 * grav * t * t;

            const screenX = this.startX + x * this.scaleX;
            const screenY = this.groundY - y * this.scaleY;

            g.circle(screenX, screenY, 2);
            g.fill({ color: 0xffffff, alpha: 0.15 });
        }

        // Launch platform
        g.roundRect(this.startX - 18, this.groundY - 12, 36, 12, 4);
        g.fill({ color: 0x555555, alpha: 0.9 });
        g.roundRect(this.startX - 18, this.groundY - 12, 36, 12, 4);
        g.stroke({ color: 0x333333, width: 2, alpha: 0.8 });

        // Angle arc
        const arcRadius = 30;
        g.moveTo(this.startX + arcRadius, this.groundY - 12);
        g.arc(this.startX, this.groundY - 12, arcRadius, 0, -thetaRad, true);
        g.stroke({ color: 0xf5b041, width: 2, alpha: 0.6 });

        // Angle fill
        g.moveTo(this.startX, this.groundY - 12);
        g.lineTo(this.startX + arcRadius, this.groundY - 12);
        g.arc(this.startX, this.groundY - 12, arcRadius, 0, -thetaRad, true);
        g.closePath();
        g.fill({ color: 0xf5b041, alpha: 0.15 });

        // Launch direction arrow
        const arrowLen = 35;
        const ax = this.startX + arrowLen * Math.cos(thetaRad);
        const ay = this.groundY - 12 - arrowLen * Math.sin(thetaRad);
        g.moveTo(this.startX, this.groundY - 12);
        g.lineTo(ax, ay);
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.8 });

        // Arrow head
        const headLen = 8;
        const headAngle = Math.PI / 6;
        g.moveTo(ax, ay);
        g.lineTo(
            ax - headLen * Math.cos(thetaRad - headAngle),
            ay + headLen * Math.sin(thetaRad - headAngle)
        );
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.8 });
        g.moveTo(ax, ay);
        g.lineTo(
            ax - headLen * Math.cos(thetaRad + headAngle),
            ay + headLen * Math.sin(thetaRad + headAngle)
        );
        g.stroke({ color: 0xff6b6b, width: 3, alpha: 0.8 });

        // Landing target
        const endX = this.startX + R * this.scaleX;
        g.circle(endX, this.groundY, 12);
        g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.5 });
        g.circle(endX, this.groundY, 6);
        g.fill({ color: 0x4ecdc4, alpha: 0.3 });

        // Max height indicator (dotted line)
        const maxY = this.groundY - maxHeight * this.scaleY;
        const maxX = this.startX + (R * this.scaleX) / 2;
        const lineHeight = this.groundY - maxY;
        for (let i = 0; i < lineHeight; i += 6) {
            g.circle(maxX, maxY + i, 1.5);
            g.fill({ color: 0x9b59b6, alpha: 0.4 });
        }

        // H label
        g.circle(maxX, maxY, 8);
        g.fill({ color: 0x9b59b6, alpha: 0.3 });
    }

    private drawEffects(): void {
        const g = this.effectGraphics;
        g.clear();

        // Trail with glow
        this.trail.forEach((p) => {
            // Outer glow
            g.circle(p.x, p.y, p.size * 1.5);
            g.fill({ color: 0xff6b6b, alpha: p.alpha * 0.2 });
            // Core
            g.circle(p.x, p.y, p.size * 0.6);
            g.fill({ color: 0xffaaaa, alpha: p.alpha * 0.7 });
        });

        // Landing particles
        this.landingParticles.forEach((p) => {
            g.circle(p.x, p.y, p.size * p.life);
            g.fill({ color: 0x6ab04c, alpha: p.life * 0.8 });
        });

        // Phase indicator (subtle)
        const phaseColors: Record<FlightPhase, number> = {
            ready: 0x888888,
            ascending: 0x4ecdc4,
            descending: 0xf5b041,
            landed: 0x6ab04c,
        };
        g.circle(this.width - 15, 15, 5);
        g.fill({ color: phaseColors[this.phase], alpha: 0.6 });
    }
}
