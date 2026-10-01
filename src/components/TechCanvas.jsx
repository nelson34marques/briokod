import { useEffect, useRef } from 'react';

/**
 * TechCanvas – circuit-board themed animated background.
 * Features PCB traces with animated data pulses, binary streams,
 * and chip grid nodes. Single <canvas>, runs at ~30fps.
 */
export default function TechCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let raf;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    // ── circuit traces (PCB-style orthogonal paths) ──────────────
    function generateTraces() {
      const traces = [];
      const count = 14;
      for (let i = 0; i < count; i++) {
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const length = 100 + Math.random() * 300;
        const segments = [];
        let cx = startX, cy = startY;
        let horizontal = Math.random() > 0.5;
        const dir = Math.random() > 0.5 ? 1 : -1;

        for (let s = 0; s < 4; s++) {
          const segLen = 40 + Math.random() * (length / 3);
          if (horizontal) {
            segments.push({ x1: cx, y1: cy, x2: cx + segLen * dir, y2: cy });
            cx += segLen * dir;
          } else {
            segments.push({ x1: cx, y1: cy, x2: cx, y2: cy + segLen * dir });
            cy += segLen * dir;
          }
          horizontal = !horizontal;
        }
        traces.push({ segments, color: Math.random() > 0.5 ? '#1e40af' : '#0e7490' });
      }
      return traces;
    }

    let traces = generateTraces();

    // ── data pulses traveling along traces ───────────────────────
    const pulses = Array.from({ length: 18 }, () => ({
      traceIdx: Math.floor(Math.random() * 14),
      segIdx: 0,
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.004,
    }));

    // ── binary rain columns ─────────────────────────────────────
    const binaryCols = Array.from({ length: 12 }, (_, i) => ({
      x: (i + 0.5) * (window.innerWidth / 12) + (Math.random() - 0.5) * 60,
      y: Math.random() * window.innerHeight,
      speed: 0.3 + Math.random() * 0.7,
      chars: Array.from({ length: 8 }, () => (Math.random() > 0.5 ? '1' : '0')),
    }));

    // ── chip nodes (small rectangles at grid intersections) ────
    const CHIP_SIZE = 60;
    const chips = [];
    for (let x = CHIP_SIZE; x < window.innerWidth; x += CHIP_SIZE * 2) {
      for (let y = CHIP_SIZE; y < window.innerHeight; y += CHIP_SIZE * 2) {
        if (Math.random() > 0.6) {
          chips.push({
            x, y,
            w: 4 + Math.random() * 8,
            h: 4 + Math.random() * 8,
            alpha: 0.04 + Math.random() * 0.08,
            pulseSpeed: 0.5 + Math.random() * 1.5,
          });
        }
      }
    }

    // ── draw loop ───────────────────────────────────────────────
    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // 1. Subtle grid (PCB via grid)
      ctx.strokeStyle = 'rgba(30,64,175,0.08)';
      ctx.lineWidth = 0.7;
      const GRID = CHIP_SIZE;
      for (let x = 0; x < W; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // 2. Circuit traces
      for (const trace of traces) {
        ctx.strokeStyle = 'rgba(30,64,175,0.14)';
        ctx.lineWidth = 1.2;
        for (const seg of trace.segments) {
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        // via dots at corners
        ctx.fillStyle = 'rgba(6,182,212,0.25)';
        for (const seg of trace.segments) {
          ctx.beginPath();
          ctx.arc(seg.x1, seg.y1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Data pulses (traveling dots on traces)
      for (const pulse of pulses) {
        const trace = traces[pulse.traceIdx % traces.length];
        const seg = trace.segments[pulse.segIdx % trace.segments.length];
        const px = seg.x1 + (seg.x2 - seg.x1) * pulse.progress;
        const py = seg.y1 + (seg.y2 - seg.y1) * pulse.progress;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, 'rgba(34,211,238,0.6)');
        grad.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(34,211,238,0.9)';
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();

        pulse.progress += pulse.speed;
        if (pulse.progress > 1) {
          pulse.progress = 0;
          pulse.segIdx = (pulse.segIdx + 1) % 4;
          if (pulse.segIdx === 0) {
            pulse.traceIdx = Math.floor(Math.random() * traces.length);
          }
        }
      }

      // 4. Binary rain
      ctx.font = '10px "JetBrains Mono Variable", monospace';
      for (const col of binaryCols) {
        for (let i = 0; i < col.chars.length; i++) {
          const alpha = 0.06 + (i / col.chars.length) * 0.1;
          ctx.fillStyle = `rgba(96,165,250,${alpha})`;
          ctx.fillText(col.chars[i], col.x, col.y - i * 14);
        }
        col.y += col.speed;
        if (col.y - col.chars.length * 14 > H) {
          col.y = -20;
          col.chars = col.chars.map(() => (Math.random() > 0.5 ? '1' : '0'));
        }
      }

      // 5. Chip nodes
      for (const chip of chips) {
        const pulse = Math.sin(t * chip.pulseSpeed + chip.x * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(34,211,238,${(chip.alpha * 2 * (0.6 + pulse * 0.4)).toFixed(3)})`;
        ctx.fillRect(chip.x - chip.w / 2, chip.y - chip.h / 2, chip.w, chip.h);
      }

      // 6. Vignette
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(4,6,12,0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      t += 0.016;
      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}
