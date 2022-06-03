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
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  useWorkletCallback,
} from 'react-native-reanimated';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import CustomBackground from './androidCustomComponents/customBackground';
import CustomHandle from './androidCustomComponents/customHandle';
import styled from '@rainbow-me/styled-components';
import { deviceUtils } from '@rainbow-me/utils';

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

const snapPoints = [
  280,
  deviceUtils.dimensions.height + getSoftMenuBarHeight(),
];

const AndroidWrapper = styled.View.attrs({
  pointerEvents: 'box-none',
})({
  height: deviceUtils.dimensions.height,
  position: 'absolute',
  width: '100%',
});

let jumpToShort;

export { jumpToShort };

const DiscoverSheet = (_, forwardedRef) => {
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();
  const isFocused = useIsFocused();

  const listeners = useRef([]);
  const bottomSheetModalRef = useRef(null);
  const onFabSearch = useRef(null);
  const sheet = useRef();

  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener) {
        listeners.current.push(listener);
        return () =>
          listeners.current.splice(listeners.current?.indexOf(listener), 1);
      },
      jumpToLong() {
        bottomSheetModalRef.current?.expand();
      },
      jumpToShort() {
        sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
        bottomSheetModalRef.current?.collapse();
      },
      onFabSearch,
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );

  jumpToShort = value.jumpToShort;

  useImperativeHandle(forwardedRef, () => value);

  const yPosition = useSharedValue(0);
  const scrollHandler = useWorkletCallback(event => {
    yPosition.value = event.contentOffset.y;
  });

  const notifyListeners = useCallback(
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
    <AndroidWrapper
      style={{
        bottom: -24,
      }}
    >
      <DiscoverSheetContext.Provider value={value}>
        <BottomSheet
          activeOffsetY={[-3, 3]}
          animatedPosition={sheetPosition}
          animationDuration={300}
          backgroundComponent={CustomBackground}
          enableContentPanningGesture={
            !headerButtonsHandlers.isSearchModeEnabled
          }
          failOffsetX={[-10, 10]}
          handleComponent={CustomHandle}
          index={1}
          ref={bottomSheetModalRef}
          scrollsToTopOnTapStatusBar={isFocused}
          snapPoints={snapPoints}
          style={{
            borderRadius: 30,
            overflow: 'hidden',
          }}
        >
          <DiscoverSheetHeader yPosition={yPosition} />
          <BottomSheetScrollView
            onScrollWorklet={scrollHandler}
            ref={sheet}
            removeClippedSubviews
          >
            <DiscoverSheetContent />
          </BottomSheetScrollView>
        </BottomSheet>
      </DiscoverSheetContext.Provider>
    </AndroidWrapper>
  );
};

export default forwardRef(DiscoverSheet);
