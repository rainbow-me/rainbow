import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

export type PolymarketLiveGameUpdate = {
  gameId: number;
  score?: string;
  period?: string;
  elapsed?: string;
  live?: boolean;
  ended?: boolean;
  status?: string;
  leagueAbbreviation?: string;
  homeTeam?: string;
  awayTeam?: string;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

type PolymarketLiveGameStoreState = {
  gamesById: Record<string, PolymarketLiveGameUpdate>;
  connectionStatus: ConnectionStatus;
  updateGame: (update: PolymarketLiveGameUpdate) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  removeGame: (gameId: number) => void;
};

export const usePolymarketLiveGameStore = createRainbowStore<PolymarketLiveGameStoreState>(set => ({
  gamesById: {},
  connectionStatus: 'idle',
  updateGame: update =>
    set(state => {
      const gameIdKey = String(update.gameId);
      const previous = state.gamesById[gameIdKey];
      return {
        gamesById: {
          ...state.gamesById,
          [gameIdKey]: { ...previous, ...update },
        },
      };
    }),
  setConnectionStatus: status => set({ connectionStatus: status }),
  removeGame: gameId =>
    set(state => {
      const gameIdKey = String(gameId);
      if (!state.gamesById[gameIdKey]) return state;
      const next = { ...state.gamesById };
      delete next[gameIdKey];
      return { gamesById: next };
    }),
}));

export const polymarketLiveGameActions = createStoreActions(usePolymarketLiveGameStore);
