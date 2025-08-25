import React from "react";

/**
 * SiteFooter
 * ---------------------------------
 * Tall, dark footer with 3 columns on desktop, stacked on mobile.
 * Left (1/3): large logo + brand text.
 * Middle (1/3): "Information" links.
 * Right (1/3): "More Resources" links.
 * Full-width under the two lists: two-tier section with:
 *   - Top: About the BSB text
 *   - Bottom: Other projects links + Donate button
 *
 * Replace the placeholder links/text below with your real content.
 */

type LinkItem = { label: string; href: string; newTab?: boolean };

const INFORMATION_LINKS: LinkItem[] = [
  { label: "About the BSB", href: "https://bereanbibles.com/about-berean-study-bible/" },
  { label: "Public Domain BSB", href: "https://berean.bible/licensing.htm" },
  { label: "Bible Translations Rated", href: "https://copy.church/initiatives/bibles/" },
];

const MORE_RESOURCES_LINKS: LinkItem[] = [
  { label: "Custom Bible Reading Plans", href: "https://custombibleplan.com/" },
  { label: "Lofi Bible", href: "https://lofi.bible/" },
  { label: "BaptistHymnal.org", href: "https://baptisthymnal.org/" },
];

export default function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="mt-12 border-t border-zinc-200/20 bg-zinc-900 text-zinc-100 dark:border-white/10 dark:bg-black dark:text-zinc-200"
    >
      {/* Top area */}
      <div className="mx-auto w-4/5 max-w-screen-2xl py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Left: brand block */}
          <div className="flex flex-col items-start gap-3">
            <img
              src="/img/ReadBSBlogo.png"
              alt="ReadBSB logo"
              className="h-32 w-32 rounded"
              decoding="async"
              loading="lazy"
            />
            <div className="text-xl font-semibold tracking-wide">ReadBSB.com</div>
            <p className="max-w-sm text-xs leading-relaxed opacity-70">
              A minimal Berean Standard Bible reader focused on providing a clean, inviting, and distraction-free user experience.
            </p>
          </div>

          {/* Middle: Information links */}
          <FooterSection title="Information" links={INFORMATION_LINKS} />

          {/* Right: More Resources links */}
          <FooterSection title="More Resources" links={MORE_RESOURCES_LINKS} />

          {/* Full-width two-tier section */}
          <div className="sm:col-span-3">
            {/* Top tier: About the BSB */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider opacity-90">About the Site</h3>
              
              <div className="md:flex gap-4 items-center justify-between">
                <p className="text-sm opacity-85">
                  This Bible reading app is presented without advertisements, freely given to all users in perpetuity. 
                  See <a href="https://thedoreanprinciple.org" target="_blank" rel="noreferrer noopener" className="underline">The Dorean Principle</a> for more information.
                </p>
                <a href="https://ko-fi.com/ryancornett" target="_blank" rel="noreferrer noopener">
                  <button
                    type="button"
                    className="rounded-xl bg-primary-400 hover:bg-primary-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary-500 transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
                  disabled:opacity-50 cursor-pointer sm:mt-0 mt-2"
                  >Support the Site
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="mx-auto w-4/5 max-w-screen-2xl border-t border-white/10 py-4 text-xs opacity-80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>{new Date().getFullYear()} ReadBSB | Site by <a href="https://ryancornett.com" target="_blank" rel="noopener noreferrer"  className="underline">Ryan Cornett</a></div>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-2 pt-4 text-sm font-semibold uppercase tracking-wider opacity-90">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.newTab ? "_blank" : undefined}
              rel={l.newTab ? "noopener noreferrer" : undefined}
              className="text-zinc-200 underline-offset-4 hover:text-white hover:underline dark:text-zinc-300"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
