'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  getDataUrl: () => string;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, { onSign?: () => void }>(
  ({ onSign }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing   = useRef(false);
    const last      = useRef<{ x: number; y: number } | null>(null);
    const hasDrawn  = useRef(false);

    // キャンバスをコンテナに合わせてリサイズ
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const setup = () => {
        const ctx = canvas.getContext('2d')!;
        const r   = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = r.width  * dpr;
        canvas.height = r.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth   = 2.5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
      };
      setup();
      const ro = new ResizeObserver(setup);
      ro.observe(canvas);
      return () => ro.disconnect();
    }, []);

    function point(e: MouseEvent | TouchEvent): { x: number; y: number } {
      const r = canvasRef.current!.getBoundingClientRect();
      if ('touches' in e) {
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
    }

    function onStart(e: MouseEvent | TouchEvent) {
      drawing.current = true;
      last.current = point(e);
      e.preventDefault();
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!drawing.current) return;
      const ctx = canvasRef.current!.getContext('2d')!;
      const p   = point(e);
      ctx.beginPath();
      if (last.current) { ctx.moveTo(last.current.x, last.current.y); }
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current  = p;
      hasDrawn.current = true;
      e.preventDefault();
    }
    function onEnd() {
      if (drawing.current && hasDrawn.current) onSign?.();
      drawing.current = false;
      last.current    = null;
    }

    useImperativeHandle(ref, () => ({
      clear() {
        const c = canvasRef.current;
        c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
        hasDrawn.current = false;
      },
      getDataUrl: () => canvasRef.current?.toDataURL('image/png') ?? '',
      isEmpty:    () => !hasDrawn.current,
    }));

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-36 cursor-crosshair touch-none bg-white"
        onMouseDown={e => onStart(e.nativeEvent)}
        onMouseMove={e => onMove(e.nativeEvent)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={e => onStart(e.nativeEvent)}
        onTouchMove={e => onMove(e.nativeEvent)}
        onTouchEnd={onEnd}
      />
    );
  }
);
SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
