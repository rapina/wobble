import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

interface LightRay {
    angle: number;
    length: number;
    speed: number;
}

export class PowerScene extends BaseScene {
    declare private bulbBlob: Blob;
    declare private bulbGraphics: Graphics;
    declare private glowGraphics: Graphics;
    declare private sparkGraphics: Graphics;
    declare private wireGraphics: Graphics;
    declare private time: number;
    declare private sparks: Spark[];
    declare private lightRays: LightRay[];

    protected setup(): void {
        this.time = 0;
        this.sparks = [];
        this.lightRays = [];

        // Initialize light rays
        for (let i = 0; i < 12; i++) {
            this.lightRays.push({
                angle: (i / 12) * Math.PI * 2,
                length: 0.5 + Math.random() * 0.5,
                speed: 0.8 + Math.random() * 0.4,
            });
        }

        // Wire graphics (behind everything)
        this.wireGraphics = new Graphics();
        this.container.addChild(this.wireGraphics);

        // Glow (behind bulb)
        this.glowGraphics = new Graphics();
        this.container.addChild(this.glowGraphics);

        // Bulb shape
        this.bulbGraphics = new Graphics();
        this.container.addChild(this.bulbGraphics);

        // Sparks
        this.sparkGraphics = new Graphics();
        this.container.addChild(this.sparkGraphics);

        // Light bulb blob (the filament/light source)
        this.bulbBlob = new Blob({
            size: 45,
            color: 0xffdd44,
            shape: 'circle',
            expression: 'happy',
        });
        this.bulbBlob.setPosition(this.centerX, this.centerY - 20);
        this.container.addChild(this.bulbBlob);
    }

    protected onVariablesChange(): void {
        // Variables will be used in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;

        const V = this.variables['V'] || 220;
        const I = this.variables['I'] || 5;
        const P = V * I;

        // Normalize power for visual effects (0-1 range, capped at 3000W)
        const powerLevel = Math.min(1, P / 3000);
        const brightness = 0.3 + powerLevel * 0.7;

        // Bulb color transitions from dim orange to bright white-yellow
        const bulbColor = this.lerpColor(0xff6600, 0xffffcc, powerLevel);

        // Expression based on power
        let expression: BlobExpression = 'happy';
        if (powerLevel > 0.8) {
            expression = 'excited';
        } else if (powerLevel > 0.5) {
            expression = 'happy';
        } else if (powerLevel < 0.2) {
            expression = 'neutral';
        }

        // Blob size pulses with power
        const pulseSpeed = 2 + powerLevel * 4;
        const pulseAmount = 0.05 + powerLevel * 0.1;
        const pulse = 1 + Math.sin(this.time * pulseSpeed) * pulseAmount;

        this.bulbBlob.updateOptions({
            wobblePhase: this.time * (2 + powerLevel * 3),
            expression,
            size: 35 + powerLevel * 25,
            scaleX: pulse,
            scaleY: pulse,
        });

        // Create sparks when power is high
        if (powerLevel > 0.5 && Math.random() < powerLevel * 0.15) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.sparks.push({
                x: this.centerX + (Math.random() - 0.5) * 30,
                y: this.centerY - 20 + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                size: 2 + Math.random() * 3,
            });
        }

        // Update sparks
        this.sparks.forEach(s => {
            s.x += s.vx * delta;
            s.y += s.vy * delta;
            s.vy += 5 * dt; // Gravity
            s.life -= 0.03;
        });
        this.sparks = this.sparks.filter(s => s.life > 0);

        // Update light rays
        this.lightRays.forEach(ray => {
            ray.length = 0.5 + 0.5 * Math.sin(this.time * ray.speed * 3 + ray.angle);
        });

        this.drawWires(powerLevel);
        this.drawGlow(powerLevel, bulbColor);
        this.drawBulb(powerLevel, bulbColor);
        this.drawSparks();
    }

    private drawWires(powerLevel: number): void {
        const g = this.wireGraphics;
        g.clear();

        const bulbX = this.centerX;
        const bulbY = this.centerY + 40;

        // Base/socket
        g.roundRect(bulbX - 20, bulbY + 20, 40, 30, 5);
        g.fill(0x444444);

        // Socket threads
        for (let i = 0; i < 3; i++) {
            g.rect(bulbX - 18, bulbY + 25 + i * 8, 36, 4);
            g.fill(0x333333);
        }

        // Wires coming from socket
        const wireGlow = powerLevel > 0.3 ? 0.3 : 0;

        // Left wire
        g.moveTo(bulbX - 10, bulbY + 50);
        g.lineTo(bulbX - 30, this.height - 20);
        g.stroke({ color: 0x666666, width: 4 });

        if (wireGlow > 0) {
            g.moveTo(bulbX - 10, bulbY + 50);
            g.lineTo(bulbX - 30, this.height - 20);
            g.stroke({ color: 0xff6600, width: 2, alpha: wireGlow });
        }

        // Right wire
        g.moveTo(bulbX + 10, bulbY + 50);
        g.lineTo(bulbX + 30, this.height - 20);
        g.stroke({ color: 0x666666, width: 4 });

        if (wireGlow > 0) {
            g.moveTo(bulbX + 10, bulbY + 50);
            g.lineTo(bulbX + 30, this.height - 20);
            g.stroke({ color: 0xff6600, width: 2, alpha: wireGlow });
        }

        // Power indicators
        g.circle(bulbX - 30, this.height - 20, 6);
        g.fill(powerLevel > 0.1 ? 0xff6b6b : 0x333333);
        g.circle(bulbX + 30, this.height - 20, 6);
        g.fill(powerLevel > 0.1 ? 0x4ecdc4 : 0x333333);
    }

    private drawGlow(powerLevel: number, color: number): void {
        const g = this.glowGraphics;
        g.clear();

        if (powerLevel < 0.1) return;

        const bulbX = this.centerX;
        const bulbY = this.centerY - 20;

        // Multiple glow layers
        for (let i = 4; i >= 0; i--) {
            const radius = 40 + i * 25 * powerLevel;
            const alpha = powerLevel * 0.15 * (1 - i * 0.15);
            g.circle(bulbX, bulbY, radius);
            g.fill({ color, alpha });
        }

        // Light rays
        this.lightRays.forEach(ray => {
            const innerR = 50;
            const outerR = innerR + 40 * ray.length * powerLevel;
            const x1 = bulbX + Math.cos(ray.angle) * innerR;
            const y1 = bulbY + Math.sin(ray.angle) * innerR;
            const x2 = bulbX + Math.cos(ray.angle) * outerR;
            const y2 = bulbY + Math.sin(ray.angle) * outerR;

            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke({ color: 0xffffcc, width: 3, alpha: powerLevel * 0.5 * ray.length });
        });
    }

    private drawBulb(powerLevel: number, fillColor: number): void {
        const g = this.bulbGraphics;
        g.clear();

        const bulbX = this.centerX;
        const bulbY = this.centerY;

        // Glass bulb outline
        g.ellipse(bulbX, bulbY - 20, 45, 55);
        g.stroke({ color: 0x888888, width: 2, alpha: 0.5 });

        // Bulb neck
        g.moveTo(bulbX - 25, bulbY + 30);
        g.lineTo(bulbX - 20, bulbY + 45);
        g.lineTo(bulbX + 20, bulbY + 45);
        g.lineTo(bulbX + 25, bulbY + 30);
        g.stroke({ color: 0x888888, width: 2, alpha: 0.5 });

        // Glass reflection
        g.ellipse(bulbX - 15, bulbY - 35, 8, 15);
        g.fill({ color: 0xffffff, alpha: 0.2 });

        // Filament (when on)
        if (powerLevel > 0.1) {
            const filamentColor = this.lerpColor(0xff4400, 0xffff88, powerLevel);

            // Draw coiled filament
            g.moveTo(bulbX - 10, bulbY + 10);
            for (let i = 0; i <= 8; i++) {
                const x = bulbX - 10 + i * 2.5;
                const y = bulbY - 10 + Math.sin(i * Math.PI) * 8;
                g.lineTo(x, y);
            }
            g.stroke({ color: filamentColor, width: 2 + powerLevel * 2 });

            // Filament glow
            g.ellipse(bulbX, bulbY - 5, 15, 12);
            g.fill({ color: fillColor, alpha: powerLevel * 0.4 });
        }
    }

    private drawSparks(): void {
        const g = this.sparkGraphics;
        g.clear();

        this.sparks.forEach(s => {
            // Spark trail
            g.circle(s.x, s.y, s.size * s.life);
            g.fill({ color: 0xffff00, alpha: s.life });

            // Spark core
            g.circle(s.x, s.y, s.size * 0.5 * s.life);
            g.fill({ color: 0xffffff, alpha: s.life });
        });
    }

    private lerpColor(c1: number, c2: number, t: number): number {
        const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return (r << 16) + (g << 8) + b;
    }
}
