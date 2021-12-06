import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
} from 'react-native';
import { SlackSheet } from '../sheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSheetContent' was resolved to '/... Remove this comment to see the full error message
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSheetHeader' was resolved to '/U... Remove this comment to see the full error message
import DiscoverSheetHeader from './DiscoverSheetHeader';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { safeAreaInsetValues } from '@rainbow-me/utils';

const BottomSheet = requireNativeComponent('DiscoverSheet');

const renderHeader = (yPosition: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <DiscoverSheetHeader yPosition={yPosition} />
);

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

function DiscoverSheet(_: any, forwardedRef: any) {
  const isFocused = useIsFocused();
  const sheet = useRef();
  const ref = useRef();
  const listeners = useRef([]);
  const onFabSearch = useRef(null);
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();
  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener: any) {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        listeners.current.push(listener);
        return () =>
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
          listeners.current.splice(listeners.current.indexOf(listener), 1);
      },
      jumpToLong() {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.DiscoverSheet.jumpTo(true, screen);
        }
      },
      jumpToShort() {
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.DiscoverSheet.jumpTo(false, screen);
        }
      },
      layoutScrollView() {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.DiscoverSheet.layout(screen);
        }
      },
      onFabSearch,
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );

  useImperativeHandle(forwardedRef, () => value);

  useEffect(() => {
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
  }, [headerButtonsHandlers.isSearchModeEnabled]);

  // noinspection JSConstructorReturnsPrimitive
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <DiscoverSheetContext.Provider value={value}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BottomSheet
        allowsDragToDismiss={false}
        allowsTapToDismiss={false}
        backgroundOpacity={0}
        blocksBackgroundTouches={false}
        cornerRadius={30}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
        gestureEnabled={!headerButtonsHandlers.isSearchModeEnabled}
        initialAnimation={false}
        interactsWithOuterScrollView
        isHapticFeedbackEnabled={false}
        onCrossMagicBorder={({ nativeEvent: { below } }: any) =>
          // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
          listeners.current.forEach(listener => listener(below))
        }
        presentGlobally={false}
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
        ref={ref}
        scrollsToTopOnTapStatusBar={isFocused}
        shortFormHeight={245}
        showDragIndicator={false}
        topOffset={safeAreaInsetValues.top}
        unmountAnimation={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SlackSheet
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
          limitScrollViewContent={headerButtonsHandlers.isSearchModeEnabled}
          onContentSizeChange={value.layoutScrollView}
          ref={sheet}
          removeClippedSubviews
          renderHeader={renderHeader}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
          scrollEnabled={!headerButtonsHandlers.isSearchModeEnabled}
          showBlur
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DiscoverSheetContent />
        </SlackSheet>
      </BottomSheet>
    </DiscoverSheetContext.Provider>
  );
}

export default forwardRef(DiscoverSheet);
