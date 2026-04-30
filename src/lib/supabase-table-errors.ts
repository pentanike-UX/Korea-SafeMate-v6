/**
 * Supabase/PostgREST 오류가 “테이블·뷰 없음(마이그레이션 미적용)”인지 판별.
 * @see https://postgrest.org/en/stable/errors.html
 */
export function isSupabaseTableMissingError(err: { message?: string; code?: string } | null | undefined): boolean {
  if (!err) return false;
  const code = String(err.code ?? "");
  const m = (err.message ?? "").toLowerCase();
  // PostgREST schema cache
  if (code === "PGRST205") return true;
  // PostgreSQL undefined_table
  if (code === "42P01") return true;
  if (m.includes("schema cache") && (m.includes("not find") || m.includes("does not exist"))) return true;
  if (m.includes("spot_catalog") && m.includes("schema cache")) return true;
  if (m.includes("relation") && m.includes("does not exist")) return true;
  return false;
}
