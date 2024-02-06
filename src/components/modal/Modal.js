import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(Centered).attrs(({ fixedToTop }) => ({
  direction: 'column',
  justify: fixedToTop ? 'start' : 'center',
}))({
  marginTop: ({ insetTop }) => (android ? insetTop : 0),
  padding: ({ containerPadding }) => containerPadding,
  ...position.sizeAsObject('100%'),
  shadowColor: ({ shadowColor }) => shadowColor,

  shadowOffset: { height: 10, width: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 25,
});

const Content = styled(Column).attrs({ shrink: 0 })({
  borderRadius: ({ radius }) => radius,
  height: ({ height }) => height,
  marginTop: ({ fixedToTop }) => (fixedToTop ? 91 : 0),
  overflow: 'hidden',
  width: '100%',
});

export default function Modal({ containerPadding = 15, fixedToTop, height, onCloseModal, radius = 12, fullScreenOnAndroid, ...props }) {
  const { height: deviceHeight } = useDimensions();
  const { top: insetTop } = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Container containerPadding={containerPadding} fixedToTop={fixedToTop} insetTop={insetTop} shadowColor={colors.shadowBlack}>
      {ios && <TouchableBackdrop onPress={onCloseModal} />}
      <Content
        {...props}
        backgroundColor={colors.white}
        fixedToTop={fixedToTop}
        height={(fullScreenOnAndroid && android ? '100%' : height) || deviceHeight - 220}
        radius={radius}
      />
    </Container>
  );
}
