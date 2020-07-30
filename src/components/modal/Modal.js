import React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { colors, padding, position } from '@rainbow-me/styles';

const Container = styled(Centered).attrs(({ fixedToTop }) => ({
  direction: 'column',
  justify: fixedToTop ? 'start' : 'center',
}))`
  margin-top: ${ios ? 20 : 0};
  ${({ containerPadding }) => padding(...containerPadding)};
  ${position.size('100%')};
`;

const Content = styled(Column).attrs({ shrink: 0 })`
  background-color: ${colors.white};
  border-radius: ${({ radius }) => radius};
  height: ${({ height }) => height};
  padding-top: ${android ? 30 : 0};
  margin-top: ${({ fixedToTop }) => (fixedToTop ? 91 : 0)};
  width: 100%;
  overflow: hidden;
`;

export default function Modal({
  containerPadding = 15,
  fixedToTop,
  height,
  onCloseModal,
  radius = 12,
  statusBarStyle = ios ? 'light-content' : 'dark-content',
  skipStatusBarManaging,
  fullScreenOnAndroid = false,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();

  return (
    <Container
      containerPadding={
        fullScreenOnAndroid && android ? [10, 0] : [containerPadding]
      }
      fixedToTop={fixedToTop}
    >
      {!skipStatusBarManaging && (
        <StatusBar barStyle={statusBarStyle} translucent />
      )}
      {!fullScreenOnAndroid ||
        (ios && <TouchableBackdrop onPress={onCloseModal} />)}
      <Content
        {...props}
        fixedToTop={fixedToTop}
        height={
          (fullScreenOnAndroid && android ? '100%' : height) ||
          deviceHeight - 230
        }
        radius={radius}
      />
    </Container>
  );
}
