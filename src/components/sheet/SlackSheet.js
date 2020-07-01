import React, { useMemo } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { Centered } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { borders, colors } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ radius }) => borders.buildRadius('top', radius)};
  background-color: ${colors.white};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
`;

const Content = styled(ScrollView)`
  background-color: ${colors.white};
  padding-top: ${SheetHandleFixedToTopHeight};
  width: 100%;
`;

const Whitespace = styled.View`
  background-color: ${colors.white};
  flex: 1;
  height: ${({ deviceHeight }) => deviceHeight};
`;

export default function SlackSheet({
  borderRadius = 30,
  children,
  scrollEnabled = true,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const bottomInset = useMemo(
    () => (insets.bottom || scrollEnabled ? 34 : 10),
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
    <Container {...props} radius={borderRadius}>
      <SheetHandleFixedToTop showBlur={scrollEnabled} />
      <Content
        contentContainerStyle={contentContainerStyle}
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
