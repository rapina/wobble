import { Ticker, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression } from '../Blob';
import { pixiColors, lerp, clamp } from '../../../utils/pixiHelpers';

type Phase = 'approach' | 'collision' | 'separate' | 'pause';

interface CollisionParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

export class CollisionScene extends BaseScene {
    declare private blob1: Blob;
    declare private blob2: Blob;
    declare private uiGraphics: Graphics;
    declare private particleGraphics: Graphics;

    declare private phase: Phase;
    declare private phaseTime: number;
    declare private blob1X: number;
    declare private blob2X: number;
    declare private blob1V: number;
    declare private blob2V: number;
    declare private initialV1: number;
    declare private finalV1: number;
    declare private finalV2: number;
    declare private particles: CollisionParticle[];

    declare private statusLabel: Text;

    // Cached values
    declare private m1: number;
    declare private m2: number;
    declare private v1: number;
    declare private e: number;

    protected setup(): void {
        this.phase = 'approach';
        this.phaseTime = 0;
        this.particles = [];

        this.m1 = 10;
        this.m2 = 5;
        this.v1 = 5;
        this.e = 0.8;

        // Graphics
        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        // Blob 1 (left, moving right)
        this.blob1 = new Blob({
            size: 60,
            color: pixiColors.mass,
            shape: 'circle',
            expression: 'happy',
        });
        this.container.addChild(this.blob1);

        // Blob 2 (right, stationary)
        this.blob2 = new Blob({
            size: 50,
            color: pixiColors.velocity,
            shape: 'circle',
            expression: 'neutral',
        });
        this.container.addChild(this.blob2);

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            fontWeight: 'bold',
            fill: 0xffffff,
        });
        this.statusLabel = new Text({ text: '접근 중', style: labelStyle });
        this.statusLabel.position.set(20, 20);
        this.container.addChild(this.statusLabel);

        this.resetSimulation();
    }

    private resetSimulation(): void {
        this.blob1X = 70;
        this.blob2X = this.width - 100;

        // Blob 1 moves right with v1, Blob 2 is stationary
        this.initialV1 = this.v1 * 0.8;
        this.blob1V = this.initialV1;
        this.blob2V = 0;

        // Calculate post-collision velocities
        // For collision with stationary object:
        // v1' = (m1 - e*m2)/(m1+m2) * v1
        // v2' = (1+e)*m1/(m1+m2) * v1
        this.finalV1 = ((this.m1 - this.e * this.m2) / (this.m1 + this.m2)) * this.initialV1;
        this.finalV2 = ((1 + this.e) * this.m1 / (this.m1 + this.m2)) * this.initialV1;

        this.phase = 'approach';
        this.phaseTime = 0;
    }

    protected onVariablesChange(): void {
        const m1 = this.variables['m₁'] ?? 10;
        const m2 = this.variables['m₂'] ?? 5;
        const v1 = this.variables['v₁'] ?? 5;
        const e = this.variables['e'] ?? 0.8;

        this.m1 = m1;
        this.m2 = m2;
        this.v1 = v1;
        this.e = e;

        // Update blob sizes based on mass
        this.blob1.updateOptions({ size: 35 + m1 * 2.5 });
        this.blob2.updateOptions({ size: 35 + m2 * 2.5 });

        // Reset simulation when variables change
        this.resetSimulation();
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.phaseTime += delta * 0.016;

        const collisionDist = (35 + this.m1 * 2.5) / 2 + (35 + this.m2 * 2.5) / 2 + 10;

        switch (this.phase) {
            case 'approach':
                this.blob1X += this.blob1V * delta;
                this.blob2X += this.blob2V * delta;

                if (this.blob2X - this.blob1X < collisionDist) {
                    this.phase = 'collision';
                    this.phaseTime = 0;

                    // Apply post-collision velocities
                    this.blob1V = this.finalV1;
                    this.blob2V = this.finalV2;

                    // Create collision particles based on impact energy
                    this.createCollisionParticles();
                }
                break;

            case 'collision':
                if (this.phaseTime > 0.25) {
                    this.phase = 'separate';
                    this.phaseTime = 0;
                }
                break;

            case 'separate':
                this.blob1X += this.blob1V * delta;
                this.blob2X += this.blob2V * delta;

                if (this.phaseTime > 2.5 || this.blob2X > this.width + 50) {
                    this.phase = 'pause';
                    this.phaseTime = 0;
                }
                break;

            case 'pause':
                if (this.phaseTime > 1) {
                    this.resetSimulation();
                }
                break;
        }

        // Update particles
        this.updateParticles(delta);

        // Expressions
        let expr1: BlobExpression = 'happy';
        let expr2: BlobExpression = 'neutral';

        if (this.phase === 'collision') {
            expr1 = 'surprised';
            expr2 = 'surprised';
        } else if (this.phase === 'approach') {
            expr1 = 'charge';
            expr2 = 'worried';
        } else if (this.phase === 'separate') {
            expr1 = this.blob1V < 0 ? 'worried' : 'happy';
            expr2 = 'excited';
        }

        // Blob 1
        const squash1 = this.phase === 'collision' ? 0.75 : 1;
        const stretch1 = this.phase === 'collision' ? 1.25 : 1;

        this.blob1.setPosition(this.blob1X, this.centerY);
        this.blob1.updateOptions({
            wobblePhase: this.phaseTime * 4,
            expression: expr1,
            scaleX: stretch1 + Math.abs(this.blob1V) * 0.01,
            scaleY: squash1,
            showSpeedLines: Math.abs(this.blob1V) > 1 && this.phase !== 'collision',
            speedDirection: this.blob1V > 0 ? Math.PI : 0,
            lookDirection: { x: Math.sign(this.blob1V), y: 0 },
        });

        // Blob 2
        const squash2 = this.phase === 'collision' ? 0.75 : 1;
        const stretch2 = this.phase === 'collision' ? 1.25 : 1;

        this.blob2.setPosition(this.blob2X, this.centerY);
        this.blob2.updateOptions({
            wobblePhase: this.phaseTime * 4 + Math.PI,
            expression: expr2,
            scaleX: stretch2 + Math.abs(this.blob2V) * 0.01,
            scaleY: squash2,
            showSpeedLines: Math.abs(this.blob2V) > 1 && this.phase !== 'collision',
            speedDirection: this.blob2V > 0 ? Math.PI : 0,
            lookDirection: { x: this.phase === 'approach' ? -1 : 1, y: 0 },
        });

        // Draw UI
        this.drawUI();
        this.drawParticles();
        this.updateStatus();
    }

    private createCollisionParticles(): void {
        const impactX = (this.blob1X + this.blob2X) / 2;
        const impactEnergy = 0.5 * this.m1 * this.initialV1 * this.initialV1;
        const particleCount = Math.floor(5 + (impactEnergy / 100) * 10);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const speed = 2 + Math.random() * 3 + this.e * 2;
            this.particles.push({
                x: impactX,
                y: this.centerY + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 3 + Math.random() * 3,
            });
        }
    }

    private updateParticles(delta: number): void {
        this.particles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 0.05 * delta;
            p.life -= 0.025 * delta;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    private drawUI(): void {
        const g = this.uiGraphics;
        g.clear();

        const groundY = this.centerY + 70;

        // Ground line
        g.moveTo(40, groundY);
        g.lineTo(this.width - 40, groundY);
        g.stroke({ color: 0x444444, width: 2 });

        // Velocity arrows
        if (this.phase === 'approach' || this.phase === 'separate') {
            // Blob 1 velocity arrow
            if (Math.abs(this.blob1V) > 0.3) {
                this.drawVelocityArrow(g, this.blob1X, this.centerY - 50, this.blob1V, 0xf5b041);
            }

            // Blob 2 velocity arrow
            if (Math.abs(this.blob2V) > 0.3) {
                this.drawVelocityArrow(g, this.blob2X, this.centerY - 50, this.blob2V, 0x5dade2);
            }
        }

        // Restitution coefficient indicator (e)
        const eBarX = this.width - 120;
        const eBarY = this.height - 35;
        const eBarWidth = 80;

        g.roundRect(eBarX, eBarY, eBarWidth, 10, 3);
        g.fill({ color: 0x333344 });

        g.roundRect(eBarX + 1, eBarY + 1, this.e * (eBarWidth - 2), 8, 2);
        g.fill({ color: this.e > 0.9 ? 0x4ecdc4 : this.e > 0.5 ? 0xf5b041 : 0xff6b6b });

        // Mass comparison circles
        const massY = groundY + 30;
        const m1Size = 8 + this.m1 * 0.4;
        const m2Size = 8 + this.m2 * 0.4;

        g.circle(60, massY, m1Size);
        g.fill({ color: pixiColors.mass, alpha: 0.7 });

        g.circle(100, massY, m2Size);
        g.fill({ color: pixiColors.velocity, alpha: 0.7 });
    }

    private drawVelocityArrow(g: Graphics, x: number, y: number, velocity: number, color: number): void {
        const length = clamp(Math.abs(velocity) * 8, 10, 60);
        const dir = Math.sign(velocity);

        const startX = x;
        const endX = x + dir * length;

        // Arrow line
        g.moveTo(startX, y);
        g.lineTo(endX, y);
        g.stroke({ color, width: 3 });

        // Arrow head
        g.moveTo(endX, y);
        g.lineTo(endX - dir * 10, y - 6);
        g.moveTo(endX, y);
        g.lineTo(endX - dir * 10, y + 6);
        g.stroke({ color, width: 3 });
    }

    private drawParticles(): void {
        const g = this.particleGraphics;
        g.clear();

        this.particles.forEach(p => {
            g.circle(p.x, p.y, p.size * p.life);
            g.fill({ color: 0xf7dc6f, alpha: p.life * 0.7 });
        });
    }

    private updateStatus(): void {
        switch (this.phase) {
            case 'approach':
                this.statusLabel.text = '충돌 전';
                this.statusLabel.style.fill = 0xf5b041;
                break;
            case 'collision':
                this.statusLabel.text = '충돌!';
                this.statusLabel.style.fill = 0xff6b6b;
                break;
            case 'separate':
                this.statusLabel.text = '충돌 후';
                this.statusLabel.style.fill = 0x4ecdc4;
                break;
            case 'pause':
                this.statusLabel.text = '대기 중...';
                this.statusLabel.style.fill = 0x888888;
                break;
        }
    }
}
