import React, { useEffect, useMemo, useRef, useState } from "react";

export type Book = {
  id: string;          // unique key (e.g., "GEN", "EXO")
  name: string;        // display name (e.g., "Genesis")
  abbr?: string;       // optional short label (e.g., "Gen")
};

export type Version = { id: string; label: string };

export type ReferenceValue = {
  bookId: string;
  chapter: number;
};

export type SelectorBarProps = {
  books: Book[];
  value: ReferenceValue;
  onChange: (val: ReferenceValue) => void;
  /**
   * Return an ordered array of available chapter numbers for a given book id.
   * Example with fetch(bible): get_chapters(bookId)
   */
  getChapterNumbers: (bookId: string) => number[];
  /**
   * Optional callback when user presses Enter in Quick Jump or clicks Go.
   * If not provided, we'll still call onChange when we can resolve a ref.
   */
  onJump?: (val: ReferenceValue) => void;
  /**
   * Hide the Version <select>. Useful for single-version apps.
   */
  showVersion?: boolean;
  className?: string;
  resolveBookId?: (input: string) => string | null;
};

export default function SelectorBar({
  books,
  value,
  onChange,
  getChapterNumbers,
  onJump,
  className = "",
}: SelectorBarProps) {
  const [quick, setQuick] = useState("");
  const quickRef = useRef<HTMLInputElement | null>(null);

  const currentBook = useMemo(
    () => books.find(b => b.id === value.bookId) || null,
    [books, value.bookId]
  );

  const chapterNumbers = useMemo(() => {
    if (!value.bookId) return [];
    try {
      return getChapterNumbers(value.bookId) ?? [];
    } catch {
      return [];
    }
  }, [getChapterNumbers, value.bookId]);

  // Keyboard shortcut: Ctrl/Cmd + K to focus quick jump
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        quickRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleBook = (id: string) => {
    // choose the lowest available chapter for the new book
    const numbers = (id ? getChapterNumbers(id) : []) ?? [];
    const nextChapter = numbers.length ? Math.min(...numbers) : 1;
    onChange({ ...value, bookId: id, chapter: nextChapter });
  };

  const handleChapter = (ch: number) => {
    onChange({ ...value, chapter: ch });
  };

  // Build a quick exact-match index and add synonyms only for John
const exactIndex = useMemo(() => {
  const m = new Map<string, Book>();
  for (const b of books) {
    m.set(b.name.toLowerCase(), b);
    if (b.abbr) m.set(b.abbr.toLowerCase(), b);
  }
  // Add friendly aliases for John if present
  const john = books.find(b => b.name.toLowerCase() === "john");
  if (john) {
    m.set("jn", john);
    m.set("jhn", john);
  }
  return m;
}, [books]);


  // Quick jump parser without regex: "John 3", "Jn 3", "ps23"
  const tryParseQuick = (raw: string): ReferenceValue | null => {
    let text = raw.trim();
    if (!text) return null;

    // Collapse whitespace (compat-friendly)
    text = text.replace(/\s+/g, ' ');

    // Find trailing number (chapter)
    let end = text.length - 1;
    while (end >= 0 && text[end] === ' ') end--;
    if (end < 0) return null;

    let startNum = end;
    while (startNum >= 0 && text[startNum] >= '0' && text[startNum] <= '9') startNum--;
    if (startNum === end) return null; // no trailing digits

    const chapterStr = text.slice(startNum + 1, end + 1);
    const chapterPart = parseInt(chapterStr, 10);
    if (!Number.isFinite(chapterPart)) return null;

    const bookPart = text.slice(0, startNum + 1).trim().toLowerCase();
    if (!bookPart) return null;

    // Find book by name or abbr (case-insensitive, startsWith match first, then includes)
    let found: Book | undefined = exactIndex.get(bookPart);

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

    const available = getChapterNumbers(found.id) ?? [];
    const safeChapter = available.length ? clamp(chapterPart, Math.min(...available), Math.max(...available)) : 1;

    return { bookId: found.id, chapter: safeChapter };
  };

  const doJump = () => {
    const parsed = tryParseQuick(quick);
    if (parsed) {
      onChange(parsed);
      onJump?.(parsed);
      setQuick("");
      quickRef.current?.blur();
    }
  };

  return (
    <div className={"w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-y border-slate-200 dark:border-slate-800 " + className} id="selector">
      <div className="mx-auto max-w-4xl px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Book */}
          <label className="sr-only" htmlFor="sel-book">Book</label>
          <select
            id="sel-book"
            className="min-w-[10rem] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-900 dark:border-slate-700"
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
            disabled={!currentBook || chapterNumbers.length === 0}
          >
            {chapterNumbers.map(ch => (
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
                placeholder="Quick jump... e.g., Jn 3"
                className="w-44 sm:w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-900 dark:border-slate-700"
                value={quick}
                onChange={e => setQuick(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    doJump();
                  }
                }}
                aria-describedby="quick-hint"
              />
            </div>
            <button
              type="button"
              onClick={doJump}
              className="rounded-xl bg-primary-400 hover:bg-primary-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary-500 transition-colors duration-200
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
             disabled:opacity-50 cursor-pointer"
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
