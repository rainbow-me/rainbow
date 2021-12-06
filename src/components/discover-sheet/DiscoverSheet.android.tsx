import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSheetContent' was resolved to '/... Remove this comment to see the full error message
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './DiscoverSheetHeader' was resolved to '/U... Remove this comment to see the full error message
import DiscoverSheetHeader from './DiscoverSheetHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './androidCustomComponents/customBackground... Remove this comment to see the full error message
import CustomBackground from './androidCustomComponents/customBackground';
// @ts-expect-error ts-migrate(6142) FIXME: Module './androidCustomComponents/customHandle' wa... Remove this comment to see the full error message
import CustomHandle from './androidCustomComponents/customHandle';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

const snapPoints = [
  280,
  deviceUtils.dimensions.height + getSoftMenuBarHeight(),
];

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const AndroidWrapper = styled.View.attrs({
  pointerEvents: 'box-none',
})`
  width: 100%;
  height: ${deviceUtils.dimensions.height};
  position: absolute;
`;

const DiscoverSheet = (_: any, forwardedRef: any) => {
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();
  const isFocused = useIsFocused();

  const listeners = useRef([]);
  const bottomSheetModalRef = useRef(null);
  const onFabSearch = useRef(null);
  const sheet = useRef();

  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener: any) {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        listeners.current.push(listener);
        return () =>
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
          listeners.current.splice(listeners.current?.indexOf(listener), 1);
      },
      jumpToLong() {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'expand' does not exist on type 'never'.
        bottomSheetModalRef.current?.expand();
      },
      jumpToShort() {
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'collapse' does not exist on type 'never'... Remove this comment to see the full error message
        bottomSheetModalRef.current?.collapse();
      },
      onFabSearch,
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );

  useImperativeHandle(forwardedRef, () => value);

  const yPosition = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    yPosition.value = event.contentOffset.y;
  });

  const notifyListeners = useCallback(
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    value => listeners.current.forEach(listener => listener(value)),
    []
  );

  const sheetPosition = useSharedValue(0);

  const hasCrossedTheMagicBorder = useSharedValue(false);
  useAnimatedReaction(
    () => sheetPosition.value > 150,
    hasJustCrossedTheMagicBorder => {
      if (hasCrossedTheMagicBorder.value !== hasJustCrossedTheMagicBorder) {
        runOnJS(notifyListeners)(hasJustCrossedTheMagicBorder);
        hasCrossedTheMagicBorder.value = hasJustCrossedTheMagicBorder;
      }
    },
    [notifyListeners]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AndroidWrapper
      style={{
        bottom: -24,
      }}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <DiscoverSheetContext.Provider value={value}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BottomSheet
          activeOffsetY={[-3, 3]}
          animatedPosition={sheetPosition}
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element[]; activeOffsetY: number... Remove this comment to see the full error message
          animationDuration={300}
          backgroundComponent={CustomBackground}
          failOffsetX={[-10, 10]}
          handleComponent={CustomHandle}
          index={1}
          ref={bottomSheetModalRef}
          scrollsToTopOnTapStatusBar={isFocused}
          snapPoints={snapPoints}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DiscoverSheetHeader yPosition={yPosition} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BottomSheetScrollView
            onScroll={scrollHandler}
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
            ref={sheet}
            removeClippedSubviews
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <DiscoverSheetContent />
          </BottomSheetScrollView>
        </BottomSheet>
      </DiscoverSheetContext.Provider>
    </AndroidWrapper>
  );
};

export default forwardRef(DiscoverSheet);
