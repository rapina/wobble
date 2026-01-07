import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface Electron {
    pos: number; // 0-1 along circuit path
    speed: number;
    size: number;
}

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

interface HeatWave {
    offset: number;
    intensity: number;
}

export class OhmScene extends BaseScene {
    declare private voltageBlob: Blob;
    declare private resistanceBlob: Blob;
    declare private circuitGraphics: Graphics;
    declare private electronGraphics: Graphics;
    declare private heatGraphics: Graphics;
    declare private sparkGraphics: Graphics;
    declare private time: number;
    declare private electrons: Electron[];
    declare private sparks: Spark[];
    declare private heatWaves: HeatWave[];
    declare private batteryPlusY: number;
    declare private batteryMinusY: number;

    protected setup(): void {
        this.time = 0;
        this.electrons = [];
        this.sparks = [];
        this.heatWaves = [];
        this.batteryPlusY = this.centerY - 50;
        this.batteryMinusY = this.centerY + 50;

        // Circuit wires
        this.circuitGraphics = new Graphics();
        this.container.addChild(this.circuitGraphics);

        // Heat glow
        this.heatGraphics = new Graphics();
        this.container.addChild(this.heatGraphics);

        // Electrons
        this.electronGraphics = new Graphics();
        this.container.addChild(this.electronGraphics);

        // Sparks
        this.sparkGraphics = new Graphics();
        this.container.addChild(this.sparkGraphics);

        // Voltage source blob (battery - left, 에너지 공급자)
        this.voltageBlob = new Blob({
            size: 50,
            color: pixiColors.voltage,
            shape: 'circle',
            expression: 'happy',
        });
        this.voltageBlob.setPosition(50, this.centerY);
        this.container.addChild(this.voltageBlob);

        // Resistance blob (center-right, 저항/고통받는 역할)
        this.resistanceBlob = new Blob({
            size: 45,
            color: pixiColors.resistance,
            shape: 'square',
            expression: 'neutral',
        });
        this.resistanceBlob.setPosition(this.width - 80, this.centerY);
        this.container.addChild(this.resistanceBlob);

        // Initialize electrons around the circuit
        for (let i = 0; i < 16; i++) {
            this.electrons.push({
                pos: i / 16,
                speed: 1,
                size: 3 + Math.random() * 2,
            });
        }

        // Initialize heat waves
        for (let i = 0; i < 5; i++) {
            this.heatWaves.push({
                offset: i * 0.2,
                intensity: 0.5 + Math.random() * 0.5,
            });
        }
    }

    protected onVariablesChange(): void {
        const V = this.variables['V'] || 12;
        const R = this.variables['R'] || 10;

        this.voltageBlob.updateOptions({ size: 40 + V * 1.5 });
        this.resistanceBlob.updateOptions({ size: 35 + R * 1.5 });
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        const dt = delta * 0.016;
        this.time += dt;

        const V = this.variables['V'] || 12;
        const R = this.variables['R'] || 10;
        const I = V / R; // Ohm's Law: I = V/R

        const flowSpeed = I * 0.003;
        const power = I * I * R; // P = I²R (heat dissipation)
        const heatLevel = Math.min(1, power / 50);

        // Update electrons
        this.electrons.forEach((e) => {
            e.pos += flowSpeed * delta * e.speed;
            if (e.pos > 1) e.pos -= 1;
        });

        // Update heat waves
        this.heatWaves.forEach((h) => {
            h.offset += 0.02 * delta;
            if (h.offset > 1) h.offset -= 1;
            h.intensity = 0.5 + Math.sin(this.time * 5 + h.offset * 10) * 0.3;
        });

        // Create sparks from resistor when high current
        if (I > 1.5 && Math.random() < I * 0.02) {
            const resistorX = this.width - 80;
            this.sparks.push({
                x: resistorX + (Math.random() - 0.5) * 30,
                y: this.centerY + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
            });
        }

        // Update sparks
        this.sparks.forEach((s) => {
            s.x += s.vx * delta;
            s.y += s.vy * delta;
            s.life -= 0.05;
        });
        this.sparks = this.sparks.filter((s) => s.life > 0);

        // Voltage blob expression based on output
        const voltageExpression: BlobExpression = V > 15 ? 'excited' : 'happy';
        this.voltageBlob.updateOptions({
            wobblePhase: this.time * 2,
            expression: voltageExpression,
            scaleX: 1 + Math.sin(this.time * 4) * 0.02,
            scaleY: 1 + Math.cos(this.time * 4) * 0.02,
        });

        // Resistance blob expression based on heat
        let resistorExpression: BlobExpression = 'neutral';
        if (heatLevel > 0.7) {
            resistorExpression = 'struggle';
        } else if (heatLevel > 0.4) {
            resistorExpression = 'worried';
        } else if (heatLevel > 0.2) {
            resistorExpression = 'effort';
        }

        this.resistanceBlob.updateOptions({
            wobblePhase: this.time * (1 + heatLevel * 2),
            expression: resistorExpression,
            showSweat: heatLevel > 0.5,
        });

        this.drawCircuit(I, heatLevel);
        this.drawHeat(heatLevel);
        this.drawElectrons(I);
        this.drawSparks();
    }

    private drawCircuit(current: number, heatLevel: number): void {
        const g = this.circuitGraphics;
        g.clear();

        const batteryX = 50;
        const resistorX = this.width - 80;
        const topY = 50;
        const bottomY = this.height - 50;
        const wireColor = 0x555555;

        // Wire thickness based on current
        const wireWidth = 3 + current * 0.3;

        // Top wire (+ terminal to resistor)
        g.moveTo(batteryX + 30, this.centerY - 25);
        g.lineTo(batteryX + 30, topY);
        g.lineTo(resistorX, topY);
        g.lineTo(resistorX, this.centerY - 25);
        g.stroke({ color: wireColor, width: wireWidth });

        // Bottom wire (resistor to - terminal)
        g.moveTo(resistorX, this.centerY + 25);
        g.lineTo(resistorX, bottomY);
        g.lineTo(batteryX + 30, bottomY);
        g.lineTo(batteryX + 30, this.centerY + 25);
        g.stroke({ color: wireColor, width: wireWidth });

        // Battery terminals
        // + terminal
        g.moveTo(batteryX + 20, this.centerY - 35);
        g.lineTo(batteryX + 40, this.centerY - 35);
        g.stroke({ color: 0xff6b6b, width: 4 });

        // - terminal
        g.moveTo(batteryX + 25, this.centerY + 35);
        g.lineTo(batteryX + 35, this.centerY + 35);
        g.stroke({ color: 0x4ecdc4, width: 4 });

        // Battery + and - labels
        g.circle(batteryX + 30, this.centerY - 45, 8);
        g.fill({ color: 0xff6b6b, alpha: 0.8 });

        g.circle(batteryX + 30, this.centerY + 45, 8);
        g.fill({ color: 0x4ecdc4, alpha: 0.8 });

        // Resistor zigzag symbol
        const resistorWidth = 40;
        const zigzags = 5;
        const amplitude = 10;
        const startX = resistorX - resistorWidth / 2;

        g.moveTo(startX, this.centerY);
        for (let i = 0; i <= zigzags; i++) {
            const x = startX + (i / zigzags) * resistorWidth;
            const y = this.centerY + (i % 2 === 0 ? -amplitude : amplitude);
            g.lineTo(x, y);
        }

        // Resistor color based on heat
        const resistorColor = this.lerpColor(0x888888, 0xff4444, heatLevel);
        g.stroke({ color: resistorColor, width: 3 });
    }

    private drawHeat(heatLevel: number): void {
        const g = this.heatGraphics;
        g.clear();

        if (heatLevel < 0.1) return;

        const resistorX = this.width - 80;

        // Heat glow around resistor
        for (let i = 3; i >= 0; i--) {
            const radius = 30 + i * 15;
            const alpha = heatLevel * 0.15 * (1 - i * 0.2);
            g.circle(resistorX, this.centerY, radius);
            g.fill({ color: 0xff6600, alpha });
        }

        // Heat waves rising
        this.heatWaves.forEach((h) => {
            const waveY = this.centerY - 40 - h.offset * 60;
            const waveAlpha = heatLevel * h.intensity * (1 - h.offset);

            if (waveAlpha > 0.05) {
                g.moveTo(resistorX - 15, waveY);
                for (let x = -15; x <= 15; x += 5) {
                    const y = waveY + Math.sin((x + this.time * 100) * 0.2) * 3;
                    g.lineTo(resistorX + x, y);
                }
                g.stroke({ color: 0xff8800, width: 2, alpha: waveAlpha });
            }
        });
    }

    private drawElectrons(current: number): void {
        const g = this.electronGraphics;
        g.clear();

        const batteryX = 50;
        const resistorX = this.width - 80;
        const topY = 50;
        const bottomY = this.height - 50;

        // Calculate path segments
        const segments = [
            // Top-left corner to top-right
            { x1: batteryX + 30, y1: this.centerY - 25, x2: batteryX + 30, y2: topY },
            { x1: batteryX + 30, y1: topY, x2: resistorX, y2: topY },
            { x1: resistorX, y1: topY, x2: resistorX, y2: this.centerY - 25 },
            // Through resistor area (skip)
            { x1: resistorX, y1: this.centerY + 25, x2: resistorX, y2: bottomY },
            { x1: resistorX, y1: bottomY, x2: batteryX + 30, y2: bottomY },
            { x1: batteryX + 30, y1: bottomY, x2: batteryX + 30, y2: this.centerY + 25 },
        ];

        // Calculate total path length
        let totalLength = 0;
        const segmentLengths: number[] = [];
        segments.forEach((seg) => {
            const len = Math.sqrt(Math.pow(seg.x2 - seg.x1, 2) + Math.pow(seg.y2 - seg.y1, 2));
            segmentLengths.push(len);
            totalLength += len;
        });

        // Add some length for through-battery and through-resistor
        totalLength += 100; // Battery gap
        totalLength += 50; // Resistor gap

        this.electrons.forEach((e) => {
            let targetDist = e.pos * totalLength;
            let x = 0, y = 0;
            let found = false;

            // Check battery gap first (pos 0-0.1 roughly)
            const batteryGap = 50;
            if (targetDist < batteryGap) {
                // Inside battery
                const t = targetDist / batteryGap;
                x = batteryX + 30;
                y = this.centerY + 25 - t * 50;
                found = true;
            } else {
                targetDist -= batteryGap;
            }

            // Go through segments
            if (!found) {
                let cumulative = 0;
                for (let i = 0; i < segments.length; i++) {
                    const seg = segments[i];
                    const len = segmentLengths[i];

                    // Add resistor gap after segment 2
                    if (i === 3) {
                        const resistorGap = 50;
                        if (targetDist < cumulative + resistorGap) {
                            // Inside resistor - skip drawing
                            found = true;
                            x = -100; // Off screen
                            y = -100;
                            break;
                        }
                        cumulative += resistorGap;
                    }

                    if (targetDist >= cumulative && targetDist < cumulative + len) {
                        const t = (targetDist - cumulative) / len;
                        x = seg.x1 + (seg.x2 - seg.x1) * t;
                        y = seg.y1 + (seg.y2 - seg.y1) * t;
                        found = true;
                        break;
                    }
                    cumulative += len;
                }
            }

            if (found && x > 0) {
                // Electron glow
                g.circle(x, y, e.size + 2);
                g.fill({ color: 0x4ecdc4, alpha: 0.3 });

                // Electron body
                g.circle(x, y, e.size);
                g.fill({ color: 0x4ecdc4, alpha: 0.9 });

                // Electron highlight
                g.circle(x - e.size * 0.3, y - e.size * 0.3, e.size * 0.4);
                g.fill({ color: 0xffffff, alpha: 0.5 });
            }
        });

        // Current flow indicators (arrows) at key points
        const arrowAlpha = Math.min(0.8, current * 0.3);
        if (arrowAlpha > 0.1) {
            // Arrow on top wire
            this.drawArrow(g, this.centerX, topY, 1, 0, arrowAlpha);
            // Arrow on bottom wire
            this.drawArrow(g, this.centerX, bottomY, -1, 0, arrowAlpha);
        }
    }

    private drawArrow(g: Graphics, x: number, y: number, dx: number, dy: number, alpha: number): void {
        const size = 8;
        const angle = Math.atan2(dy, dx);

        g.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        g.lineTo(x + Math.cos(angle + 2.5) * size, y + Math.sin(angle + 2.5) * size);
        g.lineTo(x + Math.cos(angle - 2.5) * size, y + Math.sin(angle - 2.5) * size);
        g.closePath();
        g.fill({ color: 0x4ecdc4, alpha });
    }

    private drawSparks(): void {
        const g = this.sparkGraphics;
        g.clear();

        this.sparks.forEach((s) => {
            g.circle(s.x, s.y, 2 + s.life * 3);
            g.fill({ color: 0xffff00, alpha: s.life });
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
