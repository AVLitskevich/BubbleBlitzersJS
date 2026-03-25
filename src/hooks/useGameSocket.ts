import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types';

type GameRuntimeConfig = {
  gameServerUrl?: string;
};

/**
 * Resolves Socket.IO origin:
 * 1) public/game-config.json → gameServerUrl (non-empty), editable after build on the static host
 * 2) import.meta.env.VITE_GAME_SERVER_URL at build time (optional)
 * 3) window.location.origin
 */
async function resolveGameServerUrl(): Promise<string> {
  const configPath = `${import.meta.env.BASE_URL}game-config.json`;
  try {
    const res = await fetch(configPath, { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as GameRuntimeConfig;
      if (typeof json.gameServerUrl === 'string' && json.gameServerUrl.trim() !== '') {
        return json.gameServerUrl.trim().replace(/\/$/, '');
      }
    }
  } catch {
    /* fall through */
  }

  const envUrl = import.meta.env.VITE_GAME_SERVER_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }

  return window.location.origin;
}

export const useGameSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let sock: Socket | null = null;

    (async () => {
      const url = await resolveGameServerUrl();
      if (cancelled) return;
      sock = io(url, {
        transports: ['websocket', 'polling'],
      });
      setSocket(sock);

      sock.on('connect', () => {
        setMyId(sock.id || null);
      });

      sock.on('gameState', (state: GameState) => {
        setGameState(structuredClone(state) as GameState);
      });
    })();

    return () => {
      cancelled = true;
      sock?.close();
    };
  }, []);

  const setPaddleInput = useCallback((dir: number) => {
    socket?.emit('paddleInput', dir);
  }, [socket]);

  const shootBall = useCallback(() => {
    socket?.emit('shootBall');
  }, [socket]);

  return {
    socket,
    gameState,
    myId,
    setPaddleInput,
    shootBall
  };
};
