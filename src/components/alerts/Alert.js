import BaseAlert from './BaseAlert';

const Alert = (options) => BaseAlert({
  ...options,
  type: 'alert',
});

export default Alert;
