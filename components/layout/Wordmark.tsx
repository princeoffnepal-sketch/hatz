import Image from "next/image";
import { site } from "@/config/site";

/** Brand wordmark. Uses the logo file from site config when set, otherwise text. */
export function Wordmark({ className = "" }: { className?: string }) {
  if (site.logo) {
    return <Image src={site.logo.src} alt={site.name} width={site.logo.width} height={site.logo.height} className={`brand-wordmark ${className}`} />;
  }
  return (
    <span className={`whitespace-nowrap text-[0.9375rem] font-semibold tracking-[0.24em] sm:text-base ${className}`}>
      {site.name}
    </span>
  );
}
