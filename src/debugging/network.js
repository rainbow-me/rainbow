// XHRInterceptor removed in RN 0.81 - network debugging disabled
// import XHRInterceptor from 'react-native/src/private/inspector/XHRInterceptor';
import { logger, RainbowError } from '@/logger';

export default function monitorNetwork(showNetworkRequests, showNetworkResponses) {
  // Network monitoring disabled due to XHRInterceptor removal in RN 0.81
  logger.debug('[NETWORKING]: Network monitoring disabled - XHRInterceptor not available in RN 0.81');
}
