import { Ticker, Graphics } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Blob } from '../Blob';

interface OrbitingBody {
    blob: Blob;
    radius: number;
    angle: number;
    period: number;
    color: number;
}

export class KeplerThirdScene extends BaseScene {
    declare private sunBlob: Blob;
    declare private mainPlanetBlob: Blob;
    declare private comparisonPlanetBlob: Blob;
    declare private orbitGraphics: Graphics;
    declare private infoGraphics: Graphics;
    declare private mainAngle: number;
    declare private compAngle: number;
    declare private time: number;

    protected setup(): void {
        this.mainAngle = 0;
        this.compAngle = 0;
        this.time = 0;

        this.orbitGraphics = new Graphics();
        this.container.addChild(this.orbitGraphics);

        this.infoGraphics = new Graphics();
        this.container.addChild(this.infoGraphics);

        // Central body (sun/star) - circle blob
        this.sunBlob = new Blob({
            size: 50,
            color: 0xf39c12,
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.6,
            glowColor: 0xf39c12,
        });
        this.sunBlob.setPosition(this.centerX, this.centerY);
        this.container.addChild(this.sunBlob);

        // Main planet (circle) - controlled by user variables
        this.mainPlanetBlob = new Blob({
            size: 22,
            color: 0x3498db,
            shape: 'circle',
            expression: 'happy',
        });
        this.container.addChild(this.mainPlanetBlob);

        // Comparison planet (square) - fixed reference orbit
        this.comparisonPlanetBlob = new Blob({
            size: 18,
            color: 0xe74c3c,
            shape: 'square',
            expression: 'happy',
        });
        this.container.addChild(this.comparisonPlanetBlob);
    }

    protected onVariablesChange(): void {
        const M = this.variables['M'] || 5.97;
        const r = this.variables['r'] || 384;

        // Sun size based on mass (M range 1-100000)
        const mNormalized = Math.log10(M + 1) / Math.log10(100001); // 0 to 1 log scale
        const sunSize = 35 + mNormalized * 35;
        this.sunBlob.updateOptions({
            size: sunSize,
            glowIntensity: 0.3 + mNormalized * 0.7,
        });

        // Main planet size hint based on orbit radius
        const rNormalized = (r - 1) / 9999; // r range 1-10000
        this.mainPlanetBlob.updateOptions({
            size: 18 + rNormalized * 10, // Larger orbit = slightly larger planet visual
        });

        // Reset angles when variables change
        this.mainAngle = 0;
        this.compAngle = 0;
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;
        this.time += delta * 0.01;

        const M = this.variables['M'] || 1.99;
        const r = this.variables['r'] || 1;
        const T = this.variables['T'] || 1;

        // Reference orbit (fixed - always at r=0.7 unit for comparison)
        const refRadius = 50; // Fixed radius
        const refPeriod = Math.pow(refRadius / 50, 1.5); // T² ∝ r³, so T ∝ r^1.5

        // Main orbit from user variables (scaled)
        // r range is 1-10000, normalize to orbit radius 45-120
        const rNormalized = (r - 1) / 9999;
        const mainRadius = 45 + rNormalized * 75;
        const mainPeriod = T; // User-controlled period

        // Calculate expected period based on Kepler's third law
        // T² ∝ r³ → T = k * r^1.5
        const expectedPeriod = Math.pow(mainRadius / 50, 1.5);

        // Angular speeds (inverse of period)
        const baseSpeed = 0.03;
        const refAngularSpeed = baseSpeed / refPeriod;
        const mainAngularSpeed = baseSpeed / mainPeriod;

        this.compAngle += refAngularSpeed * delta;
        this.mainAngle += mainAngularSpeed * delta;

        // Position reference planet (comparison - square)
        const refX = this.centerX + Math.cos(this.compAngle) * refRadius;
        const refY = this.centerY + Math.sin(this.compAngle) * refRadius * 0.7;
        this.comparisonPlanetBlob.setPosition(refX, refY);

        // Position main planet (circle)
        const mainX = this.centerX + Math.cos(this.mainAngle) * mainRadius;
        const mainY = this.centerY + Math.sin(this.mainAngle) * mainRadius * 0.7;
        this.mainPlanetBlob.setPosition(mainX, mainY);

        // Depth effect - size and z-order
        const mainDepth = Math.sin(this.mainAngle);
        const refDepth = Math.sin(this.compAngle);

        // Base planet size from orbit radius (larger orbit = larger visual hint)
        const mainBaseSize = 18 + rNormalized * 10;
        this.mainPlanetBlob.updateOptions({
            size: mainBaseSize + mainDepth * 4,
            wobblePhase: this.time * 3,
        });

        this.comparisonPlanetBlob.updateOptions({
            size: 16 + refDepth * 3,
            wobblePhase: this.time * 2,
        });

        // Z-ordering (which planet is in front)
        if (mainDepth > refDepth) {
            this.container.setChildIndex(this.mainPlanetBlob, this.container.children.length - 1);
        } else {
            this.container.setChildIndex(this.comparisonPlanetBlob, this.container.children.length - 1);
        }

        // Animate sun
        this.sunBlob.updateOptions({
            wobblePhase: this.time * 1.5,
        });

        this.drawOrbits(mainRadius, refRadius, expectedPeriod, mainPeriod);
        this.drawKeplerVisualization(r, T, expectedPeriod);
    }

    private drawOrbits(mainRadius: number, refRadius: number, expectedPeriod: number, actualPeriod: number): void {
        const g = this.orbitGraphics;
        g.clear();

        // Reference orbit (red, dashed)
        const refSegments = 32;
        for (let i = 0; i < refSegments; i += 2) {
            const startAngle = (i / refSegments) * Math.PI * 2;
            const endAngle = ((i + 1) / refSegments) * Math.PI * 2;

            const x1 = this.centerX + Math.cos(startAngle) * refRadius;
            const y1 = this.centerY + Math.sin(startAngle) * refRadius * 0.7;
            const x2 = this.centerX + Math.cos(endAngle) * refRadius;
            const y2 = this.centerY + Math.sin(endAngle) * refRadius * 0.7;

            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.4 });
        }

        // Main orbit (blue, solid)
        g.ellipse(this.centerX, this.centerY, mainRadius, mainRadius * 0.7);
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.5 });

        // Radius lines
        const mainX = this.mainPlanetBlob.position.x;
        const mainY = this.mainPlanetBlob.position.y;
        const refX = this.comparisonPlanetBlob.position.x;
        const refY = this.comparisonPlanetBlob.position.y;

        // Main radius line
        g.moveTo(this.centerX, this.centerY);
        g.lineTo(mainX, mainY);
        g.stroke({ color: 0x3498db, width: 2, alpha: 0.4 });

        // Reference radius line
        g.moveTo(this.centerX, this.centerY);
        g.lineTo(refX, refY);
        g.stroke({ color: 0xe74c3c, width: 1, alpha: 0.3 });

        // Period progress arcs
        const arcRadius = 25;

        // Main planet progress (blue)
        const mainProgress = (this.mainAngle % (Math.PI * 2));
        g.moveTo(this.centerX, this.centerY);
        g.arc(this.centerX, this.centerY, arcRadius, 0, mainProgress);
        g.lineTo(this.centerX, this.centerY);
        g.fill({ color: 0x3498db, alpha: 0.25 });

        // Reference planet progress (red) - smaller arc
        const refProgress = (this.compAngle % (Math.PI * 2));
        g.moveTo(this.centerX, this.centerY);
        g.arc(this.centerX, this.centerY, arcRadius - 8, 0, refProgress);
        g.lineTo(this.centerX, this.centerY);
        g.fill({ color: 0xe74c3c, alpha: 0.25 });

        // Kepler law match indicator
        const periodMatch = Math.abs(actualPeriod - expectedPeriod) < 0.2;
        const indicatorColor = periodMatch ? 0x2ecc71 : 0xf39c12;

        // Small indicator in corner
        g.circle(this.width - 30, 30, 12);
        g.fill({ color: indicatorColor, alpha: 0.5 });
        g.circle(this.width - 30, 30, 12);
        g.stroke({ color: indicatorColor, width: 2, alpha: 0.8 });
    }

    private drawKeplerVisualization(r: number, T: number, expectedT: number): void {
        const g = this.infoGraphics;
        g.clear();

        // T² vs r³ comparison bars at bottom
        const barY = this.height - 50;
        const barMaxWidth = 80;
        const barHeight = 15;

        // r³ bar (normalized to 0-1 range for display)
        const rCubed = Math.pow(r, 3);
        const rCubedNormalized = Math.min(rCubed / 10, 1);
        const rBarX = this.centerX - 90;

        g.roundRect(rBarX, barY, barMaxWidth, barHeight, 4);
        g.fill({ color: 0x222222, alpha: 0.5 });
        g.roundRect(rBarX, barY, rCubedNormalized * barMaxWidth, barHeight, 4);
        g.fill({ color: 0x9b59b6, alpha: 0.7 });

        // T² bar
        const tSquared = Math.pow(T, 2);
        const tSquaredNormalized = Math.min(tSquared / 10, 1);
        const tBarX = this.centerX + 10;

        g.roundRect(tBarX, barY, barMaxWidth, barHeight, 4);
        g.fill({ color: 0x222222, alpha: 0.5 });
        g.roundRect(tBarX, barY, tSquaredNormalized * barMaxWidth, barHeight, 4);
        g.fill({ color: 0x1abc9c, alpha: 0.7 });

        // Equal sign or not equal based on Kepler match
        const ratio = tSquared / (rCubed + 0.001);
        const isBalanced = ratio > 0.7 && ratio < 1.3;

        // Connection line between bars
        g.moveTo(rBarX + barMaxWidth + 5, barY + barHeight / 2);
        g.lineTo(tBarX - 5, barY + barHeight / 2);
        g.stroke({
            color: isBalanced ? 0x2ecc71 : 0xe74c3c,
            width: 2,
            alpha: 0.7
        });

        // Legend indicators (top left)
        // Blue circle = main planet
        g.circle(25, 25, 8);
        g.fill({ color: 0x3498db, alpha: 0.8 });

        // Red square = reference planet
        g.rect(17, 45, 16, 16);
        g.fill({ color: 0xe74c3c, alpha: 0.8 });

        // r³ label indicator (bottom left of bars)
        g.roundRect(rBarX, barY - 20, 25, 15, 3);
        g.fill({ color: 0x9b59b6, alpha: 0.4 });

        // T² label indicator (bottom left of bars)
        g.roundRect(tBarX, barY - 20, 25, 15, 3);
        g.fill({ color: 0x1abc9c, alpha: 0.4 });
    }
}
