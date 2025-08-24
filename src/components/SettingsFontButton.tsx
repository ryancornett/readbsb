// src/components/SettingsFontButton.tsx
import React from "react";
import { useFontSize } from "../state/FontSizeContext";

export default function SettingsFontButton() {
  const { size, cycle } = useFontSize();
  const label = `Font: ${size} (click to change)`;
  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500
                      dark:hover:bg-white/10 cursor-pointer transition-all duration-200 cursor-pointer"
      aria-label={label}
    >
      <span className="font-serif text-lg leading-none select-none">A</span>
    </button>
  );
}
