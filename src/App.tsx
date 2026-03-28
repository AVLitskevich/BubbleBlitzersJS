import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Trophy, Users, Timer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameSocket } from './hooks/useGameSocket';
import GameField from './components/GameField';
import MobileControls from './components/MobileControls';
import { GameFieldsLayout } from './components/GameFieldsLayout';
import { GAME_HEIGHT, GAME_WIDTH } from './types';
import { PlayerState } from './types';
import { SCORE_FLOAT_DURATION_SEC } from './constants';

function paddleDirFromKeys(left: boolean, right: boolean): number {
  if (left && !right) return -1;
  if (right && !left) return 1;
  return 0;
}

type HeaderFloat = {
  id: string;
  label: string;
  side: 'me' | 'op';
  tone: 'gain' | 'loss';
};

const App: React.FC = () => {
  const { gameState, myId, setPaddleInput, shootBall } = useGameSocket();
  const keysHeld = useRef({ left: false, right: false });
  const [headerFloats, setHeaderFloats] = useState<HeaderFloat[]>([]);
  const prevMyPlayerRef = useRef<PlayerState | null>(null);
  const prevOpponentRef = useRef<PlayerState | null>(null);

  const pushHeaderFloat = useCallback((label: string, side: 'me' | 'op', tone: 'gain' | 'loss') => {
    const id = `hf-${performance.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setHeaderFloats((fs) => [...fs, { id, label, side, tone }]);
  }, []);

  const emitPaddleDir = useCallback(() => {
    setPaddleInput(paddleDirFromKeys(keysHeld.current.left, keysHeld.current.right));
  }, [setPaddleInput]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      keysHeld.current = { left: false, right: false };
      setPaddleInput(0);
    }
  }, [gameState?.status, setPaddleInput]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!gameState || gameState.status !== 'playing' || !myId || !gameState.players[myId]) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.repeat) return;
        keysHeld.current.left = true;
        emitPaddleDir();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.repeat) return;
        keysHeld.current.right = true;
        emitPaddleDir();
      } else if (e.key === ' ') {
        e.preventDefault();
        shootBall();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        keysHeld.current.left = false;
        emitPaddleDir();
      } else if (e.key === 'ArrowRight') {
        keysHeld.current.right = false;
        emitPaddleDir();
      }
    };
    const clearInput = () => {
      keysHeld.current = { left: false, right: false };
      setPaddleInput(0);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInput);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInput);
    };
  }, [gameState, myId, emitPaddleDir, setPaddleInput, shootBall]);

  const myPlayer = myId ? gameState?.players[myId] : null;
  const opponentId = myId ? Object.keys(gameState?.players ?? {}).find((id) => id !== myId) : null;
  const opponentPlayer = opponentId && gameState ? gameState.players[opponentId] : null;

  useEffect(() => {
    if (!myPlayer) {
      prevMyPlayerRef.current = null;
      return;
    }
    const prev = prevMyPlayerRef.current;
    if (prev && prev.id === myPlayer.id) {
      const d = myPlayer.score - prev.score;
      const ballDropped = prev.ballActive && !myPlayer.ballActive;
      if (d > 0) {
        pushHeaderFloat(`+${d}`, 'me', 'gain');
      } else if (d < 0) {
        pushHeaderFloat(`${d}`, 'me', 'loss');
      } else if (ballDropped) {
        pushHeaderFloat('-10', 'me', 'loss');
      }
    }
    prevMyPlayerRef.current = myPlayer;
  }, [myPlayer, pushHeaderFloat]);

  useEffect(() => {
    if (!opponentPlayer) {
      prevOpponentRef.current = null;
      return;
    }
    const prev = prevOpponentRef.current;
    if (prev && prev.id === opponentPlayer.id) {
      const d = opponentPlayer.score - prev.score;
      const ballDropped = prev.ballActive && !opponentPlayer.ballActive;
      if (d > 0) {
        pushHeaderFloat(`+${d}`, 'op', 'gain');
      } else if (d < 0) {
        pushHeaderFloat(`${d}`, 'op', 'loss');
      } else if (ballDropped) {
        pushHeaderFloat('-10', 'op', 'loss');
      }
    }
    prevOpponentRef.current = opponentPlayer;
  }, [opponentPlayer, pushHeaderFloat]);

  if (!gameState) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-widest uppercase animate-pulse">Connecting to Game Server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#0a0a0a] px-2 py-2 pb-36 md:pb-2 font-sans text-white sm:px-4 sm:py-3">
      {/* Header */}
      <div className="mb-2 flex w-full max-w-5xl shrink-0 items-center justify-between gap-2 self-center overflow-visible rounded-xl border border-white/5 bg-[#1a1a1a] p-2 shadow-xl sm:mb-3 sm:rounded-2xl sm:p-3 md:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="shrink-0 rounded-lg bg-emerald-500/10 p-1.5 sm:p-2">
            <Zap className="h-4 w-4 text-emerald-400 sm:h-5 sm:w-5" />
          </div>
          <div className="relative z-10 min-h-[2.25rem] min-w-0 overflow-visible sm:min-h-[2.5rem] sm:min-w-[3rem]">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/60 sm:text-[10px]">
              Your Score
            </p>
            <p className="font-mono text-lg leading-none sm:text-2xl">{myPlayer?.score ?? 0}</p>
            {headerFloats
              .filter((f) => f.side === 'me')
              .map((f) => (
                <span
                  key={f.id}
                  role="presentation"
                  style={{ animationDuration: `${SCORE_FLOAT_DURATION_SEC}s` }}
                  className={`pointer-events-none absolute left-full top-[1.15rem] ml-1 whitespace-nowrap font-black text-lg tabular-nums drop-shadow-lg animate-score-float-header sm:top-[1.35rem] sm:ml-2 sm:text-xl ${
                    f.tone === 'gain' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  onAnimationEnd={() =>
                    setHeaderFloats((fs) => fs.filter((x) => x.id !== f.id))
                  }
                >
                  {f.label}
                </span>
              ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center px-1">
          <div className="mb-0.5 flex items-center gap-1 sm:mb-1 sm:gap-2">
            <Timer className="h-3.5 w-3.5 text-zinc-500 sm:h-4 sm:w-4" />
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:inline sm:text-xs">
              Remaining
            </span>
          </div>
          <p className="font-mono text-2xl tracking-tighter sm:text-3xl">
            {Math.floor(gameState.remainingTime / 60)}:{(Math.floor(gameState.remainingTime % 60)).toString().padStart(2, '0')}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-right sm:gap-4">
          <div className="relative z-10 min-h-[2.25rem] min-w-0 overflow-visible sm:min-h-[2.5rem] sm:min-w-[3rem]">
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-wider text-rose-400/60 sm:text-[10px]">
              <span className="sm:hidden">Opp.</span>
              <span className="hidden sm:inline">Opponent Score</span>
            </p>
            <p className="font-mono text-lg leading-none sm:text-2xl">{opponentPlayer?.score ?? 0}</p>
            {headerFloats
              .filter((f) => f.side === 'op')
              .map((f) => (
                <span
                  key={f.id}
                  role="presentation"
                  style={{ animationDuration: `${SCORE_FLOAT_DURATION_SEC}s` }}
                  className={`pointer-events-none absolute right-full top-[1.15rem] mr-1 whitespace-nowrap font-black text-lg tabular-nums drop-shadow-lg animate-score-float-header sm:top-[1.35rem] sm:mr-2 sm:text-xl ${
                    f.tone === 'gain' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  onAnimationEnd={() =>
                    setHeaderFloats((fs) => fs.filter((x) => x.id !== f.id))
                  }
                >
                  {f.label}
                </span>
              ))}
          </div>
          <div className="shrink-0 rounded-lg bg-rose-500/10 p-1.5 sm:p-2">
            <Users className="h-4 w-4 text-rose-400 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>

      {gameState.status === 'waiting' && Object.keys(gameState.players).length < 2 && (
        <div className="mb-1 shrink-0 self-center rounded-full border border-white/5 bg-zinc-900/90 px-4 py-1.5 sm:py-2">
          <p className="text-center text-xs font-medium tracking-wide text-zinc-400">
            Waiting for another player to join…
          </p>
        </div>
      )}

      {/* Game fields: scaled to fit remaining viewport height */}
      <GameFieldsLayout>
        {myPlayer && (
          <GameField
            player={myPlayer}
            isMe={true}
            title="👤 YOUR FIELD"
            borderColorClass="border-emerald-500/20"
            shadowColorClass="shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          />
        )}

        <div className="relative shrink-0">
          {opponentPlayer ? (
            <GameField
              player={opponentPlayer}
              isMe={false}
              title="Opponent Field"
              borderColorClass="border-rose-500/20"
              shadowColorClass="shadow-[0_0_30px_rgba(244,63,94,0.1)]"
              opacityClass="opacity-80"
            />
          ) : (
            <div className="relative w-[400px] shrink-0">
              <div className="mb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-rose-400">Opponent Field</h2>
              </div>
              <div
                className="flex items-center justify-center rounded-xl border-2 border-rose-500/10 bg-[#141414]"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
              >
                <p className="animate-pulse px-4 text-center text-sm font-medium text-zinc-500">
                  Waiting for opponent…
                </p>
              </div>
            </div>
          )}
        </div>
      </GameFieldsLayout>

      {/* Overlays */}
      <AnimatePresence>
        {gameState.status === 'countdown' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <h1 className="font-black italic text-white drop-shadow-2xl [font-size:min(28vw,12rem)]">
              {Math.ceil(gameState.countdown)}
            </h1>
          </motion.div>
        )}

        {gameState.status === 'ended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-8"
          >
            <div className="bg-[#1a1a1a] p-12 rounded-[2rem] border border-white/10 shadow-2xl text-center max-w-md w-full">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Game Over</h2>
              <p className="text-zinc-400 mb-8">
                {gameState.technicalVictory && gameState.winnerId === myId ? "Opponent disconnected. Technical Victory!" :
                 gameState.winnerId === myId ? "You won the match!" : 
                 gameState.winnerId === 'draw' ? "It's a draw!" : "Opponent won the match."}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Your Score</p>
                  <p className="text-2xl font-mono">{myPlayer?.score || 0}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Opponent</p>
                  <p className="text-2xl font-mono">{opponentPlayer?.score || 0}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600">
                {gameState.restartTimer !== undefined
                  ? `Restarting level in ${Math.ceil(gameState.restartTimer)} seconds...`
                  : "Waiting for server reset..."}
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Controls Help */}
      <div className="pointer-events-none fixed bottom-2 left-2 z-30 hidden sm:flex flex-col gap-1 sm:bottom-6 sm:left-6 sm:gap-2 md:bottom-8 md:left-8">
        <div className="flex items-center gap-2 text-zinc-500 sm:gap-3">
          <kbd className="rounded border border-white/5 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] sm:px-2 sm:py-1 sm:text-xs">
            ←
          </kbd>
          <kbd className="rounded border border-white/5 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] sm:px-2 sm:py-1 sm:text-xs">
            →
          </kbd>
          <span className="text-[9px] font-bold uppercase tracking-widest sm:text-[10px]">Move</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 sm:gap-3">
          <kbd className="rounded border border-white/5 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] sm:px-4 sm:py-1 sm:text-xs">
            SPACE
          </kbd>
          <span className="text-[9px] font-bold uppercase tracking-widest sm:text-[10px]">Shoot</span>
        </div>
      </div>
      <MobileControls onMove={setPaddleInput} onShoot={shootBall} />
    </div>
  );
};

export default App;
