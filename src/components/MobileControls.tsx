import React from 'react';

interface MobileControlsProps {
  onMove: (dir: number) => void;
  onShoot: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onShoot }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-32 items-center justify-between px-6 pb-6 md:hidden">
      <div className="flex gap-4">
        <button
          className="h-20 w-20 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center border border-white/10 shadow-lg"
          onTouchStart={(e) => { e.preventDefault(); onMove(-1); }}
          onTouchEnd={(e) => { e.preventDefault(); onMove(0); }}
        >
          <span className="text-3xl">←</span>
        </button>
        <button
          className="h-20 w-20 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center border border-white/10 shadow-lg"
          onTouchStart={(e) => { e.preventDefault(); onMove(1); }}
          onTouchEnd={(e) => { e.preventDefault(); onMove(0); }}
        >
          <span className="text-3xl">→</span>
        </button>
      </div>
      <button
        className="h-24 w-24 rounded-full bg-emerald-500/20 active:bg-emerald-500/40 flex items-center justify-center border border-emerald-500/30 shadow-lg"
        onTouchStart={(e) => { e.preventDefault(); onShoot(); }}
      >
        <span className="text-2xl font-bold uppercase tracking-tighter">Fire</span>
      </button>
    </div>
  );
};

export default MobileControls;
