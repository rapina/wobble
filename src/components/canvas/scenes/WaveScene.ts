import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobShape } from '../Blob';

const SHAPES: BlobShape[] = ['circle', 'square'];

export class WaveScene extends BaseScene {
    declare private blobs: Blob[];
    declare private waveGraphics: Graphics;
    declare private time: number;
    declare private numBlobs: number;
    declare private blobSpacing: number;

    protected setup(): void {
        this.blobs = [];
        this.time = 0;
        this.numBlobs = 12;
        this.waveGraphics = new Graphics();
        this.container.addChild(this.waveGraphics);

        this.blobSpacing = this.width / (this.numBlobs + 1);

        const colors = [0x4ecdc4, 0x45b7d1, 0x96ceb4, 0x88d8b0, 0x7fcdcd];

        for (let i = 0; i < this.numBlobs; i++) {
            const blob = new Blob({
                size: 32,
                color: colors[i % colors.length],
                shape: SHAPES[i % SHAPES.length],
                expression: 'happy',
            });
            blob.setPosition(this.blobSpacing * (i + 1), this.centerY);
            this.container.addChild(blob);
            this.blobs.push(blob);
        }
    }

    protected onVariablesChange(): void {
        // Wave parameters will be applied in animate
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.03;

        const amplitude = (this.variables['A'] || 1) * 60;
        const frequency = this.variables['f'] || 1;
        // λ controls how many waves fit across the screen (1 = one full wave)
        const wavesAcross = this.variables['λ'] || 1;

        const omega = 2 * Math.PI * frequency;
        // Phase per blob: distribute wavesAcross full waves across all blobs
        const phasePerBlob = (2 * Math.PI * wavesAcross) / this.numBlobs;

        this.blobs.forEach((blob, i) => {
            // Each blob has a phase offset based on its position
            const phase = i * phasePerBlob;
            const y = amplitude * Math.sin(phase - omega * this.time);

            const baseX = this.blobSpacing * (i + 1);
            blob.setPosition(baseX, this.centerY + y);

            // Velocity for visual effects
            const velocity = omega * Math.cos(phase - omega * this.time);
            const normalizedVelocity = velocity / omega; // -1 to 1

            // Stretch based on velocity direction
            const stretchY = 1 + normalizedVelocity * 0.3;
            const stretchX = 1 - normalizedVelocity * 0.15;

            // Expression based on position
            let expression: 'happy' | 'excited' | 'surprised' | 'neutral' = 'happy';
            if (y > amplitude * 0.5) {
                expression = 'excited';
            } else if (y < -amplitude * 0.5) {
                expression = 'surprised';
            }

            blob.updateOptions({
                wobblePhase: this.time * 2 + i * 0.3,
                scaleY: stretchY,
                scaleX: stretchX,
                expression,
            });
        });

        this.drawWave(amplitude, omega, phasePerBlob);
    }

    private drawWave(amplitude: number, omega: number, phasePerBlob: number): void {
        const g = this.waveGraphics;
        g.clear();

        // Draw smooth wave curve
        const startX = this.blobSpacing * 0.5;
        const endX = this.width - this.blobSpacing * 0.5;

        g.moveTo(startX, this.centerY);

        for (let x = startX; x <= endX; x += 3) {
            // Convert x position to phase
            const normalizedX = (x - startX) / (endX - startX);
            const phase = normalizedX * this.numBlobs * phasePerBlob;
            const y = amplitude * Math.sin(phase - omega * this.time);
            g.lineTo(x, this.centerY + y);
        }

        g.stroke({ color: 0x4ecdc4, width: 2, alpha: 0.4 });

        // Draw center line
        g.moveTo(20, this.centerY);
        g.lineTo(this.width - 20, this.centerY);
        g.stroke({ color: 0x444444, width: 1, alpha: 0.5 });

        // Draw amplitude markers
        g.moveTo(15, this.centerY - amplitude);
        g.lineTo(25, this.centerY - amplitude);
        g.moveTo(15, this.centerY + amplitude);
        g.lineTo(25, this.centerY + amplitude);
        g.stroke({ color: 0x666666, width: 1 });
    }
}
