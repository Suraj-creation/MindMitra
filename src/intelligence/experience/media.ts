// Authorized media resolution for experiences (Sections 13/14/44/56).
//
// Reuses the existing Backblaze B2 client (src/storage/b2.ts) -- no second
// media pipeline, no second credential path. Credentials never leave the
// server: the browser only ever receives a short-lived presigned URL or a
// public asset path.
//
// The one rule that shapes this whole module: a media object that cannot be
// resolved returns null. It is never replaced by a stand-in image, because a
// stand-in makes "who is this?" a question about a stranger.

import * as repo from "../../db/person-data-repository";
import { getB2Client, getPresignedDownloadUrl } from "../../storage/b2";
import { ResolvedMedia } from "./types";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

const PRESIGN_TTL_SECONDS = 3600;

/** Cache of storage_key -> whether the object exists in B2, to avoid a HEAD per render. */
const b2ExistenceCache = new Map<string, { exists: boolean; checkedAt: number }>();
const EXISTENCE_TTL_MS = 5 * 60_000;

/**
 * A cap on how long the person waits for object storage to answer. If B2 is
 * slow or unreachable, the experience still renders from whatever resolved --
 * it does not sit on a loading screen while a bucket times out. A false
 * negative here is recoverable (the next request re-checks); a hung page is not.
 */
const HEAD_TIMEOUT_MS = 2500;

async function existsInB2(storageKey: string): Promise<boolean> {
  const cached = b2ExistenceCache.get(storageKey);
  if (cached && Date.now() - cached.checkedAt < EXISTENCE_TTL_MS) return cached.exists;

  const client = getB2Client();
  if (!client) {
    b2ExistenceCache.set(storageKey, { exists: false, checkedAt: Date.now() });
    return false;
  }
  const bucket = (process.env.B2_BUCKET_NAME || "mindmitra").trim();
  try {
    await Promise.race([
      client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey })),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("b2_head_timeout")), HEAD_TIMEOUT_MS)),
    ]);
    b2ExistenceCache.set(storageKey, { exists: true, checkedAt: Date.now() });
    return true;
  } catch {
    b2ExistenceCache.set(storageKey, { exists: false, checkedAt: Date.now() });
    return false;
  }
}

/**
 * Resolve authorized media for a person.
 *
 * Authorization happens in SQL (listAuthorizedMedia), not here -- this only
 * turns rows that already passed it into loadable URLs. Ids that were filtered
 * out simply do not appear in the returned map; callers must treat a missing
 * key as "no media", which is what makes a blocked photo degrade into a
 * text-only experience rather than a broken image.
 */
export async function resolveAuthorizedMedia(
  personId: string,
  mediaIds: string[],
  altTextById: Record<string, string> = {}
): Promise<Map<string, ResolvedMedia>> {
  const out = new Map<string, ResolvedMedia>();
  const unique = Array.from(new Set(mediaIds.filter(Boolean)));
  if (unique.length === 0) return out;

  const rows = await repo.listAuthorizedMedia(personId, unique).catch(() => []);

  // Resolved in parallel: each row may cost a round trip to object storage, and
  // doing them in sequence made opening the page wait for the sum of them.
  const resolved = await Promise.all(
    rows.map(async (row): Promise<ResolvedMedia | null> => {
      const key = row.storage_key || "";
      if (!key) return null;

      const mediaType = (["photo", "audio", "video", "document"] as const).includes(row.media_type as any)
        ? (row.media_type as ResolvedMedia["media_type"])
        : "photo";
      const altText = altTextById[row.id] || "A photograph from your own album.";

      if (/^https?:\/\//i.test(key)) {
        return {
          media_id: row.id,
          media_type: mediaType,
          url: key,
          alt_text: altText,
          source: "absolute_url",
          storage_key: key,
        };
      }

      // B2 first: this is where caregiver/family uploads land.
      if (await existsInB2(key)) {
        const url = await getPresignedDownloadUrl(key, PRESIGN_TTL_SECONDS).catch(() => null);
        if (url) {
          return {
            media_id: row.id,
            media_type: mediaType,
            url,
            alt_text: altText,
            source: "b2_presigned",
            storage_key: key,
            expires_at: new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000).toISOString(),
          };
        }
      }

      // Seeded/bundled assets live under public/. Still a real media record
      // with real provenance -- not a placeholder standing in for a missing
      // object.
      if (key.startsWith("assets/") || key.startsWith("/assets/")) {
        return {
          media_id: row.id,
          media_type: mediaType,
          url: key.startsWith("/") ? key : `/${key}`,
          alt_text: altText,
          source: "local_asset",
          storage_key: key,
        };
      }

      // Unresolvable: deliberately omitted. See the module header.
      return null;
    })
  );

  for (const m of resolved) {
    if (m) out.set(m.media_id, m);
  }

  return out;
}
