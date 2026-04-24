import { mockContentPosts } from "@/data/mock";
import { AdminContentTable } from "@/components/admin/admin-content-table";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

export const metadata = {
  title: "Content | Admin",
};

export default function AdminContentPage() {
  const pending = mockContentPosts.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-10">
      <div>
        <AdminOpsPillarHeader
          pillar="content"
          title="Content quality & moderation"
          description="Editorial standards and approvals — separate from booking assignment and from guardian verification toggles."
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Content</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {/* TODO(prod): Content management integration — queues, SLAs, moderator roles, spam signals. */}
          Approve or reject posts; approved items feed contribution metrics used elsewhere.
        </p>
      </div>

      <div className="grid gap-3 sm:max-w-md">
        <AdminStatCard label="Pending moderation" value={pending} hint="Mock queue depth" />
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-semibold tracking-tight">All posts</h2>
        <AdminContentTable posts={mockContentPosts} />
      </div>
    </div>
  );
}
