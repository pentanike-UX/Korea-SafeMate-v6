import { MypageHubShell } from "@/components/mypage/mypage-hub-shell";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { guardianStatusFromRow, type GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { buildMockAccountMePayload } from "@/lib/dev/mock-guardian-auth";
import { getMockGuardianIdFromCookies } from "@/lib/dev/mock-guardian-cookies.server";
import { getMypageHubSnapshot } from "@/lib/mypage-hub-snapshot.server";
import { getMypagePointsBundleCached } from "@/lib/points/mypage-points-data.server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  let appRole: AppAccountRole = "traveler";
  let guardianStatus: GuardianProfileStatus = "none";
  let accountDisplayName = "";
  let accountEmail: string | null = null;
  let accountAvatarUrl: string | null = null;
  let memberSinceIso: string | null = null;
  let accountUserId: string | null = null;

  const mockId = await getMockGuardianIdFromCookies();
  if (mockId) {
    const mock = buildMockAccountMePayload(mockId);
    if (mock) {
      const [snapshot, pointsBundle] = await Promise.all([
        getMypageHubSnapshot(mock.auth.id, "guardian", mock.guardian_status),
        getMypagePointsBundleCached(mock.auth.id),
      ]);
      return (
        <MypageHubShell
          appRole="guardian"
          guardianStatus={mock.guardian_status}
          accountDisplayName={mock.profile.display_name?.trim() || mock.user.legal_name || ""}
          accountEmail={mock.auth.email ?? null}
          accountAvatarUrl={mock.profile.profile_image_url}
          memberSinceIso={mock.user.created_at}
          accountUserId={mock.auth.id}
          snapshot={snapshot}
          pointsSheetInitial={pointsBundle.api}
        >
          {children}
        </MypageHubShell>
      );
    }
  }

  const sb = await getServerSupabaseForUser();
  if (sb) {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      accountUserId = user.id;
      accountEmail = user.email ?? null;
      memberSinceIso = user.created_at ?? null;
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const oauthAvatar =
        (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta?.picture === "string" && meta.picture) ||
        null;
      const [{ data: u }, { data: up }] = await Promise.all([
        sb.from("users").select("app_role, legal_name, email").eq("id", user.id).maybeSingle(),
        sb.from("user_profiles").select("display_name, profile_image_url").eq("user_id", user.id).maybeSingle(),
      ]);
      appRole = (u?.app_role as AppAccountRole | undefined) ?? "traveler";
      const rowEmail = u?.email as string | null | undefined;
      if (rowEmail) accountEmail = rowEmail;
      const storedAvatar = (up?.profile_image_url as string | null | undefined)?.trim() || null;
      accountAvatarUrl = storedAvatar || oauthAvatar;
      accountDisplayName =
        (up?.display_name as string | null | undefined)?.trim() ||
        (u?.legal_name as string | null | undefined)?.trim() ||
        (accountEmail ? accountEmail.split("@")[0] : "") ||
        "";

      const { data: gp } = await sb
        .from("guardian_profiles")
        .select("profile_status, approval_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (gp) {
        guardianStatus = guardianStatusFromRow(
          gp as { profile_status?: string | null; approval_status?: string | null },
        );
      }
    }
  }

  const [snapshot, pointsBundle] = await Promise.all([
    getMypageHubSnapshot(accountUserId, appRole, guardianStatus),
    accountUserId ? getMypagePointsBundleCached(accountUserId) : Promise.resolve(null),
  ]);

  return (
    <MypageHubShell
      appRole={appRole}
      guardianStatus={guardianStatus}
      accountDisplayName={accountDisplayName}
      accountEmail={accountEmail}
      accountAvatarUrl={accountAvatarUrl}
      memberSinceIso={memberSinceIso}
      accountUserId={accountUserId}
      snapshot={snapshot}
      pointsSheetInitial={pointsBundle?.api ?? null}
    >
      {children}
    </MypageHubShell>
  );
}
