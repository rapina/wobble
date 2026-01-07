import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface WaveCircle {
    x: number;
    radius: number;
    opacity: number;
}

export class DopplerScene extends BaseScene {
    declare private sourceBlob: Blob;
    declare private observerBlob: Blob;
    declare private waveGraphics: Graphics;
    declare private waves: WaveCircle[];
    declare private time: number;
    declare private sourceX: number;
    declare private lastWaveTime: number;

    protected setup(): void {
        this.waves = [];
        this.time = 0;
        this.sourceX = 100;
        this.lastWaveTime = 0;
        this.waveGraphics = new Graphics();
        this.container.addChild(this.waveGraphics);

        this.sourceBlob = new Blob({
            size: 50,
            color: 0xff6b6b,
            shape: 'circle',
            expression: 'happy',
        });
        this.container.addChild(this.sourceBlob);

        this.observerBlob = new Blob({
            size: 40,
            color: 0x4ecdc4,
            shape: 'square',
            expression: 'happy',
        });
        this.observerBlob.setPosition(this.width - 80, this.centerY);
        this.container.addChild(this.observerBlob);

        this.sourceX = 100;
    }

    protected onVariablesChange(): void {
        // Wave parameters from variables
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        const vs = this.variables['vs'] || 10;
        const f = this.variables['f'] || 440;

        // Move source
        this.sourceX += vs * 0.1 * delta;
        if (this.sourceX > this.width - 100) {
            this.sourceX = 100;
            this.waves = [];
        }

        // Emit waves periodically
        const waveInterval = 1 / (f * 0.01);
        if (this.time - this.lastWaveTime > waveInterval) {
            this.waves.push({
                x: this.sourceX,
                radius: 0,
                opacity: 1,
            });
            this.lastWaveTime = this.time;
        }

        // Update waves
        const waveSpeed = 5;
        this.waves.forEach((wave) => {
            wave.radius += waveSpeed * delta;
            wave.opacity = Math.max(0, 1 - wave.radius / 200);
        });
        this.waves = this.waves.filter((w) => w.opacity > 0);

        this.sourceBlob.setPosition(this.sourceX, this.centerY);
        this.sourceBlob.updateOptions({
            wobblePhase: this.time * 2,
            showSpeedLines: vs > 5,
            speedDirection: 0,
        });

        this.observerBlob.updateOptions({ wobblePhase: this.time });

        this.drawWaves();
    }

    private drawWaves(): void {
        const g = this.waveGraphics;
        g.clear();

        this.waves.forEach((wave) => {
            g.circle(wave.x, this.centerY, wave.radius);
            g.stroke({ color: 0xff6b6b, width: 2, alpha: wave.opacity });
        });
    }
}
