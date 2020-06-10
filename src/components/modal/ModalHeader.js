import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { borders, colors, position } from '../../styles';
import { Centered, Row } from '../layout';
import { TruncatedText } from '../text';
import ModalHeaderButton from './ModalHeaderButton';

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

const ModalHeader = ({
  onPressBack,
  onPressClose,
  showBackButton,
  showDoneButton,
  title,
  ...props
}) => (
  <Container {...props}>
    {showBackButton && (
      <ModalHeaderButton label="Settings" onPress={onPressBack} side="left" />
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
      <ModalHeaderButton label="Done" onPress={onPressClose} side="right" />
    )}
  </Container>
);

ModalHeader.propTypes = {
  onPressBack: PropTypes.func,
  onPressClose: PropTypes.func,
  showBackButton: PropTypes.bool,
  showDoneButton: PropTypes.bool,
  title: PropTypes.string,
};

ModalHeader.defaultProps = {
  showDoneButton: true,
};

ModalHeader.height = ModalHeaderHeight;

export default ModalHeader;
