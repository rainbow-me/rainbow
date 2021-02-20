import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findNodeHandle, NativeModules } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import styled from 'styled-components';
import { SlackSheet } from '../sheet';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import CustomBackground from './androidCustomComponents/customBackground';
import CustomHandle from './androidCustomComponents/customHandle';
import { safeAreaInsetValues } from '@rainbow-me/utils';

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

const snapPoints = ['25%', '90%'];

const AndroidWrapper = styled.View.attrs({
  pointerEvents: 'box-none',
})`
  width: 100%;
  position: absolute;
  height: 100%;
`;

const DiscoverSheetAndroid = (_, forwardedRef) => {
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();

  const listeners = useRef([]);
  const bottomSheetModalRef = useRef(null);
  const onFabSearch = useRef(null);

  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener) {
        listeners.current.push(listener);
        return () =>
          listeners.current.splice(listeners.current.indexOf(listener), 1);
      },
      jumpToLong() {
        bottomSheetModalRef.current.expand();
      },
      jumpToShort() {
        bottomSheetModalRef.current.collapse();
      },
      onFabSearch,
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
        transform: [{ translateY: safeAreaInsetValues.top * 2 }],
      }}
    >
      <DiscoverSheetContext.Provider value={value}>
        <BottomSheet
          activeOffsetY={[-3, 3]}
          animatedPosition={sheetPosition}
          animationDuration={300}
          backgroundComponent={CustomBackground}
          failOffsetX={[-10, 10]}
          handleComponent={CustomHandle}
          index={1}
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <DiscoverSheetHeader yPosition={yPosition} />
          <BottomSheetScrollView onScroll={scrollHandler}>
            <DiscoverSheetContent />
          </BottomSheetScrollView>
        </BottomSheet>
      </DiscoverSheetContext.Provider>
    </AndroidWrapper>
  );
};

function DiscoverSheetIOS(_, forwardedRef) {
  const isFocused = useIsFocused();
  const sheet = useRef();
  const ref = useRef();
  const listeners = useRef([]);
  const onFabSearch = useRef(null);
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();
  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener) {
        listeners.current.push(listener);
        return () =>
          listeners.current.splice(listeners.current.indexOf(listener), 1);
      },
      jumpToLong() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.jumpTo(true, screen);
        }
      },
      jumpToShort() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.jumpTo(false, screen);
        }
      },
      layoutScrollView() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.layout(screen);
        }
      },
      onFabSearch,
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );

  useImperativeHandle(forwardedRef, () => value);

  useEffect(() => {
    sheet.current.scrollTo({ x: 0, y: 0 });
  }, [headerButtonsHandlers.isSearchModeEnabled]);

  // noinspection JSConstructorReturnsPrimitive
  return (
    <DiscoverSheetContext.Provider value={value}>
      <SlackBottomSheet
        allowsDragToDismiss={false}
        allowsTapToDismiss={false}
        backgroundOpacity={0}
        blocksBackgroundTouches={false}
        cornerRadius={30}
        gestureEnabled={!headerButtonsHandlers.isSearchModeEnabled}
        initialAnimation={false}
        interactsWithOuterScrollView
        isHapticFeedbackEnabled={false}
        onCrossMagicBorder={({ nativeEvent: { below } }) =>
          listeners.current.forEach(listener => listener(below))
        }
        presentGlobally={false}
        ref={ref}
        scrollsToTopOnTapStatusBar={isFocused}
        shortFormHeight={245}
        showDragIndicator={false}
        topOffset={safeAreaInsetValues.top}
        unmountAnimation={false}
      >
        <SlackSheet
          limitScrollViewContent={headerButtonsHandlers.isSearchModeEnabled}
          onContentSizeChange={value.layoutScrollView}
          ref={sheet}
          renderHeader={renderHeader}
          scrollEnabled={!headerButtonsHandlers.isSearchModeEnabled}
          showBlur
        >
          <DiscoverSheetContent />
        </SlackSheet>
      </SlackBottomSheet>
    </DiscoverSheetContext.Provider>
  );
}

export default forwardRef(ios ? DiscoverSheetIOS : DiscoverSheetAndroid);
