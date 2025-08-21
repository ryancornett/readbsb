import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SelectorBar Component
 * ---------------------------------
 * Purpose: let users pick a Version, Book, and Chapter, with an optional quick-jump box.
 * - Fully controlled via `value` + `onChange`.
 * - Computes chapter list from the selected book's `chapters` count.
 * - Quick Jump accepts inputs like: "John 3", "Jn 3", "Ps 23".
 * - Keyboard: Ctrl/Cmd + K focuses Quick Jump.
 *
 * Tailwind: ships with a clean, compact layout that wraps nicely on mobile.
 */

export type Book = {
  id: string;          // unique key (e.g., "GEN", "EXO")
  name: string;        // display name (e.g., "Genesis")
  chapters: number;    // number of chapters
  abbr?: string;       // optional short label (e.g., "Gen")
};

export type ReferenceValue = {
  versionId: string;
  bookId: string;
  chapter: number;
};

export type SelectorBarProps = {
  books: Book[];
  value: ReferenceValue;
  onChange: (val: ReferenceValue) => void;
  /**
   * Optional callback when user presses Enter in Quick Jump or clicks Go.
   * If not provided, we'll still call onChange when we can resolve a ref.
   */
  onJump?: (val: ReferenceValue) => void;
  className?: string;
};

export default function SelectorBar({
  books,
  value,
  onChange,
  onJump,
  className = "",
}: SelectorBarProps) {
  const [quick, setQuick] = useState("");
  const quickRef = useRef<HTMLInputElement | null>(null);

  const currentBook = useMemo(() => books.find(b => b.id === value.bookId) || null, [books, value.bookId]);

  const chapters = useMemo(() => {
    const n = currentBook?.chapters ?? 0;
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [currentBook]);

  // Keyboard shortcut: Ctrl/Cmd + K to focus quick jump
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && (e.key.toLowerCase() === "k")) {
        e.preventDefault();
        quickRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handle cascading changes
  const handleVersion = (id: string) => {
    onChange({ ...value, versionId: id });
  };

  const handleBook = (id: string) => {
    const b = books.find(x => x.id === id);
    const nextChapter = clamp(1, 1, b?.chapters ?? 1);
    onChange({ ...value, bookId: id, chapter: nextChapter });
  };

  const handleChapter = (ch: number) => {
    onChange({ ...value, chapter: ch });
  };

  // Quick jump parser: "John 3", "Jn 3", "ps23"
  const tryParseQuick = (raw: string): ReferenceValue | null => {
    const text = raw.trim().replace(/\s+/g, " ");
    if (!text) return null;

    // Separate trailing numbers as chapter
    const match = text.match(/^(.*?)[\s\.]*(\d+)$/i);
    if (!match) return null;

    const bookPart = match[1].trim().toLowerCase();
    const chapterPart = parseInt(match[2], 10);
    if (!Number.isFinite(chapterPart)) return null;

    // Find book by name or abbr (case-insensitive, startsWith match first, then includes)
    let found: Book | undefined = books.find(b =>
      b.name.toLowerCase() === bookPart || (b.abbr && b.abbr.toLowerCase() === bookPart)
    );

    if (!found) {
      const starts = books.find(b =>
        b.name.toLowerCase().startsWith(bookPart) || (b.abbr && b.abbr.toLowerCase().startsWith(bookPart))
      );
      found = starts;
    }
    if (!found) {
      const includes = books.find(b =>
        b.name.toLowerCase().includes(bookPart) || (b.abbr && b.abbr.toLowerCase().includes(bookPart))
      );
      found = includes;
    }
    if (!found) return null;

    const chapter = clamp(chapterPart, 1, found.chapters);
    return { versionId: value.versionId, bookId: found.id, chapter };
  };

  const doJump = () => {
    const parsed = tryParseQuick(quick);
    if (parsed) {
      onChange(parsed);
      onJump?.(parsed);
    }
  };

  return (
    <div className={"w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-y border-slate-200 dark:border-slate-800 " + className}>
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">

          {/* Book */}
          <label className="sr-only" htmlFor="sel-book">Book</label>
          <select
            id="sel-book"
            className="min-w-[8rem] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-900 dark:border-slate-700"
            value={value.bookId}
            onChange={e => handleBook(e.target.value)}
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Chapter */}
          <label className="sr-only" htmlFor="sel-chapter">Chapter</label>
          <select
            id="sel-chapter"
            className="w-[7.5rem] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-900 dark:border-slate-700"
            value={value.chapter}
            onChange={e => handleChapter(parseInt(e.target.value, 10))}
            disabled={!currentBook}
          >
            {chapters.map(ch => (
              <option key={ch} value={ch}>Chapter {ch}</option>
            ))}
          </select>

          {/* Quick Jump */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <label className="sr-only" htmlFor="quick">Quick jump</label>
              <input
                id="quick"
                ref={quickRef}
                type="text"
                inputMode="text"
                placeholder="Quick jump… e.g., Jn 3"
                className="w-44 sm:w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-900 dark:border-slate-700"
                value={quick}
                onChange={e => setQuick(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") doJump(); }}
                aria-describedby="quick-hint"
              />
              <div id="quick-hint" className="pointer-events-none absolute -bottom-5 left-1 text-[10px] text-slate-500 select-none">
                Press ⌘/Ctrl + K
              </div>
            </div>
            <button
              type="button"
              onClick={doJump}
              className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
            >Go</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utils
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Example usage
 * ---------------------------------
 * Drop this in your AppShell or page to wire it up.
 * Replace the `books` array with your real data source.
 */
export function SelectorBarDemo() {
  const books: Book[] = [
    { id: "GEN", name: "Genesis", chapters: 50, abbr: "Gen" },
    { id: "EXO", name: "Exodus", chapters: 40, abbr: "Ex" },
    { id: "LEV", name: "Leviticus", chapters: 27, abbr: "Lev" },
    { id: "PSA", name: "Psalms", chapters: 150, abbr: "Ps" },
    { id: "JOH", name: "John", chapters: 21, abbr: "Jn" },
    { id: "ROM", name: "Romans", chapters: 16, abbr: "Rom" },
  ];

  const [ref, setRef] = useState<ReferenceValue>({ versionId: "ESV", bookId: "JOH", chapter: 3 });

  useEffect(() => {
    // Example: inform router / content loader here
    // loadContent(ref)
    console.log("Ref changed:", ref);
  }, [ref]);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <SelectorBar
        books={books}
        value={ref}
        onChange={setRef}
        onJump={(v) => console.log("Jump to:", v)}
      />
      <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
        Current: {ref.versionId} – {books.find(b=>b.id===ref.bookId)?.name} {ref.chapter}
      </div>
    </div>
  );
}
