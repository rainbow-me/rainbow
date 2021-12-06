import BaseAlert from './BaseAlert';

const Alert = (options: any) =>
  BaseAlert({
    ...options,
    alertType: 'alert',
  });

export default Alert;
