declare module "*.css";

declare namespace JSX {
  interface IntrinsicElements {
    [key: `s-${string}`]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
  }
}
