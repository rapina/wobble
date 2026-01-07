import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

interface SoundPulse {
    x: number;
    startX: number;
    speed: number;
    active: boolean;
}

export class SoundSpeedScene extends BaseScene {
    declare private speakerBlob: Blob;
    declare private receiverBlob: Blob;
    declare private waveGraphics: Graphics;
    declare private uiGraphics: Graphics;
    declare private pulse: SoundPulse;
    declare private time: number;
    declare private pulseInterval: number;
    declare private receiverReaction: number;

    protected setup(): void {
        this.time = 0;
        this.pulseInterval = 0;
        this.receiverReaction = 0;

        this.waveGraphics = new Graphics();
        this.container.addChild(this.waveGraphics);

        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        // Speaker/sound source (circle)
        this.speakerBlob = new Blob({
            size: 45,
            color: 0x9b59b6,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.3,
            glowColor: 0x9b59b6,
        });
        this.speakerBlob.setPosition(60, this.centerY);
        this.container.addChild(this.speakerBlob);

        // Receiver (square - different from speaker)
        this.receiverBlob = new Blob({
            size: 40,
            color: 0x3498db,
            shape: 'square',
            expression: 'sleepy',
        });
        this.receiverBlob.setPosition(this.width - 60, this.centerY);
        this.container.addChild(this.receiverBlob);

        // Initialize pulse
        this.pulse = {
            x: 60,
            startX: 60,
            speed: 0,
            active: false,
        };
    }

    protected onVariablesChange(): void {
        // Reset pulse on variable change
        this.launchPulse();
    }

    private launchPulse(): void {
        const T = this.variables['T'] || 20;
        const v = 331 + 0.6 * T;

        this.pulse = {
            x: 85,
            startX: 85,
            speed: v,
            active: true,
        };

        // Speaker reaction
        this.speakerBlob.updateOptions({
            expression: 'surprised',
            scaleX: 1.2,
            scaleY: 0.9,
        });
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        const T = this.variables['T'] || 20;
        const v = 331 + 0.6 * T;

        // Auto-launch pulse periodically
        this.pulseInterval += delta * 0.02;
        if (this.pulseInterval > 2.5) {
            this.launchPulse();
            this.pulseInterval = 0;
        }

        const receiverX = this.width - 60;
        const travelDistance = receiverX - 85;

        // Update pulse position
        if (this.pulse.active) {
            // Speed scaled for visualization (higher speed = faster movement)
            const visualSpeed = (v / 343) * 3; // Normalized to 20°C speed
            this.pulse.x += visualSpeed * delta;

            // Check if pulse reached receiver
            if (this.pulse.x >= receiverX - 20) {
                this.pulse.active = false;
                this.receiverReaction = 1;

                // Receiver reacts
                this.receiverBlob.updateOptions({
                    expression: 'surprised',
                    scaleX: 1.15,
                    scaleY: 0.9,
                });
            }
        }

        // Fade receiver reaction
        if (this.receiverReaction > 0) {
            this.receiverReaction -= delta * 0.03;
            if (this.receiverReaction <= 0) {
                this.receiverReaction = 0;
                this.receiverBlob.updateOptions({
                    expression: 'happy',
                    scaleX: 1,
                    scaleY: 1,
                });
            }
        }

        // Speaker animation
        const speakerScale = this.pulse.active && this.pulse.x < 120 ? 1.1 : 1;
        this.speakerBlob.updateOptions({
            wobblePhase: this.time * 4,
            scaleX: speakerScale + Math.sin(this.time * 8) * 0.05,
            expression: this.pulse.active && this.pulse.x < 120 ? 'effort' : 'happy',
        });

        // Receiver wobble
        this.receiverBlob.updateOptions({
            wobblePhase: this.time * 2,
        });

        // Temperature-based background color hint
        this.drawAirMolecules(T);
        this.drawPulse(T, v);
        this.drawSpeedMeter(v, T);
        this.drawTemperatureBar(T);
    }

    private drawAirMolecules(T: number): void {
        const g = this.waveGraphics;
        g.clear();

        // Subtle temperature gradient in background
        const normalizedT = (T + 40) / 90; // -40 to 50 -> 0 to 1

        // Air molecules visualization (dots that move faster at higher T)
        const numMolecules = 20;
        for (let i = 0; i < numMolecules; i++) {
            const baseX = 100 + (i % 10) * ((this.width - 160) / 10);
            const baseY = 40 + Math.floor(i / 10) * (this.height - 80);
            const offset = Math.sin(this.time * (2 + normalizedT * 3) + i) * (5 + normalizedT * 10);

            g.circle(baseX + offset, baseY + Math.cos(this.time * 2 + i) * 3, 2);
            g.fill({ color: 0xffffff, alpha: 0.1 + normalizedT * 0.1 });
        }
    }

    private drawPulse(T: number, v: number): void {
        const g = this.waveGraphics;

        // Color based on temperature/speed
        let color: number;
        if (T < 0) {
            color = 0x3498db; // Cold - blue, slower
        } else if (T < 30) {
            color = 0x2ecc71; // Normal - green
        } else {
            color = 0xe74c3c; // Hot - red, faster
        }

        if (this.pulse.active) {
            const pulseX = this.pulse.x;

            // Main pulse wave (vertical line that travels)
            for (let i = 0; i < 3; i++) {
                const waveX = pulseX - i * 15;
                const alpha = 1 - i * 0.3;
                const height = 60 - i * 15;

                if (waveX > 85) {
                    g.moveTo(waveX, this.centerY - height);
                    g.lineTo(waveX, this.centerY + height);
                    g.stroke({ color, width: 4 - i, alpha: alpha * 0.8 });
                }
            }

            // Compression waves (semicircles)
            for (let i = 0; i < 2; i++) {
                const waveX = pulseX - i * 25 - 10;
                if (waveX > 85) {
                    g.arc(waveX, this.centerY, 20 + i * 10, -Math.PI / 2, Math.PI / 2);
                    g.stroke({ color, width: 2, alpha: 0.4 - i * 0.15 });
                }
            }

            // Speed trail (shows how fast it's going)
            const trailLength = Math.min((v - 300) * 0.5, 60);
            g.moveTo(pulseX - 20, this.centerY);
            g.lineTo(pulseX - 20 - trailLength, this.centerY);
            g.stroke({ color, width: 3, alpha: 0.3 });
        }

        // Connection line between speaker and receiver
        g.moveTo(85, this.centerY);
        g.lineTo(this.width - 85, this.centerY);
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.15 });

        // Distance markers
        const distance = this.width - 170;
        for (let i = 0; i <= 4; i++) {
            const x = 85 + (distance / 4) * i;
            g.moveTo(x, this.centerY + 25);
            g.lineTo(x, this.centerY + 35);
            g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        }
    }

    private drawSpeedMeter(v: number, T: number): void {
        const g = this.uiGraphics;
        g.clear();

        // Speed meter at bottom
        const meterX = this.centerX - 80;
        const meterY = this.height - 45;
        const meterWidth = 160;
        const meterHeight = 20;

        // Background
        g.roundRect(meterX, meterY, meterWidth, meterHeight, 6);
        g.fill({ color: 0x222222, alpha: 0.7 });

        // Speed fill (300-380 m/s range mapped to bar)
        const minV = 300;
        const maxV = 380;
        const fillRatio = Math.min(Math.max((v - minV) / (maxV - minV), 0), 1);
        const fillWidth = fillRatio * meterWidth;

        // Gradient color based on speed
        let color: number;
        if (T < 0) {
            color = 0x3498db;
        } else if (T < 30) {
            color = 0x2ecc71;
        } else {
            color = 0xe74c3c;
        }

        g.roundRect(meterX, meterY, fillWidth, meterHeight, 6);
        g.fill({ color, alpha: 0.8 });

        // Reference mark at 343 m/s (20°C)
        const refX = meterX + ((343 - minV) / (maxV - minV)) * meterWidth;
        g.moveTo(refX, meterY - 5);
        g.lineTo(refX, meterY + meterHeight + 5);
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

        // Current speed indicator arrow
        const currentX = meterX + fillWidth;
        g.moveTo(currentX, meterY - 8);
        g.lineTo(currentX - 6, meterY - 15);
        g.lineTo(currentX + 6, meterY - 15);
        g.closePath();
        g.fill({ color: 0xffffff, alpha: 0.9 });

        // Speed value display
        const speedText = Math.round(v);
        const digitWidth = 12;
        const digits = speedText.toString().split('');
        const startX = this.centerX - (digits.length * digitWidth) / 2;

        digits.forEach((digit, i) => {
            g.roundRect(startX + i * digitWidth - 2, meterY - 35, digitWidth - 2, 18, 3);
            g.fill({ color, alpha: 0.6 });
        });

        // "m/s" unit indicator
        g.roundRect(startX + digits.length * digitWidth + 5, meterY - 35, 28, 18, 3);
        g.fill({ color: 0x444444, alpha: 0.6 });
    }

    private drawTemperatureBar(T: number): void {
        const g = this.uiGraphics;

        // Temperature bar on right side
        const barX = this.width - 35;
        const barHeight = 100;
        const barY = this.centerY - barHeight / 2;
        const barWidth = 14;

        // Background
        g.roundRect(barX, barY, barWidth, barHeight, 5);
        g.fill({ color: 0x222222, alpha: 0.6 });

        // Temperature fill (-40 to 50°C)
        const normalizedT = (T + 40) / 90;
        const fillHeight = barHeight * normalizedT;

        // Color gradient
        const r = Math.floor(normalizedT * 231);
        const b = Math.floor((1 - normalizedT) * 219);
        const color = (r << 16) | (70 << 8) | b;

        g.roundRect(barX + 2, barY + barHeight - fillHeight, barWidth - 4, fillHeight, 4);
        g.fill({ color, alpha: 0.85 });

        // Temperature markers
        // Hot (50°C)
        g.circle(barX - 8, barY + 5, 4);
        g.fill({ color: 0xe74c3c, alpha: 0.6 });

        // Normal (20°C)
        const normalY = barY + barHeight * (1 - (20 + 40) / 90);
        g.moveTo(barX - 5, normalY);
        g.lineTo(barX, normalY);
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

        // Cold (-40°C)
        g.circle(barX - 8, barY + barHeight - 5, 4);
        g.fill({ color: 0x3498db, alpha: 0.6 });

        // Current temperature indicator
        const currentY = barY + barHeight * (1 - normalizedT);
        g.moveTo(barX - 12, currentY);
        g.lineTo(barX, currentY - 5);
        g.lineTo(barX, currentY + 5);
        g.closePath();
        g.fill({ color: 0xffffff, alpha: 0.9 });
    }
}
