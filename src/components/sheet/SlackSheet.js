// FIXME unify with iOS
import React, { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import { useReanimatedValue } from '../list/MarqueeList';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, position } from '@rainbow-me/styles';

const { event } = Animated;

const AndroidBackground = styled.View`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ additionalTopPadding, contentHeight, deferredHeight, deviceHeight }) =>
    deferredHeight || ios
      ? ''
      : `top: ${
          contentHeight && additionalTopPadding
            ? deviceHeight - contentHeight
            : 0
        };`};
  ${android ? 'border-radius: 20;' : ''}
  background-color: ${({ backgroundColor }) => backgroundColor};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
`;

const Content = styled(Animated.ScrollView).attrs(({ y }) => ({
  directionalLockEnabled: true,
  keyboardShouldPersistTaps: 'always',
  onScroll: event([
    {
      nativeEvent: {
        contentOffset: {
          y,
        },
      },
    },
  ]),
  scrollEventThrottle: 16,
}))`
  background-color: ${({ backgroundColor }) => backgroundColor};
  ${({ contentHeight, deviceHeight }) =>
    contentHeight ? `height: ${deviceHeight + contentHeight}` : null};
  padding-top: ${SheetHandleFixedToTopHeight};
  width: 100%;
`;

const ContentWrapper = styled.View`
  ${position.size('100%')};
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const Whitespace = styled.View`
  background-color: ${({ backgroundColor }) => backgroundColor};
  flex: 1;
  height: ${({ deviceHeight }) => deviceHeight};
  z-index: -1;
`;

export default function SlackSheet({
  additionalTopPadding = false,
  backgroundColor = colors.white,
  borderRadius = 30,
  children,
  contentHeight,
  deferredHeight = false,
  hideHandle = false,
  renderHeader,
  scrollEnabled = true,
  ...props
}) {
  const yPosition = useReanimatedValue(0);
  const { height: deviceHeight } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeArea();
  const bottomInset = useMemo(
    () => (insets.bottom || scrollEnabled ? 42 : 30),
    [insets.bottom, scrollEnabled]
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomInset,
    }),
    [bottomInset]
  );

  const scrollIndicatorInsets = useMemo(
    () => ({
      bottom: bottomInset,
      top: borderRadius + SheetHandleFixedToTopHeight,
    }),
    [borderRadius, bottomInset]
  );

  return (
    <Fragment>
      {android ? (
        <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} />
      ) : null}
      <Container
        additionalTopPadding={additionalTopPadding}
        backgroundColor={backgroundColor}
        contentHeight={contentHeight}
        deferredHeight={deferredHeight}
        deviceHeight={deviceHeight}
        {...props}
      >
        {android && (
          <AndroidBackground
            as={TouchableWithoutFeedback}
            backgroundColor={backgroundColor}
          >
            <AndroidBackground backgroundColor={backgroundColor} />
          </AndroidBackground>
        )}
        {!hideHandle && <SheetHandleFixedToTop showBlur={scrollEnabled} />}
        <ContentWrapper backgroundColor={backgroundColor}>
          {renderHeader?.(yPosition)}
          <Content
            backgroundColor={backgroundColor}
            contentContainerStyle={scrollEnabled && contentContainerStyle}
            contentHeight={contentHeight}
            deviceHeight={deviceHeight}
            directionalLockEnabled
            scrollEnabled={scrollEnabled}
            scrollIndicatorInsets={scrollIndicatorInsets}
            y={yPosition}
          >
            {children}
            {!scrollEnabled && (
              <Whitespace
                backgroundColor={backgroundColor}
                deviceHeight={deviceHeight}
              />
            )}
          </Content>
        </ContentWrapper>
      </Container>
    </Fragment>
  );
}
