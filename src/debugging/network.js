import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';

let internalCounter = 0;

const PREFIX = `[NETWORKING]:`;
const EXCLUDED_URLS = [
  'http://localhost:8081/symbolicate', // RN packager
  'https://clients3.google.com/generate_204', // Offline connection detection
];

export default function monitorNetwork(
  showNetworkRequests,
  showNetworkResponses
) {
  const requestCache = {};

  const getEmojiForStatusCode = status => {
    if (status >= 200 && status < 400) {
      return '✅';
    } else {
      return '❌';
    }
  };

  const emptyLine = () => {
    console.log('');
  };
  const separator = () => {
    console.log(`----------------------------------------`);
  };

  if (showNetworkRequests) {
    XHRInterceptor.setSendCallback((data, xhr) => {
      if (EXCLUDED_URLS.indexOf(xhr._url) === -1) {
        internalCounter++;
        xhr._trackingName = internalCounter;

        separator();
        emptyLine();
        console.log(
          `${PREFIX} ➡️  REQUEST #${xhr._trackingName} -  ${xhr._method} ${xhr._url}`
        );
        emptyLine();
        if (data) {
          emptyLine();
          console.log(' PARAMETERS: ');
          emptyLine();
          try {
            const dataObj = JSON.parse(data);
            console.log(' {');
            Object.keys(dataObj).forEach(key => {
              console.log(`   ${key} : `, dataObj[key]);
            });
            console.log(' }');
          } catch (e) {
            console.log(data);
          }
        }
        emptyLine();

        requestCache[internalCounter] = {
          startTime: new Date().getTime(),
        };
      }
    });
  }

  if (showNetworkResponses) {
    XHRInterceptor.setResponseCallback(
      (status, timeout, response, url, type, xhr) => {
        if (EXCLUDED_URLS.indexOf(url) === -1) {
          // fetch and clear the request data from the cache
          const rid = xhr._trackingName;
          const cachedRequest = requestCache[rid] || {};
          requestCache[rid] = null;
          const time =
            (cachedRequest.startTime &&
              new Date().getTime() - cachedRequest.startTime) ||
            null;

          separator();
          emptyLine();
          console.log(
            `${PREFIX} ${getEmojiForStatusCode(status)}  RESPONSE #${rid} -  ${
              xhr._method
            } ${url}`
          );
          emptyLine();
          if (timeout && status > 400) {
            console.log(` ⚠️ ⚠️  TIMEOUT!  ⚠️ ⚠️ `);
          }

          if (status) {
            console.log(` Status:  ${status}`);
          }

          if (time) {
            console.log(` Completed in:  ${time / 1000} s`);
          }

          if (response) {
            emptyLine();
            console.log(' RESPONSE: ');
            emptyLine();
            try {
              const responseObj = JSON.parse(response);
              console.log(' {');
              Object.keys(responseObj).forEach(key => {
                console.log(`   ${key} : `, responseObj[key]);
              });
              console.log(' }');
            } catch (e) {
              console.log(response);
            }
          }
          emptyLine();
        }
      }
    );
  }
  XHRInterceptor.enableInterception();
}
