import React from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

export const SavingsSheetEmptyHeight = 313;
export const SavingsSheetHeight = android
  ? 424 - getSoftMenuBarHeight() / 2
  : 352;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const SavingsSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();

  return (
    <Container
      deviceHeight={deviceHeight}
      height={SavingsSheetHeight}
      insets={insets}
    >
      <StatusBar barStyle="light-content" />
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={SavingsSheetHeight}
      />
    </Container>
  );
};

export default React.memo(SavingsSheet);
