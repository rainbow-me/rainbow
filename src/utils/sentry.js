import { addBreadcrumb } from '@sentry/react-native';

const addInfoBreadcrumb = message =>
  addBreadcrumb({
    level: 'info',
    message,
  });

export default {
  addInfoBreadcrumb,
};
