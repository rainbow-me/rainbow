import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const ClearInputIcon = ({ color, ...props }) => (
  <Svg height="20" width="20" {...props}>
    <Path
      d="M9.99 0C15.464 0 20 4.524 20 10.005 20 15.476 15.474 20 10 20S0 15.476 0 10.005C0 4.524 4.516 0 9.99 0zm3.366 5.742a.842.842 0 00-.648.27L9.99 8.71 7.292 6.022a.868.868 0 00-.648-.27.914.914 0 00-.928.918c0 .242.106.474.28.638l2.689 2.697-2.689 2.706a.87.87 0 00-.28.638c0 .513.416.928.928.928a.927.927 0 00.667-.27l2.68-2.688 2.698 2.688a.91.91 0 00.657.27.922.922 0 00.929-.928.962.962 0 00-.271-.657l-2.698-2.687 2.698-2.707a.83.83 0 00.28-.638.914.914 0 00-.928-.918z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

ClearInputIcon.propTypes = {
  color: PropTypes.string,
};

ClearInputIcon.defaultProps = {
  color: colors.black,
};

export default ClearInputIcon;
