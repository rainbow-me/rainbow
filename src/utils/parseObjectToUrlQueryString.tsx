import { keys } from 'lodash';

export default params =>
  keys(params)
    .map(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(params[key]);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');
