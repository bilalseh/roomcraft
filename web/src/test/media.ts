// jsdom has no media queries. Tests choose which ones match; by default none do
// (a wide screen, with full motion).
let matches: (query: string) => boolean = () => false;

export function matchMediaQueries(predicate: (query: string) => boolean): void {
  matches = predicate;
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
    // The MediaQueryList type still includes these old listener methods.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    addListener: () => undefined,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    removeListener: () => undefined,
  });
}
