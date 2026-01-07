import { Ticker, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Wobble, WobbleExpression } from '../Wobble';
import { clamp, lerp } from '../../../utils/pixiHelpers';

/**
 * PressureScene - 압력 (P = F/A)
 * Triangle (Spike) character presses down on a surface
 * Smaller area = higher pressure = deeper penetration
 */
export class PressureScene extends BaseScene {
    declare private spike: Wobble;
    declare private surfaceGraphics: Graphics;
    declare private uiGraphics: Graphics;

    // Displayed values (smoothed)
    declare private displayedForce: number;
    declare private displayedArea: number;
    declare private displayedPenetration: number;

    // Animation state
    declare private time: number;

    declare private statusLabel: Text;

    protected setup(): void {
        this.displayedForce = 100;
        this.displayedArea = 10;
        this.displayedPenetration = 0;
        this.time = 0;

        // Surface graphics (ground/material being pressed)
        this.surfaceGraphics = new Graphics();
        this.container.addChild(this.surfaceGraphics);

        // UI graphics (arrows, labels)
        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        });
        this.statusLabel = new Text({ text: '', style: labelStyle });
        this.statusLabel.position.set(20, 20);
        this.container.addChild(this.statusLabel);

        // Spike (triangle) - ADD LAST to be on top
        this.spike = new Wobble({
            size: 70,
            color: 0xE74C3C, // Red for Spike
            shape: 'triangle',
            expression: 'effort',
            showShadow: true,
        });
        this.container.addChild(this.spike);
    }

    protected onVariablesChange(): void {
        // Read in animate()
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;

        // Get target values
        const targetForce = this.variables['F'] ?? 100;
        const targetArea = this.variables['A'] ?? 10;

        // Smooth parameter changes
        this.displayedForce = lerp(this.displayedForce, targetForce, 0.08);
        this.displayedArea = lerp(this.displayedArea, targetArea, 0.08);

        // Calculate pressure: P = F/A (in kPa)
        const pressure = (this.displayedForce * 10) / this.displayedArea;

        // Penetration depth based on pressure - use log scale for better range
        // Min pressure ~10 (F=10, A=100), Max ~2000 (F=200, A=1)
        const normalizedPressure = clamp((pressure - 10) / 300, 0, 1);
        const targetPenetration = normalizedPressure * 80;
        this.displayedPenetration = lerp(this.displayedPenetration, targetPenetration, 0.08);

        // Update time for animations
        this.time += delta * 0.02;

        // Pressing animation - intensity based on force
        const pressIntensity = this.displayedForce / 200;
        const pressCycle = Math.sin(this.time * (2 + pressIntensity * 2));
        const pressOffset = pressCycle * (3 + pressIntensity * 5);

        // Surface Y position
        const surfaceY = this.centerY + 50;
        // Spike goes DOWN into the surface as penetration increases
        const spikeY = surfaceY - 55 + this.displayedPenetration * 0.7 + pressOffset;

        // Expression based on pressure
        let expression: WobbleExpression = 'happy';
        if (pressure > 400) {
            expression = 'struggle';
        } else if (pressure > 200) {
            expression = 'effort';
        } else if (pressure > 100) {
            expression = 'neutral';
        }

        // Size visual for area (larger area = wider base)
        const areaScale = 0.5 + (this.displayedArea / 80) * 1.0;

        // Squash based on force (more force = more squash)
        const forceSquash = this.displayedForce / 300;
        const scaleY = 1 - forceSquash * 0.2 - this.displayedPenetration / 300;

        this.spike.setPosition(this.centerX, spikeY);
        this.spike.updateOptions({
            expression,
            scaleX: areaScale * (1 + forceSquash * 0.1),
            scaleY: clamp(scaleY, 0.7, 1.1),
            wobblePhase: this.time,
            showSweat: pressure > 300,
        });

        // Draw elements
        this.drawSurface(surfaceY);
        this.drawUI(surfaceY, pressure, areaScale);
        this.updateStatus(pressure);
    }

    private drawSurface(surfaceY: number): void {
        const g = this.surfaceGraphics;
        g.clear();

        // Main surface (deformable material)
        const surfaceHeight = 100;

        // Surface with depression where spike is pressing
        const indentWidth = 30 + this.displayedArea * 0.6;
        const indentDepth = this.displayedPenetration;

        // Draw surface with indentation
        g.moveTo(0, surfaceY);
        g.lineTo(this.centerX - indentWidth, surfaceY);

        // Indentation curve
        g.bezierCurveTo(
            this.centerX - indentWidth * 0.5, surfaceY,
            this.centerX - indentWidth * 0.3, surfaceY + indentDepth,
            this.centerX, surfaceY + indentDepth
        );
        g.bezierCurveTo(
            this.centerX + indentWidth * 0.3, surfaceY + indentDepth,
            this.centerX + indentWidth * 0.5, surfaceY,
            this.centerX + indentWidth, surfaceY
        );

        g.lineTo(this.width, surfaceY);
        g.lineTo(this.width, surfaceY + surfaceHeight);
        g.lineTo(0, surfaceY + surfaceHeight);
        g.closePath();

        // Material color
        const materialColor = this.getPressureColor(this.displayedPenetration);
        g.fill(materialColor);

        // Surface line
        g.moveTo(0, surfaceY);
        g.lineTo(this.centerX - indentWidth, surfaceY);
        g.stroke({ color: 0x8888aa, width: 3 });

        g.moveTo(this.centerX + indentWidth, surfaceY);
        g.lineTo(this.width, surfaceY);
        g.stroke({ color: 0x8888aa, width: 3 });

        // Stress lines radiating from indent point
        if (this.displayedPenetration > 10) {
            const lineCount = Math.floor(this.displayedPenetration / 8);
            for (let i = 0; i < lineCount; i++) {
                const angle = (Math.PI * 0.3) + (Math.PI * 0.4) * (i / Math.max(lineCount, 1));
                const length = 15 + this.displayedPenetration * 0.5;

                g.moveTo(this.centerX, surfaceY + indentDepth * 0.5);
                g.lineTo(
                    this.centerX + Math.cos(angle) * length,
                    surfaceY + indentDepth * 0.5 + Math.sin(angle) * length
                );
            }
            g.stroke({ color: 0xaa6666, width: 1, alpha: 0.5 });
        }
    }

    private drawUI(surfaceY: number, pressure: number, areaScale: number): void {
        const g = this.uiGraphics;
        g.clear();

        // Force arrow (pointing down)
        const arrowLength = 30 + this.displayedForce * 0.15;
        const arrowStartY = surfaceY - 130 - this.displayedPenetration;
        const arrowEndY = arrowStartY + arrowLength;

        g.moveTo(this.centerX, arrowStartY);
        g.lineTo(this.centerX, arrowEndY);
        g.stroke({ color: 0xf7dc6f, width: 4 });

        // Arrow head
        g.moveTo(this.centerX, arrowEndY);
        g.lineTo(this.centerX - 8, arrowEndY - 12);
        g.moveTo(this.centerX, arrowEndY);
        g.lineTo(this.centerX + 8, arrowEndY - 12);
        g.stroke({ color: 0xf7dc6f, width: 4, cap: 'round' });

        // F label
        g.roundRect(this.centerX - 14, arrowStartY - 25, 28, 20, 4);
        g.fill({ color: 0xf7dc6f, alpha: 0.8 });

        // Area indicator (horizontal bracket at base)
        const baseWidth = 25 * areaScale;
        const bracketY = surfaceY + 55;

        g.moveTo(this.centerX - baseWidth, bracketY);
        g.lineTo(this.centerX + baseWidth, bracketY);
        g.stroke({ color: 0x82e0aa, width: 3 });

        // Vertical ticks
        g.moveTo(this.centerX - baseWidth, bracketY - 6);
        g.lineTo(this.centerX - baseWidth, bracketY + 6);
        g.moveTo(this.centerX + baseWidth, bracketY - 6);
        g.lineTo(this.centerX + baseWidth, bracketY + 6);
        g.stroke({ color: 0x82e0aa, width: 3 });

        // A label
        g.roundRect(this.centerX - 12, bracketY + 10, 24, 18, 4);
        g.fill({ color: 0x82e0aa, alpha: 0.8 });

        // Pressure indicator (side bar)
        const barX = this.width - 40;
        const barHeight = 100;
        const barY = this.centerY - barHeight / 2;
        const pressureRatio = clamp(pressure / 500, 0, 1);

        // Background bar
        g.roundRect(barX, barY, 20, barHeight, 4);
        g.fill(0x333344);

        // Filled portion
        const fillHeight = pressureRatio * (barHeight - 4);
        g.roundRect(barX + 2, barY + barHeight - 2 - fillHeight, 16, fillHeight, 2);

        // Color based on pressure
        const pressureColor = pressure > 300 ? 0xff6b6b : pressure > 150 ? 0xf7dc6f : 0x4ecdc4;
        g.fill(pressureColor);

        // P label
        g.roundRect(barX - 2, barY - 25, 24, 20, 4);
        g.fill({ color: pressureColor, alpha: 0.8 });
    }

    private updateStatus(pressure: number): void {
        this.statusLabel.text = `P = ${this.displayedForce.toFixed(0)} ÷ ${this.displayedArea.toFixed(1)} = ${pressure.toFixed(0)} kPa`;

        if (pressure > 300) {
            this.statusLabel.style.fill = 0xff6b6b;
        } else if (pressure > 150) {
            this.statusLabel.style.fill = 0xf7dc6f;
        } else {
            this.statusLabel.style.fill = 0x4ecdc4;
        }
    }

    private getPressureColor(penetration: number): number {
        const t = clamp(penetration / 80, 0, 1);
        return this.lerpColor(0x4a5568, 0x2d3748, t);
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
