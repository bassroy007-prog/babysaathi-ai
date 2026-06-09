import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueuedOpType =
  | 'ADD_FEED'
  | 'STOP_FEED'
  | 'ADD_SLEEP'
  | 'STOP_SLEEP'
  | 'ADD_DIAPER'
  | 'ADD_GROWTH'
  | 'MARK_VACCINE'
  | 'MARK_MILESTONE';

export interface QueuedOperation {
  id: string;
  type: QueuedOpType;
  payload: Record<string, any>;
  enqueuedAt: string; // ISO string
  retries: number;
}

type FlushHandler = (op: QueuedOperation) => Promise<void>;

const QUEUE_KEY = '@babysaathi_offline_queue';
const MAX_RETRIES = 3;

// ─── Offline Queue Service ────────────────────────────────────────────────────

class OfflineQueueService {
  private flushHandlers = new Map<QueuedOpType, FlushHandler>();
  private isOnline = true;
  private isFlushing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  // ── Initialise ────────────────────────────────────────────────────────────

  init() {
    // Subscribe to connectivity changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleConnectivityChange);

    // Check current state immediately
    NetInfo.fetch().then(state => {
      this.isOnline = !!(state.isConnected && state.isInternetReachable);
    });
  }

  destroy() {
    this.unsubscribeNetInfo?.();
  }

  // ── Register a Firestore flush handler for each op type ──────────────────

  register(type: QueuedOpType, handler: FlushHandler) {
    this.flushHandlers.set(type, handler);
  }

  // ── Enqueue an operation ─────────────────────────────────────────────────

  async enqueue(type: QueuedOpType, payload: Record<string, any>): Promise<string> {
    const op: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      enqueuedAt: new Date().toISOString(),
      retries: 0,
    };

    const queue = await this.readQueue();
    queue.push(op);
    await this.writeQueue(queue);

    console.log(`[OfflineQueue] Enqueued ${type} (${op.id}). Queue size: ${queue.length}`);

    // Try to flush immediately if online
    if (this.isOnline) {
      this.flush();
    }

    return op.id;
  }

  // ── Check if we're online ─────────────────────────────────────────────────

  get online() {
    return this.isOnline;
  }

  // ── Queue size ────────────────────────────────────────────────────────────

  async size(): Promise<number> {
    const q = await this.readQueue();
    return q.length;
  }

  // ── Flush all pending operations ──────────────────────────────────────────

  async flush(): Promise<void> {
    if (this.isFlushing) return;
    this.isFlushing = true;

    try {
      let queue = await this.readQueue();
      if (queue.length === 0) return;

      console.log(`[OfflineQueue] Flushing ${queue.length} pending operations...`);

      const remaining: QueuedOperation[] = [];

      for (const op of queue) {
        const handler = this.flushHandlers.get(op.type);
        if (!handler) {
          console.warn(`[OfflineQueue] No handler for ${op.type} — dropping`);
          continue;
        }

        try {
          await handler(op);
          console.log(`[OfflineQueue] ✅ Flushed ${op.type} (${op.id})`);
        } catch (err) {
          op.retries += 1;
          if (op.retries < MAX_RETRIES) {
            console.warn(`[OfflineQueue] ⚠️ ${op.type} failed (retry ${op.retries}/${MAX_RETRIES}):`, err);
            remaining.push(op);
          } else {
            console.error(`[OfflineQueue] ❌ Dropping ${op.type} after ${MAX_RETRIES} retries`);
          }
        }
      }

      await this.writeQueue(remaining);
      if (remaining.length === 0) {
        console.log('[OfflineQueue] All operations synced.');
      }
    } finally {
      this.isFlushing = false;
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private handleConnectivityChange = (state: NetInfoState) => {
    const wasOffline = !this.isOnline;
    this.isOnline = !!(state.isConnected && state.isInternetReachable);

    if (wasOffline && this.isOnline) {
      console.log('[OfflineQueue] Back online — flushing queue...');
      this.flush();
    }
  };

  private async readQueue(): Promise<QueuedOperation[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async writeQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[OfflineQueue] Failed to persist queue:', err);
    }
  }
}

export const offlineQueue = new OfflineQueueService();
