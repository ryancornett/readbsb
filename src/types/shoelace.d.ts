export {};
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sl-icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        src?: string;
        library?: string;
        label?: string;
      };
    }
  }
}
