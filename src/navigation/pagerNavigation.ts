export type PagerNavigationState<Page extends string> = {
  back?: Page;
  forward?: Page;
  page: Page;
};

/** Navigation actions synchronously publish their resulting state to subscribers. */
export type PagerNavigation<Page extends string> = {
  /** Starts a new pager path and returns its authoritative first state. */
  beginPath?: () => PagerNavigationState<Page>;
  getState: () => PagerNavigationState<Page>;
  goBack?: () => void;
  goForward?: () => void;
  navigate: (page: Page) => void;
  subscribe: (listener: (state: PagerNavigationState<Page>) => void) => () => void;
};
