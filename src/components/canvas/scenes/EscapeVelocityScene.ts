import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

interface RocketState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    escaped: boolean;
    active: boolean;
}

export class EscapeVelocityScene extends BaseScene {
    declare private planetBlob: Blob;
    declare private rocketBlob: Blob;
    declare private graphicsLayer: Graphics;
    declare private trailGraphics: Graphics;
    declare private rocket: RocketState;
    declare private trail: { x: number; y: number; alpha: number }[];
    declare private time: number;
    declare private escapeVelocity: number;
    declare private launchCooldown: number;

    protected setup(): void {
        this.time = 0;
        this.trail = [];
        this.launchCooldown = 0;
        this.escapeVelocity = 11.2;

        this.graphicsLayer = new Graphics();
        this.container.addChild(this.graphicsLayer);

        this.trailGraphics = new Graphics();
        this.container.addChild(this.trailGraphics);

        // Planet (circle blob)
        this.planetBlob = new Blob({
            size: 70,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.4,
            glowColor: 0x5dade2,
        });
        this.planetBlob.setPosition(this.centerX - 60, this.centerY);
        this.container.addChild(this.planetBlob);

        // Rocket (square blob - different from planet)
        this.rocketBlob = new Blob({
            size: 25,
            color: 0xe74c3c,
            shape: 'square',
            expression: 'happy',
        });
        this.container.addChild(this.rocketBlob);

        this.rocket = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            escaped: false,
            active: false,
        };

        this.resetRocket();
    }

    private resetRocket(): void {
        const planetSize = this.planetBlob.getOptions().size as number;
        const planetX = this.centerX - 60;

        this.rocket = {
            x: planetX + planetSize / 2 + 20,
            y: this.centerY,
            vx: 0,
            vy: 0,
            escaped: false,
            active: false,
        };
        this.rocketBlob.setPosition(this.rocket.x, this.rocket.y);
        this.trail = [];
    }

    protected onVariablesChange(): void {
        const M = this.variables['M'] || 5.97;
        const r = this.variables['r'] || 6.37;

        // Calculate escape velocity: v = sqrt(2GM/r)
        // Simplified visual scaling
        const G = 6.674; // Simplified constant
        this.escapeVelocity = Math.sqrt((2 * G * M) / r);

        // Planet SIZE based on radius r (range 1-100)
        // Normalize: r=1 → 35, r=100 → 90
        const rNormalized = (r - 1) / 99;
        const planetSize = 35 + rNormalized * 55;

        // Planet color and glow based on mass M (heavier = denser/brighter)
        // M range 0.1-200
        const mNormalized = Math.min(M / 200, 1);
        let color: number;
        if (M < 3) {
            color = 0x95a5a6; // Light gray - small mass
        } else if (M < 10) {
            color = 0x3498db; // Blue - Earth-like
        } else if (M < 50) {
            color = 0xe67e22; // Orange - gas giant
        } else {
            color = 0x9b59b6; // Purple - super massive
        }

        this.planetBlob.updateOptions({
            size: planetSize,
            color,
            glowColor: color,
            glowIntensity: 0.2 + mNormalized * 0.8, // Mass affects glow
        });

        this.resetRocket();
        this.launchCooldown = 0;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        const v = this.variables['v'] || 11.2;
        const M = this.variables['M'] || 5.97;

        const planetX = this.centerX - 60;
        const planetSize = this.planetBlob.getOptions().size as number;

        // Launch cooldown
        this.launchCooldown -= delta * 0.02;

        // Launch rocket if ready
        if (!this.rocket.active && this.launchCooldown <= 0) {
            this.launchRocket(v);
            this.launchCooldown = 3; // 3 seconds between launches
        }

        // Update rocket physics
        if (this.rocket.active) {
            // Gravity pulls rocket back (simplified)
            const dx = planetX - this.rocket.x;
            const dy = this.centerY - this.rocket.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > planetSize / 2) {
                // Gravity force (inverse square)
                const gravityStrength = (M * 0.5) / (dist * dist) * 100;
                this.rocket.vx += (dx / dist) * gravityStrength * delta * 0.016;
                this.rocket.vy += (dy / dist) * gravityStrength * delta * 0.016;
            }

            // Update position
            this.rocket.x += this.rocket.vx * delta;
            this.rocket.y += this.rocket.vy * delta;

            // Add trail
            if (Math.random() < 0.5) {
                this.trail.push({
                    x: this.rocket.x - this.rocket.vx * 0.3,
                    y: this.rocket.y - this.rocket.vy * 0.3,
                    alpha: 1,
                });
            }

            // Check if escaped (far enough away)
            if (this.rocket.x > this.width + 20 || this.rocket.y < -20 || this.rocket.y > this.height + 20) {
                this.rocket.escaped = true;
                this.rocket.active = false;
                this.launchCooldown = 1;
            }

            // Check if crashed back
            if (dist < planetSize / 2 + 10 && this.rocket.vx < 0) {
                this.rocket.escaped = false;
                this.rocket.active = false;
                this.launchCooldown = 1;
            }

            // Check if fell off screen (failed)
            if (this.rocket.x < 0) {
                this.rocket.escaped = false;
                this.rocket.active = false;
                this.launchCooldown = 1;
            }

            this.rocketBlob.setPosition(this.rocket.x, this.rocket.y);

            // Rocket expression based on state
            const currentSpeed = Math.sqrt(this.rocket.vx * this.rocket.vx + this.rocket.vy * this.rocket.vy);
            if (this.rocket.vx < 0) {
                // Falling back
                this.rocketBlob.updateOptions({ expression: 'worried', color: 0xe74c3c });
            } else if (currentSpeed > 3) {
                this.rocketBlob.updateOptions({ expression: 'surprised', color: 0x2ecc71 });
            } else {
                this.rocketBlob.updateOptions({ expression: 'happy', color: 0xf39c12 });
            }
        } else {
            // Reset rocket position when not active
            if (this.launchCooldown < 0.5) {
                this.resetRocket();
            }
        }

        // Fade trail
        this.trail.forEach((p) => {
            p.alpha -= 0.04 * delta;
        });
        this.trail = this.trail.filter((p) => p.alpha > 0);

        // Animate planet
        this.planetBlob.updateOptions({
            wobblePhase: this.time * 2,
        });

        this.drawGraphics(v, planetX, planetSize);
        this.drawTrail();
    }

    private launchRocket(v: number): void {
        const planetSize = this.planetBlob.getOptions().size as number;
        const planetX = this.centerX - 60;

        // Launch angle slightly upward
        const launchAngle = -0.2; // Slight upward angle

        this.rocket = {
            x: planetX + planetSize / 2 + 20,
            y: this.centerY,
            vx: v * 0.4 * Math.cos(launchAngle),
            vy: v * 0.4 * Math.sin(launchAngle),
            escaped: false,
            active: true,
        };
        this.trail = [];
    }

    private drawTrail(): void {
        const g = this.trailGraphics;
        g.clear();

        // Draw rocket exhaust trail
        this.trail.forEach((p) => {
            const size = 3 + p.alpha * 3;
            g.circle(p.x, p.y, size);

            // Trail color: green if escaping, red if falling
            const color = this.rocket.vx >= 0 ? 0x2ecc71 : 0xe74c3c;
            g.fill({ color, alpha: p.alpha * 0.6 });
        });
    }

    private drawGraphics(v: number, planetX: number, planetSize: number): void {
        const g = this.graphicsLayer;
        g.clear();

        // Gravity well visualization (concentric rings)
        for (let i = 1; i <= 5; i++) {
            const radius = planetSize / 2 + i * 20;
            const alpha = 0.25 - i * 0.04;
            g.circle(planetX, this.centerY, radius);
            g.stroke({ color: 0x5dade2, width: 2 - i * 0.3, alpha });
        }

        // Escape boundary (dashed circle)
        const escapeRadius = planetSize / 2 + 100;
        const segments = 24;
        for (let i = 0; i < segments; i += 2) {
            const startAngle = (i / segments) * Math.PI * 2;
            const endAngle = ((i + 1) / segments) * Math.PI * 2;

            // Move to start of arc to prevent line from previous position
            const startX = planetX + Math.cos(startAngle) * escapeRadius;
            const startY = this.centerY + Math.sin(startAngle) * escapeRadius;
            g.moveTo(startX, startY);

            g.arc(planetX, this.centerY, escapeRadius, startAngle, endAngle);
            g.stroke({ color: 0xf39c12, width: 2, alpha: 0.4 });
        }

        // Velocity meter (bottom right)
        const meterX = this.width - 50;
        const meterY = this.centerY - 60;
        const meterHeight = 120;
        const meterWidth = 15;

        // Meter background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 5);
        g.fill({ color: 0x222222, alpha: 0.7 });

        // Escape velocity threshold line
        const escapeY = meterY + meterHeight - (this.escapeVelocity / 20) * meterHeight;
        g.moveTo(meterX - 10, escapeY);
        g.lineTo(meterX + meterWidth + 10, escapeY);
        g.stroke({ color: 0xf39c12, width: 2, alpha: 0.8 });

        // Current velocity fill
        const fillHeight = Math.min((v / 20) * meterHeight, meterHeight);
        const fillColor = v >= this.escapeVelocity ? 0x2ecc71 : 0xe74c3c;
        g.roundRect(meterX, meterY + meterHeight - fillHeight, meterWidth, fillHeight, 5);
        g.fill({ color: fillColor, alpha: 0.8 });

        // Velocity indicator
        const vY = meterY + meterHeight - fillHeight;
        g.moveTo(meterX - 8, vY);
        g.lineTo(meterX, vY - 4);
        g.lineTo(meterX, vY + 4);
        g.closePath();
        g.fill({ color: 0xffffff, alpha: 0.9 });

        // Success/Failure indicator
        const indicatorX = this.width - 80;
        const indicatorY = 40;
        if (v >= this.escapeVelocity) {
            // Success - green checkmark area
            g.circle(indicatorX, indicatorY, 18);
            g.fill({ color: 0x2ecc71, alpha: 0.3 });
            g.circle(indicatorX, indicatorY, 18);
            g.stroke({ color: 0x2ecc71, width: 2, alpha: 0.8 });
        } else {
            // Failure - red X area
            g.circle(indicatorX, indicatorY, 18);
            g.fill({ color: 0xe74c3c, alpha: 0.3 });
            g.circle(indicatorX, indicatorY, 18);
            g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.8 });
        }

        // Planet surface marker
        g.circle(planetX + planetSize / 2 + 20, this.centerY, 4);
        g.fill({ color: 0xffffff, alpha: 0.5 });

        // Launch direction arrow (when rocket is ready)
        if (!this.rocket.active && this.launchCooldown < 0.3) {
            const arrowStartX = planetX + planetSize / 2 + 30;
            const arrowLength = Math.min(v * 3, 60);

            g.moveTo(arrowStartX, this.centerY);
            g.lineTo(arrowStartX + arrowLength, this.centerY - arrowLength * 0.2);
            g.stroke({ color: 0x2ecc71, width: 3, alpha: 0.6 });

            // Arrow head
            const endX = arrowStartX + arrowLength;
            const endY = this.centerY - arrowLength * 0.2;
            g.moveTo(endX, endY);
            g.lineTo(endX - 10, endY - 5);
            g.moveTo(endX, endY);
            g.lineTo(endX - 10, endY + 5);
            g.stroke({ color: 0x2ecc71, width: 3, alpha: 0.6 });
        }

    }
}
