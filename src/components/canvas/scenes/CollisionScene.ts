import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob, BlobExpression } from '../Blob';
import { pixiColors } from '../../../utils/pixiHelpers';

interface BallState {
    blob: Blob;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    radius: number;
    hit: boolean;
}

interface CollisionParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

export class CollisionScene extends BaseScene {
    declare private cueBall: BallState;
    declare private targetBalls: BallState[];
    declare private uiGraphics: Graphics;
    declare private particleGraphics: Graphics;
    declare private particles: CollisionParticle[];
    declare private phase: 'ready' | 'moving' | 'settling' | 'pause';
    declare private phaseTime: number;

    // Cached values
    declare private m1: number;
    declare private m2: number;
    declare private v1: number;
    declare private e: number;

    protected setup(): void {
        this.particles = [];
        this.phase = 'ready';
        this.phaseTime = 0;

        this.m1 = 10;
        this.m2 = 5;
        this.v1 = 5;
        this.e = 0.8;

        // Graphics layers
        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        // Create cue ball
        const cueBlobObj = new Blob({
            size: 45,
            color: 0xffffff,
            shape: 'circle',
            expression: 'charge',
        });
        this.container.addChild(cueBlobObj);
        this.cueBall = {
            blob: cueBlobObj,
            x: 60,
            y: this.centerY,
            vx: 0,
            vy: 0,
            mass: this.m1,
            radius: 22,
            hit: false,
        };

        // Create target balls in triangle formation
        this.targetBalls = [];
        const colors = [0xff6b6b, 0x4ecdc4, 0xf7dc6f, 0x9b59b6, 0x3498db, 0xe74c3c];
        const startX = this.width - 120;
        const startY = this.centerY;
        const spacing = 38;

        // Triangle pattern: 1-2-3 formation
        const positions = [
            { row: 0, col: 0 },      // Front
            { row: 1, col: -0.5 },   // Second row
            { row: 1, col: 0.5 },
            { row: 2, col: -1 },     // Third row
            { row: 2, col: 0 },
            { row: 2, col: 1 },
        ];

        positions.forEach((pos, i) => {
            const targetBlob = new Blob({
                size: 40,
                color: colors[i % colors.length],
                shape: 'circle',
                expression: 'happy',
            });
            this.container.addChild(targetBlob);

            this.targetBalls.push({
                blob: targetBlob,
                x: startX - pos.row * spacing * 0.866,
                y: startY + pos.col * spacing,
                vx: 0,
                vy: 0,
                mass: this.m2,
                radius: 20,
                hit: false,
            });
        });

        this.resetSimulation();
    }

    private resetSimulation(): void {
        this.phase = 'ready';
        this.phaseTime = 0;
        this.particles = [];

        // Reset cue ball
        this.cueBall.x = 60;
        this.cueBall.y = this.centerY;
        this.cueBall.vx = this.v1 * 1.5;
        this.cueBall.vy = 0;
        this.cueBall.hit = false;
        this.cueBall.mass = this.m1;
        this.cueBall.radius = 18 + this.m1 * 0.5;

        // Reset target balls in triangle
        const startX = this.width - 120;
        const startY = this.centerY;
        const spacing = 38;

        const positions = [
            { row: 0, col: 0 },
            { row: 1, col: -0.5 },
            { row: 1, col: 0.5 },
            { row: 2, col: -1 },
            { row: 2, col: 0 },
            { row: 2, col: 1 },
        ];

        this.targetBalls.forEach((ball, i) => {
            const pos = positions[i];
            ball.x = startX - pos.row * spacing * 0.866;
            ball.y = startY + pos.col * spacing;
            ball.vx = 0;
            ball.vy = 0;
            ball.hit = false;
            ball.mass = this.m2;
            ball.radius = 16 + this.m2 * 0.4;
        });

        // Start moving after brief pause
        setTimeout(() => {
            if (this.phase === 'ready') {
                this.phase = 'moving';
            }
        }, 500);
    }

    protected onVariablesChange(): void {
        this.m1 = this.variables['m₁'] ?? 10;
        this.m2 = this.variables['m₂'] ?? 5;
        this.v1 = this.variables['v₁'] ?? 5;
        this.e = this.variables['e'] ?? 0.8;

        // Update cue ball size
        this.cueBall.blob.updateOptions({ size: 36 + this.m1 * 1.5 });

        // Update target ball sizes
        this.targetBalls.forEach(ball => {
            ball.blob.updateOptions({ size: 32 + this.m2 * 1.2 });
        });

        this.resetSimulation();
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.phaseTime += delta * 0.016;

        if (this.phase === 'moving' || this.phase === 'settling') {
            // Update cue ball position
            this.cueBall.x += this.cueBall.vx * delta;
            this.cueBall.y += this.cueBall.vy * delta;

            // Apply friction
            this.cueBall.vx *= 0.995;
            this.cueBall.vy *= 0.995;

            // Update target balls
            this.targetBalls.forEach(ball => {
                ball.x += ball.vx * delta;
                ball.y += ball.vy * delta;
                ball.vx *= 0.995;
                ball.vy *= 0.995;
            });

            // Check collisions between cue ball and targets
            this.targetBalls.forEach(target => {
                this.checkCollision(this.cueBall, target);
            });

            // Check collisions between target balls
            for (let i = 0; i < this.targetBalls.length; i++) {
                for (let j = i + 1; j < this.targetBalls.length; j++) {
                    this.checkCollision(this.targetBalls[i], this.targetBalls[j]);
                }
            }

            // Wall bounces
            this.bounceOffWalls(this.cueBall);
            this.targetBalls.forEach(ball => this.bounceOffWalls(ball));

            // Check if all balls have settled
            const allSettled = this.isSettled(this.cueBall) &&
                this.targetBalls.every(b => this.isSettled(b));

            if (allSettled && this.phase === 'moving') {
                this.phase = 'settling';
                this.phaseTime = 0;
            }

            if (this.phase === 'settling' && this.phaseTime > 1.5) {
                this.phase = 'pause';
                this.phaseTime = 0;
            }
        }

        if (this.phase === 'pause' && this.phaseTime > 1) {
            this.resetSimulation();
        }

        // Update particles
        this.updateParticles(delta);

        // Update blob positions and expressions
        this.updateBlobs();

        // Draw
        this.drawTable();
        this.drawParticles();
    }

    private checkCollision(a: BallState, b: BallState): void {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
            // Collision detected
            const nx = dx / dist;
            const ny = dy / dist;

            // Relative velocity
            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const dvn = dvx * nx + dvy * ny;

            // Only if approaching
            if (dvn > 0) {
                // Impulse with restitution
                const impulse = (1 + this.e) * dvn / (1 / a.mass + 1 / b.mass);

                a.vx -= impulse * nx / a.mass;
                a.vy -= impulse * ny / a.mass;
                b.vx += impulse * nx / b.mass;
                b.vy += impulse * ny / b.mass;

                // Separate balls
                const overlap = minDist - dist;
                const totalMass = a.mass + b.mass;
                a.x -= overlap * nx * (b.mass / totalMass);
                a.y -= overlap * ny * (b.mass / totalMass);
                b.x += overlap * nx * (a.mass / totalMass);
                b.y += overlap * ny * (a.mass / totalMass);

                a.hit = true;
                b.hit = true;

                // Create collision particles
                this.createCollisionParticles((a.x + b.x) / 2, (a.y + b.y) / 2, dvn);
            }
        }
    }

    private bounceOffWalls(ball: BallState): void {
        const margin = 30;
        const tableTop = this.centerY - 80;
        const tableBottom = this.centerY + 80;
        const tableLeft = margin;
        const tableRight = this.width - margin;

        if (ball.x - ball.radius < tableLeft) {
            ball.x = tableLeft + ball.radius;
            ball.vx = -ball.vx * this.e;
        }
        if (ball.x + ball.radius > tableRight) {
            ball.x = tableRight - ball.radius;
            ball.vx = -ball.vx * this.e;
        }
        if (ball.y - ball.radius < tableTop) {
            ball.y = tableTop + ball.radius;
            ball.vy = -ball.vy * this.e;
        }
        if (ball.y + ball.radius > tableBottom) {
            ball.y = tableBottom - ball.radius;
            ball.vy = -ball.vy * this.e;
        }
    }

    private isSettled(ball: BallState): boolean {
        return Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1;
    }

    private createCollisionParticles(x: number, y: number, intensity: number): void {
        const count = Math.floor(4 + intensity * 2);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 1.5 + Math.random() * 2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 2 + Math.random() * 2,
            });
        }
    }

    private updateParticles(delta: number): void {
        this.particles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= 0.03 * delta;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    private updateBlobs(): void {
        // Cue ball
        const cueSpeed = Math.sqrt(this.cueBall.vx ** 2 + this.cueBall.vy ** 2);
        let cueExpr: BlobExpression = 'happy';
        if (this.phase === 'ready') cueExpr = 'charge';
        else if (cueSpeed > 2) cueExpr = 'excited';
        else if (this.cueBall.hit) cueExpr = 'surprised';

        this.cueBall.blob.setPosition(this.cueBall.x, this.cueBall.y);
        this.cueBall.blob.updateOptions({
            wobblePhase: this.phaseTime * 4,
            expression: cueExpr,
            scaleX: 1 + cueSpeed * 0.02,
            showSpeedLines: cueSpeed > 3,
            speedDirection: Math.atan2(this.cueBall.vy, this.cueBall.vx) + Math.PI,
        });

        // Target balls
        this.targetBalls.forEach((ball, i) => {
            const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
            let expr: BlobExpression = 'happy';
            if (speed > 2) expr = 'surprised';
            else if (ball.hit && speed < 0.5) expr = 'sleepy';

            ball.blob.setPosition(ball.x, ball.y);
            ball.blob.updateOptions({
                wobblePhase: this.phaseTime * 3 + i,
                expression: expr,
                scaleX: 1 + speed * 0.015,
                showSpeedLines: speed > 2.5,
                speedDirection: Math.atan2(ball.vy, ball.vx) + Math.PI,
            });
        });
    }

    private drawTable(): void {
        const g = this.uiGraphics;
        g.clear();

        const tableTop = this.centerY - 80;
        const tableBottom = this.centerY + 80;
        const tableLeft = 30;
        const tableRight = this.width - 30;

        // Table surface
        g.roundRect(tableLeft, tableTop, tableRight - tableLeft, tableBottom - tableTop, 8);
        g.fill({ color: 0x0d5c0d, alpha: 0.6 });

        // Table border
        g.roundRect(tableLeft, tableTop, tableRight - tableLeft, tableBottom - tableTop, 8);
        g.stroke({ color: 0x8b4513, width: 6, alpha: 0.8 });

        // Inner line
        g.roundRect(tableLeft + 8, tableTop + 8, tableRight - tableLeft - 16, tableBottom - tableTop - 16, 4);
        g.stroke({ color: 0x228b22, width: 1, alpha: 0.5 });

        // Restitution indicator
        const eBarX = 20;
        const eBarY = this.height - 30;
        const eBarWidth = 80;

        g.roundRect(eBarX, eBarY, eBarWidth, 10, 4);
        g.fill({ color: 0x333333, alpha: 0.6 });

        g.roundRect(eBarX, eBarY, this.e * eBarWidth, 10, 4);
        g.fill({ color: this.e > 0.8 ? 0x4ecdc4 : this.e > 0.5 ? 0xf5b041 : 0xff6b6b, alpha: 0.8 });

        // Phase indicator
        const phaseColors: Record<string, number> = {
            ready: 0x888888,
            moving: 0x4ecdc4,
            settling: 0xf5b041,
            pause: 0x666666,
        };
        g.circle(this.width - 25, 25, 8);
        g.fill({ color: phaseColors[this.phase], alpha: 0.8 });
    }

    private drawParticles(): void {
        const g = this.particleGraphics;
        g.clear();

        this.particles.forEach(p => {
            g.circle(p.x, p.y, p.size * p.life);
            g.fill({ color: 0xffffff, alpha: p.life * 0.8 });
        });
    }
}
