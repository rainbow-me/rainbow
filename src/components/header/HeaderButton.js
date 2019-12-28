import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { padding } from '../../styles';
import { TouchableScale } from '../animations';
import { Flex } from '../layout';

const HeaderButton = ({ children, onPress, transformOrigin, ...props }) => (
  <TouchableScale
    activeScale={0.8}
    hapticType="impactLight"
    pressInFriction={50}
    pressInTension={400}
    pressOutFriction={30}
    pressOutTension={300}
    onPress={onPress}
    transformOrigin={transformOrigin}
    useNativeDriver
  >
    <Flex css={padding(10, 19, 8)} {...props}>
      {children}
    </Flex>
  </TouchableScale>
);

HeaderButton.propTypes = {
  ...TouchableScale.propTypes,
  children: PropTypes.node,
  onPress: PropTypes.func.isRequired,
};

export default pure(HeaderButton);
