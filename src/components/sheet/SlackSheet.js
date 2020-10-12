import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import deviceUtils from '../../utils/deviceUtils';
import { Centered } from '../layout';
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
  border-radius: 20;
  top: ${({ contentHeight, additionalTopPadding }) =>
    contentHeight && additionalTopPadding
      ? deviceUtils.dimensions.height - contentHeight
      : 0};
  right: 0;
`;

const Content = styled(ScrollView).attrs({
  directionalLockEnabled: true,
  keyboardShouldPersistTaps: 'always',
})`
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
  scrollEnabled = true,
  additionalTopPadding = false,
  ...props
}) {
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
        <TouchableWithoutFeedback
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}
        >
          <View
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}
          />
        </TouchableWithoutFeedback>
        {!hideHandle && ios && (
          <SheetHandleFixedToTop showBlur={scrollEnabled} />
        )}
        <Content
          backgroundColor={backgroundColor}
          contentContainerStyle={scrollEnabled && contentContainerStyle}
          contentHeight={contentHeight}
          deviceHeight={deviceHeight}
          directionalLockEnabled
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
    </>
  );
}
