import React, { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import MobileTopDrawer from "./MobileTopDrawer";
import SelectorBar, { ReferenceValue } from "./SelectorBar";
import { listBooks, fetchChapterHtml } from '../services/bible';

/**
 * AppShell: page-level layout only (no data, no logic).
 * Regions:
 * - <header> (sticky)
 * - <main> with:
 *    - previous arrow
 *    - selector bar
 *    - bible text container
 *    - next arrow
 * - <section id="footnotes">
 * - <section id="cross-references">
 * - <footer>
 */
export default function AppShell() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [books, setBooks] = useState<UIBook[]>([]);
  const [current, setCurrent] = useState<ReferenceValue>({
    versionId: 'BSB',
    bookId: '',
    chapter: 1,
  });
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load book metadata on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await listBooks();
        if (!alive) return;
        const uiBooks: UIBook[] = b.map(x => ({ id: x.id, name: x.name, chapters: x.chapters, abbr: x.abbr }));
        setBooks(uiBooks);
        // Default to John 3 if nothing set yet
        const first = uiBooks.find(x => x.name === 'John') ?? uiBooks[0];
        setCurrent(c => ({ ...c, bookId: c.bookId || first.id, chapter: c.chapter || 1 }));
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load books');
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load chapter HTML whenever selection changes
  useEffect(() => {
    if (!current.bookId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const html = await fetchChapterHtml(current.bookId, current.chapter);
        if (!ctrl.signal.aborted) setHtml(html);
      } catch (e: any) {
        if (!ctrl.signal.aborted) setErr(e?.message ?? 'Failed to load chapter');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [current.bookId, current.chapter]);

  // Single-version app: pass just BSB; you can hide the version <select> in SelectorBar if desired
  const versions = useMemo(() => [{ id: 'BSB', label: 'BSB' }], []);






  

  return (
    <div className="min-h-dvh flex flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <Header
        onOpenSettings={() => {/* TODO: open settings dialog */}}
        onToggleAudio={() => {/* TODO: toggle audio panel */}}
        onShare={() => {
          if (navigator.share) navigator.share({ title: document.title, url: location.href });
          else navigator.clipboard.writeText(location.href);
        }}
        onToggleTheme={() => {
          const html = document.documentElement;
          html.classList.toggle("dark");
        }}
        onOpenMobileMenu={() => setDrawerOpen(true)}
      />

      <MobileTopDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {/* TODO: put quick links, book/chapter picker entry point, settings toggle, etc. */}
        <button className="rounded border px-3 py-2">Open Book/Chapter</button>
      </MobileTopDrawer>

      {/* MAIN */}
      <main id="main" role="main" className="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-4 sm:px-4">
        {/* Selector bar */}
        <SelectorBar
            books={books}
            value={current}
            onChange={setCurrent}
            onJump={setCurrent}
            className="sticky top-0 z-20"
        />

        {/* Reader frame */}
        <div id="bible-wrapper" className="relative">
          {/* Previous arrow (hidden on mobile; appears on sm+) */}
          <button
            id="previous-chapter-arrow"
            className="group fixed left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white dark:bg-zinc-800/85 dark:hover:bg-zinc-800 sm:block"
            aria-label="Previous chapter"
          >
            <sl-icon name="chevron-left" class="text-2xl"></sl-icon>
          </button>

          {/* Next arrow (hidden on mobile; appears on sm+) */}
          <button
            id="next-chapter-arrow"
            className="group fixed right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white dark:bg-zinc-800/85 dark:hover:bg-zinc-800 sm:block"
            aria-label="Next chapter"
          >
            <sl-icon name="chevron-right" class="text-2xl"></sl-icon>
          </button>

          {/* Back to top (mobile-friendly) */}
          <button
            id="floating-back-to-top-arrow"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-3 rounded-full bg-blue-600 p-2 text-white shadow sm:bottom-6"
            aria-label="Back to top"
          >
            <sl-icon name="arrow-up"></sl-icon>
          </button>

          {/* Bible text container */}
          <div
            id="bible-container"
            className="mx-auto max-w-prose font-serif leading-relaxed mx-auto max-w-4xl px-3 py-4 sm:px-4"
            aria-label="Bible text"
          >
            {err && (
          <div className="mb-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40">
            {err}
          </div>
                )}
                {loading && (
                <div className="mb-3 animate-pulse rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    Loading…
                </div>
                )}
                {!loading && !err && (
                // IMPORTANT: must wrap fetch(bible) HTML in .fetch-bible
                <div className="fetch-bible fb-plain prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: html }} />
                )}
          </div>

          {/* Footnotes */}
          <section
            id="footnotes"
            aria-label="Footnotes"
            className="mx-auto mt-6 max-w-prose border-t pt-4 text-sm opacity-90 dark:border-white/10"
          >
            <p className="opacity-60">[Footnotes will appear here]</p>
          </section>

          {/* Cross References */}
          <section
            id="cross-references"
            aria-label="Cross references"
            className="mx-auto mt-6 max-w-prose border-t pt-4 text-sm opacity-90 dark:border-white/10"
          >
            <p className="opacity-60">[Cross references will appear here]</p>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        role="contentinfo"
        className="border-t border-black/10 px-3 py-6 text-sm opacity-80 dark:border-white/10 sm:px-4"
      >
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} ReadBSB</div>
            <nav className="flex items-center gap-3" aria-label="Footer links">
              <a className="hover:underline" href="#" rel="noopener">About</a>
              <a className="hover:underline" href="#" rel="noopener">License</a>
              <a className="hover:underline" href="#" rel="noopener">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
