
const addInfoBreadcrumb = message =>
  console.log({
    level: 'info',
    message,
  });

const addDataBreadcrumb = (message, data) =>
  console.log({
    data,
    level: 'info',
    message,
  });

const addNavBreadcrumb = (prevRoute, nextRoute, data) =>
  console.log({
    data,
    level: 'info',
    message: `From ${prevRoute} to ${nextRoute}`,
  });

export default {
  addDataBreadcrumb,
  addInfoBreadcrumb,
  addNavBreadcrumb,
};
