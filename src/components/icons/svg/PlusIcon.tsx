import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const PlusIcon = ({ color, colors, ...props }) => {
  return (
    <Svg height="22" viewBox="-1.75 -1.75 22 22" width="22" {...props}>
      <Path
        d="M9.2,18.3c-.8,0,-1.5,-.6,-1.5,-1.4V10.6H1.4C.6,10.6,0,10,0,9.2C0,8.4,.6,7.7,1.4,7.7H7.7V1.4C7.7,.6,8.4,0,9.1,0h.1c.8,0,1.4,.6,1.4,1.4V7.7h6.3c.8,0,1.4,.7,1.4,1.5c0,.8,-.6,1.4,-1.4,1.4H10.6v6.3c0,.8,-.6,1.4,-1.4,1.4Z"
        fill={color || colors.white}
        fillRule="nonzero"
      />
    </Svg>
  );
};

PlusIcon.propTypes = {
  color: PropTypes.string,
};

export default PlusIcon;
