import React from "react";

type HeaderProps = {
  onOpenSettings?: () => void;
  onToggleAudio?: () => void;
  onShare?: () => void;
  onToggleTheme?: () => void;
  onOpenMobileMenu?: () => void;
};

export default function Header({
  onOpenSettings,
  onToggleAudio,
  onShare,
  onToggleTheme,
  onOpenMobileMenu
}: HeaderProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80"
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-3 sm:px-4">
        {/* Left: Logo + brand */}
        <a href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
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
          <IconButton label="Settings" name="gear-fill" onClick={onOpenSettings} />
          <IconButton label="Audio" name="volume-up-fill" onClick={onToggleAudio} />
          <IconButton label="Share" name="share-fill" onClick={onShare} />
          <IconButton label="Theme" name="moon-fill" onClick={onToggleTheme} />
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
      className={`rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-white/10 ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <sl-icon name={name}></sl-icon>
    </button>
  );
}
