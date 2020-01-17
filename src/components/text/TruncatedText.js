import PropTypes from 'prop-types';
import { createElement, memo } from 'react';
import Text from './Text';

const TruncatedText = ({ component, ...props }) =>
  createElement(component, props);

TruncatedText.propTypes = {
  component: PropTypes.func,
  ellipsizeMode: PropTypes.oneOf(['clip', 'head', 'middle', 'tail']),
  numberOfLines: PropTypes.number,
};

TruncatedText.defaultProps = {
  component: Text,
  ellipsizeMode: 'tail',
  numberOfLines: 1,
};

export default memo(TruncatedText);
