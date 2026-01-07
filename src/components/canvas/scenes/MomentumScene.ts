import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobShape } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

type Phase = 'approach' | 'collision' | 'separate' | 'reset';

export class MomentumScene extends BaseScene {
    declare private blob1: Blob;
    declare private blob2: Blob;
    declare private trackGraphics: Graphics;
    declare private impactGraphics: Graphics;

    declare private phase: Phase;
    declare private blob1X: number;
    declare private blob2X: number;
    declare private blob1V: number;
    declare private blob2V: number;
    declare private mass1: number;
    declare private mass2: number;
    declare private time: number;
    declare private impactTimer: number;
    declare private groundY: number;

    protected setup(): void {
        this.phase = 'approach';
        this.time = 0;
        this.impactTimer = 0;
        this.groundY = this.height - 80;

        this.mass1 = 10;
        this.mass2 = 10;

        // Initial positions
        this.blob1X = 80;
        this.blob2X = this.width - 120;
        this.blob1V = 3;
        this.blob2V = 0;

        // Graphics layers
        this.trackGraphics = new Graphics();
        this.container.addChild(this.trackGraphics);

        this.impactGraphics = new Graphics();
        this.container.addChild(this.impactGraphics);

        // Blob 1 (moving - 공격자)
        this.blob1 = new Blob({
            size: 50,
            color: pixiColors.mass,
            shape: 'circle',
            expression: 'excited',
        });
        this.container.addChild(this.blob1);

        // Blob 2 (stationary - 피해자)
        this.blob2 = new Blob({
            size: 50,
            color: pixiColors.velocity,
            shape: 'square',
            expression: 'happy',
        });
        this.container.addChild(this.blob2);
    }

    protected onVariablesChange(): void {
        const m = this.variables['m'] || 10;
        const v = this.variables['v'] || 5;

        this.mass1 = m;
        this.mass2 = 15; // Fixed mass for blob2

        this.blob1.updateOptions({ size: 35 + m * 0.8 });
        this.blob2.updateOptions({ size: 35 + this.mass2 * 0.8 });

        // Reset with new velocity
        if (this.phase === 'reset' || this.phase === 'approach') {
            this.blob1V = v * 0.6;
        }
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.02;

        this.updatePhysics(delta);
        this.updateBlobs();
        this.drawTrack();
        this.drawImpact(delta);
    }

    private updatePhysics(delta: number): void {
        const friction = 0.998;
        const blob1Size = 35 + this.mass1 * 0.8;
        const blob2Size = 35 + this.mass2 * 0.8;
        const collisionDist = (blob1Size + blob2Size) / 2;

        switch (this.phase) {
            case 'approach':
                this.blob1X += this.blob1V * delta * 2;
                this.blob2X += this.blob2V * delta * 2;

                // Check collision
                if (this.blob1X + collisionDist / 2 >= this.blob2X - collisionDist / 2) {
                    this.phase = 'collision';
                    this.impactTimer = 1;

                    // Elastic collision formula
                    const m1 = this.mass1;
                    const m2 = this.mass2;
                    const v1 = this.blob1V;
                    const v2 = this.blob2V;

                    // Conservation of momentum + kinetic energy
                    this.blob1V = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
                    this.blob2V = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
                }
                break;

            case 'collision':
                this.impactTimer -= 0.1 * delta;
                if (this.impactTimer <= 0) {
                    this.phase = 'separate';
                }
                break;

            case 'separate':
                this.blob1X += this.blob1V * delta * 2;
                this.blob2X += this.blob2V * delta * 2;
                this.blob1V *= friction;
                this.blob2V *= friction;

                // Check boundaries
                if (this.blob2X > this.width - 50 || this.blob1X < 50 ||
                    (Math.abs(this.blob1V) < 0.1 && Math.abs(this.blob2V) < 0.1)) {
                    this.phase = 'reset';
                }
                break;

            case 'reset':
                // Smoothly reset positions
                this.blob1X += (80 - this.blob1X) * 0.02 * delta;
                this.blob2X += (this.width - 120 - this.blob2X) * 0.02 * delta;

                if (Math.abs(this.blob1X - 80) < 5 && Math.abs(this.blob2X - (this.width - 120)) < 5) {
                    this.blob1X = 80;
                    this.blob2X = this.width - 120;
                    this.blob1V = (this.variables['v'] || 5) * 0.6;
                    this.blob2V = 0;
                    this.phase = 'approach';
                }
                break;
        }
    }

    private updateBlobs(): void {
        const speed1 = Math.abs(this.blob1V);
        const speed2 = Math.abs(this.blob2V);

        // Blob 1
        let expr1: 'happy' | 'excited' | 'surprised' | 'worried' = 'happy';
        if (this.phase === 'collision') {
            expr1 = 'surprised';
        } else if (speed1 > 2) {
            expr1 = 'excited';
        } else if (this.phase === 'reset') {
            expr1 = 'happy';
        }

        const stretch1X = 1 + speed1 * 0.04;
        const stretch1Y = 1 - speed1 * 0.02;

        this.blob1.setPosition(this.blob1X, this.groundY - 25);
        this.blob1.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: stretch1X,
            scaleY: stretch1Y,
            showSpeedLines: speed1 > 1.5,
            speedDirection: this.blob1V > 0 ? Math.PI : 0,
            expression: expr1,
        });

        // Blob 2
        let expr2: 'happy' | 'excited' | 'surprised' | 'worried' = 'happy';
        if (this.phase === 'collision') {
            expr2 = 'surprised';
        } else if (speed2 > 2) {
            expr2 = 'excited';
        } else if (this.phase === 'approach' && this.blob1X > this.width * 0.4) {
            expr2 = 'worried';
        }

        const stretch2X = 1 + speed2 * 0.04;
        const stretch2Y = 1 - speed2 * 0.02;

        this.blob2.setPosition(this.blob2X, this.groundY - 25);
        this.blob2.updateOptions({
            wobblePhase: this.time * 2.5,
            scaleX: stretch2X,
            scaleY: stretch2Y,
            showSpeedLines: speed2 > 1.5,
            speedDirection: this.blob2V > 0 ? Math.PI : 0,
            expression: expr2,
        });
    }

    private drawTrack(): void {
        const g = this.trackGraphics;
        g.clear();

        // Ground
        g.rect(30, this.groundY, this.width - 60, 15);
        g.fill({ color: 0x4a4a4a });
        g.stroke({ color: 0x666666, width: 2 });

        // Center line
        g.moveTo(this.centerX, this.groundY - 5);
        g.lineTo(this.centerX, this.groundY + 20);
        g.stroke({ color: 0x666666, width: 2, alpha: 0.5 });
    }

    private drawImpact(delta: number): void {
        const g = this.impactGraphics;
        g.clear();

        if (this.impactTimer > 0) {
            const impactX = (this.blob1X + this.blob2X) / 2;
            const impactY = this.groundY - 25;
            const radius = (1 - this.impactTimer) * 60 + 20;

            // Impact ring
            g.circle(impactX, impactY, radius);
            g.stroke({ color: 0xffffff, width: 3, alpha: this.impactTimer * 0.8 });

            // Spark lines
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const innerR = radius * 0.8;
                const outerR = radius * 1.3;
                g.moveTo(
                    impactX + Math.cos(angle) * innerR,
                    impactY + Math.sin(angle) * innerR
                );
                g.lineTo(
                    impactX + Math.cos(angle) * outerR,
                    impactY + Math.sin(angle) * outerR
                );
            }
            g.stroke({ color: 0xffff00, width: 2, alpha: this.impactTimer });
        }
    }
}
