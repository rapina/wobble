import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

interface TrailPoint {
    x: number;
    y: number;
    alpha: number;
}

export class ProjectileScene extends BaseScene {
    declare private projectileBlob: Blob;
    declare private groundGraphics: Graphics;
    declare private trajectoryGraphics: Graphics;
    declare private trail: TrailPoint[];
    declare private animationTime: number;

    protected setup(): void {
        this.animationTime = 0;
        this.trail = [];

        this.groundGraphics = new Graphics();
        this.container.addChild(this.groundGraphics);

        this.trajectoryGraphics = new Graphics();
        this.container.addChild(this.trajectoryGraphics);

        // Projectile
        this.projectileBlob = new Blob({
            size: 30,
            color: 0xe74c3c,
            shape: 'circle',
            expression: 'happy',
        });
        this.projectileBlob.setPosition(this.centerX, this.height - 80);
        this.container.addChild(this.projectileBlob);

        this.drawGround();
    }

    protected onVariablesChange(): void {
        this.animationTime = 0;
        this.trail = [];
        this.drawTrajectoryPreview();
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;

        const v = this.variables['v'] || 20;
        const theta = this.variables['θ'] || 45;
        const g = this.variables['g'] || 9.8;

        const thetaRad = (theta * Math.PI) / 180;
        const vx = v * Math.cos(thetaRad);
        const vy = v * Math.sin(thetaRad);

        // Total flight time
        const totalTime = (2 * vy) / g;
        const R = (v * v * Math.sin(2 * thetaRad)) / g;

        // Animation cycle
        this.animationTime += delta * 0.015;
        const cycleTime = this.animationTime % 2;
        const t = Math.min(cycleTime, 1.5) * (totalTime / 1.5);

        // Calculate position
        const x = vx * t;
        const y = vy * t - 0.5 * g * t * t;

        // Scale to screen coordinates
        const groundY = this.height - 80;
        const scaleX = Math.min((this.width - 80) / Math.max(R, 1), 3);
        const scaleY = Math.min((this.height - 150) / Math.max((vy * vy) / (2 * g), 1), 2);

        // Center the trajectory horizontally
        const trajectoryWidth = R * scaleX;
        const startX = this.centerX - trajectoryWidth / 2;

        const screenX = startX + x * scaleX;
        const screenY = groundY - y * scaleY;

        // Add trail
        if (cycleTime < 1.5 && y >= 0) {
            this.trail.push({
                x: screenX,
                y: screenY,
                alpha: 1,
            });
        }

        // Fade trail
        this.trail.forEach((p) => {
            p.alpha -= 0.01 * delta;
        });
        this.trail = this.trail.filter((p) => p.alpha > 0);

        // Update blob
        if (y >= 0) {
            this.projectileBlob.setPosition(screenX, screenY);

            // Rotation based on velocity direction
            const currentVy = vy - g * t;
            const angle = Math.atan2(-currentVy, vx);
            this.projectileBlob.updateOptions({
                wobblePhase: this.animationTime * 5,
            });
        } else {
            // Reset to start
            this.projectileBlob.setPosition(startX, groundY);
        }

        this.drawTrail();
    }

    private drawGround(): void {
        const g = this.groundGraphics;
        g.clear();

        const groundY = this.height - 80;

        // Ground
        g.rect(0, groundY, this.width, 80);
        g.fill({ color: 0x2d5016, alpha: 0.8 });

        // Launch platform will be drawn in drawTrajectoryPreview based on startX
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
        const totalTime = (2 * vy) / grav;
        const R = (v * v * Math.sin(2 * thetaRad)) / grav;

        const groundY = this.height - 80;
        const scaleX = Math.min((this.width - 80) / Math.max(R, 1), 3);
        const scaleY = Math.min((this.height - 150) / Math.max((vy * vy) / (2 * grav), 1), 2);

        // Center the trajectory horizontally
        const trajectoryWidth = R * scaleX;
        const startX = this.centerX - trajectoryWidth / 2;

        // Draw trajectory path (dashed)
        for (let i = 0; i <= 30; i++) {
            const t = (i / 30) * totalTime;
            const x = vx * t;
            const y = vy * t - 0.5 * grav * t * t;

            const screenX = startX + x * scaleX;
            const screenY = groundY - y * scaleY;

            if (i === 0) {
                g.moveTo(screenX, screenY);
            } else {
                g.lineTo(screenX, screenY);
            }
        }
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });

        // Draw angle indicator
        const arcRadius = 40;
        g.moveTo(startX, groundY);
        g.lineTo(startX + arcRadius, groundY);
        g.stroke({ color: 0xf39c12, width: 2, alpha: 0.5 });

        // Move to start of arc to prevent line artifact
        const arcStartX = startX + arcRadius;
        g.moveTo(arcStartX, groundY);
        g.arc(startX, groundY, arcRadius, 0, -thetaRad, true);
        g.stroke({ color: 0xf39c12, width: 2, alpha: 0.5 });

        // Launch direction arrow
        g.moveTo(startX, groundY);
        g.lineTo(startX + 50 * Math.cos(thetaRad), groundY - 50 * Math.sin(thetaRad));
        g.stroke({ color: 0xe74c3c, width: 3, alpha: 0.7 });

        // Range marker
        const endX = startX + trajectoryWidth;
        g.moveTo(endX, groundY);
        g.lineTo(endX, groundY + 15);
        g.stroke({ color: 0x2ecc71, width: 3, alpha: 0.7 });

        // Launch platform (centered with trajectory)
        g.rect(startX - 20, groundY - 15, 40, 15);
        g.fill({ color: 0x666666, alpha: 0.9 });
    }

    private drawTrail(): void {
        const g = this.trajectoryGraphics;

        this.trail.forEach((p) => {
            g.circle(p.x, p.y, 3);
            g.fill({ color: 0xe74c3c, alpha: p.alpha * 0.6 });
        });
    }
}
