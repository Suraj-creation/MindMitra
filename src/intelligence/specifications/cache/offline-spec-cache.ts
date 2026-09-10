/**
 * Offline Specification Cache
 *
 * Persists validated GameExperienceSpecifications for offline play.
 * Rule: Only specifications that have been validated and marked valid
 * may be cached. Invalid specifications are rejected before saving.
 */

import { GameExperienceSpecification, GameTemplate } from "../types";

export interface CachedSpecEntry {
  spec_id: string;
  person_id: string;
  game_template: GameTemplate;
  version: string;
  cached_at: string;
  checksum: string;
  specification: GameExperienceSpecification;
}

export class OfflineSpecCache {
  private static readonly STORAGE_KEY_PREFIX = "offline_game_spec_";
  private static readonly INDEX_KEY = "offline_game_specs_index";

  // In-memory fallback for non-browser / Node.js test environments
  private static memoryStore = new Map<string, CachedSpecEntry>();

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private static computeChecksum(spec: GameExperienceSpecification): string {
    const raw = `${spec.spec_id}:${spec.person_id}:${spec.game_template}:${spec.sequence.length}:${spec.created_at}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `chk_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Saves a validated specification into the cache.
   * Rejects if spec was not validated or failed validation.
   */
  public static saveValidatedSpecification(
    spec: GameExperienceSpecification
  ): { success: boolean; checksum?: string; error?: string } {
    if (!spec.validation_result?.is_valid) {
      return {
        success: false,
        error: "Cannot cache specification: Specification failed validation or has not been validated.",
      };
    }

    const checksum = this.computeChecksum(spec);
    const entry: CachedSpecEntry = {
      spec_id: spec.spec_id,
      person_id: spec.person_id,
      game_template: spec.game_template,
      version: spec.version,
      cached_at: new Date().toISOString(),
      checksum,
      specification: spec,
    };

    // Save in memory
    this.memoryStore.set(spec.spec_id, entry);

    // Save in LocalStorage if available
    if (this.isBrowser()) {
      try {
        const itemKey = `${this.STORAGE_KEY_PREFIX}${spec.spec_id}`;
        localStorage.setItem(itemKey, JSON.stringify(entry));

        // Update index
        const index = this.getStoredIndex();
        if (!index.includes(spec.spec_id)) {
          index.push(spec.spec_id);
          localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
        }
      } catch (err: any) {
        console.warn("Failed to write to localStorage, using in-memory cache:", err);
      }
    }

    return { success: true, checksum };
  }

  /**
   * Retrieves a cached specification by spec_id.
   */
  public static getCachedSpecification(
    specId: string
  ): GameExperienceSpecification | null {
    if (this.memoryStore.has(specId)) {
      return this.memoryStore.get(specId)!.specification;
    }

    if (this.isBrowser()) {
      try {
        const itemKey = `${this.STORAGE_KEY_PREFIX}${specId}`;
        const raw = localStorage.getItem(itemKey);
        if (raw) {
          const entry: CachedSpecEntry = JSON.parse(raw);
          this.memoryStore.set(specId, entry);
          return entry.specification;
        }
      } catch (err: any) {
        console.warn("Failed to read from localStorage:", err);
      }
    }

    return null;
  }

  /**
   * Gets the latest cached specification for a given person and game template.
   */
  public static getLatestCachedSpecification(
    personId: string,
    gameTemplate: GameTemplate
  ): GameExperienceSpecification | null {
    const all = this.listCachedSpecifications(personId);
    const matching = all
      .filter((entry) => entry.game_template === gameTemplate)
      .sort(
        (a, b) =>
          new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime()
      );

    return matching.length > 0 ? matching[0].specification : null;
  }

  /**
   * Lists all cached specifications, optionally filtered by personId.
   */
  public static listCachedSpecifications(personId?: string): CachedSpecEntry[] {
    const entries: CachedSpecEntry[] = [];

    if (this.isBrowser()) {
      const index = this.getStoredIndex();
      for (const id of index) {
        try {
          const raw = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${id}`);
          if (raw) {
            const entry: CachedSpecEntry = JSON.parse(raw);
            entries.push(entry);
            this.memoryStore.set(id, entry);
          }
        } catch {
          // ignore corrupted entry
        }
      }
    } else {
      entries.push(...Array.from(this.memoryStore.values()));
    }

    if (personId) {
      return entries.filter((e) => e.person_id === personId);
    }
    return entries;
  }

  /**
   * Removes a cached specification.
   */
  public static removeCachedSpecification(specId: string): boolean {
    this.memoryStore.delete(specId);

    if (this.isBrowser()) {
      try {
        localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${specId}`);
        const index = this.getStoredIndex().filter((id) => id !== specId);
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
      } catch (err) {
        console.warn("Failed to remove from localStorage:", err);
      }
    }
    return true;
  }

  /**
   * Clears the cache.
   */
  public static clearCache(): void {
    if (this.isBrowser()) {
      const index = this.getStoredIndex();
      for (const id of index) {
        localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${id}`);
      }
      localStorage.removeItem(this.INDEX_KEY);
    }
    this.memoryStore.clear();
  }

  private static getStoredIndex(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(this.INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
