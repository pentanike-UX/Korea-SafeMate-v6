import Image from "next/image";
import { FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM } from "@/lib/ui/fill-image";

/**
 * 「이 가디언을 소개합니다」 직후 — 서술을 보조하는 가벼운 가로 스크롤 갤러리.
 */
export function GuardianIntroGallery({
  displayName,
  urls,
  title,
  lead,
}: {
  displayName: string;
  urls: string[];
  title: string;
  lead: string;
}) {
  if (urls.length === 0) return null;

  return (
    <section aria-label={title} className="border-border/50 rounded-2xl border border-dashed bg-muted/20 px-3 py-5 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h2 className="text-text-strong text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed sm:text-sm">{lead}</p>
      </div>
      <div className="scrollbar-thin -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-gutter:stable] sm:gap-4">
        {urls.map((src) => (
          <figure
            key={src}
            className="border-border/60 relative aspect-[4/3] w-[min(88vw,17.5rem)] shrink-0 snap-center snap-always overflow-hidden rounded-xl border bg-muted shadow-sm sm:w-[min(42vw,14rem)] md:w-[min(30vw,12.5rem)]"
          >
            <Image
              src={src}
              alt=""
              fill
              className={FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM}
              sizes="(max-width:640px) 88vw, 280px"
            />
            <figcaption className="sr-only">{displayName}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
