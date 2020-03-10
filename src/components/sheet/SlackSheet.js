import React, { useMemo } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Centered } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';

const Container = styled(Centered).attrs({ direction: 'column' })`
  background-color: ${colors.white};
  border-radius: ${({ borderRadius }) => borderRadius};
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

export default function SlackSheet({
  borderRadius = 24,
  children,
  scrollEnabled = true,
  ...props
}) {
  const insets = useSafeArea();
  const bottomInset = (insets.bottom || 10) * (scrollEnabled ? 1 : 0.5);

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
    <Container {...props} borderRadius={borderRadius}>
      <SheetHandleFixedToTop showBlur={scrollEnabled} />
      <Content
        contentContainerStyle={contentContainerStyle}
        directionalLockEnabled
        scrollEnabled={scrollEnabled}
        scrollIndicatorInsets={scrollIndicatorInsets}
      >
        {children}
      </Content>
    </Container>
  );
}
