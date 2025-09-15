import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./Header";
import MobileTopDrawer from "./MobileTopDrawer";
import SelectorBar, { type ReferenceValue, type Book as UIBook } from "./SelectorBar";
import { listBooks, fetchChapterHtml } from "../services/bible";
import { get_chapters } from "@gracious.tech/fetch-client";
import SettingsFontButton from "../components/SettingsFontButton";
import { useFontSize } from "../state/FontSizeContext";
import Footer from "./Footer";
import { scrollToBible, getHeaderOffsetPx } from "../services/scrollToBible";
import AudioPanel from "../components/AudioPanel";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import { useQueryState, parseAsInteger } from "nuqs";

export default function AppShell() {
  const [audioOpen, setAudioOpen] = useState(false);
  const { textClass } = useFontSize();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [books, setBooks] = useState<UIBook[]>([]);
  const handleOpenMobileMenu = useCallback(() => setDrawerOpen(true), []);
  const handleCloseMobileMenu = useCallback(() => setDrawerOpen(false), []);
  const [notesOn, setNotesOn] = useState(true);
const handleToggleNotes = useCallback(() => {
    setNotesOn(v => !v);
  }, []);

  useEffect(() => {
    // reflect state to the DOM root
    document.documentElement.classList.toggle("notes-off", !notesOn);
  }, [notesOn]);

const handleToggleAudio = useCallback(() => setAudioOpen(o => !o), []);
const handleShare = useCallback(() => {
  if (navigator.share) navigator.share({ title: document.title, url: location.href });
  else navigator.clipboard.writeText(location.href);
}, []);
const handleToggleTheme = useCallback(() => {
  const html = document.documentElement;
  html.classList.toggle("dark");
  localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light");
}, []);

  const [bookId, setBookId] = useQueryState('bookId');
  const [chapter, setChapter] = useQueryState('chapter', parseAsInteger.withDefault(1));
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeBook = React.useMemo(() => {
    const id = (bookId || "").toUpperCase();
    return books.find(b => b.id.toUpperCase() === id) || null;
  }, [books, bookId]);

  const bookLabel = activeBook?.name ?? activeBook?.abbr ?? (bookId || "").toUpperCase();


  // Load book metadata on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await listBooks();
        if (!alive) return;
        // ⬇️ No `chapters` here anymore
        const uiBooks: UIBook[] = b.map(x => ({ id: x.id, name: x.name, abbr: x.abbr }));
        setBooks(uiBooks);
        // Default to John if present; otherwise first book
        const first = uiBooks.find(x => x.name === "John") ?? uiBooks[0];
        if (!bookId && first) {
          setBookId(first.id);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load books");
      }
    })();
    return () => {
      alive = false;
    };
  }, [bookId, setBookId]);

  // Load chapter HTML whenever selection changes
  useEffect(() => {
    if (!bookId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const html = await fetchChapterHtml(bookId, chapter);
        if (!ctrl.signal.aborted) setHtml(html);
      } catch (e: any) {
        if (!ctrl.signal.aborted) setErr(e?.message ?? "Failed to load chapter");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [bookId, chapter]);

const getChapterNumbers = (bookId: string) => get_chapters(bookId);

// Create current reference object for navigation functions
const current = useMemo(() => ({
  bookId: bookId || "",
  chapter: chapter
}), [bookId, chapter]);

const prevCandidate = getPrevRef(current, books, getChapterNumbers, true);
const nextCandidate = getNextRef(current, books, getChapterNumbers, true);
const canGoPrev = !!prevCandidate; // with wrap+nonempty books this will be true
const canGoNext = !!nextCandidate;

// Compute previous/next refs across books
function getPrevRef(
  current: ReferenceValue,
  books: { id: string; name: string; abbr?: string }[],
  getChapterNumbers: (bookId: string) => number[],
  wrapAcrossEnds = true
): ReferenceValue | null {
  if (!current.bookId || books.length === 0) return null;

  const idx = books.findIndex(b => b.id === current.bookId);
  if (idx < 0) return null;

  const chs = getChapterNumbers(current.bookId);
  const minCh = chs.length ? Math.min(...chs) : 1;

  // Same book, previous chapter
  if (current.chapter > minCh) {
    return { ...current, chapter: current.chapter - 1 };
  }

  // Previous book
  if (idx > 0) {
    const prevBook = books[idx - 1];
    const prevChs = getChapterNumbers(prevBook.id);
    const last = prevChs.length ? Math.max(...prevChs) : 1;
    return { ...current, bookId: prevBook.id, chapter: last };
  }

  // Wrap: go to last book's last chapter (e.g., Genesis 1 ⇠ Revelation 22)
  if (wrapAcrossEnds) {
    const lastBook = books[books.length - 1];
    const lastChs = getChapterNumbers(lastBook.id);
    const last = lastChs.length ? Math.max(...lastChs) : 1;
    return { ...current, bookId: lastBook.id, chapter: last };
  }

  return null;
}

function getNextRef(
  current: ReferenceValue,
  books: { id: string; name: string; abbr?: string }[],
  getChapterNumbers: (bookId: string) => number[],
  wrapAcrossEnds = true
): ReferenceValue | null {
  if (!current.bookId || books.length === 0) return null;

  const idx = books.findIndex(b => b.id === current.bookId);
  if (idx < 0) return null;

  const chs = getChapterNumbers(current.bookId);
  const maxCh = chs.length ? Math.max(...chs) : 1;

  // Same book, next chapter
  if (current.chapter < maxCh) {
    return { ...current, chapter: current.chapter + 1 };
  }

  // Next book
  if (idx < books.length - 1) {
    const nextBook = books[idx + 1];
    const nextChs = getChapterNumbers(nextBook.id);
    const first = nextChs.length ? Math.min(...nextChs) : 1;
    return { ...current, bookId: nextBook.id, chapter: first };
  }

  // Wrap: go to first book's first chapter (e.g., Revelation 22 ⇢ Genesis 1)
  if (wrapAcrossEnds) {
    const firstBook = books[0];
    const firstChs = getChapterNumbers(firstBook.id);
    const first = firstChs.length ? Math.min(...firstChs) : 1;
    return { ...current, bookId: firstBook.id, chapter: first };
  }

  return null;
}




  return (
    <div className="min-h-dvh flex flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <Header
        onToggleAudio={() => setAudioOpen(o => !o)}
        onShare={() => {
          if (navigator.share) navigator.share({ title: document.title, url: location.href });
          else navigator.clipboard.writeText(location.href);
        }}
        onToggleTheme={() => {
          const html = document.documentElement;
          html.classList.toggle('dark');
          localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        }}
        onOpenMobileMenu={handleOpenMobileMenu}
        onToggleNotes={handleToggleNotes}
        notesOn={notesOn}
      />

      <MobileTopDrawer open={drawerOpen} onClose={handleCloseMobileMenu}>
  <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
    {/* Font size */}
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">Font size</span>
      {/* Adjust import path if needed */}
      <SettingsFontButton />
    </div>

    {/* Audio */}
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">Audio player</span>
      <button
        type="button"
        onClick={() => { handleToggleAudio(); handleCloseMobileMenu(); }}
        className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10"
        aria-label="Audio"
        title="Audio"
      >
        <SlIcon name="headphones"/>
      </button>
    </div>

    {/* Share */}
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">Share</span>
      <button
        type="button"
        onClick={() => { handleShare(); handleCloseMobileMenu(); }}
        className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10"
        aria-label="Share"
        title="Share"
      >
        <SlIcon name="share-fill" />
      </button>
    </div>

    {/* Theme */}
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">Theme</span>
      <button
        type="button"
        onClick={handleToggleTheme}
        className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <SlIcon name="sun-fill" className="block dark:hidden" />
        <SlIcon name="moon-fill" className="hidden dark:block" />
      </button>
    </div>
  </div>
</MobileTopDrawer>



      {/* MAIN */}
      <main id="main" role="main" className="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-4 sm:px-4 min-h-[calc(100dvh-3.5rem)]">
  <SelectorBar
    books={books}
    value={current}
    onChange={(newRef) => {
      setBookId(newRef.bookId);
      setChapter(newRef.chapter);
    }}
    onJump={(newRef) => {
      setBookId(newRef.bookId);
      setChapter(newRef.chapter);
    }}
    getChapterNumbers={getChapterNumbers}
    showVersion={false}
    className="sticky top-0 z-20"
  />


        {/* Reader frame */}
        <div id="bible-wrapper relative" className="relative">
          {/* Previous arrow */}
          <button
            id="previous-chapter-arrow"
            className="group fixed left-2 top-5/7 sm:top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800/85 dark:hover:bg-zinc-800 sm:block transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-x-0.5 hover:shadow-md cursor-pointer"
            aria-label="Previous chapter"
            onClick={() => {
              if (prevCandidate) {
                setBookId(prevCandidate.bookId);
                setChapter(prevCandidate.chapter);
                scrollToBible(getHeaderOffsetPx());
              }}}
            disabled={!canGoPrev}
          >
            <SlIcon name="chevron-left" className="text-2xl" />
          </button>

          {/* Next arrow */}
          <button
            id="next-chapter-arrow"
            className="group fixed right-2 top-5/7 sm:top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800/85 dark:hover:bg-zinc-800 sm:block transition-all duration-200 ease-out motion-reduce:transition-none hover:translate-x-0.5 hover:shadow-md cursor-pointer"
            aria-label="Next chapter"
            onClick={() => { if (nextCandidate) {
              setBookId(nextCandidate.bookId);
              setChapter(nextCandidate.chapter);
              scrollToBible(getHeaderOffsetPx());
              }}}
            disabled={!canGoNext}
          >
            <SlIcon name="chevron-right" className="text-2xl" />
          </button>


          {/* Back to top (mobile-friendly) */}
          <button
            id="floating-back-to-top-arrow"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed hidden sm:block bottom-16 right-3 rounded-full bg-primary-400 hover:bg-primary-500 p-2 text-white shadow sm:bottom-6 transition-all duration-300 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer z-1000"
            aria-label="Back to top"
          >
            <SlIcon name="arrow-up"></SlIcon>
          </button>

          {/* Bible text container */}
          <div
            id="bible-container"
            className={`mx-auto max-w-4xl px-3 py-4 font-serif leading-relaxed sm:px-4 w-[85vw] lg:w-[70ch] ${notesOn ? "" : "notes-off"}`}
            aria-label="Bible text"
          >
            {err && (
              <div className="mb-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40">
                {err}
              </div>
            )}
            {loading && (
              <div className="mb-3 animate-pulse rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-zinc-800/40">
                Loading…
              </div>
            )}
            {!loading && !err && (
              // IMPORTANT: keep fetch.bible HTML within .fetch-bible (and import client.css once in your app)
              <div
                className={'fetch-bible custom ' + textClass}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>
        </div>
      </main>

    <AudioPanel
      open={audioOpen}
      onClose={() => setAudioOpen(false)}
      bookId={bookId || ""}
      chapter={chapter}
      bookLabel={bookLabel}
    />

      <Footer />
    </div>
  );
}

