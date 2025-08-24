import React from "react";
import SettingsFontButton from "../components/SettingsFontButton";

type HeaderProps = {
  onToggleAudio?: () => void;
  onShare?: () => void;
  onToggleTheme?: () => void;
  onOpenMobileMenu?: () => void;
  onToggleNotes?: () => void;
  notesOn?: boolean;
};

export default function Header({
  onToggleAudio,
  onShare,
  onToggleTheme,
  onOpenMobileMenu,
  onToggleNotes,
  notesOn
}: HeaderProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80"
    >
      <div className="mx-auto w-4/5 flex h-14 max-w-screen-2xl items-center justify-between px-3 sm:px-4">
        {/* Left: Logo + brand */}
        <a href="/" className="flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded">
          <img
            src="/img/ReadBSBlogo.png"
            alt=""
            className="h-7 w-7 rounded"
            decoding="async"
            loading="eager"
          />
          <span className="font-sans text-base font-semibold">ReadBSB</span>
        </a>

        {/* Right: actions on desktop */}
        <nav aria-label="Header actions" className="hidden items-center gap-1 sm:flex">
          <SettingsFontButton />
          <IconButton
            label={notesOn ? "Hide inline notes" : "Show inline notes"}
            name={notesOn ? "eye" : "eye-slash"}
            onClick={onToggleNotes}
          />

          <IconButton label="Audio" name="volume-up-fill" onClick={onToggleAudio} />
          <IconButton label="Share" name="share-fill" onClick={onShare} />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500
                      dark:hover:bg-white/10 cursor-pointer transition-all duration-200 cursor-pointer"
          >
            {/* Show moon in light mode */}
            <sl-icon name="moon-fill" class="block dark:hidden"></sl-icon>
            {/* Show sun (or lightbulb-fill) in dark mode */}
            <sl-icon name="sun-fill" class="hidden dark:block"></sl-icon>
          </button>
        </nav>

        {/* Mobile hamburger */}
        <IconButton
          className="sm:hidden"
          label="Menu"
          name="list"
          onClick={onOpenMobileMenu}
        />
      </div>
    </header>
  );
}

function IconButton({
  label,
  name,
  onClick,
  className = ""
}: {
  label: string;
  name: string; // sl-icon name
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10 cursor-pointer ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <sl-icon name={name}></sl-icon>
    </button>
  );
}
