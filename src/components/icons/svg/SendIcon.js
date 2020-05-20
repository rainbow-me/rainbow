import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const SendIcon = ({ color, ...props }) => (
  <Svg height={23} width={22} viewBox="0 0 23 22" {...props}>
    <Path
      d="M22.2521752,19.7010605 C22.9929795,21.133282 22.3308642,22.0021207 20.7694019,21.6407639 L14.3640515,20.158425 C13.5835218,19.9777933 12.8789302,19.1963793 12.7874069,18.3874992 L11.7690784,9.38754741 C11.4982482,6.99396034 11.0638229,6.98551216 10.7966635,9.38754741 L9.79567028,18.3874992 C9.70697915,19.1849228 8.99950549,19.9780561 8.21802685,20.158425 L1.79554488,21.6407639 C0.231656011,22.0017169 -0.442156838,21.1459859 0.305218367,19.7010605 L9.93735205,1.07893545 C10.6781562,-0.353286208 11.8726663,-0.36599007 12.6200415,1.07893545 L22.2521752,19.7010605 Z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

SendIcon.propTypes = {
  color: PropTypes.string,
};

SendIcon.defaultProps = {
  color: colors.white,
};

export default SendIcon;
