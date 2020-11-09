import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { Centered } from '../layout';
import { useReanimatedValue } from '../list/MarqueeList';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { colors } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  background-color: ${({ backgroundColor }) => backgroundColor};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
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
  ...props
}) {
  const yPosition = useReanimatedValue(0);
  const { height: deviceHeight } = useDimensions();
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
    <Container backgroundColor={backgroundColor} {...props}>
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
  );
}
