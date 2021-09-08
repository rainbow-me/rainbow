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
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import { safeAreaInsetValues } from '@rainbow-me/utils';

const BottomSheet = requireNativeComponent('DiscoverSheet');

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

function DiscoverSheet(_, forwardedRef) {
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
          NativeModules.DiscoverSheet.jumpTo(true, screen);
        }
      },
      jumpToShort() {
        sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.DiscoverSheet.jumpTo(false, screen);
        }
      },
      layoutScrollView() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.DiscoverSheet.layout(screen);
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
    sheet.current.scrollTo({ animated: false, x: 0, y: 0 });
  }, [headerButtonsHandlers.isSearchModeEnabled]);

  // noinspection JSConstructorReturnsPrimitive
  return (
    <DiscoverSheetContext.Provider value={value}>
      <BottomSheet
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
          removeClippedSubviews
          renderHeader={renderHeader}
          scrollEnabled={!headerButtonsHandlers.isSearchModeEnabled}
          showBlur
        >
          <DiscoverSheetContent />
        </SlackSheet>
      </BottomSheet>
    </DiscoverSheetContext.Provider>
  );
}

export default forwardRef(DiscoverSheet);
