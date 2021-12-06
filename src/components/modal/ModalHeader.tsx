import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Centered, Row } from '../layout';
import { TruncatedText } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ModalHeaderButton' was resolved to '/Use... Remove this comment to see the full error message
import ModalHeaderButton from './ModalHeaderButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, position } from '@rainbow-me/styles';

export const ModalHeaderHeight = 50;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
  shrink: 0,
})`
  ${borders.buildRadius('top', 20)};
  background-color: ${({ backgroundColor }) => backgroundColor};
  height: ${ModalHeaderHeight};
  width: 100%;
`;

const TitleContainer = styled(Centered)`
  ${position.cover};
  z-index: 0;
`;

export default function ModalHeader({
  onPressBack,
  onPressClose,
  showBackButton,
  showDoneButton = true,
  title,
  ...props
}: any) {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container backgroundColor={colors.white} {...props}>
      {showBackButton && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ModalHeaderButton label="Settings" onPress={onPressBack} side="left" />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TitleContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TruncatedText
          align="center"
          color={colors.black}
          height={21}
          lineHeight="loose"
          size="large"
          weight="bold"
        >
          {title}
        </TruncatedText>
      </TitleContainer>
      {showDoneButton && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ModalHeaderButton label="Done" onPress={onPressClose} side="right" />
      )}
    </Container>
  );
}
