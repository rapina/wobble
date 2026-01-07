import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors, lerp } from '../../../utils/pixiHelpers';

interface FieldParticle {
    x: number;
    y: number;
    angle: number;
    speed: number;
    life: number;
}

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

export class CoulombScene extends BaseScene {
    declare private charge1Blob: Blob;
    declare private charge2Blob: Blob;
    declare private fieldGraphics: Graphics;
    declare private forceGraphics: Graphics;
    declare private sparkGraphics: Graphics;
    declare private indicatorGraphics: Graphics;
    declare private fieldParticles: FieldParticle[];
    declare private sparks: Spark[];
    declare private time: number;
    declare private distance: number;
    declare private targetDistance: number;
    declare private forceStrength: number;

    protected setup(): void {
        this.time = 0;
        this.distance = 150;
        this.targetDistance = 150;
        this.forceStrength = 0;
        this.fieldParticles = [];
        this.sparks = [];

        // Field visualization
        this.fieldGraphics = new Graphics();
        this.container.addChild(this.fieldGraphics);

        // Force arrows
        this.forceGraphics = new Graphics();
        this.container.addChild(this.forceGraphics);

        // Sparks
        this.sparkGraphics = new Graphics();
        this.container.addChild(this.sparkGraphics);

        // Positive charge (red)
        this.charge1Blob = new Blob({
            size: 55,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'charge',
            glowIntensity: 0.3,
            glowColor: 0xff6b6b,
        });
        this.container.addChild(this.charge1Blob);

        // Negative charge (cyan)
        this.charge2Blob = new Blob({
            size: 55,
            color: 0x4ecdc4,
            shape: 'square',
            expression: 'sleepy',
            glowIntensity: 0.3,
            glowColor: 0x4ecdc4,
        });
        this.container.addChild(this.charge2Blob);

        // Force/distance indicator
        this.indicatorGraphics = new Graphics();
        this.container.addChild(this.indicatorGraphics);

        // Initialize field particles
        for (let i = 0; i < 30; i++) {
            this.fieldParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                angle: 0,
                speed: 0,
                life: Math.random(),
            });
        }
    }

    protected onVariablesChange(): void {
        // Variable names match formula: q₁, q₂ (range 1-100), r (range 1-50)
        const q1 = this.variables['q₁'] || 10;
        const q2 = this.variables['q₂'] || 10;
        const r = this.variables['r'] || 10;

        // q₁, q₂ range 1-100: normalize to 0-1 for size scaling
        const q1Normalized = (q1 - 1) / 99;
        const q2Normalized = (q2 - 1) / 99;

        // More dramatic size change: 35 to 75
        this.charge1Blob.updateOptions({
            size: 35 + q1Normalized * 40,
            glowIntensity: 0.2 + q1Normalized * 0.8,
        });
        this.charge2Blob.updateOptions({
            size: 35 + q2Normalized * 40,
            glowIntensity: 0.2 + q2Normalized * 0.8,
        });

        // r range 1-50: smaller r = closer charges
        const rNormalized = (r - 1) / 49; // 0 to 1
        this.targetDistance = 70 + rNormalized * 150; // 70 to 220 pixels
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;

        // Smooth distance transition
        this.distance = lerp(this.distance, this.targetDistance, 0.08);

        const q1 = this.variables['q₁'] || 10;
        const q2 = this.variables['q₂'] || 10;
        const r = this.variables['r'] || 10;

        // Calculate normalized force strength for visualization
        // F ∝ q1 * q2 / r² - use normalized values
        const q1Normalized = (q1 - 1) / 99;
        const q2Normalized = (q2 - 1) / 99;
        const rNormalized = (r - 1) / 49;

        // Force is proportional to q1*q2/r², normalize to 0-1 range
        const chargeProduct = q1Normalized * q2Normalized;
        const distanceFactor = Math.max(0.1, rNormalized); // Avoid division by zero
        this.forceStrength = Math.min(1, (chargeProduct / (distanceFactor * distanceFactor)) * 2);

        // Assume both charges are positive (repulsive) or could implement sign logic
        const isAttractive = false; // For simplicity, assuming same sign charges

        // Position charges
        const pos1X = this.centerX - this.distance / 2;
        const pos2X = this.centerX + this.distance / 2;

        // More dramatic oscillation effect based on force (repulsion = push apart)
        const oscillationSpeed = 3 + this.forceStrength * 5;
        const oscillationAmount = 2 + this.forceStrength * 8;
        const oscillation = Math.sin(this.time * oscillationSpeed) * oscillationAmount;
        const repulsionOffset = oscillation; // Repulsive force

        this.charge1Blob.setPosition(pos1X - repulsionOffset, this.centerY);
        this.charge2Blob.setPosition(pos2X + repulsionOffset, this.centerY);

        // Expressions based on distance and force
        let expression1: BlobExpression = 'happy';
        let expression2: BlobExpression = 'happy';

        if (this.forceStrength > 0.6) {
            expression1 = 'effort';
            expression2 = 'effort';
        } else if (this.forceStrength > 0.3) {
            expression1 = 'charge';
            expression2 = 'charge';
        }

        // Wobble speed increases with force
        const wobbleSpeed = 2 + this.forceStrength * 4;
        this.charge1Blob.updateOptions({
            wobblePhase: this.time * wobbleSpeed,
            lookDirection: { x: 1, y: 0 },
            expression: expression1,
            scaleX: 1 + Math.sin(this.time * 5) * this.forceStrength * 0.1,
        });

        this.charge2Blob.updateOptions({
            wobblePhase: this.time * wobbleSpeed + Math.PI,
            lookDirection: { x: -1, y: 0 },
            expression: expression2,
            scaleX: 1 + Math.sin(this.time * 5 + Math.PI) * this.forceStrength * 0.1,
        });

        // Update field particles
        this.updateFieldParticles(pos1X, pos2X, isAttractive, delta);

        // Generate sparks based on force strength (more sparks = stronger force)
        const sparkProbability = 0.1 + this.forceStrength * 0.4;
        if (Math.random() < sparkProbability) {
            const midX = this.centerX;
            // Sparks appear between the charges
            const sparkSpread = 20 + (1 - this.forceStrength) * 60;
            this.sparks.push({
                x: midX + (Math.random() - 0.5) * sparkSpread,
                y: this.centerY + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * (2 + this.forceStrength * 4),
                vy: (Math.random() - 0.5) * (2 + this.forceStrength * 4),
                life: 1,
            });
        }

        // Update sparks
        this.sparks.forEach(s => {
            s.x += s.vx * delta;
            s.y += s.vy * delta;
            s.life -= 0.04;
        });
        this.sparks = this.sparks.filter(s => s.life > 0);

        this.drawFieldLines(pos1X, pos2X, isAttractive);
        this.drawFieldParticles();
        this.drawForceArrows(pos1X, pos2X, isAttractive);
        this.drawSparks();
        this.drawIndicator(r, this.forceStrength, isAttractive);
    }

    private updateFieldParticles(pos1X: number, pos2X: number, isAttractive: boolean, delta: number): void {
        this.fieldParticles.forEach(p => {
            // Calculate field direction from both charges
            const dx1 = p.x - pos1X;
            const dy1 = p.y - this.centerY;
            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 10;

            const dx2 = p.x - pos2X;
            const dy2 = p.y - this.centerY;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 10;

            // Field vectors (positive charge pushes out, negative pulls in)
            const fx = (dx1 / dist1 / dist1) - (dx2 / dist2 / dist2);
            const fy = (dy1 / dist1 / dist1) - (dy2 / dist2 / dist2);

            p.angle = Math.atan2(fy, fx);
            p.speed = Math.min(2, Math.sqrt(fx * fx + fy * fy) * 500);

            // Move along field
            p.x += Math.cos(p.angle) * p.speed * delta;
            p.y += Math.sin(p.angle) * p.speed * delta;
            p.life -= 0.01;

            // Reset if out of bounds or dead
            if (p.life <= 0 || p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
                // Respawn near one of the charges
                const nearCharge1 = Math.random() > 0.5;
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 20;
                p.x = (nearCharge1 ? pos1X : pos2X) + Math.cos(angle) * dist;
                p.y = this.centerY + Math.sin(angle) * dist;
                p.life = 1;
            }
        });
    }

    private drawFieldLines(pos1X: number, pos2X: number, isAttractive: boolean): void {
        const g = this.fieldGraphics;
        g.clear();

        // Draw curved field lines between charges
        const numLines = 8;
        const spreadAngles = [-0.8, -0.5, -0.2, 0, 0, 0.2, 0.5, 0.8];

        for (let i = 0; i < numLines; i++) {
            const yOffset = spreadAngles[i] * 80;
            const startX = pos1X + 35;
            const endX = pos2X - 35;
            const startY = this.centerY + yOffset * 0.3;
            const endY = this.centerY + yOffset * 0.3;

            // Control points for bezier curve
            const ctrl1X = startX + (endX - startX) * 0.3;
            const ctrl1Y = startY + yOffset;
            const ctrl2X = startX + (endX - startX) * 0.7;
            const ctrl2Y = endY + yOffset;

            g.moveTo(startX, startY);
            g.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);

            const lineAlpha = 0.3 + this.forceStrength * 0.3;
            g.stroke({
                color: isAttractive ? 0x88aaff : 0xff8888,
                width: 1.5,
                alpha: lineAlpha * (1 - Math.abs(yOffset) / 100),
            });

            // Draw arrows along field lines
            if (isAttractive) {
                const arrowX = (startX + endX) / 2;
                const arrowY = (ctrl1Y + ctrl2Y) / 2;
                this.drawSmallArrow(g, arrowX, arrowY, 0, isAttractive ? 0x88aaff : 0xff8888, lineAlpha);
            }
        }

        // Radial field lines from positive charge (outward)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            // Skip lines that go toward the other charge
            if (Math.abs(angle) < 0.5 || Math.abs(angle - Math.PI) < 0.5) continue;

            const innerR = 40;
            const outerR = 70;
            const x1 = pos1X + Math.cos(angle) * innerR;
            const y1 = this.centerY + Math.sin(angle) * innerR;
            const x2 = pos1X + Math.cos(angle) * outerR;
            const y2 = this.centerY + Math.sin(angle) * outerR;

            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke({ color: 0xff6b6b, width: 1, alpha: 0.3 });
        }

        // Radial field lines toward negative charge (inward)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            if (Math.abs(angle) < 0.5 || Math.abs(angle - Math.PI) < 0.5) continue;

            const innerR = 40;
            const outerR = 70;
            const x1 = pos2X + Math.cos(angle) * outerR;
            const y1 = this.centerY + Math.sin(angle) * outerR;
            const x2 = pos2X + Math.cos(angle) * innerR;
            const y2 = this.centerY + Math.sin(angle) * innerR;

            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke({ color: 0x4ecdc4, width: 1, alpha: 0.3 });
        }
    }

    private drawSmallArrow(g: Graphics, x: number, y: number, angle: number, color: number, alpha: number): void {
        const size = 6;
        g.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        g.lineTo(x + Math.cos(angle + 2.5) * size, y + Math.sin(angle + 2.5) * size);
        g.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        g.lineTo(x + Math.cos(angle - 2.5) * size, y + Math.sin(angle - 2.5) * size);
        g.stroke({ color, width: 2, alpha });
    }

    private drawFieldParticles(): void {
        const g = this.fieldGraphics;

        this.fieldParticles.forEach(p => {
            const alpha = p.life * 0.5;
            g.circle(p.x, p.y, 2);
            g.fill({ color: 0xaabbff, alpha });
        });
    }

    private drawForceArrows(pos1X: number, pos2X: number, isAttractive: boolean): void {
        const g = this.forceGraphics;
        g.clear();

        // More dramatic arrow length based on force
        const arrowLength = 25 + this.forceStrength * 60;

        // Force on charge 1 (points toward/away from charge 2)
        const dir1 = isAttractive ? 0 : Math.PI;
        this.drawForceArrow(g, pos1X, this.centerY, dir1, arrowLength, pixiColors.force);

        // Force on charge 2 (points toward/away from charge 1)
        const dir2 = isAttractive ? Math.PI : 0;
        this.drawForceArrow(g, pos2X, this.centerY, dir2, arrowLength, pixiColors.force);

        // F labels
        const label1X = pos1X + Math.cos(dir1) * (arrowLength + 15);
        const label2X = pos2X + Math.cos(dir2) * (arrowLength + 15);

        g.circle(label1X, this.centerY, 10);
        g.fill({ color: pixiColors.force, alpha: 0.3 });
        g.circle(label2X, this.centerY, 10);
        g.fill({ color: pixiColors.force, alpha: 0.3 });
    }

    private drawForceArrow(g: Graphics, x: number, y: number, angle: number, length: number, color: number): void {
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        // Arrow shaft
        g.moveTo(x, y);
        g.lineTo(endX, endY);
        g.stroke({ color, width: 3 });

        // Arrow head
        const headAngle = 0.4;
        const headLength = 10;
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
        g.stroke({ color, width: 3 });
    }

    private drawSparks(): void {
        const g = this.sparkGraphics;
        g.clear();

        this.sparks.forEach(s => {
            g.circle(s.x, s.y, 3 * s.life);
            g.fill({ color: 0xffffff, alpha: s.life * 0.8 });
            g.circle(s.x, s.y, 5 * s.life);
            g.fill({ color: 0x88aaff, alpha: s.life * 0.4 });
        });
    }

    private drawIndicator(r: number, force: number, isAttractive: boolean): void {
        const g = this.indicatorGraphics;
        g.clear();

        // Distance indicator at bottom
        const indicatorY = this.height - 40;

        // Background panel
        g.roundRect(this.centerX - 80, indicatorY - 20, 160, 40, 8);
        g.fill({ color: 0x1a1a2e, alpha: 0.8 });

        // r (distance) bar - r range 1-50
        const rNormalized = (r - 1) / 49;
        const barX = this.centerX - 65;
        const maxBarWidth = 70;

        g.roundRect(barX, indicatorY - 5, maxBarWidth, 10, 3);
        g.fill({ color: 0x333344 });
        g.roundRect(barX, indicatorY - 5, maxBarWidth * rNormalized, 10, 3);
        g.fill({ color: 0x888888, alpha: 0.7 });

        // Force indicator bar
        const forceBarX = this.centerX + 10;
        const forceBarWidth = 60;
        g.roundRect(forceBarX, indicatorY - 5, forceBarWidth, 10, 3);
        g.fill({ color: 0x333344 });

        // Force fill with color based on strength
        const forceColor = force > 0.6 ? 0xff6b6b : force > 0.3 ? 0xf39c12 : 0x2ecc71;
        g.roundRect(forceBarX, indicatorY - 5, forceBarWidth * force, 10, 3);
        g.fill({ color: forceColor, alpha: 0.8 });

        // Force meter arrow indicator
        const arrowX = forceBarX + forceBarWidth * force;
        g.moveTo(arrowX, indicatorY - 10);
        g.lineTo(arrowX - 4, indicatorY - 16);
        g.lineTo(arrowX + 4, indicatorY - 16);
        g.closePath();
        g.fill({ color: 0xffffff, alpha: 0.8 });
    }
}
