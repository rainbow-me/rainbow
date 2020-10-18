import lang from 'i18n-js';
import React from 'react';
import styled from 'styled-components';
import { Centered, Row } from '../layout';
import { TruncatedText } from '../text';
import ModalHeaderButton from './ModalHeaderButton';
import { borders, colors, position } from '@rainbow-me/styles';

export const ModalHeaderHeight = 50;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
  shrink: 0,
})`
  ${borders.buildRadius('top', 20)};
  background-color: ${colors.white};
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
}) {
  return (
    <Container {...props}>
      {showBackButton && (
        <ModalHeaderButton
          label={lang.t('settings.label')}
          onPress={onPressBack}
          side="left"
        />
      )}
      <TitleContainer>
        <TruncatedText
          align="center"
          height={21}
          lineHeight="loose"
          size="large"
          weight="bold"
        >
          {title}
        </TruncatedText>
      </TitleContainer>
      {showDoneButton && (
        <ModalHeaderButton
          label={lang.t('settings.done')}
          onPress={onPressClose}
          side="right"
        />
      )}
    </Container>
  );
}
