import React, { useLayoutEffect, useRef, useState } from 'react';

type Dims = { scale: number; iw: number; ih: number };

/**
 * Measures intrinsic size of children (two game fields + gap), then scales down
 * with transform-origin top-left so everything fits the available flex area without page scroll.
 */
export const GameFieldsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<Dims>({ scale: 1, iw: 832, ih: 640 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const iw = inner.scrollWidth;
      const ih = inner.scrollHeight;
      const { width: ow, height: oh } = outer.getBoundingClientRect();
      if (iw < 1 || ih < 1 || ow < 1 || oh < 1) return;
      const s = Math.min(1, ow / iw, oh / ih) * 0.98;
      setDims({ scale: s, iw, ih });
    };

    update();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(update);
    });

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
    };
  }, []);

  const { scale, iw, ih } = dims;

  return (
    <div
      ref={outerRef}
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-1 py-1 sm:px-2 sm:py-2"
    >
      <div
        className="overflow-hidden rounded-sm"
        style={{
          width: Math.max(1, iw * scale),
          height: Math.max(1, ih * scale),
        }}
      >
        <div
          ref={innerRef}
          className="flex w-max items-start justify-center gap-4 sm:gap-8"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
