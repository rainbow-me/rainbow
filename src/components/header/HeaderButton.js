import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Flex } from '../layout';

const Container = styled(Flex)`
  ${padding(10)};
`;

const HeaderButton = ({
  children,
  onPress,
  transformOrigin,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} transformOrigin={transformOrigin}>
    <Container {...props}>
      {children}
    </Container>
  </ButtonPressAnimation>
);

HeaderButton.propTypes = {
  ...ButtonPressAnimation.propTypes,
  children: PropTypes.node,
  onPress: PropTypes.func.isRequired,
};

export default pure(HeaderButton);
