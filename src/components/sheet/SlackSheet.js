import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { Column } from '../layout';
import SheetHandleFixedToTop, {
  SheetHandleFixedToTopHeight,
} from './SheetHandleFixedToTop';
import { useDimensions } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const Container = styled(Column).attrs({
  justify: 'end',
})`
  background-color: ${({ backgroundColor }) => backgroundColor};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
`;

const Content = styled(ScrollView).attrs({
  directionalLockEnabled: true,
})`
  ${({ contentHeight, deviceHeight }) =>
    contentHeight ? `height: ${deviceHeight + contentHeight}` : null};
  background-color: ${({ backgroundColor }) => backgroundColor};
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
  bottomInset,
  children,
  contentHeight,
  scrollEnabled,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const contentBottomInset = bottomInset || insets.bottom || 30;

  const contentContainerStyle = useMemoOne(
    () => ({
      flexGrow: 1,
      flexShrink: 0,
      paddingBottom: contentBottomInset,
    }),
    [contentBottomInset]
  );

  const scrollIndicatorInsets = useMemoOne(
    () => ({
      bottom: contentBottomInset,
      top: borderRadius + SheetHandleFixedToTopHeight,
    }),
    [borderRadius, contentBottomInset]
  );

  return (
    <Container {...props} backgroundColor={backgroundColor}>
      <SheetHandleFixedToTop showBlur={scrollEnabled} />
      <Content
        backgroundColor={backgroundColor}
        contentContainerStyle={contentContainerStyle}
        contentHeight={contentHeight}
        deviceHeight={deviceHeight}
        scrollEnabled={scrollEnabled}
        scrollIndicatorInsets={scrollIndicatorInsets}
      >
        {children}
        {!scrollEnabled && (
          <Whitespace
            backgroundColor={backgroundColor}
            deviceHeight={deviceHeight}
          />
        )}
      </Content>
    </Container>
  );
}
