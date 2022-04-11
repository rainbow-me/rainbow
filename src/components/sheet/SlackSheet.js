import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, {
  forwardRef,
  Fragment,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const AndroidBackground = styled.View({
  ...position.coverAsObject,
  backgroundColor: ({ backgroundColor }) => backgroundColor,
});

const Container = styled(Centered).attrs({ direction: 'column' })(
  ({
    backgroundColor,
    additionalTopPadding,
    contentHeight,
    deferredHeight,
    deviceHeight,
  }) => ({
    ...(deferredHeight || ios
      ? {}
      : {
          top:
            contentHeight && additionalTopPadding
              ? deviceHeight - contentHeight
              : 0,
        }),
    ...(android ? { borderTopLeftRadius: 30, borderTopRightRadius: 30 } : {}),
    backgroundColor: backgroundColor,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  })
);

const Content = styled.ScrollView.attrs(({ limitScrollViewContent }) => ({
  contentContainerStyle: limitScrollViewContent ? { height: '100%' } : {},
  directionalLockEnabled: true,
  keyboardShouldPersistTaps: 'always',
  scrollEventThrottle: 16,
}))(({ contentHeight, deviceHeight, backgroundColor, removeTopPadding }) => ({
  backgroundColor: backgroundColor,
  ...(contentHeight ? { height: deviceHeight + contentHeight } : {}),
  paddingTop: removeTopPadding ? 0 : SheetHandleFixedToTopHeight,
  width: '100%',
}));

const ContentWrapper = styled.View({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ backgroundColor }) => backgroundColor,
});

const Whitespace = styled.View({
  backgroundColor: ({ backgroundColor }) => backgroundColor,
  flex: 1,
  height: ({ deviceHeight }) => deviceHeight,
  zIndex: -1,
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
    ...props
  },
  ref
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yPosition = givenYPosition || useSharedValue(0);
  const { height: deviceHeight } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeArea();
  const bottomInset = useMemo(
    () => (insets.bottom || scrollEnabled ? 42 : 30),
    [insets.bottom, scrollEnabled]
  );
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
      discoverSheet &&
        ios &&
        sheet.current.setNativeProps({ scrollIndicatorInsets });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const scrollHandler = useAnimatedScrollHandler(event => {
    yPosition.value = event.contentOffset.y;
  });

  const bg = backgroundColor || colors.white;

  return (
    <Fragment>
      {android ? (
        <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} />
      ) : null}
      <Container
        additionalTopPadding={additionalTopPadding}
        backgroundColor={bg}
        contentHeight={contentHeight}
        deferredHeight={deferredHeight}
        deviceHeight={deviceHeight}
        testID={testID}
        {...props}
      >
        {android && (
          <AndroidBackground as={TouchableWithoutFeedback} backgroundColor={bg}>
            <AndroidBackground backgroundColor={bg} />
          </AndroidBackground>
        )}
        {!hideHandle && (
          <SheetHandleFixedToTop showBlur={showBlur || scrollEnabled} />
        )}
        <ContentWrapper backgroundColor={bg}>
          {renderHeader?.(yPosition)}
          <Content
            as={
              isInsideBottomSheet ? BottomSheetScrollView : Animated.ScrollView
            }
            backgroundColor={bg}
            contentContainerStyle={scrollEnabled && contentContainerStyle}
            contentHeight={contentHeight}
            deviceHeight={deviceHeight}
            limitScrollViewContent={limitScrollViewContent}
            onContentSizeChange={onContentSizeChange}
            ref={sheet}
            removeClippedSubviews={removeClippedSubviews}
            removeTopPadding={removeTopPadding}
            scrollEnabled={scrollEnabled}
            scrollIndicatorInsets={scrollIndicatorInsets}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            {...(isInsideBottomSheet && android
              ? {
                  onScrollWorklet: scrollHandler,
                }
              : {
                  onScroll: scrollHandler,
                })}
          >
            {children}
            {!scrollEnabled && (
              <Whitespace backgroundColor={bg} deviceHeight={deviceHeight} />
            )}
          </Content>
        </ContentWrapper>
      </Container>
    </Fragment>
  );
});
