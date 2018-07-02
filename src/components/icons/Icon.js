import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';
import ArrowIcon from './svg/ArrowIcon';
import SpinnerIcon from './svg/SpinnerIcon';

const Icon = ({ name, ...props }) =>
  createElement((Icon.IconTypes[name] || Flex), props);

Icon.propTypes = {
  name: PropTypes.string,
};

Icon.IconTypes = {
  arrow: ArrowIcon,
  spinner: SpinnerIcon,
};

export default Icon;
