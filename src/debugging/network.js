import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
import { logger, RainbowError } from '@/logger';

let internalCounter = 0;

const PREFIX = `[NETWORKING]:`;
const EXCLUDED_URLS = [
  'http://localhost:8081/symbolicate', // RN packager
  'https://clients3.google.com/generate_204', // Offline connection detection
];

export default function monitorNetwork(showNetworkRequests, showNetworkResponses) {
  const requestCache = {};

  const getEmojiForStatusCode = status => {
    if (status >= 200 && status < 400) {
      return '✅';
    } else {
      return '❌';
    }
  };

  const emptyLine = () => {
    logger.debug('');
  };
  const separator = () => {
    logger.debug(`----------------------------------------`);
  };

  if (showNetworkRequests) {
    XHRInterceptor.setSendCallback((data, xhr) => {
      if (EXCLUDED_URLS.indexOf(xhr._url) === -1) {
        internalCounter++;
        xhr._trackingName = internalCounter;

        separator();
        emptyLine();
        logger.debug(`${PREFIX} ➡️  REQUEST #${xhr._trackingName} -  ${xhr._method} ${xhr._url}`);
        emptyLine();
        if (data) {
          emptyLine();
          logger.debug(' PARAMETERS: ');
          emptyLine();
          try {
            const dataObj = JSON.parse(data);
            logger.debug(' {');
            Object.keys(dataObj).forEach(key => {
              logger.debug(`   ${key} : `, dataObj[key]);
            });
            logger.debug(' }');
          } catch (e) {
            logger.error(new RainbowError(`Error parsing data: ${e}`), { data });
          }
        }
        emptyLine();

        requestCache[internalCounter] = {
          startTime: Date.now(),
        };
      }
    });
  }

  if (showNetworkResponses) {
    XHRInterceptor.setResponseCallback((status, timeout, response, url, type, xhr) => {
      if (EXCLUDED_URLS.indexOf(url) === -1) {
        // fetch and clear the request data from the cache
        const rid = xhr._trackingName;
        const cachedRequest = requestCache[rid] || {};
        requestCache[rid] = null;
        const time = (cachedRequest.startTime && Date.now() - cachedRequest.startTime) || null;

        separator();
        emptyLine();
        logger.debug(`${PREFIX} ${getEmojiForStatusCode(status)}  RESPONSE #${rid} -  ${xhr._method} ${url}`);
        emptyLine();
        if (timeout && status > 400) {
          logger.debug(` ⚠️ ⚠️  TIMEOUT!  ⚠️ ⚠️ `);
        }

        if (status) {
          logger.debug(` Status:  ${status}`);
        }

        if (time) {
          logger.debug(` Completed in:  ${time / 1000} s`);
        }

        if (response) {
          emptyLine();
          logger.debug(' RESPONSE: ');
          emptyLine();
          try {
            const responseObj = JSON.parse(response);
            logger.debug(' {');
            Object.keys(responseObj).forEach(key => {
              logger.debug(`   ${key} : `, responseObj[key]);
            });
            logger.debug(' }');
          } catch (e) {
            logger.error(new RainbowError(`Error parsing response: ${e}`), { data: response });
          }
        }
        emptyLine();
      }
    });
  }
  XHRInterceptor.enableInterception();
}
