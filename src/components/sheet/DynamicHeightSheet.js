import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, { forwardRef, Fragment, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import SheetHandleFixedToTop, { SheetHandleFixedToTopHeight } from './SheetHandleFixedToTop';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { IS_ANDROID, IS_IOS } from '@/env';
import TouchableBackdrop from '../TouchableBackdrop';

const AndroidBackground = styled.View({
  ...position.coverAsObject,
  backgroundColor: ({ backgroundColor }) => backgroundColor,
});

const Container = styled(Centered).attrs({ direction: 'column' })(
  ({
    backgroundColor,
    borderRadius,
    contentHeight,
    sheetHeight,
    sheetHeightRatio, // Default to 2/3 of the screen
  }) => ({
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: backgroundColor,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    height: sheetHeight ? sheetHeight : contentHeight * sheetHeightRatio, // Set height to a ratio of the device height
  })
);

const Content = styled.ScrollView.attrs(({ limitScrollViewContent }) => ({
  contentContainerStyle: limitScrollViewContent ? { height: '100%' } : {},
  directionalLockEnabled: true,
  keyboardShouldPersistTaps: 'always',
  scrollEventThrottle: 16,
}))(({ contentHeight, deviceHeight, backgroundColor, removeTopPadding, sheetHeightRatio = 0.67 }) => ({
  // Default to 2/3 of the screen
  backgroundColor: backgroundColor,
  ...(contentHeight ? { height: deviceHeight * sheetHeightRatio + contentHeight } : {}), // Set height to a ratio of the device height
  paddingTop: removeTopPadding ? 0 : SheetHandleFixedToTopHeight,
  width: '100%',
}));

const ContentWrapper = styled.View({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ backgroundColor }) => backgroundColor,
});

export default forwardRef(function SlackSheet(
  {
    additionalTopPadding = false,
    removeTopPadding = false,
    backgroundColor,
    borderRadius = 30,
    children,
    contentHeight,
    deferredHeight = false,
    discoverSheet,
    hideHandle = false,
    limitScrollViewContent,
    onContentSizeChange,
    renderHeader,
    scrollEnabled = true,
    showsHorizontalScrollIndicator = true,
    showsVerticalScrollIndicator = true,
    showBlur,
    testID,
    removeClippedSubviews = false,
    yPosition: givenYPosition,
    onDismiss,
    sheetHeight,
    sheetHeightRatio = 1, // Default to full height of screen
    ...props
  },
  ref
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yPosition = givenYPosition || useSharedValue(0);
  const { height: deviceHeight } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = useMemo(() => (insets.bottom || scrollEnabled ? 42 : 30), [insets.bottom, scrollEnabled]);
  const { colors } = useTheme();
  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomInset,
    }),
    [bottomInset]
  );

  const sheet = useRef();
  const isInsideBottomSheet = !!useContext(BottomSheetContext);

  useImperativeHandle(ref, () => sheet.current);

  const scrollIndicatorInsets = useMemo(
    () => ({
      bottom: bottomInset,
      top: borderRadius + SheetHandleFixedToTopHeight,
    }),
    [borderRadius, bottomInset]
  );

  // In discover sheet we need to set it additionally
  useEffect(
    () => {
      discoverSheet && ios && sheet.current.setNativeProps({ scrollIndicatorInsets });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const scrollHandler = useAnimatedScrollHandler(event => {
    yPosition.value = event.contentOffset.y;
  });

  const bg = backgroundColor || colors.white;

  // callback upon closing the sheet
  useEffect(
    () => () => {
      if (onDismiss) onDismiss();
    },
    []
  );

  return (
    <Fragment>
      {IS_ANDROID ? <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} /> : null}
      <TouchableBackdrop onPress={goBack} />

      <Container
        additionalTopPadding={additionalTopPadding}
        backgroundColor={bg}
        contentHeight={contentHeight}
        borderRadius={borderRadius}
        deferredHeight={deferredHeight}
        deviceHeight={deviceHeight}
        sheetHeightRatio={sheetHeightRatio}
        sheetHeight={sheetHeight}
        testID={testID}
        {...props}
      >
        {IS_ANDROID && (
          <AndroidBackground as={TouchableWithoutFeedback} backgroundColor={bg}>
            <AndroidBackground backgroundColor={bg} />
          </AndroidBackground>
        )}
        {!hideHandle && <SheetHandleFixedToTop showBlur={showBlur || scrollEnabled} />}
        <ContentWrapper backgroundColor={bg}>
          {renderHeader?.(yPosition)}
          <Content
            as={isInsideBottomSheet ? BottomSheetScrollView : Animated.ScrollView}
            backgroundColor={bg}
            contentContainerStyle={scrollEnabled && contentContainerStyle}
            contentHeight={contentHeight}
            deviceHeight={deviceHeight}
            sheetHeightRatio={sheetHeightRatio}
            limitScrollViewContent={limitScrollViewContent}
            onContentSizeChange={onContentSizeChange}
            ref={sheet}
            removeClippedSubviews={removeClippedSubviews}
            removeTopPadding={removeTopPadding}
            scrollEnabled={scrollEnabled}
            scrollIndicatorInsets={scrollIndicatorInsets}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            {...(isInsideBottomSheet && IS_ANDROID
              ? {
                  onScrollWorklet: scrollHandler,
                }
              : {
                  onScroll: scrollHandler,
                })}
          >
            {children}
          </Content>
        </ContentWrapper>
      </Container>
    </Fragment>
  );
});
