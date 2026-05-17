'use client';

import { useEffect, useRef } from 'react';

type Dot = {
  x: number;
  y: number;
};

export function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let time = 0;

    const buildGrid = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      dots = [];
      const gap = width < 760 ? 28 : 34;
      for (let y = 0; y < height + gap; y += gap) {
        for (let x = 0; x < width + gap; x += gap) {
          dots.push({ x, y });
        }
      }
    };

    const draw = () => {
      time += 0.012;
      context.clearRect(0, 0, width, height);

      const pointer = pointerRef.current;
      for (const dot of dots) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pulse = (Math.sin(time + dot.x * 0.01 + dot.y * 0.008) + 1) / 2;
        const hover = Math.max(0, 1 - distance / 180);
        const radius = 1.1 + pulse * 0.65 + hover * 3.2;
        const alpha = 0.12 + pulse * 0.13 + hover * 0.58;

        context.beginPath();
        context.fillStyle = `rgba(166, 228, 0, ${alpha})`;
        context.shadowColor = `rgba(166, 228, 0, ${hover * 0.85})`;
        context.shadowBlur = hover * 18;
        context.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const onPointerLeave = () => {
      pointerRef.current = { x: -9999, y: -9999 };
    };

    buildGrid();
    draw();
    window.addEventListener('resize', buildGrid);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', buildGrid);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="dot-grid-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="dot-grid-canvas" />
    </div>
  );
}
