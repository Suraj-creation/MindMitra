import { ExperienceEpisode } from "../../domain/cognitive-experience";

export interface QueuedOfflineEvent {
  idempotency_key: string;
  event_type: "experience_episode" | "trial_telemetry";
  payload: ExperienceEpisode | any;
  created_at: string;
  sync_attempts: number;
  last_attempt_at?: string;
  status: "pending" | "syncing" | "synced" | "failed";
}

export class OfflineEventOutbox {
  private static readonly STORAGE_KEY = "mindmitra_offline_event_outbox";
  private static _instance: OfflineEventOutbox;

  public static getInstance(): OfflineEventOutbox {
    if (!OfflineEventOutbox._instance) {
      OfflineEventOutbox._instance = new OfflineEventOutbox();
    }
    return OfflineEventOutbox._instance;
  }

  public static enqueueEvent(eventType: "experience_episode" | "trial_telemetry", payload: any, idempotencyKey?: string): QueuedOfflineEvent {
    return OfflineEventOutbox.getInstance().enqueue(eventType, payload, idempotencyKey);
  }

  public static getPendingEvents(): QueuedOfflineEvent[] {
    return OfflineEventOutbox.getInstance().getPending();
  }

  public static clear(): void {
    OfflineEventOutbox.getInstance().clearAll();
  }

  public static async syncPendingEvents(): Promise<{ synced_count: number; failed_count: number; synced_keys: string[] }> {
    return OfflineEventOutbox.getInstance().syncWithServer();
  }

  private memoryQueue: QueuedOfflineEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public enqueue(eventType: "experience_episode" | "trial_telemetry", payload: any, idempotencyKey?: string): QueuedOfflineEvent {
    const key = idempotencyKey || payload.idempotency_key || `idem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const queued: QueuedOfflineEvent = {
      idempotency_key: key,
      event_type: eventType,
      payload: { ...payload, idempotency_key: key },
      created_at: new Date().toISOString(),
      sync_attempts: 0,
      status: "pending",
    };

    const existingIndex = this.memoryQueue.findIndex((e) => e.idempotency_key === key);
    if (existingIndex >= 0) {
      this.memoryQueue[existingIndex] = queued;
    } else {
      this.memoryQueue.push(queued);
    }

    this.saveToStorage();
    return queued;
  }

  public enqueueEpisode(episode: ExperienceEpisode): QueuedOfflineEvent {
    return this.enqueue("experience_episode", episode, episode.idempotency_key);
  }

  public clearAll(): void {
    this.memoryQueue = [];
    this.saveToStorage();
  }

  public getPending(): QueuedOfflineEvent[] {
    return this.memoryQueue.filter((e) => e.status === "pending" || e.status === "failed");
  }

  public getAll(): QueuedOfflineEvent[] {
    return [...this.memoryQueue];
  }

  public markSynced(idempotencyKeys: string[]): void {
    const keySet = new Set(idempotencyKeys);
    this.memoryQueue = this.memoryQueue.map((item) => {
      if (keySet.has(item.idempotency_key)) {
        return { ...item, status: "synced" };
      }
      return item;
    });
    this.saveToStorage();
  }

  public clearSynced(): void {
    this.memoryQueue = this.memoryQueue.filter((e) => e.status !== "synced");
    this.saveToStorage();
  }

  /**
   * Idempotent Synchronization with MindMitra Server Layer
   */
  public async syncWithServer(endpoint: string = "/v1/cognitive-studio/sync-offline-events"): Promise<{
    synced_count: number;
    failed_count: number;
    synced_keys: string[];
  }> {
    const pending = this.getPending();
    if (pending.length === 0) {
      return { synced_count: 0, failed_count: 0, synced_keys: [] };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: pending.map((p) => ({
            idempotency_key: p.idempotency_key,
            event_type: p.event_type,
            payload: p.payload,
            created_at: p.created_at,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      const syncedKeys: string[] = result.synced_keys || pending.map((p) => p.idempotency_key);
      this.markSynced(syncedKeys);

      return {
        synced_count: syncedKeys.length,
        failed_count: pending.length - syncedKeys.length,
        synced_keys: syncedKeys,
      };
    } catch (err) {
      // Mark attempts
      const now = new Date().toISOString();
      this.memoryQueue = this.memoryQueue.map((item) => {
        if (item.status === "pending") {
          return {
            ...item,
            sync_attempts: item.sync_attempts + 1,
            last_attempt_at: now,
            status: item.sync_attempts >= 3 ? "failed" : "pending",
          };
        }
        return item;
      });
      this.saveToStorage();
      return { synced_count: 0, failed_count: pending.length, synced_keys: [] };
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(OfflineEventOutbox.STORAGE_KEY);
        if (raw) {
          this.memoryQueue = JSON.parse(raw);
        }
      } catch {
        this.memoryQueue = [];
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(OfflineEventOutbox.STORAGE_KEY, JSON.stringify(this.memoryQueue));
      } catch {
        // storage quota exceeded or unavailable
      }
    }
  }
}

export const offlineEventOutbox = new OfflineEventOutbox();
