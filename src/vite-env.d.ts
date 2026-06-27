/// <reference types="vite/client" />

declare global {
  interface Window {
    MathJax: {
      typesetPromise?: (nodes?: Element[]) => Promise<void>;
      [key: string]: unknown;
    };
  }
}
