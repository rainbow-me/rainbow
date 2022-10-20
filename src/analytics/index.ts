import { createClient, SegmentClient } from '@segment/analytics-react-native';
import { REACT_APP_SEGMENT_API_WRITE_KEY } from 'react-native-dotenv';

import { EventProperties, events } from '@/analytics/events';
import { UserProperties } from '@/analytics/userProperties';
import Routes from '@/navigation/routesNames';

// TODO: we only use route properties for 1 sheet, we need to collect all possibles and lay out the same as we do for event properties
// this should live in navigation once we type that
type RouteKeys = keyof typeof Routes;
type RouteName = typeof Routes[RouteKeys];

export class Analytics {
  public client: SegmentClient;
  public currentWalletAddressHash?: string;
  public deviceId?: string;
  public debug: boolean;
  public events = events;

  constructor({ debug = false }: { debug?: boolean }) {
    this.debug = debug;
    this.client = createClient({
      debug: debug,
      trackAppLifecycleEvents: true,
      trackDeepLinks: true,
      // TODO: add dev write key to team env
      writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
    });
  }

  public identify(userProperties: UserProperties) {
    const metadata = this.getDefaultMetadata();
    this.client.identify(this.deviceId, {
      ...userProperties,
      ...metadata,
    });
  }

  public screen(routeName: RouteName, params: Record<string, any> = {}): void {
    const metadata = this.getDefaultMetadata();
    this.client.screen(routeName, { ...params, ...metadata });
  }

  public track<T extends keyof EventProperties>(
    event: T,
    params?: EventProperties[T]
  ) {
    const category = this.getTrackingEventCategory(event);
    const metadata = this.getDefaultMetadata();
    this.client.track(event, { ...params, category, ...metadata });
  }

  private getDefaultMetadata() {
    return {
      walletAddressHash: this.currentWalletAddressHash,
    };
  }

  public setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  public setCurrentWalletAddressHash(currentWalletAddressHash: string) {
    this.currentWalletAddressHash = currentWalletAddressHash;
  }

  public getTrackingEventCategory<T extends keyof EventProperties>(event: T) {
    for (const category of Object.keys(events)) {
      // @ts-expect-error We know the index type of `events`
      for (const ev of Object.values(events[category])) {
        if (ev === event) return category;
      }
    }
  }
}

export const analyticsV2 = new Analytics({
  debug: false,
});

/**
 * @deprecated Use the `analyticsV2` export from this same file
 */
export const analytics = createClient({
  debug: false,
  trackAppLifecycleEvents: true,
  trackDeepLinks: true,
  writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
});
