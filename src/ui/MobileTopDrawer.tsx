import React from "react";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

type MobileTopDrawerProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function MobileTopDrawer({ open, onClose, children }: MobileTopDrawerProps) {
  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity sm:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      {/* Panel */}
      <aside
        className={`fixed inset-x-0 top-0 z-50 w-full bg-white shadow dark:bg-zinc-900 sm:hidden
        transition-transform ${open ? "translate-y-0" : "-translate-y-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img src="img/ReadBSBlogo.png" className="h-6 w-6 rounded" alt="" />
            <span className="font-sans text-base font-semibold">ReadBSB</span>
          </div>
          <button
            className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <SlIcon name="x-lg" />
          </button>
        </div>
        <div className="p-3">{children ?? <div className="opacity-70 text-sm">Menu content…</div>}</div>
      </aside>
    </>
  );
}
