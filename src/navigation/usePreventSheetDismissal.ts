import { useEffect, useRef } from 'react';

import { DEFAULT_COOL_MODAL_HEADER_HEIGHT } from '@/navigation/config';
import { useNavigation } from '@/navigation/Navigation';

/**
 * The gesture channels, spanning both navigators a panel sheet can be registered in: cool-modals on iOS
 * (`Routes.ios.tsx`), the bottom-sheet navigator on Android (`Routes.android.tsx`). A caller cannot know
 * which one it landed in, so every key is always sent and the inapplicable half is ignored.
 *
 * `setOptions` types its argument as stack options, which name none of these, so the cast below is the
 * boundary — this type is what actually holds the shape.
 */
type GestureDismissalOptions = {
  allowsDragToDismiss: boolean;
  allowsTapToDismiss: boolean;
  backdropPressBehavior: 'close' | 'none';
  dismissable: boolean;
  enablePanDownToClose: boolean;
  headerHeight: number;
};

function gestureDismissalOptions(prevented: boolean): GestureDismissalOptions {
  return {
    allowsDragToDismiss: !prevented,
    allowsTapToDismiss: !prevented,
    backdropPressBehavior: prevented ? 'none' : 'close',
    dismissable: !prevented,
    enablePanDownToClose: !prevented,
    // `dismissable: false` alone leaves the pan gesture responding to touches that start inside the
    // header band, so the band has to collapse too.
    headerHeight: prevented ? 0 : DEFAULT_COOL_MODAL_HEADER_HEIGHT,
  };
}

/**
 * Holds a panel sheet open while `prevented`, closing every way out of it at once.
 *
 * Two mechanisms, because dismissals arrive in two orders. A gesture closes the sheet first and tells
 * navigation afterwards, so it has to be switched off before it can start. Everything else — Android
 * hardware back, `PanelSheet`'s tap cover, any `goBack()` — reaches navigation first and is cancelled here.
 */
export function usePreventSheetDismissal(prevented: boolean): void {
  const navigation = useNavigation();
  const { setOptions } = navigation;
  const preventedRef = useRef(prevented);
  preventedRef.current = prevented;

  useEffect(() => {
    setOptions(gestureDismissalOptions(prevented) as Parameters<typeof setOptions>[0]);
  }, [prevented, setOptions]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (preventedRef.current) event.preventDefault();
      }),
    [navigation]
  );
}
