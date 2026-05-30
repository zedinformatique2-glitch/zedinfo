import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type Counts = {
  categories: number;
  products: number;
  prebuilts: number;
  orders: number;
  landingPages: number;
  savedBuilds: number;
  promotions: number;
  deliveryCarriers: number;
};

type CollectResult = {
  snapshot: unknown;
  imageUrls: string[];
  counts: Counts;
};

type PerformResult = {
  backupId: Id<"backups">;
  prefix: string;
  imagesCopied: number;
  imagesFailed: number;
};

// ---------------------------------------------------------------------------
// Minimal AWS SigV4 signer for Cloudflare R2 (S3-compatible), using Web Crypto.
// We avoid an npm dependency because Convex's bundler externalizes aws4fetch.
// ---------------------------------------------------------------------------

const SERVICE = "s3";
const REGION = "auto";
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(data)));
}

async function hmac(key: BufferSource, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
}

async function signingKey(
  secret: string,
  dateStamp: string
): Promise<ArrayBuffer> {
  // Pass the Uint8Array view directly (NOT .buffer): some runtimes back the
  // view with a larger pooled ArrayBuffer, which would corrupt the key.
  let k = await hmac(enc.encode("AWS4" + secret), dateStamp);
  k = await hmac(k, REGION);
  k = await hmac(k, SERVICE);
  k = await hmac(k, "aws4_request");
  return k;
}

// RFC3986 encoding for canonical URIs (keep "/" as path separator handling done by caller).
function uriEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

type R2 = {
  accessKeyId: string;
  secret: string;
  host: string;
  origin: string;
  bucket: string;
};

function r2Config(): R2 {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!accessKeyId || !secret || !endpoint || !bucket) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT and R2_BUCKET in Convex env."
    );
  }
  const origin = endpoint.replace(/\/$/, "");
  const host = new URL(origin).host;
  return { accessKeyId, secret, host, origin, bucket };
}

// Build the two timestamp formats SigV4 needs.
function stamps(now: number) {
  const amzDate = new Date(now)
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

// Canonical object path: "/bucket/key/parts" with each segment URI-encoded.
function canonicalPath(r2: R2, key: string): string {
  const segments = [r2.bucket, ...key.split("/")].map(uriEncode);
  return "/" + segments.join("/");
}

// Signed PUT of an object to R2. content-type is sent but intentionally NOT
// signed (some fetch impls rewrite it), so only host/date/payload are signed.
async function putObject(
  r2: R2,
  key: string,
  body: ArrayBuffer | string,
  contentType: string
): Promise<void> {
  const { amzDate, dateStamp } = stamps(Date.now());
  const bodyBytes = typeof body === "string" ? enc.encode(body) : new Uint8Array(body);
  const payloadHash = toHex(await crypto.subtle.digest("SHA-256", bodyBytes));
  const path = canonicalPath(r2, key);

  const canonicalHeaders =
    `host:${r2.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const sig = toHex(await hmac(await signingKey(r2.secret, dateStamp), stringToSign));
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${r2.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const res = await fetch(`${r2.origin}${path}`, {
    method: "PUT",
    body: bodyBytes,
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status}: ${text.slice(0, 1500)}`);
  }
}

// Presigned (query-signed) GET URL, valid for `expires` seconds.
async function presignGet(r2: R2, key: string, expires: number): Promise<string> {
  const { amzDate, dateStamp } = stamps(Date.now());
  const path = canonicalPath(r2, key);
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const signedHeaders = "host";

  const query = new Map<string, string>([
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${r2.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expires)],
    ["X-Amz-SignedHeaders", signedHeaders],
  ]);
  const canonicalQuery = [...query.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, val]) => `${uriEncode(k)}=${uriEncode(val)}`)
    .join("&");

  const canonicalRequest = [
    "GET",
    path,
    canonicalQuery,
    `host:${r2.host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const sig = toHex(await hmac(await signingKey(r2.secret, dateStamp), stringToSign));
  return `${r2.origin}${path}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}

// Filename-safe last segment of a URL, for the snapshot's image folder.
function lastSegment(url: string): string {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").filter(Boolean).pop() ?? "image";
    return seg.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "image";
  } catch {
    return "image";
  }
}

// ---------------------------------------------------------------------------
// Backup worker.
// ---------------------------------------------------------------------------

export const perform = internalAction({
  args: { trigger: v.union(v.literal("manual"), v.literal("cron")) },
  handler: async (ctx, args): Promise<PerformResult> => {
    const startedAt = Date.now();
    const stamp = new Date(startedAt).toISOString().replace(/[:.]/g, "-");
    const prefix = `snapshots/${stamp}`;

    const backupId: Id<"backups"> = await ctx.runMutation(
      internal.backup.recordStart,
      {
        prefix,
        trigger: args.trigger,
        startedAt,
      }
    );

    try {
      const r2 = r2Config();
      const { snapshot, imageUrls, counts }: CollectResult =
        await ctx.runQuery(internal.backup.collectData, {});

      // 1) Catalog/data first — the most important part is safe immediately.
      const dataJson = JSON.stringify(snapshot);
      const dataBytes = enc.encode(dataJson).byteLength;
      await putObject(r2, `${prefix}/data.json`, dataJson, "application/json");

      // 2) Copy images into the snapshot, with bounded concurrency.
      const manifest: Array<{
        url: string;
        key: string;
        bytes: number;
        contentType: string;
        ok: boolean;
        error?: string;
      }> = [];
      let imageBytes = 0;
      let imagesCopied = 0;
      let imagesFailed = 0;

      const seenKeys = new Set<string>();
      const targets = imageUrls.map((url, i) => {
        let key = `${prefix}/images/${i}-${lastSegment(url)}`;
        while (seenKeys.has(key)) key = `${key}-x`;
        seenKeys.add(key);
        return { url, key };
      });

      const CONCURRENCY = 8;
      for (let i = 0; i < targets.length; i += CONCURRENCY) {
        const batch = targets.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async ({ url, key }) => {
            try {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error(`fetch ${resp.status}`);
              const buf = await resp.arrayBuffer();
              const contentType =
                resp.headers.get("content-type") || "application/octet-stream";
              await putObject(r2, key, buf, contentType);
              imageBytes += buf.byteLength;
              imagesCopied += 1;
              manifest.push({ url, key, bytes: buf.byteLength, contentType, ok: true });
            } catch (e) {
              imagesFailed += 1;
              manifest.push({
                url,
                key,
                bytes: 0,
                contentType: "",
                ok: false,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          })
        );
      }

      // 3) Manifest mapping original URL -> snapshot key.
      await putObject(
        r2,
        `${prefix}/manifest.json`,
        JSON.stringify({ takenAt: startedAt, images: manifest }, null, 2),
        "application/json"
      );

      await ctx.runMutation(internal.backup.recordFinish, {
        id: backupId,
        finishedAt: Date.now(),
        status: "completed",
        counts,
        dataBytes,
        imageBytes,
        imagesTotal: imageUrls.length,
        imagesCopied,
        imagesFailed,
      });

      return { backupId, prefix, imagesCopied, imagesFailed };
    } catch (e) {
      await ctx.runMutation(internal.backup.recordFinish, {
        id: backupId,
        finishedAt: Date.now(),
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },
});

// Public trigger used by the admin "Create backup now" button.
export const run = action({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    return await ctx.runAction(internal.backupActions.perform, {
      trigger: "manual",
    });
  },
});

// Presigned, time-limited download link for a snapshot's data.json.
export const downloadUrl = action({
  args: { prefix: v.string() },
  handler: async (_ctx, args) => {
    const r2 = r2Config();
    return await presignGet(r2, `${args.prefix}/data.json`, 3600);
  },
});
