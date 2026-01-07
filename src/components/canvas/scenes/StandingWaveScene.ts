import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

export class StandingWaveScene extends BaseScene {
    declare private stringGraphics: Graphics;
    declare private nodeGraphics: Graphics;
    declare private endBlobs: Blob[];
    declare private time: number;

    protected setup(): void {
        this.time = 0;
        this.endBlobs = [];

        this.stringGraphics = new Graphics();
        this.container.addChild(this.stringGraphics);

        this.nodeGraphics = new Graphics();
        this.container.addChild(this.nodeGraphics);

        // Fixed end points (blobs)
        const leftBlob = new Blob({
            size: 25,
            color: 0x666666,
            shape: 'square',
            expression: 'neutral',
        });
        leftBlob.setPosition(50, this.centerY);
        this.container.addChild(leftBlob);
        this.endBlobs.push(leftBlob);

        const rightBlob = new Blob({
            size: 25,
            color: 0x666666,
            shape: 'square',
            expression: 'neutral',
        });
        rightBlob.setPosition(this.width - 50, this.centerY);
        this.container.addChild(rightBlob);
        this.endBlobs.push(rightBlob);
    }

    protected onVariablesChange(): void {
        // Update string length visual
        const L = this.variables['L'] || 1;
        const normalizedL = (L - 0.5) / 1.5; // 0 to 1

        // Adjust end positions based on length
        const margin = 50 + (1 - normalizedL) * 40;
        this.endBlobs[0].setPosition(margin, this.centerY);
        this.endBlobs[1].setPosition(this.width - margin, this.centerY);
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.04;

        const L = this.variables['L'] || 1;
        const n = Math.round(this.variables['n'] || 1);

        // Update end blobs
        this.endBlobs.forEach((blob) => {
            blob.updateOptions({ wobblePhase: this.time });
        });

        this.drawString(L, n);
        this.drawNodes(L, n);
        this.drawHarmonicIndicator(n);
    }

    private drawString(L: number, n: number): void {
        const g = this.stringGraphics;
        g.clear();

        const normalizedL = (L - 0.5) / 1.5;
        const margin = 50 + (1 - normalizedL) * 40;
        const startX = margin;
        const endX = this.width - margin;
        const stringLength = endX - startX;

        // String vibration parameters
        const amplitude = 50;
        const frequency = 2 + n * 0.5; // Higher harmonics vibrate faster
        const wavelength = stringLength / n;

        // Draw multiple frames for motion blur effect
        for (let frame = 0; frame < 3; frame++) {
            const timeOffset = frame * 0.05;
            const alpha = 0.3 - frame * 0.08;

            g.moveTo(startX, this.centerY);

            for (let x = startX; x <= endX; x += 2) {
                const normalizedX = (x - startX) / stringLength;
                // Standing wave: sin(kx) * cos(ωt)
                const spatialTerm = Math.sin(normalizedX * n * Math.PI);
                const temporalTerm = Math.cos((this.time - timeOffset) * frequency * Math.PI);
                const y = this.centerY + spatialTerm * temporalTerm * amplitude;

                g.lineTo(x, y);
            }

            g.stroke({ color: 0x4ecdc4, width: 4 - frame, alpha });
        }

        // Main string (current position)
        g.moveTo(startX, this.centerY);

        for (let x = startX; x <= endX; x += 2) {
            const normalizedX = (x - startX) / stringLength;
            const spatialTerm = Math.sin(normalizedX * n * Math.PI);
            const temporalTerm = Math.cos(this.time * frequency * Math.PI);
            const y = this.centerY + spatialTerm * temporalTerm * amplitude;

            g.lineTo(x, y);
        }

        g.stroke({ color: 0x4ecdc4, width: 4, alpha: 0.9 });

        // Baseline (equilibrium position)
        g.moveTo(startX, this.centerY);
        g.lineTo(endX, this.centerY);
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
    }

    private drawNodes(L: number, n: number): void {
        const g = this.nodeGraphics;
        g.clear();

        const normalizedL = (L - 0.5) / 1.5;
        const margin = 50 + (1 - normalizedL) * 40;
        const startX = margin;
        const endX = this.width - margin;
        const stringLength = endX - startX;

        const frequency = 2 + n * 0.5;
        const temporalTerm = Math.cos(this.time * frequency * Math.PI);
        const amplitude = 50;

        // Draw nodes (fixed points) and antinodes (maximum amplitude points)
        for (let i = 0; i <= n; i++) {
            const nodeX = startX + (i / n) * stringLength;

            // Node marker
            g.circle(nodeX, this.centerY, 6);
            g.fill({ color: 0xff6b6b, alpha: 0.8 });

            // Node label: "N"
            g.circle(nodeX, this.centerY + 35, 10);
            g.fill({ color: 0xff6b6b, alpha: 0.5 });
        }

        // Antinodes (between nodes)
        for (let i = 0; i < n; i++) {
            const antinodeX = startX + ((i + 0.5) / n) * stringLength;
            const antinodeY = this.centerY + temporalTerm * amplitude;

            // Antinode current position
            g.circle(antinodeX, antinodeY, 8);
            g.fill({ color: 0xffd700, alpha: 0.7 });

            // Antinode range indicator
            g.moveTo(antinodeX, this.centerY - amplitude);
            g.lineTo(antinodeX, this.centerY + amplitude);
            g.stroke({ color: 0xffd700, width: 1, alpha: 0.3 });

            // Antinode label: "A"
            g.circle(antinodeX, this.centerY + 50, 10);
            g.fill({ color: 0xffd700, alpha: 0.5 });
        }

        // Wavelength indicator
        if (n >= 1) {
            const wavelength = stringLength / n;
            const indicatorY = this.centerY - 80;

            // Show one wavelength
            const waveStartX = startX;
            const waveEndX = startX + wavelength;

            g.moveTo(waveStartX, indicatorY);
            g.lineTo(waveEndX, indicatorY);
            g.stroke({ color: 0x87ceeb, width: 2, alpha: 0.7 });

            // Arrow heads
            g.moveTo(waveStartX, indicatorY);
            g.lineTo(waveStartX + 8, indicatorY - 5);
            g.moveTo(waveStartX, indicatorY);
            g.lineTo(waveStartX + 8, indicatorY + 5);
            g.stroke({ color: 0x87ceeb, width: 2, alpha: 0.7 });

            g.moveTo(waveEndX, indicatorY);
            g.lineTo(waveEndX - 8, indicatorY - 5);
            g.moveTo(waveEndX, indicatorY);
            g.lineTo(waveEndX - 8, indicatorY + 5);
            g.stroke({ color: 0x87ceeb, width: 2, alpha: 0.7 });

            // λ label
            g.circle((waveStartX + waveEndX) / 2, indicatorY - 15, 12);
            g.fill({ color: 0x87ceeb, alpha: 0.5 });
        }
    }

    private drawHarmonicIndicator(n: number): void {
        const g = this.nodeGraphics;

        // Harmonic number display at bottom
        const indicatorX = this.centerX;
        const indicatorY = this.height - 35;

        // Background
        g.roundRect(indicatorX - 50, indicatorY - 8, 100, 22, 8);
        g.fill({ color: 0x222222, alpha: 0.7 });

        // Harmonic dots
        for (let i = 1; i <= 5; i++) {
            const dotX = indicatorX - 40 + (i - 1) * 20;
            const isActive = i <= n;
            g.circle(dotX, indicatorY + 3, 6);
            g.fill({ color: isActive ? 0x4ecdc4 : 0x444444, alpha: isActive ? 0.9 : 0.5 });
        }
    }
}
