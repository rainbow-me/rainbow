import PropTypes from 'prop-types';
import { AlertIOS } from 'react-native';

const BaseAlert = ({
  buttons,
  callback,
  message,
  title,
  type,
}) => AlertIOS[type](title, message, buttons || callback);

BaseAlert.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.shape({
    onPress: PropTypes.func,
    style: PropTypes.oneOf(['cancel', 'default', 'destructive']),
    text: PropTypes.string.isRequired,
  })),
  callback: PropTypes.func,
  message: PropTypes.string,
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['alert', 'prompt']).isRequired,
};

export default BaseAlert;
