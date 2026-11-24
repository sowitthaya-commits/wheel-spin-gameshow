'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SliceItem, SpinData } from '../../types/game';
import { calculateSliceAngles, detectPegCrossings } from '../../lib/wheel-math';

interface WheelCanvasProps {
  slices: SliceItem[];
  spinData: SpinData | null;
  status?: string;
  logoUrl?: string;
  gameTitle?: string;
  onPegTick?: (speedFactor: number) => void;
  onSpinComplete?: (winningSliceId: string) => void;
  size?: number;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  spinData,
  status = 'IDLE',
  logoUrl,
  gameTitle = 'LUCKY SPIN',
  onPegTick,
  onSpinComplete,
  size = 540,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);
  const completedSpinIdRef = useRef<string | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const ledPhaseRef = useRef<number>(0);

  // Load logo image if provided
  useEffect(() => {
    if (!logoUrl) {
      setLogoImage(null);
      return;
    }
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => setLogoImage(img);
  }, [logoUrl]);

  // Main Draw Function
  const drawWheel = useCallback((angle: number, ledPhase: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = size;
    const height = size;

    if (canvas.width !== width * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = width / 2 - 24; // Room for rim & pointer
    const wheelRadius = outerRadius - 32; // Inside gold rim
    const hubRadius = 54;

    const sliceAngles = calculateSliceAngles(slices);

    // 0. Ambient Golden Flare (Horizontal / Radial Backlight like Reference Image)
    ctx.save();
    const flareGrad = ctx.createRadialGradient(
      centerX,
      centerY,
      wheelRadius * 0.4,
      centerX,
      centerY,
      outerRadius + 30
    );
    flareGrad.addColorStop(0, 'rgba(245, 176, 65, 0.15)');
    flareGrad.addColorStop(0.6, 'rgba(212, 175, 55, 0.08)');
    flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 1. Draw Outer Gold Rim Background & Deep Gold Glow
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(245, 176, 65, 0.65)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#08080C';
    ctx.fill();
    ctx.restore();

    // Multi-tier metallic gold gradient rim
    const rimGradient = ctx.createLinearGradient(0, 0, width, height);
    rimGradient.addColorStop(0, '#FFFBE6');
    rimGradient.addColorStop(0.15, '#F5CD47');
    rimGradient.addColorStop(0.35, '#AA771C');
    rimGradient.addColorStop(0.5, '#FFEAA7');
    rimGradient.addColorStop(0.65, '#85590E');
    rimGradient.addColorStop(0.85, '#F5B041');
    rimGradient.addColorStop(1, '#D4AF37');

    // Outer gold beveled ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = rimGradient;
    ctx.fill();

    // Inner dark trough channel where bulbs sit
    const troughOuter = outerRadius - 4;
    const troughInner = wheelRadius + 4;
    const troughGrad = ctx.createRadialGradient(
      centerX,
      centerY,
      troughInner,
      centerX,
      centerY,
      troughOuter
    );
    troughGrad.addColorStop(0, '#120E05');
    troughGrad.addColorStop(0.5, '#221A0A');
    troughGrad.addColorStop(1, '#0C0A04');

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, troughOuter, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, troughInner, 0, 2 * Math.PI, true);
    ctx.fillStyle = troughGrad;
    ctx.fill();

    // Outer & inner gold hairline pinstripe bevels
    ctx.strokeStyle = 'rgba(255, 245, 190, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, troughOuter, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 230, 140, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, troughInner, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // 2. Draw 3D Incandescent LED Bulbs on Rim (with intense warm golden halos)
    const bulbCount = 28;
    for (let i = 0; i < bulbCount; i++) {
      const bulbAngle = (i / bulbCount) * 2 * Math.PI;
      const bulbDistance = (troughOuter + troughInner) / 2;
      const bx = centerX + bulbDistance * Math.cos(bulbAngle);
      const by = centerY + bulbDistance * Math.sin(bulbAngle);

      const isLit = (i + Math.floor(ledPhase)) % 2 === 0;

      ctx.save();

      if (isLit) {
        // Outer warm golden halo flare
        const haloGrad = ctx.createRadialGradient(bx, by, 2, bx, by, 14);
        haloGrad.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
        haloGrad.addColorStop(0.4, 'rgba(245, 176, 65, 0.6)');
        haloGrad.addColorStop(1, 'rgba(245, 176, 65, 0)');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 14, 0, 2 * Math.PI);
        ctx.fill();

        // 3D Glowing Bulb sphere
        const bulbSphere = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 6);
        bulbSphere.addColorStop(0, '#FFFFFF');
        bulbSphere.addColorStop(0.3, '#FFF7D6');
        bulbSphere.addColorStop(0.7, '#F5B041');
        bulbSphere.addColorStop(1, '#D48806');

        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = bulbSphere;
        ctx.shadowColor = '#FFE57F';
        ctx.shadowBlur = 12;
        ctx.fill();
      } else {
        // Dim/off warm brass bulb
        const dimSphere = ctx.createRadialGradient(bx - 1.5, by - 1.5, 0.5, bx, by, 5);
        dimSphere.addColorStop(0, '#C29338');
        dimSphere.addColorStop(0.7, '#6E4D12');
        dimSphere.addColorStop(1, '#332304');

        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = dimSphere;
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. Draw Slices (Rotated by angle)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((angle * Math.PI) / 180);

    if (sliceAngles.length === 0) {
      // Empty wheel placeholder
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#14141A';
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ไม่มีรายการรางวัล', 0, 0);
    } else {
      sliceAngles.forEach(slice => {
        const startRad = (slice.startAngle * Math.PI) / 180;
        const endRad = (slice.endAngle * Math.PI) / 180;

        // Draw slice wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius, startRad, endRad);
        ctx.closePath();

        // Subtle gradient on each slice for 3D depth
        ctx.fillStyle = slice.color;
        ctx.fill();

        // Draw radial slice border with polished gold line
        ctx.strokeStyle = 'rgba(255, 235, 160, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner shadow edge
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Slice Text
        ctx.save();
        const midAngleRad = (((slice.startAngle + slice.endAngle) / 2) * Math.PI) / 180;
        ctx.rotate(midAngleRad);

        const textDist = wheelRadius * 0.63;
        ctx.translate(textDist, 0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 6;
        ctx.font = slice.arcSpan < 25 ? 'bold 12px sans-serif' : 'bold 15px sans-serif';

        // Truncate long text if arc span is small
        let displayLabel = slice.label;
        if (displayLabel.length > 15) {
          displayLabel = displayLabel.substring(0, 14) + '…';
        }
        ctx.fillText(displayLabel, 0, 0);

        // Subtext showing percentage if arc is wide enough
        if (slice.arcSpan >= 28) {
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#FFE57F';
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.fillText(`(${slice.percentage}%)`, 0, 16);
        }

        ctx.restore();
      });
    }

    ctx.restore(); // Restore slice rotation

    // 4. Draw Center Metallic 3D Sphere / Dome Hub (Just like reference image)
    ctx.save();

    // Hub drop shadow onto the wheel
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#08080C';
    ctx.fill();
    ctx.restore();

    // Outer beveled gold ring for hub
    ctx.save();
    const hubRimGrad = ctx.createLinearGradient(
      centerX - hubRadius,
      centerY - hubRadius,
      centerX + hubRadius,
      centerY + hubRadius
    );
    hubRimGrad.addColorStop(0, '#FFFBE6');
    hubRimGrad.addColorStop(0.3, '#D4AF37');
    hubRimGrad.addColorStop(0.7, '#7A520C');
    hubRimGrad.addColorStop(1, '#F5B041');

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = hubRimGrad;
    ctx.fill();

    // Inner 3D Convex Dome (Spherical button highlight)
    const domeRadius = hubRadius - 6;
    const domeGrad = ctx.createRadialGradient(
      centerX - domeRadius * 0.35,
      centerY - domeRadius * 0.35,
      2,
      centerX,
      centerY,
      domeRadius
    );
    domeGrad.addColorStop(0, '#FFFDF2');
    domeGrad.addColorStop(0.2, '#FFE885');
    domeGrad.addColorStop(0.5, '#D4A328');
    domeGrad.addColorStop(0.85, '#875C0E');
    domeGrad.addColorStop(1, '#3D2802');

    ctx.beginPath();
    ctx.arc(centerX, centerY, domeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = domeGrad;
    ctx.fill();

    // Inner dark disc inlay for text / logo
    const innerDiscRadius = domeRadius - 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerDiscRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(15, 12, 6, 0.65)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 235, 127, 0.4)';
    ctx.stroke();

    if (logoImage) {
      // Draw circular clipped logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerDiscRadius - 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        logoImage,
        centerX - (innerDiscRadius - 2),
        centerY - (innerDiscRadius - 2),
        (innerDiscRadius - 2) * 2,
        (innerDiscRadius - 2) * 2
      );
      ctx.restore();
    } else {
      // Hub Title Text in shining gold
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 13px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      const titleToDisplay =
        gameTitle.length > 11 ? gameTitle.substring(0, 10) + '…' : gameTitle;
      ctx.fillText(titleToDisplay, centerX, centerY);
    }
    ctx.restore();

    // 5. Draw Top Peg Pointer (Needle at 270 deg / Top) with Glowing Golden Light Flare
    ctx.save();
    const pointerTopY = centerY - outerRadius - 6;
    const pointerTipY = centerY - outerRadius + 24;

    // Flare beam behind pointer (like the horizontal lens flare in reference image)
    const flareGradPointer = ctx.createRadialGradient(
      centerX,
      pointerTipY,
      2,
      centerX,
      pointerTipY,
      35
    );
    flareGradPointer.addColorStop(0, 'rgba(255, 235, 140, 0.9)');
    flareGradPointer.addColorStop(0.4, 'rgba(245, 176, 65, 0.5)');
    flareGradPointer.addColorStop(1, 'rgba(245, 176, 65, 0)');

    ctx.fillStyle = flareGradPointer;
    ctx.beginPath();
    ctx.arc(centerX, pointerTipY, 35, 0, 2 * Math.PI);
    ctx.fill();

    // Pointer Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Golden metallic pointer body
    ctx.beginPath();
    ctx.moveTo(centerX - 18, pointerTopY);
    ctx.lineTo(centerX + 18, pointerTopY);
    ctx.lineTo(centerX, pointerTipY);
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(
      centerX - 18,
      pointerTopY,
      centerX + 18,
      pointerTipY
    );
    pointerGrad.addColorStop(0, '#FFF5C0');
    pointerGrad.addColorStop(0.3, '#F5B041');
    pointerGrad.addColorStop(0.7, '#D4AF37');
    pointerGrad.addColorStop(1, '#9E6B15');
    ctx.fillStyle = pointerGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Pointer Center Gem / Pivot Pin
    ctx.beginPath();
    ctx.arc(centerX, pointerTopY + 3, 5, 0, 2 * Math.PI);
    const pinGrad = ctx.createRadialGradient(
      centerX - 1,
      pointerTopY + 2,
      1,
      centerX,
      pointerTopY + 3,
      5
    );
    pinGrad.addColorStop(0, '#FFFFFF');
    pinGrad.addColorStop(0.5, '#FFE57F');
    pinGrad.addColorStop(1, '#C28308');
    ctx.fillStyle = pinGrad;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#FFF';
    ctx.stroke();

    ctx.restore();
    ctx.fillStyle = pointerGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Top needle center pin
    ctx.beginPath();
    ctx.arc(centerX, pointerTopY + 2, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFEAA7';
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }, [slices, size, logoImage, gameTitle]);

  // RequestAnimationFrame Animation Loop
  useEffect(() => {
    let animId: number;

    const animate = () => {
      ledPhaseRef.current += 0.05;

      if (status === 'SPINNING' && spinData && spinData.spinId) {
        const { startAngle, targetAngle, durationMs, startTimestamp } = spinData;
        const elapsed = Date.now() - startTimestamp;
        const progress = Math.min(1, Math.max(0, elapsed / durationMs));

        // Cubic-bezier ease-out: 1 - (1 - progress)^3
        const eased = 1 - Math.pow(1 - progress, 3);
        const newAngle = startAngle + (targetAngle - startAngle) * eased;

        // Detect peg crossing
        const sliceAngles = calculateSliceAngles(slices);
        const didCross = detectPegCrossings(currentAngleRef.current, newAngle, sliceAngles);
        if (didCross && onPegTick) {
          const speedFactor = (1 - progress) * 2 + 0.5;
          onPegTick(speedFactor);
        }

        currentAngleRef.current = newAngle;
        drawWheel(newAngle, ledPhaseRef.current * 3);

        if (progress >= 1) {
          if (completedSpinIdRef.current !== spinData.spinId) {
            completedSpinIdRef.current = spinData.spinId;
            isSpinningRef.current = false;
            if (onSpinComplete) {
              onSpinComplete(spinData.winningSliceId);
            }
          }
        } else {
          isSpinningRef.current = true;
        }
      } else {
        // Idle animation with steady LED phase
        drawWheel(currentAngleRef.current, ledPhaseRef.current);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [spinData, slices, drawWheel, onPegTick, onSpinComplete]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="max-w-full drop-shadow-[0_0_35px_rgba(245,176,65,0.3)]"
      />
    </div>
  );
};
