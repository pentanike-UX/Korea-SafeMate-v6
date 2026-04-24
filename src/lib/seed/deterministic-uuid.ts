import { createHash } from "node:crypto";

/** DNS namespace UUID (RFC 4122) as bytes — namespace for app-specific v5 names. */
const NS_BYTES = Buffer.from("6ba7b8109dad11d180b400c04fd430c8", "hex");

/**
 * Deterministic UUID v5 — same `name` always yields same UUID (per process).
 * Use for sample `users.id` / `content_posts.id` so seed imports are idempotent.
 */
export function seedUuidV5(name: string): string {
  const hash = createHash("sha1");
  hash.update(NS_BYTES);
  hash.update(name, "utf8");
  const digest = hash.digest();
  const bytes = Buffer.alloc(16);
  digest.copy(bytes, 0, 0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const GUARDIAN_PREFIX = "safemate:seed:guardian:";
const POST_PREFIX = "safemate:seed:post:";

export function seedGuardianUserUuid(seedGuardianKey: string): string {
  return seedUuidV5(`${GUARDIAN_PREFIX}${seedGuardianKey.trim()}`);
}

export function seedContentPostUuid(seedContentKey: string): string {
  return seedUuidV5(`${POST_PREFIX}${seedContentKey.trim()}`);
}
