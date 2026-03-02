import { time } from '@/utils/time';
import { type PolymarketLiveGameUpdate, polymarketLiveGameActions } from '@/features/polymarket/stores/polymarketLiveGameStore';
import { POLYMARKET_SPORTS_WS_URL } from '@/features/polymarket/constants';

const MAX_RECONNECT_DELAY_MS = time.seconds(30);

class PolymarketSportsWsClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private activeListeners = 0;
  private isConnecting = false;
  private requestedClose = false;

  start() {
    this.activeListeners += 1;
    if (this.activeListeners === 1) {
      this.connect();
    }
  }

  stop() {
    this.activeListeners = Math.max(0, this.activeListeners - 1);
    if (this.activeListeners === 0) {
      this.close();
    }
  }

  private connect() {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;
    this.requestedClose = false;
    polymarketLiveGameActions.setConnectionStatus('connecting');

    try {
      const socket = new WebSocket(POLYMARKET_SPORTS_WS_URL);
      this.socket = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        polymarketLiveGameActions.setConnectionStatus('connected');
      };

      socket.onmessage = event => {
        const update = this.parseMessage(event.data);
        if (!update) return;
        polymarketLiveGameActions.updateGame(update);
      };

      socket.onerror = () => {
        polymarketLiveGameActions.setConnectionStatus('error');
        if (this.socket && this.socket.readyState !== WebSocket.CLOSING && this.socket.readyState !== WebSocket.CLOSED) {
          this.socket.close();
        }
      };

      socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;

        if (this.activeListeners === 0) {
          polymarketLiveGameActions.setConnectionStatus('idle');
          return;
        }

        // Still have active listeners - need to reconnect
        if (this.requestedClose) {
          // Close was requested but new listeners appeared, reconnect immediately
          this.requestedClose = false;
          this.connect();
        } else {
          // Unexpected close, reconnect with backoff
          polymarketLiveGameActions.setConnectionStatus('error');
          this.scheduleReconnect();
        }
      };
    } catch {
      this.isConnecting = false;
      polymarketLiveGameActions.setConnectionStatus('error');
      this.scheduleReconnect();
    }
  }

  private close() {
    this.requestedClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    polymarketLiveGameActions.setConnectionStatus('idle');
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.activeListeners === 0) return;
    const delay = Math.min(time.seconds(2 ** this.reconnectAttempts), MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private parseMessage(message: unknown): PolymarketLiveGameUpdate | null {
    if (typeof message !== 'string') return null;
    try {
      const data: unknown = JSON.parse(message);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
      const gameId = (data as { gameId?: unknown }).gameId;
      if (typeof gameId !== 'number') return null;
      return data as PolymarketLiveGameUpdate;
    } catch {
      return null;
    }
  }
}

export const polymarketSportsWsClient = new PolymarketSportsWsClient();
