import { parseGuardianPostPayload, verifyGuardianPostsSecret } from "@/lib/guardian-posts-api";
import { insertGuardianContentPost } from "@/lib/guardian-posts-persist";

export async function POST(req: Request) {
  if (!verifyGuardianPostsSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseGuardianPostPayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await insertGuardianContentPost(payload);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 500 });
  }
  if (!result.saved) {
    return Response.json({
      saved: false,
      message: result.message,
      preview: result.preview,
    });
  }
  return Response.json({ id: result.id, saved: true });
}
