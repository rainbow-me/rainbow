import {
  createClient,
  JsonMap,
  SegmentClient,
} from '@segment/analytics-react-native';
import * as env from '@/env';
import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  REACT_APP_SEGMENT_API_DEV_WRITE_KEY,
} from 'react-native-dotenv';
import { TrackingEventProperties } from './trackingEvents';
import { UserProperties } from './userProperties';
import Routes from '@/navigation/routesNames';

// TODO: we only use route properties for 1 sheet, we need to collect all possibles and lay out the same as we do for event properties
// this should live in navigation once we type that
type RouteKeys = keyof typeof Routes;
type RouteNames = typeof Routes[RouteKeys];

class analyticsInstance {
  client: SegmentClient;
  deviceId?: string;
  addressHash?: string;

  constructor({
    debug = false,
    deviceId,
    addressHash,
  }: {
    debug?: boolean;
    deviceId?: string;
    addressHash?: string;
  } = {}) {
    this.client = createClient({
      debug: debug,
      trackAppLifecycleEvents: true,
      trackDeepLinks: true,
      // TODO: add dev write key to team env
      writeKey: debug
        ? REACT_APP_SEGMENT_API_DEV_WRITE_KEY
        : REACT_APP_SEGMENT_API_WRITE_KEY,
    });
    // TODO: load identifier, addressHash and call identify
    this.deviceId = deviceId;
    this.addressHash = addressHash;
  }

  identify(properties: UserProperties) {
    // wipe any PII here ( we need to develop a strategy for this )
    this.client.identify(this.deviceId, properties as JsonMap);
  }

  screen(routeName: RouteNames, params?: Record<string, any>): void {
    // wipe any PII here ( we need to develop a strategy for this )
    this.client.screen(routeName, params);
  }

  track<T extends keyof TrackingEventProperties>(
    event: T,
    params: TrackingEventProperties[typeof event]
  ) {
    this.client.track(event, params);
  }
}

// export both analytics for now
export const analyticsV2 = new analyticsInstance();
export const analytics = createClient({
  debug: false,
  trackAppLifecycleEvents: true,
  trackDeepLinks: true,
  writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
});

/*
// Identify Type Checking
analyticsV2.identify({invalidProperty: false})
analyticsV2.identify({numberOfNFTs: 69})

// Screen Type Checking
analyticsV2.screen(Routes.EXPLAIN_SHEET, {type: 'gas'});
analyticsV2.screen('invalid route');

// Track Type Checking
analyticsV2.track(TrackingEvents.pressedButton, { action: 'swap', buttonName: 'swapButton', invalidParam: "me"});
analyticsV2.track(TrackingEvents.pressedButton, { action: 'swap', buttonName: 'swapButton'});

*/
