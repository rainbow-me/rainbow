import BaseAlert from './BaseAlert';

const Alert = options =>
  BaseAlert({
    ...options,
    alertType: 'alert',
  });

export default Alert;
