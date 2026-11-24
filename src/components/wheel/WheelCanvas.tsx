'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SliceItem, SpinData } from '../../types/game';
import { calculateSliceAngles, detectPegCrossings } from '../../lib/wheel-math';

interface WheelCanvasProps {
  slices: SliceItem[];
  spinData: SpinData | null;
  logoUrl?: string;
  gameTitle?: string;
  onPegTick?: (speedFactor: number) => void;
  onSpinComplete?: (winningSliceId: string) => void;
  size?: number;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  spinData,
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
    const outerRadius = width / 2 - 20; // Room for rim & pointer
    const wheelRadius = outerRadius - 26; // Inside gold rim
    const hubRadius = 52;

    const sliceAngles = calculateSliceAngles(slices);

    // 1. Draw Outer Gold Rim Background & Glow
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(245, 176, 65, 0.45)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1A1429';
    ctx.fill();
    ctx.restore();

    // Metallic gold rim ring
    const rimGradient = ctx.createLinearGradient(0, 0, width, height);
    rimGradient.addColorStop(0, '#FFEAA7');
    rimGradient.addColorStop(0.25, '#D4AF37');
    rimGradient.addColorStop(0.5, '#F5B041');
    rimGradient.addColorStop(0.75, '#B7791F');
    rimGradient.addColorStop(1, '#FFD700');

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = rimGradient;
    ctx.fill();

    // 2. Draw LED Light Bulbs on Rim (28 bulbs)
    const bulbCount = 28;
    for (let i = 0; i < bulbCount; i++) {
      const bulbAngle = (i / bulbCount) * 2 * Math.PI;
      const bulbDistance = outerRadius - 13;
      const bx = centerX + bulbDistance * Math.cos(bulbAngle);
      const by = centerY + bulbDistance * Math.sin(bulbAngle);

      const isLit = (i + Math.floor(ledPhase)) % 2 === 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, 2 * Math.PI);

      if (isLit) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFEAA7';
        ctx.shadowBlur = 10;
        ctx.fill();
      } else {
        ctx.fillStyle = '#9C7A28';
        ctx.shadowBlur = 0;
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
      ctx.fillStyle = '#2A2045';
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
        ctx.fillStyle = slice.color;
        ctx.fill();

        // Draw radial slice border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Slice Text
        ctx.save();
        const midAngleRad = ((slice.startAngle + slice.endAngle) / 2 * Math.PI) / 180;
        ctx.rotate(midAngleRad);

        const textDist = wheelRadius * 0.62;
        ctx.translate(textDist, 0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.font = slice.arcSpan < 25 ? 'bold 11px sans-serif' : 'bold 14px sans-serif';

        // Truncate long text if arc span is small
        let displayLabel = slice.label;
        if (displayLabel.length > 16) {
          displayLabel = displayLabel.substring(0, 15) + '…';
        }
        ctx.fillText(displayLabel, 0, 0);

        // Subtext showing percentage if arc is wide enough
        if (slice.arcSpan >= 30) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(`(${slice.percentage}%)`, 0, 16);
        }

        ctx.restore();
      });
    }

    ctx.restore(); // Restore slice rotation

    // 4. Draw Center Metallic Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F0D20';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.fill();

    // Metallic border for hub
    ctx.lineWidth = 5;
    ctx.strokeStyle = rimGradient;
    ctx.stroke();

    if (logoImage) {
      // Draw circular clipped logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius - 6, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        logoImage,
        centerX - (hubRadius - 6),
        centerY - (hubRadius - 6),
        (hubRadius - 6) * 2,
        (hubRadius - 6) * 2
      );
      ctx.restore();
    } else {
      // Hub Title Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.fillText(gameTitle.length > 12 ? gameTitle.substring(0, 11) + '…' : gameTitle, centerX, centerY);
    }
    ctx.restore();

    // 5. Draw Top Peg Pointer (Needle at 270 deg / Top)
    ctx.save();
    const pointerTopY = centerY - outerRadius - 4;
    const pointerTipY = centerY - outerRadius + 22;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(centerX - 16, pointerTopY);
    ctx.lineTo(centerX + 16, pointerTopY);
    ctx.lineTo(centerX, pointerTipY);
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(centerX - 16, pointerTopY, centerX + 16, pointerTipY);
    pointerGrad.addColorStop(0, '#FF4757');
    pointerGrad.addColorStop(1, '#FF6B81');
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

      if (spinData && spinData.spinId) {
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
        // Idle animation
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
