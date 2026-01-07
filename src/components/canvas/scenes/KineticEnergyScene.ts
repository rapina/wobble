import { Ticker, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';
import { pixiColors, lerp, clamp } from '../../../utils/pixiHelpers';

interface EnergyParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
}

interface ImpactWave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
}

export class KineticEnergyScene extends BaseScene {
    declare private blob: Blob;
    declare private uiGraphics: Graphics;
    declare private particleGraphics: Graphics;
    declare private glowGraphics: Graphics;
    declare private trailGraphics: Graphics;

    // Animation state
    declare private blobX: number;
    declare private blobY: number;
    declare private velocity: number;
    declare private targetVelocity: number;
    declare private direction: number;
    declare private wobblePhase: number;

    // Particles and effects
    declare private particles: EnergyParticle[];
    declare private impactWaves: ImpactWave[];
    declare private trailPoints: { x: number; y: number; energy: number }[];

    // Current values
    declare private currentMass: number;
    declare private currentSpeed: number;
    declare private currentEnergy: number;
    declare private displayedEnergy: number;

    // Layout
    declare private groundY: number;
    declare private leftBound: number;
    declare private rightBound: number;

    // Labels
    declare private massLabel: Text;
    declare private speedLabel: Text;
    declare private energyLabel: Text;
    declare private formulaLabel: Text;
    declare private vLabel: Text;
    declare private vSquaredLabel: Text;

    // Blur filter for glow
    declare private blurFilter: BlurFilter;

    protected setup(): void {
        // Initialize state
        this.currentMass = 10;
        this.currentSpeed = 5;
        this.currentEnergy = 0.5 * 10 * 25;
        this.displayedEnergy = this.currentEnergy;

        this.groundY = this.height * 0.65;
        this.leftBound = 60;
        this.rightBound = this.width - 60;

        this.blobX = this.centerX;
        this.blobY = this.groundY - 40;
        this.velocity = 0;
        this.targetVelocity = this.currentSpeed * 15;
        this.direction = 1;
        this.wobblePhase = 0;

        this.particles = [];
        this.impactWaves = [];
        this.trailPoints = [];

        // Graphics layers
        this.glowGraphics = new Graphics();
        this.blurFilter = new BlurFilter({ strength: 15 });
        this.glowGraphics.filters = [this.blurFilter];
        this.container.addChild(this.glowGraphics);

        this.trailGraphics = new Graphics();
        this.container.addChild(this.trailGraphics);

        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        this.particleGraphics = new Graphics();
        this.container.addChild(this.particleGraphics);

        // Blob
        this.blob = new Blob({
            size: 50,
            color: pixiColors.energy,
            shape: 'circle',
            expression: 'happy',
            glowColor: 0xffaa00,
            glowIntensity: 0.3,
        });
        this.container.addChild(this.blob);

        // Text labels
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        });

        const valueStyle = new TextStyle({
            fontFamily: 'monospace',
            fontSize: 12,
            fill: 0xaaaaaa,
        });

        this.massLabel = new Text({ text: 'm = 10 kg', style: valueStyle });
        this.speedLabel = new Text({ text: 'v = 5 m/s', style: valueStyle });
        this.energyLabel = new Text({ text: 'E = 125 J', style: labelStyle });
        this.formulaLabel = new Text({
            text: 'E = ½mv²',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: 0xf5b041,
            }),
        });

        this.massLabel.position.set(20, 20);
        this.speedLabel.position.set(20, 40);
        this.formulaLabel.position.set(20, this.height - 30);

        // v and v² comparison labels
        const smallLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fill: 0x888888,
        });

        this.vLabel = new Text({ text: 'v', style: smallLabelStyle });
        this.vSquaredLabel = new Text({ text: 'v²', style: smallLabelStyle });

        this.container.addChild(this.massLabel);
        this.container.addChild(this.speedLabel);
        this.container.addChild(this.energyLabel);
        this.container.addChild(this.formulaLabel);
        this.container.addChild(this.vLabel);
        this.container.addChild(this.vSquaredLabel);
    }

    protected onVariablesChange(): void {
        const m = this.variables['m'] ?? 10;
        const v = this.variables['v'] ?? 5;

        this.currentMass = m;
        this.currentSpeed = v;
        this.currentEnergy = 0.5 * m * v * v;

        // Update blob size based on mass
        const blobSize = 35 + m * 0.8;
        this.blob.updateOptions({ size: blobSize });

        // Update target velocity (visual speed)
        this.targetVelocity = v * 12;

        // Update labels
        this.massLabel.text = `m = ${m.toFixed(0)} kg`;
        this.speedLabel.text = `v = ${v.toFixed(1)} m/s`;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;

        this.wobblePhase += delta * 0.1;
        this.updateMovement(delta);
        this.updateParticles(delta);
        this.updateTrail();
        this.updateBlob();
        this.drawUI();
        this.drawEffects();

        // Smooth energy display
        this.displayedEnergy = lerp(this.displayedEnergy, this.currentEnergy, 0.1);
    }

    private updateMovement(delta: number): void {
        // Smooth velocity transition
        this.velocity = lerp(this.velocity, this.targetVelocity * this.direction, 0.05);

        // Move blob
        this.blobX += this.velocity * delta * 0.15;

        // Bounce off walls
        if (this.blobX >= this.rightBound - 30) {
            this.blobX = this.rightBound - 30;
            this.direction = -1;
            this.createImpact(this.blobX + 20, this.blobY);
            this.createEnergyBurst(this.blobX + 20, this.blobY);
        } else if (this.blobX <= this.leftBound + 30) {
            this.blobX = this.leftBound + 30;
            this.direction = 1;
            this.createImpact(this.blobX - 20, this.blobY);
            this.createEnergyBurst(this.blobX - 20, this.blobY);
        }

        // Add trail particles based on energy
        if (Math.abs(this.velocity) > 10 && Math.random() < 0.4) {
            const energyRatio = this.currentEnergy / 10000;
            this.particles.push({
                x: this.blobX - this.direction * 25,
                y: this.blobY + (Math.random() - 0.5) * 20,
                vx: -this.direction * (2 + Math.random() * 2),
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                maxLife: 1,
                size: 4 + energyRatio * 8,
                color: this.getEnergyColor(energyRatio),
            });
        }
    }

    private createImpact(x: number, y: number): void {
        const energyRatio = this.currentEnergy / 10000;
        this.impactWaves.push({
            x,
            y,
            radius: 0,
            maxRadius: 30 + energyRatio * 70,
            life: 1,
        });
    }

    private createEnergyBurst(x: number, y: number): void {
        const energyRatio = this.currentEnergy / 10000;
        const particleCount = Math.floor(5 + energyRatio * 20);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const speed = 3 + Math.random() * 4 + energyRatio * 5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed * -this.direction,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                size: 3 + Math.random() * 4 + energyRatio * 4,
                color: this.getEnergyColor(energyRatio),
            });
        }
    }

    private getEnergyColor(ratio: number): number {
        // Low energy: blue, High energy: orange/red
        if (ratio < 0.3) return 0x5dade2;
        if (ratio < 0.6) return 0xf5b041;
        return 0xe74c3c;
    }

    private updateParticles(delta: number): void {
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 0.1 * delta; // gravity
            p.life -= 0.02 * delta;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update impact waves
        this.impactWaves.forEach(w => {
            w.radius += 5;
            w.life -= 0.03;
        });
        this.impactWaves = this.impactWaves.filter(w => w.life > 0);
    }

    private updateTrail(): void {
        // Add current position to trail
        this.trailPoints.unshift({
            x: this.blobX,
            y: this.blobY,
            energy: this.currentEnergy,
        });

        // Limit trail length based on speed
        const maxTrailLength = Math.floor(10 + (this.currentSpeed / 20) * 30);
        if (this.trailPoints.length > maxTrailLength) {
            this.trailPoints.pop();
        }
    }

    private updateBlob(): void {
        const speed = Math.abs(this.velocity);
        const energyRatio = clamp(this.currentEnergy / 5000, 0, 1);

        // Stretch based on speed
        const stretchFactor = speed / 100;
        const stretchX = 1 + stretchFactor * 0.15;
        const stretchY = 1 - stretchFactor * 0.1;

        // Expression based on energy
        let expression: 'happy' | 'excited' | 'surprised' | 'charge' = 'happy';
        if (energyRatio > 0.7) {
            expression = 'excited';
        } else if (energyRatio > 0.4) {
            expression = 'charge';
        }

        // Glow intensity based on energy
        const glowIntensity = 0.2 + energyRatio * 0.6;

        this.blob.setPosition(this.blobX, this.blobY);
        this.blob.updateOptions({
            wobblePhase: this.wobblePhase + speed * 0.01,
            scaleX: stretchX,
            scaleY: stretchY,
            showSpeedLines: speed > 50,
            speedDirection: this.direction > 0 ? Math.PI : 0,
            expression,
            glowIntensity,
            glowColor: this.getEnergyColor(energyRatio),
        });
    }

    private drawUI(): void {
        const g = this.uiGraphics;
        g.clear();

        const barX = this.width - 140;
        const barWidth = 100;
        const barHeight = 16;

        // Energy bar background
        const energyBarY = 25;
        g.roundRect(barX, energyBarY, barWidth, barHeight, 4);
        g.fill({ color: 0x333333 });
        g.stroke({ color: 0x555555, width: 1 });

        // Energy bar fill - length proportional to energy
        const maxEnergy = 10000; // 50kg * 20m/s * 20m/s * 0.5
        const energyRatio = clamp(this.displayedEnergy / maxEnergy, 0, 1);
        const fillWidth = energyRatio * (barWidth - 4);

        if (fillWidth > 0) {
            g.roundRect(barX + 2, energyBarY + 2, fillWidth, barHeight - 4, 3);
            g.fill({ color: this.getEnergyColor(energyRatio) });
        }

        // Energy label
        this.energyLabel.text = `E = ${this.displayedEnergy.toFixed(0)} J`;
        this.energyLabel.position.set(barX, energyBarY + barHeight + 5);

        // v² visualization - show how v² grows faster than v
        const vBarY = energyBarY + 55;
        const vRatio = this.currentSpeed / 20;
        const vSquaredRatio = (this.currentSpeed * this.currentSpeed) / 400;

        // v bar
        g.roundRect(barX, vBarY, barWidth, 10, 3);
        g.fill({ color: 0x333333 });
        if (vRatio > 0) {
            g.roundRect(barX + 2, vBarY + 2, vRatio * (barWidth - 4), 6, 2);
            g.fill({ color: 0x5dade2 });
        }

        // v² bar
        g.roundRect(barX, vBarY + 18, barWidth, 10, 3);
        g.fill({ color: 0x333333 });
        if (vSquaredRatio > 0) {
            g.roundRect(barX + 2, vBarY + 20, vSquaredRatio * (barWidth - 4), 6, 2);
            g.fill({ color: 0xf5b041 });
        }

        // Position v and v² labels
        this.vLabel.position.set(barX - 20, vBarY - 2);
        this.vSquaredLabel.position.set(barX - 20, vBarY + 16);

        // Ground line
        g.moveTo(this.leftBound, this.groundY);
        g.lineTo(this.rightBound, this.groundY);
        g.stroke({ color: 0x444444, width: 3 });

        // Wall indicators
        g.rect(this.leftBound - 10, this.groundY - 80, 10, 80);
        g.fill({ color: 0x444444 });
        g.rect(this.rightBound, this.groundY - 80, 10, 80);
        g.fill({ color: 0x444444 });

        // Speed scale on ground
        const scaleY = this.groundY + 15;
        for (let i = 0; i <= 4; i++) {
            const x = this.leftBound + (i / 4) * (this.rightBound - this.leftBound);
            g.moveTo(x, this.groundY);
            g.lineTo(x, this.groundY + 8);
            g.stroke({ color: 0x666666, width: 1 });
        }
    }

    private drawEffects(): void {
        const glow = this.glowGraphics;
        glow.clear();

        const trail = this.trailGraphics;
        trail.clear();

        const particles = this.particleGraphics;
        particles.clear();

        // Draw energy trail (length = energy indicator)
        if (this.trailPoints.length > 2) {
            const energyRatio = clamp(this.currentEnergy / 5000, 0, 1);

            for (let i = 1; i < this.trailPoints.length; i++) {
                const p = this.trailPoints[i];
                const alpha = (1 - i / this.trailPoints.length) * 0.5 * energyRatio;
                const size = (1 - i / this.trailPoints.length) * (8 + energyRatio * 12);

                trail.circle(p.x, p.y, size);
                trail.fill({ color: this.getEnergyColor(energyRatio), alpha });
            }
        }

        // Draw glow behind blob based on energy
        const energyRatio = clamp(this.currentEnergy / 5000, 0, 1);
        if (energyRatio > 0.1) {
            const glowSize = 40 + energyRatio * 60;
            glow.circle(this.blobX, this.blobY, glowSize);
            glow.fill({ color: this.getEnergyColor(energyRatio), alpha: energyRatio * 0.4 });
        }

        // Draw impact waves
        this.impactWaves.forEach(w => {
            particles.circle(w.x, w.y, w.radius);
            particles.stroke({
                color: this.getEnergyColor(this.currentEnergy / 10000),
                width: 3 * w.life,
                alpha: w.life * 0.6,
            });
        });

        // Draw particles
        this.particles.forEach(p => {
            const alpha = p.life * 0.8;
            particles.circle(p.x, p.y, p.size * p.life);
            particles.fill({ color: p.color, alpha });
        });
    }
}
