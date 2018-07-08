import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';

import ArrowIcon from './svg/ArrowIcon';
import AvatarIcon from './svg/AvatarIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';

const Icon = ({ name, ...props }) =>
  createElement((Icon.IconTypes[name] || Flex), props);

Icon.propTypes = {
  name: PropTypes.string,
};

Icon.IconTypes = {
  arrow: ArrowIcon,
  avatar: AvatarIcon,
  spinner: SpinnerIcon,
  threeDots: ThreeDotsIcon,
};

export default Icon;
