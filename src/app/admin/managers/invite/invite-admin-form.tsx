"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdminByEmail, type InviteAdminState } from "./actions";

export function InviteAdminForm() {
  const [state, formAction, pending] = useActionState(inviteAdminByEmail, null as InviteAdminState | null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" name="email" type="email" required autoComplete="email" placeholder="ops@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          name="role"
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          defaultValue="admin"
        >
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
      </div>
      {state?.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state?.ok ? <p className="text-muted-foreground text-sm">Invitation created. They can sign in with Google using this email.</p> : null}
      <Button type="submit" disabled={pending} className="rounded-lg">
        {pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
