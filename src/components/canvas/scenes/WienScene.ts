import { Ticker, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Wobble, WobbleExpression } from '../Wobble';
import { clamp, lerp } from '../../../utils/pixiHelpers';

/**
 * WienScene - 빈의 변위 법칙 (λmax = b/T)
 * Star (Twinkle) character changes color based on temperature
 * Hot stars are blue, cool stars are red
 */
export class WienScene extends BaseScene {
    declare private star: Wobble;
    declare private backgroundGraphics: Graphics;
    declare private uiGraphics: Graphics;
    declare private glowGraphics: Graphics;

    // Displayed values (smoothed)
    declare private displayedTemp: number;
    declare private displayedWavelength: number;

    // Animation state
    declare private time: number;
    declare private pulsePhase: number;

    // Background stars
    declare private backgroundStars: { x: number; y: number; size: number; twinkle: number }[];

    declare private statusLabel: Text;

    protected setup(): void {
        this.displayedTemp = 5800;
        this.displayedWavelength = 500;
        this.time = 0;
        this.pulsePhase = 0;

        // Generate background stars
        this.backgroundStars = [];
        for (let i = 0; i < 50; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 1 + Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2,
            });
        }

        // Background graphics (space with stars)
        this.backgroundGraphics = new Graphics();
        this.container.addChild(this.backgroundGraphics);

        // Glow effect behind star
        this.glowGraphics = new Graphics();
        this.container.addChild(this.glowGraphics);

        // UI graphics
        this.uiGraphics = new Graphics();
        this.container.addChild(this.uiGraphics);

        // Star (Twinkle) - the main character
        this.star = new Wobble({
            size: 80,
            color: 0xFFD700, // Will be updated based on temperature
            shape: 'star',
            expression: 'excited',
            showShadow: false,
            glowIntensity: 0.5,
        });
        this.container.addChild(this.star);

        // Status label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xffffff,
        });
        this.statusLabel = new Text({ text: '', style: labelStyle });
        this.statusLabel.position.set(20, 20);
        this.container.addChild(this.statusLabel);
    }

    protected onVariablesChange(): void {
        // Read in animate()
    }

    protected animate(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67;

        // Get target values
        const targetTemp = this.variables['T'] ?? 5800;

        // Smooth parameter changes
        this.displayedTemp = lerp(this.displayedTemp, targetTemp, 0.05);

        // Calculate wavelength using Wien's law: λmax = b/T
        const b = 2898000; // nm·K
        const wavelength = b / this.displayedTemp;
        this.displayedWavelength = wavelength;

        // Update time for animations
        this.time += delta * 0.02;
        this.pulsePhase += delta * 0.05;

        // Calculate star color from wavelength
        const starColor = this.wavelengthToColor(wavelength);

        // Expression based on temperature
        let expression: WobbleExpression = 'happy';
        if (this.displayedTemp > 10000) {
            expression = 'excited';
        } else if (this.displayedTemp > 7000) {
            expression = 'happy';
        } else if (this.displayedTemp > 4000) {
            expression = 'neutral';
        } else {
            expression = 'sleepy';
        }

        // Pulsing scale based on temperature (hotter = faster pulse)
        const pulseSpeed = this.displayedTemp / 5000;
        const pulseAmount = 0.05 + (this.displayedTemp / 20000) * 0.1;
        const pulse = 1 + Math.sin(this.pulsePhase * pulseSpeed) * pulseAmount;

        // Glow intensity based on temperature
        const glowIntensity = clamp(this.displayedTemp / 8000, 0.2, 1);

        this.star.setPosition(this.centerX, this.centerY);
        this.star.updateOptions({
            color: starColor,
            expression,
            scaleX: pulse,
            scaleY: pulse,
            wobblePhase: this.time * 2,
            glowColor: starColor,
            glowIntensity,
        });

        // Draw elements
        this.drawStarfield();
        this.drawGlow(starColor, glowIntensity, pulse);
        this.drawUI(wavelength);
        this.updateStatus(wavelength);
    }

    private drawStarfield(): void {
        const g = this.backgroundGraphics;
        g.clear();

        // Dark space background gradient
        g.rect(0, 0, this.width, this.height);
        g.fill(0x0a0a15);

        // Twinkling background stars
        for (const star of this.backgroundStars) {
            star.twinkle += 0.02;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
            g.circle(star.x, star.y, star.size);
            g.fill({ color: 0xffffff, alpha });
        }

        // Nebula-like color wash based on main star temperature
        const nebulaColor = this.wavelengthToColor(this.displayedWavelength);
        g.circle(this.centerX, this.centerY, 200);
        g.fill({ color: nebulaColor, alpha: 0.05 });
    }

    private drawGlow(color: number, intensity: number, pulse: number): void {
        const g = this.glowGraphics;
        g.clear();

        // Multiple glow layers for realistic star glow
        const layers = 4;
        for (let i = layers; i >= 1; i--) {
            const radius = 60 + (i * 30) * pulse;
            const alpha = (intensity * 0.15) / i;
            g.circle(this.centerX, this.centerY, radius);
            g.fill({ color, alpha });
        }

        // Core glow
        g.circle(this.centerX, this.centerY, 50 * pulse);
        g.fill({ color: 0xffffff, alpha: 0.1 });
    }

    private drawUI(wavelength: number): void {
        const g = this.uiGraphics;
        g.clear();

        // Temperature bar (left side)
        const tempBarX = 30;
        const tempBarHeight = 150;
        const tempBarY = this.centerY - tempBarHeight / 2;
        const tempRatio = clamp((this.displayedTemp - 2000) / 10000, 0, 1);

        // Background bar
        g.roundRect(tempBarX, tempBarY, 20, tempBarHeight, 4);
        g.fill(0x333344);

        // Temperature gradient (blue at top, red at bottom)
        const fillHeight = tempRatio * (tempBarHeight - 4);
        g.roundRect(tempBarX + 2, tempBarY + tempBarHeight - 2 - fillHeight, 16, fillHeight, 2);

        const tempColor = this.wavelengthToColor(this.displayedWavelength);
        g.fill(tempColor);

        // T label
        g.roundRect(tempBarX - 2, tempBarY - 25, 24, 20, 4);
        g.fill({ color: 0xf39c12, alpha: 0.8 });

        // Wavelength spectrum bar (bottom)
        const spectrumY = this.height - 60;
        const spectrumWidth = this.width - 100;
        const spectrumX = 50;
        const spectrumHeight = 20;

        // Draw spectrum
        const steps = 50;
        const stepWidth = spectrumWidth / steps;
        for (let i = 0; i < steps; i++) {
            // Map to visible spectrum: ~380nm (violet) to ~700nm (red)
            const wl = 380 + (i / steps) * 320;
            const color = this.wavelengthToColor(wl);
            g.rect(spectrumX + i * stepWidth, spectrumY, stepWidth + 1, spectrumHeight);
            g.fill(color);
        }

        // Spectrum border
        g.roundRect(spectrumX - 2, spectrumY - 2, spectrumWidth + 4, spectrumHeight + 4, 4);
        g.stroke({ color: 0x666666, width: 2 });

        // Current wavelength marker
        const markerWl = clamp(wavelength, 380, 700);
        const markerX = spectrumX + ((markerWl - 380) / 320) * spectrumWidth;

        g.moveTo(markerX, spectrumY - 10);
        g.lineTo(markerX, spectrumY + spectrumHeight + 10);
        g.stroke({ color: 0xffffff, width: 3 });

        // Wavelength label
        g.roundRect(markerX - 25, spectrumY + spectrumHeight + 15, 50, 22, 4);
        g.fill({ color: 0x333344, alpha: 0.9 });

        // Labels: UV on left, IR on right
        const uvLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fill: 0x8888ff,
        });

        const irLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fill: 0xff8888,
        });

        // Star type indicator
        const starType = this.getStarType();
        g.roundRect(this.width - 80, 20, 60, 25, 4);
        g.fill({ color: this.wavelengthToColor(wavelength), alpha: 0.8 });
    }

    private updateStatus(wavelength: number): void {
        const starType = this.getStarType();
        this.statusLabel.text = `${starType} | T = ${this.displayedTemp.toFixed(0)} K | λmax = ${wavelength.toFixed(0)} nm`;

        const color = this.wavelengthToColor(wavelength);
        this.statusLabel.style.fill = color;
    }

    private getStarType(): string {
        // Stellar classification based on temperature
        const T = this.displayedTemp;
        if (T >= 10000) return 'O/B형 (청색)';
        if (T >= 7500) return 'A형 (청백색)';
        if (T >= 6000) return 'F형 (백색)';
        if (T >= 5200) return 'G형 (황색)';
        if (T >= 3700) return 'K형 (주황색)';
        return 'M형 (적색)';
    }

    /**
     * Convert wavelength (nm) to RGB color
     * Based on approximation of visible spectrum
     */
    private wavelengthToColor(wavelength: number): number {
        let r: number, g: number, b: number;

        // Clamp to extended visible range for stars
        const wl = clamp(wavelength, 300, 800);

        if (wl < 380) {
            // UV - show as deep blue/violet
            r = 0.3;
            g = 0;
            b = 1;
        } else if (wl < 440) {
            // Violet
            r = (440 - wl) / 60 * 0.5;
            g = 0;
            b = 1;
        } else if (wl < 490) {
            // Blue to cyan
            r = 0;
            g = (wl - 440) / 50;
            b = 1;
        } else if (wl < 510) {
            // Cyan to green
            r = 0;
            g = 1;
            b = (510 - wl) / 20;
        } else if (wl < 580) {
            // Green to yellow
            r = (wl - 510) / 70;
            g = 1;
            b = 0;
        } else if (wl < 645) {
            // Yellow to orange to red
            r = 1;
            g = (645 - wl) / 65;
            b = 0;
        } else if (wl < 700) {
            // Red
            r = 1;
            g = 0;
            b = 0;
        } else {
            // Infrared - show as deep red
            r = 1;
            g = 0;
            b = 0;
        }

        // For hot stars (short wavelength), add white component
        if (wavelength < 450) {
            const whiteness = (450 - wavelength) / 150;
            r = clamp(r + whiteness * 0.5, 0, 1);
            g = clamp(g + whiteness * 0.5, 0, 1);
            b = clamp(b + whiteness * 0.3, 0, 1);
        }

        // Convert to hex
        return (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
    }
}
