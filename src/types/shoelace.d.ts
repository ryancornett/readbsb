import React from "react";

type WebCompProps<T = {}> =
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & T;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sl-icon": WebCompProps<{ name?: string; src?: string; label?: string; library?: string }>;
      // add more sl-* as you need them
    }
  }
}
export {};
