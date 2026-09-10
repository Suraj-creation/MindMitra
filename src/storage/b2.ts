import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface B2Status {
  configured: boolean;
  connected: boolean;
  bucket?: string;
  endpoint?: string;
  region?: string;
  error?: string;
  diagnostic?: string;
}

let s3Client: S3Client | null = null;
let currentClientKey = "";

export function formatEndpoint(rawEndpoint?: string): string {
  let ep = (rawEndpoint || process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com").trim();
  if (!ep.startsWith("http://") && !ep.startsWith("https://")) {
    ep = `https://${ep}`;
  }
  return ep;
}

export function deriveRegion(endpoint: string, explicitRegion?: string): string {
  if (explicitRegion && explicitRegion.trim()) {
    return explicitRegion.trim();
  }
  const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  return match ? match[1] : "us-east-005";
}

export function getB2Client(): S3Client | null {
  const keyId = (process.env.B2_APPLICATION_KEY_ID || "").trim();
  const appKey = (process.env.B2_APPLICATION_KEY || "").trim();
  const endpoint = formatEndpoint(process.env.B2_ENDPOINT);
  const region = deriveRegion(endpoint, process.env.B2_REGION);

  if (!keyId || !appKey) {
    return null;
  }

  const clientKey = `${keyId}:${appKey}:${endpoint}:${region}`;
  if (!s3Client || currentClientKey !== clientKey) {
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
      forcePathStyle: true,
    });
    currentClientKey = clientKey;
  }

  return s3Client;
}

export async function checkB2Health(): Promise<B2Status> {
  const keyId = (process.env.B2_APPLICATION_KEY_ID || "").trim();
  const appKey = (process.env.B2_APPLICATION_KEY || "").trim();
  const bucket = (process.env.B2_BUCKET_NAME || "mindmitra").trim();
  const endpoint = formatEndpoint(process.env.B2_ENDPOINT);
  const region = deriveRegion(endpoint, process.env.B2_REGION);

  if (!keyId || !appKey) {
    return {
      configured: false,
      connected: false,
      bucket,
      endpoint,
      region,
      error: "B2_APPLICATION_KEY_ID or B2_APPLICATION_KEY is missing.",
      diagnostic: "Add B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME in Settings.",
    };
  }

  // Check for common Master Key mismatch:
  // Backblaze Master Application Keys end in 0000000001 and are rejected by S3 API
  const isMasterKeyId = keyId.endsWith("0000000001");

  const client = getB2Client();
  if (!client) {
    return {
      configured: false,
      connected: false,
      error: "Could not initialize Backblaze B2 S3 Client",
    };
  }

  try {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1,
    });
    await client.send(cmd);
    return {
      configured: true,
      connected: true,
      bucket,
      endpoint,
      region,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    let diagnostic = "";

    if (isMasterKeyId || msg.includes("is not valid")) {
      diagnostic =
        "Backblaze requires a custom Application Key for S3 compatibility, not the Master Application Key (which ends in 0000000001). Go to Backblaze Console > Application Keys > 'Add a New Application Key', select your bucket 'mindmitra' with 'Read and Write', and use that key's keyID and applicationKey.";
    }

    return {
      configured: true,
      connected: false,
      bucket,
      endpoint,
      region,
      error: msg,
      diagnostic,
    };
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string | null> {
  const client = getB2Client();
  const bucket = (process.env.B2_BUCKET_NAME || "mindmitra").trim();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
  const client = getB2Client();
  const bucket = (process.env.B2_BUCKET_NAME || "mindmitra").trim();
  if (!client) return null;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
