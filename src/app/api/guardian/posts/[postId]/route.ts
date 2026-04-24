import { isUuidString, parseGuardianPostPayload, verifyGuardianPostsSecret } from "@/lib/guardian-posts-api";
import { updateGuardianContentPost } from "@/lib/guardian-posts-persist";

type Props = { params: Promise<{ postId: string }> };

export async function PATCH(req: Request, ctx: Props) {
  if (!verifyGuardianPostsSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await ctx.params;
  if (!isUuidString(postId)) {
    return Response.json({ error: "postId must be a UUID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseGuardianPostPayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid payload (full resource expected)" }, { status: 400 });
  }

  const result = await updateGuardianContentPost(postId, payload);
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
