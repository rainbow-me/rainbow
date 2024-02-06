import PropTypes from 'prop-types';
import { WrappedAlert as Alert } from '@/helpers/alert';

const BaseAlert = ({ alertType, buttons, callback, message, title, type }) => Alert[alertType](title, message, buttons || callback, type);

BaseAlert.propTypes = {
  alertType: PropTypes.oneOf(['alert', 'prompt']).isRequired,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      onPress: PropTypes.func,
      style: PropTypes.oneOf(['cancel', 'default', 'destructive']),
      text: PropTypes.string.isRequired,
    })
  ),
  callback: PropTypes.func,
  message: PropTypes.string,
  title: PropTypes.string.isRequired,
  type: PropTypes.string,
};

export default BaseAlert;
