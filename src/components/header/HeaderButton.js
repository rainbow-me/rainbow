import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Flex } from '../layout';

const HeaderButton = ({
  children,
  onPress,
  transformOrigin,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} transformOrigin={transformOrigin}>
    <Flex {...props} css={padding(10)}>
      {children}
    </Flex>
  </ButtonPressAnimation>
);

HeaderButton.propTypes = {
  ...ButtonPressAnimation.propTypes,
  children: PropTypes.node,
  onPress: PropTypes.func.isRequired,
};

export default pure(HeaderButton);
