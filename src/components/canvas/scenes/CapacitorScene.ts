import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

const SHAPES: BlobShape[] = ['circle', 'square'];

interface ChargeParticle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    positive: boolean;
    wobbleOffset: number;
}

interface EnergySpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

export class CapacitorScene extends BaseScene {
    declare private plateGraphics: Graphics;
    declare private fieldGraphics: Graphics;
    declare private energyGraphics: Graphics;
    declare private sparkGraphics: Graphics;
    declare private chargeBlobs: Blob[];
    declare private chargeParticles: ChargeParticle[];
    declare private energySparks: EnergySpark[];
    declare private time: number;
    declare private chargeLevel: number;
    declare private targetChargeLevel: number;
    declare private energyPulse: number;

    protected setup(): void {
        this.chargeBlobs = [];
        this.chargeParticles = [];
        this.energySparks = [];
        this.time = 0;
        this.chargeLevel = 0;
        this.targetChargeLevel = 0;
        this.energyPulse = 0;

        // Energy storage visualization
        this.energyGraphics = new Graphics();
        this.container.addChild(this.energyGraphics);

        // Plates
        this.plateGraphics = new Graphics();
        this.container.addChild(this.plateGraphics);

        // Electric field
        this.fieldGraphics = new Graphics();
        this.container.addChild(this.fieldGraphics);

        // Sparks
        this.sparkGraphics = new Graphics();
        this.container.addChild(this.sparkGraphics);

        // Create charge blobs (3 positive, 3 negative)
        for (let i = 0; i < 6; i++) {
            const isPositive = i < 3;
            const blob = new Blob({
                size: 22,
                color: isPositive ? 0xff6b6b : 0x4ecdc4,
                shape: SHAPES[i % SHAPES.length],
                expression: isPositive ? 'charge' : 'sleepy',
            });
            this.container.addChild(blob);
            this.chargeBlobs.push(blob);
        }

        // Initialize floating charge particles
        for (let i = 0; i < 20; i++) {
            const positive = i < 10;
            this.chargeParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 100,
                y: this.centerY + (Math.random() - 0.5) * 100,
                targetX: 0,
                targetY: 0,
                positive,
                wobbleOffset: Math.random() * Math.PI * 2,
            });
        }
    }

    protected onVariablesChange(): void {
        // C: 1-10 mF, V: 1-10 kV
        const C = this.variables['C'] || 4;
        const V = this.variables['V'] || 5;

        // Normalize charge level based on actual ranges
        // At C=10, V=10 → max charge, at C=1, V=1 → min charge
        const normalizedC = (C - 1) / 9; // 0 to 1
        const normalizedV = (V - 1) / 9; // 0 to 1
        this.targetChargeLevel = 0.3 + (normalizedC + normalizedV) * 1.35; // 0.3 to 3
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;
        this.energyPulse += dt;

        // Smooth charge level transition
        this.chargeLevel += (this.targetChargeLevel - this.chargeLevel) * 0.03;

        // C: 1-10 mF, V: 1-10 kV
        const C = this.variables['C'] || 4;
        const V = this.variables['V'] || 5;
        const E = this.variables['E'] || 50; // Energy in kJ from formula

        // Plate dimensions - gap inversely proportional to C (larger C = smaller gap)
        const plateWidth = 25;
        const plateHeight = 130;
        const normalizedC = (C - 1) / 9;
        const plateGap = 90 - normalizedC * 30; // 90 to 60 (larger C = smaller gap)
        const leftPlateX = this.centerX - plateGap / 2 - plateWidth;
        const rightPlateX = this.centerX + plateGap / 2;

        // Update charge blob positions
        const chargeIntensity = Math.min(1, this.chargeLevel);
        for (let i = 0; i < 3; i++) {
            const y = this.centerY - 40 + i * 40;
            const wobble = Math.sin(this.time * 3 + i) * 3 * chargeIntensity;
            const attraction = this.chargeLevel * 8;

            // Positive charges on left plate
            this.chargeBlobs[i].setPosition(leftPlateX - 18 + attraction + wobble, y);
            this.chargeBlobs[i].updateOptions({
                wobblePhase: this.time + i * 0.5,
                opacity: chargeIntensity,
                size: 18 + chargeIntensity * 6,
                expression: this.chargeLevel > 1.5 ? 'excited' : 'happy',
            });

            // Negative charges on right plate
            this.chargeBlobs[i + 3].setPosition(rightPlateX + plateWidth + 18 - attraction - wobble, y);
            this.chargeBlobs[i + 3].updateOptions({
                wobblePhase: this.time + i * 0.5 + Math.PI,
                opacity: chargeIntensity,
                size: 18 + chargeIntensity * 6,
                expression: this.chargeLevel > 1.5 ? 'excited' : 'happy',
            });
        }

        // Update floating charge particles
        this.updateChargeParticles(leftPlateX, rightPlateX, plateWidth, plateHeight, delta);

        // Generate energy sparks when highly charged
        if (this.chargeLevel > 1.5 && Math.random() < 0.1 * this.chargeLevel) {
            const side = Math.random() > 0.5;
            const sparkX = side ? rightPlateX : leftPlateX + plateWidth;
            this.energySparks.push({
                x: sparkX + (Math.random() - 0.5) * 10,
                y: this.centerY + (Math.random() - 0.5) * plateHeight * 0.8,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
            });
        }

        // Update sparks
        this.energySparks.forEach(s => {
            s.x += s.vx * delta;
            s.y += s.vy * delta;
            s.life -= 0.05;
        });
        this.energySparks = this.energySparks.filter(s => s.life > 0);

        this.drawEnergyStorage(E, plateGap);
        this.drawPlates(leftPlateX, rightPlateX, plateWidth, plateHeight);
        this.drawElectricField(leftPlateX, rightPlateX, plateWidth, plateHeight, plateGap);
        this.drawChargeParticles();
        this.drawSparks();
    }

    private updateChargeParticles(leftPlateX: number, rightPlateX: number, plateWidth: number, plateHeight: number, delta: number): void {
        const topY = this.centerY - plateHeight / 2 + 10;

        this.chargeParticles.forEach((p, i) => {
            // Target positions based on charge level
            const row = Math.floor((i % 10) / 2);
            const col = i % 2;

            if (p.positive) {
                // Positive charges move toward left plate
                p.targetX = leftPlateX + 5 + col * 8;
                p.targetY = topY + row * 25 + 10;
            } else {
                // Negative charges move toward right plate
                p.targetX = rightPlateX + plateWidth - 5 - col * 8;
                p.targetY = topY + row * 25 + 10;
            }

            // Move toward target based on charge level
            const moveStrength = this.chargeLevel * 0.08;
            p.x += (p.targetX - p.x) * moveStrength;
            p.y += (p.targetY - p.y) * moveStrength;

            // Add wobble
            p.x += Math.sin(this.time * 2 + p.wobbleOffset) * 0.5;
            p.y += Math.cos(this.time * 2.5 + p.wobbleOffset) * 0.5;
        });
    }

    private drawEnergyStorage(energy: number, plateGap: number): void {
        const g = this.energyGraphics;
        g.clear();

        // Energy indicator (bottom)
        const indicatorX = 30;
        const indicatorY = this.height - 40;
        const maxBarWidth = 100;

        // Background
        g.roundRect(indicatorX - 5, indicatorY - 15, maxBarWidth + 30, 30, 8);
        g.fill({ color: 0x1a1a2e, alpha: 0.8 });

        // Energy bar background
        g.roundRect(indicatorX, indicatorY - 8, maxBarWidth, 16, 4);
        g.fill({ color: 0x333344 });

        // Energy bar fill (based on ½CV², max 500 kJ)
        const normalizedEnergy = Math.min(1, energy / 500);
        const fillWidth = maxBarWidth * normalizedEnergy;
        g.roundRect(indicatorX, indicatorY - 8, fillWidth, 16, 4);
        g.fill({ color: pixiColors.energy, alpha: 0.7 + normalizedEnergy * 0.3 });

        // Energy pulse effect
        if (normalizedEnergy > 0.3) {
            const pulseAlpha = Math.sin(this.energyPulse * 5) * 0.15 + 0.15;
            g.roundRect(indicatorX, indicatorY - 8, fillWidth, 16, 4);
            g.fill({ color: 0xffffff, alpha: pulseAlpha * normalizedEnergy });
        }

        // E label (for Energy)
        g.circle(indicatorX + maxBarWidth + 15, indicatorY, 10);
        g.fill({ color: pixiColors.energy, alpha: 0.4 + normalizedEnergy * 0.3 });

        // Energy glow between plates - stronger with more energy
        if (this.chargeLevel > 0.3) {
            const glowAlpha = (this.chargeLevel - 0.3) * 0.12 + normalizedEnergy * 0.08;
            const glowPulse = Math.sin(this.energyPulse * 3) * 0.03;
            g.rect(this.centerX - plateGap / 2 + 5, this.centerY - 60, plateGap - 10, 120);
            g.fill({ color: pixiColors.energy, alpha: glowAlpha + glowPulse });
        }
    }

    private drawPlates(leftX: number, rightX: number, width: number, height: number): void {
        const g = this.plateGraphics;
        g.clear();

        const topY = this.centerY - height / 2;

        // Left plate (positive)
        g.roundRect(leftX, topY, width, height, 4);
        g.fill(0x666677);

        // Left plate highlight
        g.roundRect(leftX, topY, 4, height, 2);
        g.fill(0x888899);

        // Left plate charge glow
        if (this.chargeLevel > 0) {
            g.roundRect(leftX - 3, topY - 3, width + 6, height + 6, 6);
            g.stroke({ color: 0xff6b6b, width: 2, alpha: Math.min(0.6, this.chargeLevel * 0.3) });
        }

        // Right plate (negative)
        g.roundRect(rightX, topY, width, height, 4);
        g.fill(0x666677);

        // Right plate highlight
        g.roundRect(rightX + width - 4, topY, 4, height, 2);
        g.fill(0x888899);

        // Right plate charge glow
        if (this.chargeLevel > 0) {
            g.roundRect(rightX - 3, topY - 3, width + 6, height + 6, 6);
            g.stroke({ color: 0x4ecdc4, width: 2, alpha: Math.min(0.6, this.chargeLevel * 0.3) });
        }

        // Wire connections
        g.moveTo(leftX + width / 2, topY - 10);
        g.lineTo(leftX + width / 2, topY - 30);
        g.lineTo(20, topY - 30);
        g.stroke({ color: 0x888888, width: 3 });

        g.moveTo(rightX + width / 2, topY - 10);
        g.lineTo(rightX + width / 2, topY - 30);
        g.lineTo(this.width - 20, topY - 30);
        g.stroke({ color: 0x888888, width: 3 });

        // Voltage source indicators
        g.circle(20, topY - 30, 8);
        g.fill({ color: 0xff6b6b, alpha: 0.5 + this.chargeLevel * 0.2 });
        g.circle(this.width - 20, topY - 30, 8);
        g.fill({ color: 0x4ecdc4, alpha: 0.5 + this.chargeLevel * 0.2 });
    }

    private drawElectricField(leftX: number, rightX: number, plateWidth: number, plateHeight: number, gap: number): void {
        const g = this.fieldGraphics;
        g.clear();

        if (this.chargeLevel < 0.2) return;

        const numLines = 7;
        const startX = leftX + plateWidth + 5;
        const endX = rightX - 5;
        const topY = this.centerY - plateHeight / 2 + 15;
        const lineSpacing = (plateHeight - 30) / (numLines - 1);

        for (let i = 0; i < numLines; i++) {
            const y = topY + i * lineSpacing;
            const waveOffset = Math.sin(this.time * 2 + i * 0.5) * 2;

            // Field line
            g.moveTo(startX, y);

            // Slight curve in the middle
            const midX = (startX + endX) / 2;
            g.quadraticCurveTo(midX, y + waveOffset, endX, y);

            g.stroke({
                color: pixiColors.force,
                width: 1.5,
                alpha: Math.min(0.7, this.chargeLevel * 0.4),
            });

            // Arrow head
            g.moveTo(endX, y);
            g.lineTo(endX - 8, y - 4);
            g.moveTo(endX, y);
            g.lineTo(endX - 8, y + 4);
            g.stroke({
                color: pixiColors.force,
                width: 1.5,
                alpha: Math.min(0.7, this.chargeLevel * 0.4),
            });

            // Moving charge visualization along field lines
            if (this.chargeLevel > 0.5) {
                const chargeX = startX + ((this.time * 30 + i * 20) % (endX - startX));
                g.circle(chargeX, y + waveOffset * (chargeX - startX) / (endX - startX), 3);
                g.fill({ color: 0x4ecdc4, alpha: 0.5 });
            }
        }

        // E label
        const labelX = (startX + endX) / 2;
        g.circle(labelX, this.centerY + plateHeight / 2 + 20, 12);
        g.fill({ color: pixiColors.force, alpha: 0.3 });
    }

    private drawChargeParticles(): void {
        const g = this.sparkGraphics;

        // Draw small charge particles
        this.chargeParticles.forEach(p => {
            const alpha = Math.min(0.8, this.chargeLevel * 0.5);
            if (alpha < 0.1) return;

            g.circle(p.x, p.y, 4);
            g.fill({ color: p.positive ? 0xff6b6b : 0x4ecdc4, alpha });

            // Tiny symbol
            if (p.positive) {
                g.moveTo(p.x - 2, p.y);
                g.lineTo(p.x + 2, p.y);
                g.moveTo(p.x, p.y - 2);
                g.lineTo(p.x, p.y + 2);
            } else {
                g.moveTo(p.x - 2, p.y);
                g.lineTo(p.x + 2, p.y);
            }
            g.stroke({ color: 0xffffff, width: 1, alpha: alpha * 0.8 });
        });
    }

    private drawSparks(): void {
        const g = this.sparkGraphics;

        this.energySparks.forEach(s => {
            g.circle(s.x, s.y, 3 * s.life);
            g.fill({ color: 0xffff88, alpha: s.life });
            g.circle(s.x, s.y, 1.5 * s.life);
            g.fill({ color: 0xffffff, alpha: s.life });
        });
    }
}
