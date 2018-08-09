import PropTypes from 'prop-types';
import { createElement } from 'react';
import { Text } from 'react-native';

const TruncatedText = ({
  component,
  ellipsizeMode,
  numberOfLines,
  ...props
}) =>
  createElement(component, {
    ellipsizeMode,
    numberOfLines,
    ...props,
  });

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

export default TruncatedText;
