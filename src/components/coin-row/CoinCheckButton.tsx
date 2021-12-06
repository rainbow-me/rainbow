import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconIndicator, CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, padding, position, shadow } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  ${position.size(CoinIconSize)};
  position: ${({ isAbsolute }: any) => (isAbsolute ? 'absolute' : 'relative')};
  top: 0;
`;

const Content = styled(Row).attrs(({ isAbsolute }) => ({
  align: 'center',
  justify: isAbsolute ? 'start' : 'center',
}))`
  ${position.size('100%')};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const CircleOutline = styled.View`
  ${borders.buildCircle(22)}
  border-color: ${({ theme: { colors } }: any) =>
    colors.alpha(colors.blueGreyDark, 0.12)};
  border-width: 1.5;
  left: 19;
  position: absolute;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const CheckmarkBackground = styled.View`
  ${borders.buildCircle(22)}
  ${padding(4.5)}
  ${({ theme: { isDarkMode, colors } }: any) =>
    shadow.build(0, 4, 12, isDarkMode ? colors.shadow : colors.appleBlue, 0.4)}
  background-color: ${({ theme: { colors } }: any) => colors.appleBlue};
  left: ${({ isAbsolute }: any) => (isAbsolute ? 19 : 0)};
`;

const CoinCheckButton = ({
  isAbsolute,
  isHidden,
  isPinned,
  onPress,
  toggle,
  ...props
}: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props} isAbsolute={isAbsolute}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content
        as={ButtonPressAnimation}
        isAbsolute={isAbsolute}
        onPress={onPress}
        opacityTouchable
        reanimatedButton
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {isHidden || isPinned ? null : <CircleOutline />}
        {!toggle && (isHidden || isPinned) ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CoinIconIndicator isPinned={isPinned} />
        ) : null}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CheckmarkBackground isAbsolute={isAbsolute}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Icon color="white" name="checkmark" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Content>
    </Container>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(CoinCheckButton, 'toggle');
