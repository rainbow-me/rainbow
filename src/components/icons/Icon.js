import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';
import SpinnerIcon from './svg/SpinnerIcon';

const Icon = (props) => {
  const icon = Icon.IconTypes[props.name];
  const iconElement = icon || Flex;

  return createElement(iconElement, props);
};

Icon.propTypes = {
  name: PropTypes.string,
};

Icon.IconTypes = {
  spinner: SpinnerIcon,
};

export default Icon;
