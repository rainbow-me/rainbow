import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { usePreventSheetDismissal } from './usePreventSheetDismissal';

type BeforeRemoveListener = (event: { preventDefault: () => void }) => void;

const mockUseEffect = jest.fn<(effect: () => void | (() => void)) => void>();
const mockRef = { current: false };
const mockSetOptions = jest.fn();
const mockAddListener = jest.fn<(event: string, listener: BeforeRemoveListener) => () => void>();
const mockNavigation = { addListener: mockAddListener, setOptions: mockSetOptions };

jest.mock('react', () => ({
  ...(jest.requireActual('react') as object),
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
  useRef: () => mockRef,
}));

jest.mock('@/navigation/config', () => ({ DEFAULT_COOL_MODAL_HEADER_HEIGHT: 25 }));

jest.mock('@/navigation/Navigation', () => ({ useNavigation: () => mockNavigation }));

const UNLOCKED = {
  allowsDragToDismiss: true,
  allowsTapToDismiss: true,
  backdropPressBehavior: 'close',
  dismissable: true,
  enablePanDownToClose: true,
  headerHeight: 25,
};

const LOCKED = {
  allowsDragToDismiss: false,
  allowsTapToDismiss: false,
  backdropPressBehavior: 'none',
  dismissable: false,
  enablePanDownToClose: false,
  headerHeight: 0,
};

function beforeRemoveListener(): BeforeRemoveListener {
  const call = mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove');
  if (!call) throw new Error('no beforeRemove listener was registered');
  return call[1];
}

function dismiss(): { prevented: boolean } {
  const preventDefault = jest.fn();
  beforeRemoveListener()({ preventDefault });
  return { prevented: preventDefault.mock.calls.length > 0 };
}

describe('usePreventSheetDismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef.current = false;
    mockUseEffect.mockImplementation(effect => void effect());
  });

  it('leaves every gesture channel open when nothing is in flight', () => {
    usePreventSheetDismissal(false);

    expect(mockSetOptions).toHaveBeenCalledWith(UNLOCKED);
  });

  // A drag closes the sheet before navigation hears about it, so these have to be off at the source.
  // `headerHeight` is part of that: `dismissable: false` alone still leaves the header band draggable.
  it('closes every gesture channel while in flight', () => {
    usePreventSheetDismissal(true);

    expect(mockSetOptions).toHaveBeenCalledWith(LOCKED);
  });

  it('cancels a navigation-driven dismissal while in flight', () => {
    usePreventSheetDismissal(true);

    expect(dismiss().prevented).toBe(true);
  });

  it('allows a navigation-driven dismissal when nothing is in flight', () => {
    usePreventSheetDismissal(false);

    expect(dismiss().prevented).toBe(false);
  });

  // The listener is registered once against `navigation`, so it has to read the current value rather
  // than the one captured when it was subscribed.
  it('applies the latest value to a listener registered before the lock', () => {
    usePreventSheetDismissal(false);
    expect(dismiss().prevented).toBe(false);

    usePreventSheetDismissal(true);
    expect(dismiss().prevented).toBe(true);

    usePreventSheetDismissal(false);
    expect(dismiss().prevented).toBe(false);
  });

  it('unsubscribes the listener on unmount', () => {
    const unsubscribe = jest.fn();
    mockAddListener.mockReturnValue(unsubscribe);
    const cleanups: (() => void)[] = [];
    mockUseEffect.mockImplementation(effect => {
      const cleanup = effect();
      if (cleanup) cleanups.push(cleanup);
    });

    usePreventSheetDismissal(true);
    cleanups.forEach(cleanup => cleanup());

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
