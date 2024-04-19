import { addBreadcrumb } from '@sentry/react-native';

const addInfoBreadcrumb = (message: any) =>
  addBreadcrumb({
    level: 'info',
    message,
  });

const addDataBreadcrumb = (message: any, data: any) =>
  addBreadcrumb({
    data,
    level: 'info',
    message,
  });

const addNavBreadcrumb = (prevRoute: any, nextRoute: any, data: any) =>
  addBreadcrumb({
    data,
    level: 'info',
    message: `From ${prevRoute} to ${nextRoute}`,
  });

/**
 * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
 */
export default {
  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  addDataBreadcrumb,
  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  addInfoBreadcrumb,
  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  addNavBreadcrumb,
};
