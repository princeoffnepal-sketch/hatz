import Link from "next/link";
import { site } from "@/config/site";
import { isDemoCatalog } from "@/lib/catalog.server";
import { Wordmark } from "./Wordmark";

const SOCIAL_LABELS: Record<keyof typeof site.social, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
};

export function Footer() {
  const social = (Object.entries(site.social) as [keyof typeof site.social, string | null][]).filter(
    (entry): entry is [keyof typeof site.social, string] => Boolean(entry[1]),
  );
  const demo = isDemoCatalog();

  return (
    <footer className="on-dark mt-24 bg-night text-ivory">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.2fr_2fr] md:py-20">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-night-soft">{site.shortDescription}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {site.footerNav.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-sm font-semibold">{group.heading}</h2>
              <ul className="mt-3 space-y-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-10 items-center text-sm text-night-soft transition-colors hover:text-ivory">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {social.length > 0 && (
            <nav aria-label="Social">
              <h2 className="text-sm font-semibold">Follow</h2>
              <ul className="mt-3 space-y-0.5">
                {social.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} className="inline-flex min-h-10 items-center text-sm text-night-soft hover:text-ivory" rel="noopener" target="_blank">
                      {SOCIAL_LABELS[key]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-night-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.name}
            {site.business.legalName ? ` · ${site.business.legalName}` : " · Business details will be added before launch."}
          </p>
          {demo && <p className="font-mono tracking-wide">DEMO STORE · NO ORDERS ARE TAKEN</p>}
        </div>
      </div>
    </footer>
  );
}
