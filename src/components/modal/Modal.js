import React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { colors, padding, position } from '../../styles';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';

const Container = styled(Centered).attrs(({ fixedToTop }) => ({
  direction: 'column',
  justify: fixedToTop ? 'start' : 'center',
}))`
  ${({ containerPadding }) => padding(containerPadding)};
  ${position.size('100%')};
`;

const Content = styled(Column).attrs({ shrink: 0 })`
  background-color: ${colors.white};
  border-radius: ${({ radius }) => radius};
  height: ${({ height }) => height};
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
  statusBarStyle = 'light-content',
  ...props
}) {
  const { height: deviceHeight } = useDimensions();

  return (
    <Container containerPadding={containerPadding} fixedToTop={fixedToTop}>
      <StatusBar barStyle={statusBarStyle} />
      <TouchableBackdrop onPress={onCloseModal} />
      <Content
        {...props}
        fixedToTop={fixedToTop}
        height={height || deviceHeight - 230}
        radius={radius}
      />
    </Container>
  );
}
