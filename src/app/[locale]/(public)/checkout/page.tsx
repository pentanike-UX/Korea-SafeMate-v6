import { CheckoutPanel } from "@/components/traveler/checkout-panel";

type Props = {
  searchParams: Promise<{ tier?: string | string[]; budget?: string | string[]; date?: string | string[]; note?: string | string[] }>;
};

function pickSingle(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tierRaw = pickSingle(sp.tier);
  const tier = tierRaw === "basic" || tierRaw === "premium" ? tierRaw : "standard";
  const budget = Number(pickSingle(sp.budget) || "0");
  const date = pickSingle(sp.date);
  const note = pickSingle(sp.note);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <CheckoutPanel tier={tier} budget={Number.isFinite(budget) ? budget : 0} date={date} note={note} />
    </main>
  );
}
