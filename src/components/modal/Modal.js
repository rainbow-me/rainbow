import React from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { colors, padding, position } from '@rainbow-me/styles';

const Container = styled(Centered).attrs(({ fixedToTop }) => ({
  direction: 'column',
  justify: fixedToTop ? 'start' : 'center',
}))`
  ${({ containerPadding }) => padding(containerPadding)};
  ${position.size('100%')};
  shadow-color: ${colors.black};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.5;
  shadow-radius: 25;
`;

const Content = styled(Column).attrs({ shrink: 0 })`
  background-color: ${colors.white};
  border-radius: ${({ radius }) => radius};
  height: ${({ height }) => height};
  margin-top: ${({ fixedToTop }) => (fixedToTop ? 91 : 0)};
  overflow: hidden;
  padding-top: ${({ fullScreenOnAndroid }) =>
    fullScreenOnAndroid && android ? getStatusBarHeight() : 0};
  width: 100%;
`;

export default function Modal({
  containerPadding = 15,
  fixedToTop,
  height,
  onCloseModal,
  radius = 12,
  statusBarStyle = 'light-content',
  fullScreenOnAndroid,
  skipStatusBar,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();

  return (
    <Container containerPadding={containerPadding} fixedToTop={fixedToTop}>
      {skipStatusBar || <StatusBar barStyle={statusBarStyle} />}
      {ios && <TouchableBackdrop onPress={onCloseModal} />}
      <Content
        fullScreenOnAndroid={fullScreenOnAndroid}
        {...props}
        fixedToTop={fixedToTop}
        height={
          (fullScreenOnAndroid && android ? '100%' : height) ||
          deviceHeight - 220
        }
        radius={radius}
      />
    </Container>
  );
}
