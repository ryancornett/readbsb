// src/state/FontSizeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "xxl";
const TEXT_MAP: Record<FontSize, string> = {
  xs: "text-size-xs",
  sm: "text-size-sm",
  base: "text-size-base",
  lg: "text-size-lg",
  xl: "text-size-xl",
  xxl: "text-size-xxl"
};
type Ctx = { size: FontSize; setSize: (s: FontSize) => void; cycle: () => void; textClass: string; };

const FontSizeContext = createContext<Ctx | null>(null);

const ORDER: FontSize[] = ["xs", "sm", "base", "lg", "xl", "xxl"];

const KEY = "bsb:fontSize";

function getInitial(): FontSize {
  try {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "xs" || saved === "sm" || saved === "base" || saved === "lg" || saved === "xl" || saved === "xxl") return saved;
    }
  } catch {}
  return "base";
}

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [size, setSize] = useState<FontSize>(getInitial);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, size); } catch {}
  }, [size]);

  const cycle = () => setSize(ORDER[(ORDER.indexOf(size) + 1) % ORDER.length]);

  const value = useMemo(
  () => ({
    size,
    setSize,
    cycle,
    textClass: TEXT_MAP[size],   // ← add this
  }),
  [size]
);
  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
};

export function useFontSize(): Ctx {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within <FontSizeProvider>.");
  return ctx;
}
