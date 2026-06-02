'use client';

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface SignaturePadRef {
  clear: () => void;
  getDataUrl: () => string;
  isEmpty: () => boolean;
}

interface Props {
  onSign?: () => void;
  className?: string;
}

const SignaturePad = forwardRef<SignaturePadRef, Props>(
  ({ onSign, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const hasDrawn = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      };

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => ro.disconnect();
    }, []);

    function getPoint(
      e: MouseEvent | TouchEvent,
      canvas: HTMLCanvasElement
    ): { x: number; y: number } {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      };
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      isDrawing.current = true;
      lastPoint.current = getPoint(e, canvas);
      e.preventDefault();
    }

    function draw(e: MouseEvent | TouchEvent) {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const point = getPoint(e, canvas);
      ctx.beginPath();
      if (lastPoint.current) {
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      lastPoint.current = point;
      hasDrawn.current = true;
      e.preventDefault();
    }

    function stopDraw() {
      if (isDrawing.current && hasDrawn.current) onSign?.();
      isDrawing.current = false;
      lastPoint.current = null;
    }

    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasDrawn.current = false;
        }
      },
      getDataUrl() {
        return canvasRef.current?.toDataURL('image/png') ?? '';
      },
      isEmpty() {
        return !hasDrawn.current;
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-36 cursor-crosshair touch-none ${className}`}
        onMouseDown={(e) => startDraw(e.nativeEvent)}
        onMouseMove={(e) => draw(e.nativeEvent)}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={(e) => startDraw(e.nativeEvent)}
        onTouchMove={(e) => draw(e.nativeEvent)}
        onTouchEnd={stopDraw}
      />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
