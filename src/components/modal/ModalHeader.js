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
  flex: 0,
  justify: 'space-between',
})`
  ${borders.buildRadius('top', 20)};
  background-color: ${colors.white};
  flex-shrink: 0;
  height: ${ModalHeaderHeight};
  width: 100%;
`;

const TitleContainer = styled(Centered)`
  ${position.cover};
  zIndex: 0;
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
      <ModalHeaderButton
        label="Settings"
        onPress={onPressBack}
        showBackArrow
        side="left"
      />
    )}
    <TitleContainer>
      <TruncatedText
        height={21}
        letterSpacing="tighter"
        size="large"
        weight="bold"
      >
        {title}
      </TruncatedText>
    </TitleContainer>
    {showDoneButton && (
      <ModalHeaderButton
        label="Done"
        onPress={onPressClose}
        side="right"
      />
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
