import React from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TouchableBackdrop' was resolved to '/Us... Remove this comment to see the full error message
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

const Container = styled(Centered).attrs(({ fixedToTop }) => ({
  direction: 'column',
  justify: fixedToTop ? 'start' : 'center',
}))`
  ${({ containerPadding }) => padding(containerPadding)};
  ${position.size('100%')};
  shadow-color: ${({ shadowColor }) => shadowColor};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.5;
  shadow-radius: 25;
`;

const Content = styled(Column).attrs({ shrink: 0 })`
  border-radius: ${({ radius }) => radius};
  height: ${({ height }) => height};
  margin-top: ${({ fixedToTop }) => (fixedToTop ? 91 : 0)};
  overflow: hidden;
  padding-top: ${({ fullScreenOnAndroid }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) {
  const { height: deviceHeight } = useDimensions();
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      containerPadding={containerPadding}
      fixedToTop={fixedToTop}
      shadowColor={colors.shadowBlack}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {skipStatusBar || <StatusBar barStyle={statusBarStyle} />}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <TouchableBackdrop onPress={onCloseModal} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content
        fullScreenOnAndroid={fullScreenOnAndroid}
        {...props}
        backgroundColor={colors.white}
        fixedToTop={fixedToTop}
        height={
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          (fullScreenOnAndroid && android ? '100%' : height) ||
          deviceHeight - 220
        }
        radius={radius}
      />
    </Container>
  );
}
