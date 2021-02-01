import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const SignatureIcon = ({ color, colors, ...props }) => (
  <Svg height="10" viewBox="0 0 10 10" width="10" {...props}>
    <Path
      d="M.007 9.78l.46-1.53c.085-.287.242-.55.455-.762l5.833-5.834a.227.227 0 0 1 .322 0l1.268 1.269a.227.227 0 0 1 0 .321L2.512 9.078c-.213.213-.475.37-.764.456L.22 9.993a.17.17 0 0 1-.212-.212zM9.177.2L9.8.823a.68.68 0 0 1 0 .96l-.761.762a.226.226 0 0 1-.32 0L7.455 1.28a.226.226 0 0 1 0-.32l.761-.761a.679.679 0 0 1 .96 0z"
      fill={color || colors.black}
      fillRule="nonzero"
    />
  </Svg>
);

SignatureIcon.propTypes = {
  color: PropTypes.string,
};

export default SignatureIcon;
