"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ditherImage } from "@/app/lib/dither";

const DEFAULT_OPTIONS = {
  threshold: 130,
  pixelSize: 1,
  spacing: 2,
  blur: 0,
  resolution: 2,
  invert: true,
  brightness: -28,
  contrast: 28,
  useOrdered: true,
  gradient: {
    angle: 0,
    points: [
      { position: 0, opacity: 46, density: 100 },
      { position: 100, opacity: 46, density: 100 },
    ],
  },
} as const;

type DitheredBackgroundProps = {
  imageUrl?: string;
  onReady?: () => void;
};

export function DitheredBackground({ imageUrl = "/civilizations/rome.png", onReady }: DitheredBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    const run = () => {
      if (!container || !canvas || !img.width) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w <= 0 || h <= 0) return;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(w / iw, h / ih);
      const sw = iw * scale;
      const sh = ih * scale;
      const sx = (w - sw) / 2;
      const sy = (h - sh) / 2;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, -sx, -sy, sw, sh);

      ditherImage(ctx, w, h, {
        ...DEFAULT_OPTIONS,
        gradient: {
          ...DEFAULT_OPTIONS.gradient,
          points: DEFAULT_OPTIONS.gradient.points.map((p) => ({ ...p })),
        },
      });
      setReady(true);
      onReady?.();
    };

    img.onload = () => {
      run();
    };
    img.src = imageUrl;

    const resizeObserver = new ResizeObserver(run);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [imageUrl]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ visibility: ready ? "visible" : "hidden" }}
        />
        {/* Strong vignette: dark edges, clear center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 18%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.95) 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}
