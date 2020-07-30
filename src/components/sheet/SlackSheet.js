import React, { useMemo } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { Centered } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { colors } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  background-color: ${colors.white};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
`;

const Content = styled(ScrollView)`
  background-color: ${colors.white};
  ${({ contentHeight, deviceHeight }) =>
    contentHeight ? `height: ${deviceHeight + contentHeight}` : null};
  padding-top: ${SheetHandleFixedToTopHeight};
  width: 100%;
`;

const Whitespace = styled.View`
  background-color: ${colors.white};
  flex: 1;
  height: ${({ deviceHeight }) => deviceHeight};
  z-index: -1;
`;

export default function SlackSheet({
  borderRadius = 30,
  children,
  contentHeight,
  scrollEnabled = true,
  ...props
}) {
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
    <Container {...props}>
      <SheetHandleFixedToTop showBlur={scrollEnabled} />
      <Content
        contentContainerStyle={scrollEnabled && contentContainerStyle}
        contentHeight={contentHeight}
        deviceHeight={deviceHeight}
        directionalLockEnabled
        scrollEnabled={scrollEnabled}
        scrollIndicatorInsets={scrollIndicatorInsets}
      >
        {children}
        {!scrollEnabled && <Whitespace deviceHeight={deviceHeight} />}
      </Content>
    </Container>
  );
}
