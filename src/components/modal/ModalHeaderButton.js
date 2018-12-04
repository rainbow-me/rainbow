import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { compose, setPropTypes, withProps, withHandlers } from 'recompact';
import styled from 'styled-components';
import { colors, padding, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered, FlexItem, Row } from '../layout';
import { Text as UnstyledText, TruncatedText } from '../text';

  // flex: 1,
const Container = styled(Row).attrs({ align: 'center' })`
  bottom: 0;
  flex: 1;
  padding-left: ${({ side }) => (side === 'left' ? 16 : 48)}
  padding-right: ${({ side }) => (side === 'left' ? 48 : 16)}
  position: absolute;
  top: 0;
  zIndex: 2;
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0')}
`;

const Text = styled(UnstyledText).attrs({
  color: 'appleBlue',
  size: 'large',
  weight: 'medium',
})`
  margin-left: ${({ showBackArrow }) => (showBackArrow ? 4 : 0)};
`;

const ModalHeaderButton = ({ children, side, showBackArrow, ...props }) => {

  return (
    <Container
      component={TouchableOpacity}
      justify={(side === 'left') ? 'start' : 'end'}
      side={side}
      {...props}
    >
      {showBackArrow && (
        <Icon
          color={colors.appleBlue}
          direction="left"
          height={16}
          name="caret"
        />
      )}
      <Text showBackArrow={showBackArrow}>
        {children}
      </Text>
    </Container>
  );
};

ModalHeaderButton.propTypes = {
  children: PropTypes.string,
  showBackArrow: PropTypes.bool,
};

export default ModalHeaderButton;
