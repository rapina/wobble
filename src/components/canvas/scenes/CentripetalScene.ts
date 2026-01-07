import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface TrailPoint {
    x: number;
    y: number;
    age: number;
}

export class CentripetalScene extends BaseScene {
    declare private blob: Blob;
    declare private pathGraphics: Graphics;
    declare private forceGraphics: Graphics;
    declare private ropeGraphics: Graphics;
    declare private trailGraphics: Graphics;
    declare private angle: number;
    declare private radius: number;
    declare private angularVelocity: number;
    declare private time: number;
    declare private trail: TrailPoint[];
    declare private centerBlob: Blob;

    protected setup(): void {
        this.angle = 0;
        this.radius = 90;
        this.angularVelocity = 0.03;
        this.time = 0;
        this.trail = [];

        // Trail
        this.trailGraphics = new Graphics();
        this.container.addChild(this.trailGraphics);

        this.pathGraphics = new Graphics();
        this.container.addChild(this.pathGraphics);

        this.ropeGraphics = new Graphics();
        this.container.addChild(this.ropeGraphics);

        this.forceGraphics = new Graphics();
        this.container.addChild(this.forceGraphics);

        // Center anchor blob (중심 역할)
        this.centerBlob = new Blob({
            size: 35,
            color: 0x666666,
            shape: 'circle',
            expression: 'neutral',
        });
        this.centerBlob.setPosition(this.centerX, this.centerY);
        this.container.addChild(this.centerBlob);

        // Orbiting blob (원심력에 의해 당기는 역할)
        this.blob = new Blob({
            size: 45,
            color: pixiColors.mass,
            shape: 'square',
            expression: 'happy',
        });
        this.container.addChild(this.blob);
    }

    protected onVariablesChange(): void {
        const m = this.variables['m'] || 5;
        const r = this.variables['r'] || 3;
        const v = this.variables['v'] || 4;

        // Update blob size based on mass (range 1-20)
        this.blob.updateOptions({ size: 35 + m * 1.5 });

        this.radius = 50 + r * 30;
        this.angularVelocity = v * 0.008;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;

        this.angle += this.angularVelocity * delta;

        const blobX = this.centerX + Math.cos(this.angle) * this.radius;
        const blobY = this.centerY + Math.sin(this.angle) * this.radius;

        // Add trail
        if (this.time % 0.015 < dt) {
            this.trail.push({ x: blobX, y: blobY, age: 0 });
            if (this.trail.length > 40) this.trail.shift();
        }
        this.trail.forEach(p => p.age += dt);

        // Calculate centripetal acceleration for expression
        const speed = this.angularVelocity * this.radius;
        const centripetalAccel = speed * speed / this.radius;

        let expression: BlobExpression = 'happy';
        if (centripetalAccel > 0.015) {
            expression = 'worried';
        } else if (centripetalAccel > 0.008) {
            expression = 'excited';
        }

        // Stretch outward due to centrifugal effect
        const stretchDir = this.angle;
        const stretchAmount = Math.min(0.25, centripetalAccel * 10);

        this.blob.setPosition(blobX, blobY);
        this.blob.updateOptions({
            wobblePhase: this.time * 5,
            lookDirection: {
                x: Math.cos(this.angle), // Looking outward
                y: Math.sin(this.angle),
            },
            expression,
            scaleX: 1 + stretchAmount * Math.abs(Math.cos(stretchDir)),
            scaleY: 1 + stretchAmount * Math.abs(Math.sin(stretchDir)),
            showSweat: centripetalAccel > 0.012,
            showSpeedLines: centripetalAccel > 0.01,
            speedDirection: this.angle + Math.PI,
        });

        // Center blob watches the orbiting blob
        this.centerBlob.updateOptions({
            wobblePhase: this.time * 2,
            lookDirection: {
                x: Math.cos(this.angle),
                y: Math.sin(this.angle),
            },
        });

        this.drawTrail();
        this.drawPath();
        this.drawRope(blobX, blobY);
        this.drawForce(blobX, blobY);
    }

    private drawTrail(): void {
        const g = this.trailGraphics;
        g.clear();

        for (let i = 1; i < this.trail.length; i++) {
            const p = this.trail[i];
            const prev = this.trail[i - 1];
            const alpha = Math.max(0, 0.5 - p.age);

            if (alpha > 0) {
                const width = 3 * (1 - p.age);
                g.moveTo(prev.x, prev.y);
                g.lineTo(p.x, p.y);
                g.stroke({ color: 0x4ecdc4, width, alpha });
            }
        }
    }

    private drawPath(): void {
        const g = this.pathGraphics;
        g.clear();

        // Dashed circle path
        const segments = 36;
        for (let i = 0; i < segments; i++) {
            if (i % 2 === 0) {
                const startAngle = (i / segments) * Math.PI * 2;
                const endAngle = ((i + 1) / segments) * Math.PI * 2;

                g.moveTo(
                    this.centerX + Math.cos(startAngle) * this.radius,
                    this.centerY + Math.sin(startAngle) * this.radius
                );
                g.lineTo(
                    this.centerX + Math.cos(endAngle) * this.radius,
                    this.centerY + Math.sin(endAngle) * this.radius
                );
            }
        }
        g.stroke({ color: 0x444444, width: 2, alpha: 0.5 });
    }

    private drawRope(blobX: number, blobY: number): void {
        const g = this.ropeGraphics;
        g.clear();

        // Taut rope with tension visualization
        const tension = this.angularVelocity * this.angularVelocity * this.radius;
        const ropeColor = this.lerpColor(0x8b4513, 0xff6b6b, Math.min(1, tension * 50));

        g.moveTo(this.centerX, this.centerY);
        g.lineTo(blobX, blobY);
        g.stroke({ color: ropeColor, width: 3 });
    }

    private drawForce(blobX: number, blobY: number): void {
        const g = this.forceGraphics;
        g.clear();

        const speed = this.angularVelocity * this.radius;
        const force = speed * speed / this.radius;
        const forceLength = 30 + force * 800;

        const dirX = (this.centerX - blobX) / this.radius;
        const dirY = (this.centerY - blobY) / this.radius;

        const endX = blobX + dirX * forceLength;
        const endY = blobY + dirY * forceLength;

        // Force arrow
        g.moveTo(blobX, blobY);
        g.lineTo(endX, endY);

        // Arrow head
        const headAngle = 0.4;
        const headLength = 10;
        const angle = Math.atan2(dirY, dirX);

        g.moveTo(endX, endY);
        g.lineTo(
            endX - Math.cos(angle - headAngle) * headLength,
            endY - Math.sin(angle - headAngle) * headLength
        );
        g.moveTo(endX, endY);
        g.lineTo(
            endX - Math.cos(angle + headAngle) * headLength,
            endY - Math.sin(angle + headAngle) * headLength
        );

        g.stroke({ color: pixiColors.force, width: 3 });
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
