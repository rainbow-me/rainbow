// FIXME unify with iOS
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import deviceUtils from '../../utils/deviceUtils';
import { Centered } from '../layout';
import { useReanimatedValue } from '../list/MarqueeList';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { useNavigation } from '@rainbow-me/navigation';
import { colors } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  background-color: ${({ backgroundColor }) => backgroundColor};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  border-top-left-radius: 20;
  border-top-right-radius: 20;
  top: ${({ contentHeight, additionalTopPadding }) =>
    contentHeight && additionalTopPadding
      ? deviceUtils.dimensions.height - contentHeight
      : 0};
  right: 0;
`;

const { event } = Animated;

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

const Whitespace = styled.View`
  background-color: ${({ backgroundColor }) => backgroundColor};
  flex: 1;
  height: ${({ deviceHeight }) => deviceHeight};
  z-index: -1;
`;

export default function SlackSheet({
  backgroundColor = colors.white,
  borderRadius = 30,
  children,
  contentHeight,
  hideHandle = false,
  renderHeader,
  scrollEnabled = true,
  additionalTopPadding = false,
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
    <>
      {android ? (
        <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} />
      ) : null}
      <Container
        additionalTopPadding={additionalTopPadding}
        backgroundColor={backgroundColor}
        contentHeight={contentHeight}
        {...props}
      >
        {android && (
          <TouchableWithoutFeedback
            style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
          >
            <View
              style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
            />
          </TouchableWithoutFeedback>
        )}
        {!hideHandle && <SheetHandleFixedToTop showBlur={scrollEnabled} />}
        <View style={{ backgroundColor, height: '100%', width: '100%' }}>
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
        </View>
      </Container>
    </>
  );
}
