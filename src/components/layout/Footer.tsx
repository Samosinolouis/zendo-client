import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  const { brand, footerSections } = siteConfig;

  return (
    <footer className="bg-foreground text-background/60 mt-auto relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-8 rounded-lg bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">{brand.initial}</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">{brand.name}</span>
            </div>
            <p className="text-sm leading-relaxed text-background/50">{brand.tagline}</p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-background/10" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">
            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
