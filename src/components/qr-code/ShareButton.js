import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import styled from 'styled-components/primitives';
import { fonts, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const ButtonWrapper = styled(Centered)`
  width: 123px;
  height: 56px;
  border-radius: 28px;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0px 10px 30px rgba(37, 41, 46, 0.2);
  background-color: #25292e;
  justify-content: center;
  padding-bottom: 2px;
  margin-top: 24px;
`;

const ButtonIcon = styled(Icon)`
  ${position.maxSize('110%')};
  margin-right: 9;
`;

const IconContainer = styled(Centered).attrs({
  grow: 0,
  shrink: 0,
})`
  ${position.size(18)};
`;

const ShareButton = ({ onPress }) => (
  <ButtonPressAnimation onPress={onPress}>
    <ButtonWrapper>
      <IconContainer>
        <ButtonIcon color="white" name="share" />
      </IconContainer>
      <Text color="white" size={fonts.size.larger} weight="semibold">
        Share
      </Text>
    </ButtonWrapper>
  </ButtonPressAnimation>
);

ShareButton.propTypes = {
  onPress: PropTypes.func,
};

export default onlyUpdateForPropTypes(ShareButton);
