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
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './SheetHandleFixedToTop' was resolved to '... Remove this comment to see the full error message
} from './SheetHandleFixedToTop';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const AndroidBackground = styled.View`
  ${position.cover};
  background-color: ${({ backgroundColor }: any) => backgroundColor};
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ additionalTopPadding, contentHeight, deferredHeight, deviceHeight }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    deferredHeight || ios
      ? ''
      : `top: ${
          contentHeight && additionalTopPadding
            ? deviceHeight - contentHeight
            : 0
        };`};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && 'border-top-left-radius: 30; border-top-right-radius: 30;'}
  background-color: ${({ backgroundColor }) => backgroundColor};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
`;

const Content = styled(Animated.ScrollView).attrs(
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'limitScrollViewContent' does not exist o... Remove this comment to see the full error message
  ({ limitScrollViewContent }) => ({
    contentContainerStyle: limitScrollViewContent ? { height: '100%' } : {},
    directionalLockEnabled: true,
    keyboardShouldPersistTaps: 'always',
    scrollEventThrottle: 16,
  })
)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
  background-color: ${({ backgroundColor }) => backgroundColor};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'contentHeight' does not exist on type '{... Remove this comment to see the full error message
  ${({ contentHeight, deviceHeight }) =>
    contentHeight ? `height: ${deviceHeight + contentHeight}` : null};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'removeTopPadding' does not exist on type... Remove this comment to see the full error message
  padding-top: ${({ removeTopPadding }) =>
    removeTopPadding ? 0 : SheetHandleFixedToTopHeight};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ContentWrapper = styled.View`
  ${position.size('100%')};
  background-color: ${({ backgroundColor }: any) => backgroundColor};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Whitespace = styled.View`
  background-color: ${({ backgroundColor }: any) => backgroundColor};
  flex: 1;
  height: ${({ deviceHeight }: any) => deviceHeight};
  z-index: -1;
`;

export default forwardRef(function SlackSheet(
  {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalTopPadding' does not exist on ... Remove this comment to see the full error message
    additionalTopPadding = false,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'removeTopPadding' does not exist on type... Remove this comment to see the full error message
    removeTopPadding = false,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
    backgroundColor,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'borderRadius' does not exist on type '{ ... Remove this comment to see the full error message
    borderRadius = 30,
    children,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'contentHeight' does not exist on type '{... Remove this comment to see the full error message
    contentHeight,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'deferredHeight' does not exist on type '... Remove this comment to see the full error message
    deferredHeight = false,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'discoverSheet' does not exist on type '{... Remove this comment to see the full error message
    discoverSheet,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'hideHandle' does not exist on type '{ ch... Remove this comment to see the full error message
    hideHandle = false,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'limitScrollViewContent' does not exist o... Remove this comment to see the full error message
    limitScrollViewContent,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onContentSizeChange' does not exist on t... Remove this comment to see the full error message
    onContentSizeChange,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'renderHeader' does not exist on type '{ ... Remove this comment to see the full error message
    renderHeader,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollEnabled' does not exist on type '{... Remove this comment to see the full error message
    scrollEnabled = true,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'showBlur' does not exist on type '{ chil... Remove this comment to see the full error message
    showBlur,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'testID' does not exist on type '{ childr... Remove this comment to see the full error message
    testID,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'removeClippedSubviews' does not exist on... Remove this comment to see the full error message
    removeClippedSubviews = false,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'yPosition' does not exist on type '{ chi... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        ios &&
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} />
      ) : null}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container
        additionalTopPadding={additionalTopPadding}
        backgroundColor={bg}
        borderRadius={borderRadius}
        contentHeight={contentHeight}
        deferredHeight={deferredHeight}
        deviceHeight={deviceHeight}
        testID={testID}
        {...props}
      >
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AndroidBackground as={TouchableWithoutFeedback} backgroundColor={bg}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <AndroidBackground backgroundColor={bg} />
          </AndroidBackground>
        )}
        {!hideHandle && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SheetHandleFixedToTop showBlur={showBlur || scrollEnabled} />
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ContentWrapper backgroundColor={bg}>
          {renderHeader?.(yPosition)}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Content
            {...(isInsideBottomSheet && { as: BottomSheetScrollView })}
            backgroundColor={bg}
            contentContainerStyle={scrollEnabled && contentContainerStyle}
            contentHeight={contentHeight}
            deviceHeight={deviceHeight}
            limitScrollViewContent={limitScrollViewContent}
            onContentSizeChange={onContentSizeChange}
            onScroll={scrollHandler}
            // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
            ref={sheet}
            removeClippedSubviews={removeClippedSubviews}
            removeTopPadding={removeTopPadding}
            scrollEnabled={scrollEnabled}
            scrollIndicatorInsets={scrollIndicatorInsets}
          >
            {children}
            {!scrollEnabled && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Whitespace backgroundColor={bg} deviceHeight={deviceHeight} />
            )}
          </Content>
        </ContentWrapper>
      </Container>
    </Fragment>
  );
});
