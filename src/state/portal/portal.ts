import { createRainbowStore } from '../internal/createRainbowStore';

type PortalState = {
  blockTouches: boolean;
  Component: JSX.Element | null;
  hide: () => void;
  setComponent: (Component: JSX.Element, blockTouches?: boolean) => void;
};

export const portalStore = createRainbowStore<PortalState>(set => ({
  blockTouches: false,
  Component: null,
  hide: () => set({ blockTouches: false, Component: null }),
  setComponent: (Component: JSX.Element, blockTouches?: boolean) => set({ blockTouches, Component }),
}));
