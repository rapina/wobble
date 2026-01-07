import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface HeatParticle {
    x: number;
    y: number;
    progress: number;
    speed: number;
    offsetY: number;
    size: number;
}

export class HeatScene extends BaseScene {
    declare private hotBlob: Blob;
    declare private coldBlob: Blob;
    declare private arrowGraphics: Graphics;
    declare private particleGraphics: Graphics;
    declare private tempGraphics: Graphics;
    declare private time: number;
    declare private heatParticles: HeatParticle[];
    declare private transferredHeat: number;

    protected setup(): void {
        this.time = 0;
        this.heatParticles = [];
        this.transferredHeat = 0;

        this.arrowGraphics = new Graphics();
        this.container.addChild(this.arrowGraphics);

        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        this.tempGraphics = new Graphics();
        this.container.addChild(this.tempGraphics);

        // Hot object (left - 에너지 전달자)
        this.hotBlob = new Blob({
            size: 70,
            color: 0xff4757,
            shape: 'circle',
            expression: 'hot',
            glowIntensity: 0.5,
            glowColor: 0xff4757,
        });
        this.hotBlob.setPosition(this.width * 0.25, this.centerY);
        this.container.addChild(this.hotBlob);

        // Cold object (right - 에너지 수신자)
        this.coldBlob = new Blob({
            size: 60,
            color: 0x4ecdc4,
            shape: 'square',
            expression: 'happy',
            glowIntensity: 0.1,
            glowColor: 0x4ecdc4,
        });
        this.coldBlob.setPosition(this.width * 0.75, this.centerY);
        this.container.addChild(this.coldBlob);
    }

    protected onVariablesChange(): void {
        // Reset transferred heat when variables change
        this.transferredHeat = 0;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        const Th = this.variables['Th'] ?? 100;
        const Tc = this.variables['Tc'] ?? 20;
        const m = this.variables['m'] ?? 1;
        const c = this.variables['c'] ?? 4.18;

        const tempDiff = Th - Tc;
        const heatFlowRate = Math.max(0, tempDiff * 0.01);

        // Simulate heat transfer progress (0 to 1)
        this.transferredHeat = Math.min(1, this.transferredHeat + heatFlowRate * 0.003 * delta);

        // Calculate effective temperatures based on transfer
        const effectiveTh = Th - tempDiff * this.transferredHeat * 0.3;
        const effectiveTc = Tc + tempDiff * this.transferredHeat * 0.3;

        // Emit heat particles based on heat flow
        const emitRate = 0.15 + heatFlowRate * 0.25;
        if (Math.random() < emitRate && tempDiff > 5) {
            this.heatParticles.push({
                x: this.width * 0.25 + 45,
                y: this.centerY + (Math.random() - 0.5) * 50,
                progress: 0,
                speed: 0.015 + Math.random() * 0.01 + heatFlowRate * 0.005,
                offsetY: (Math.random() - 0.5) * 20,
                size: 4 + Math.random() * 4 + heatFlowRate * 3,
            });
        }

        // Update particles with wave motion
        this.heatParticles.forEach((p) => {
            p.progress += p.speed * delta;
            const travelDist = this.width * 0.5 - 90;
            p.x = this.width * 0.25 + 45 + p.progress * travelDist;
            p.y = this.centerY + Math.sin(p.progress * Math.PI * 3 + p.offsetY) * 15 + p.offsetY;
        });
        this.heatParticles = this.heatParticles.filter((p) => p.progress < 1);

        // Hot blob - more intense animation when hot
        const hotIntensity = effectiveTh / 150;
        const hotPulse = 1 + Math.sin(this.time * 4 * hotIntensity) * 0.08 * hotIntensity;
        let hotExpression: BlobExpression = 'happy';
        if (effectiveTh > 80) hotExpression = 'hot';
        if (effectiveTh > 120) hotExpression = 'excited';

        // Calculate color based on temperature (blue 0x4ecdc4 -> red 0xff4757)
        const hotColorR = Math.min(255, 100 + effectiveTh * 1.2);
        const hotColorG = Math.max(50, 150 - effectiveTh * 0.8);
        const hotColorB = Math.max(50, 150 - effectiveTh * 0.8);
        const hotColor = (hotColorR << 16) | (hotColorG << 8) | hotColorB;

        this.hotBlob.updateOptions({
            size: 55 + effectiveTh * 0.15,
            wobblePhase: this.time * (2 + hotIntensity * 2),
            scaleX: hotPulse,
            scaleY: hotPulse,
            glowIntensity: Math.min(0.8, hotIntensity * 0.6),
            glowColor: hotColor,
            color: hotColor,
            expression: hotExpression,
        });

        // Cold blob - gains energy over time
        const coldIntensity = effectiveTc / 100;
        const coldPulse = 1 + Math.sin(this.time * 2 * (1 + coldIntensity)) * 0.03 * (1 + coldIntensity);
        let coldExpression: BlobExpression = 'happy';
        if (effectiveTc < 10) coldExpression = 'sleepy';
        if (effectiveTc > 50) coldExpression = 'surprised';
        if (effectiveTc > 80) coldExpression = 'hot';

        const coldColorR = Math.min(255, 78 + effectiveTc * 1.5);
        const coldColorG = Math.max(100, 205 - effectiveTc * 0.5);
        const coldColorB = Math.max(100, 196 - effectiveTc * 0.8);
        const coldColor = (coldColorR << 16) | (coldColorG << 8) | coldColorB;

        this.coldBlob.updateOptions({
            size: 50 + effectiveTc * 0.12,
            wobblePhase: this.time * (1 + coldIntensity),
            scaleX: coldPulse,
            scaleY: coldPulse,
            glowIntensity: Math.min(0.5, coldIntensity * 0.4),
            glowColor: coldColor,
            color: coldColor,
            expression: coldExpression,
        });

        this.drawHeatFlow(tempDiff, heatFlowRate);
        this.drawParticles();
        this.drawTemperatureIndicators(effectiveTh, effectiveTc, m, c);
    }

    private drawHeatFlow(tempDiff: number, heatFlowRate: number): void {
        const g = this.arrowGraphics;
        g.clear();

        if (tempDiff <= 5) return;

        const startX = this.width * 0.25 + 55;
        const endX = this.width * 0.75 - 55;
        const y = this.centerY;

        // Pulsing arrow based on heat flow
        const pulseAlpha = 0.3 + Math.sin(this.time * 5) * 0.15 + heatFlowRate * 0.3;
        const arrowWidth = 2 + heatFlowRate * 3;

        // Gradient-like arrow with multiple lines
        for (let i = 0; i < 3; i++) {
            const offsetY = (i - 1) * 8;
            const alpha = pulseAlpha * (1 - Math.abs(i - 1) * 0.3);

            g.moveTo(startX, y + offsetY);
            g.lineTo(endX - 20, y + offsetY);
            g.stroke({ color: 0xff6b6b, width: arrowWidth - i * 0.5, alpha });
        }

        // Arrow head
        const headSize = 12 + heatFlowRate * 8;
        g.moveTo(endX, y);
        g.lineTo(endX - headSize, y - headSize * 0.7);
        g.lineTo(endX - headSize * 0.7, y);
        g.lineTo(endX - headSize, y + headSize * 0.7);
        g.closePath();
        g.fill({ color: 0xff6b6b, alpha: pulseAlpha + 0.2 });

        // Heat wave effect
        const waveX = startX + ((this.time * 80) % (endX - startX - 30));
        if (waveX < endX - 30) {
            g.circle(waveX, y, 6 + heatFlowRate * 4);
            g.fill({ color: 0xffaa00, alpha: 0.5 });
        }
    }

    private drawParticles(): void {
        const g = this.particleGraphics;
        g.clear();

        this.heatParticles.forEach((p) => {
            const opacity = Math.sin(p.progress * Math.PI);
            const size = p.size * (1 - p.progress * 0.3);

            // Glow
            g.circle(p.x, p.y, size * 1.5);
            g.fill({ color: 0xff8844, alpha: opacity * 0.3 });

            // Core
            g.circle(p.x, p.y, size);
            g.fill({ color: 0xff6b6b, alpha: opacity * 0.8 });

            // Bright center
            g.circle(p.x, p.y, size * 0.4);
            g.fill({ color: 0xffcc00, alpha: opacity });
        });
    }

    private drawTemperatureIndicators(Th: number, Tc: number, m: number, c: number): void {
        const g = this.tempGraphics;
        g.clear();

        // Hot side temperature bar
        const hotBarX = this.width * 0.25 - 30;
        const hotBarY = this.centerY + 60;
        const barWidth = 60;
        const barHeight = 8;

        g.roundRect(hotBarX, hotBarY, barWidth, barHeight, 3);
        g.fill({ color: 0x333344, alpha: 0.6 });

        const hotFill = Math.min(1, Th / 150);
        g.roundRect(hotBarX, hotBarY, barWidth * hotFill, barHeight, 3);
        g.fill({ color: 0xff4757, alpha: 0.8 });

        // Cold side temperature bar
        const coldBarX = this.width * 0.75 - 30;
        const coldBarY = this.centerY + 60;

        g.roundRect(coldBarX, coldBarY, barWidth, barHeight, 3);
        g.fill({ color: 0x333344, alpha: 0.6 });

        const coldFill = Math.min(1, Tc / 150);
        g.roundRect(coldBarX, coldBarY, barWidth * coldFill, barHeight, 3);
        g.fill({ color: 0x4ecdc4, alpha: 0.8 });

        // Heat transfer indicator (Q = mcΔT)
        const Q = m * c * Math.abs(Th - Tc);
        const qBarX = this.centerX - 40;
        const qBarY = this.centerY + 70;

        g.roundRect(qBarX, qBarY, 80, 10, 4);
        g.fill({ color: 0x1a1a2e, alpha: 0.8 });

        const qFill = Math.min(1, Q / 500);
        g.roundRect(qBarX, qBarY, 80 * qFill, 10, 4);
        g.fill({ color: 0xffaa00, alpha: 0.7 + Math.sin(this.time * 4) * 0.2 });
    }
}
