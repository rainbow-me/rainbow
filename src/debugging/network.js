import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
import logger from '@/utils/logger';

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
    logger.log('');
  };
  const separator = () => {
    logger.log(`----------------------------------------`);
  };

  if (showNetworkRequests) {
    XHRInterceptor.setSendCallback((data, xhr) => {
      if (EXCLUDED_URLS.indexOf(xhr._url) === -1) {
        internalCounter++;
        xhr._trackingName = internalCounter;

        separator();
        emptyLine();
        logger.log(`${PREFIX} ➡️  REQUEST #${xhr._trackingName} -  ${xhr._method} ${xhr._url}`);
        emptyLine();
        if (data) {
          emptyLine();
          logger.log(' PARAMETERS: ');
          emptyLine();
          try {
            const dataObj = JSON.parse(data);
            logger.log(' {');
            Object.keys(dataObj).forEach(key => {
              logger.log(`   ${key} : `, dataObj[key]);
            });
            logger.log(' }');
          } catch (e) {
            logger.log(data);
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
        logger.log(`${PREFIX} ${getEmojiForStatusCode(status)}  RESPONSE #${rid} -  ${xhr._method} ${url}`);
        emptyLine();
        if (timeout && status > 400) {
          logger.log(` ⚠️ ⚠️  TIMEOUT!  ⚠️ ⚠️ `);
        }

        if (status) {
          logger.log(` Status:  ${status}`);
        }

        if (time) {
          logger.log(` Completed in:  ${time / 1000} s`);
        }

        if (response) {
          emptyLine();
          logger.log(' RESPONSE: ');
          emptyLine();
          try {
            const responseObj = JSON.parse(response);
            logger.log(' {');
            Object.keys(responseObj).forEach(key => {
              logger.log(`   ${key} : `, responseObj[key]);
            });
            logger.log(' }');
          } catch (e) {
            logger.log(response);
          }
        }
        emptyLine();
      }
    });
  }
  XHRInterceptor.enableInterception();
}
