import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const PlusIcon = ({ color, colors, ...props }) => (
  <Svg height="22" viewBox="0 0 22 22" width="22" {...props}>
    <Path
      d="M13.6,21.8c-.4,0,-.7,-.2,-1,-.4L6.8,15.5c-.2,-.3,-.4,-.6,-.4,-1c0,-.8,.6,-1.3,1.3,-1.3c.4,0,.7,.2,.9,.4L11,16l1.4,1.7l-.1,-2.4V9.1c0,-3.2,-1.9,-5,-4.5,-5c-2.7,0,-4.6,1.8,-4.6,5v2.5c0,.8,-.6,1.3,-1.3,1.3C1.2,12.9,.6,12.4,.6,11.6V9C.6,4.3,3.4,1.5,7.7,1.5c4.3,0,7.2,2.9,7.2,7.6v6.2l-.1,2.4L16.3,16l2.3,-2.4c.2,-.2,.5,-.4,.9,-.4c.8,0,1.3,.5,1.3,1.3c0,.4,-.1,.7,-.4,1l-5.8,5.9c-.3,.2,-.6,.4,-1,.4Z"
      fill={color || colors.white}
      fillRule="nonzero"
    />
  </Svg>
);

PlusIcon.propTypes = {
  color: PropTypes.string,
};

export default PlusIcon;
