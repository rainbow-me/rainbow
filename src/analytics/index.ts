import { createClient, SegmentClient } from '@segment/analytics-react-native';
import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  LOG_LEVEL,
  LOG_DEBUG,
} from 'react-native-dotenv';

import { EventProperties, events } from '@/analytics/events';
import { UserProperties } from '@/analytics/userProperties';
import { LogLevel } from '@/logger';

export class Analytics {
  client: SegmentClient;
  currentWalletAddressHash?: string;
  deviceId?: string;
  events = events;
  disabled = false;

  constructor() {
    this.client = createClient({
      debug: Boolean(LOG_DEBUG) || LOG_LEVEL === LogLevel.Debug,
      trackAppLifecycleEvents: true,
      trackDeepLinks: true,
      // TODO: add dev write key to team env
      writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
    });
  }

  identify(userProperties: UserProperties) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.identify(this.deviceId, {
      ...userProperties,
      ...metadata,
    });
  }

  screen(routeName: string, params: Record<string, any> = {}): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.screen(routeName, { ...params, ...metadata });
  }

  track<T extends keyof EventProperties>(
    event: T,
    params?: EventProperties[T]
  ) {
    if (this.disabled) return;
    const category = this.getTrackingEventCategory(event);
    const metadata = this.getDefaultMetadata();
    this.client.track(event, { ...params, category, ...metadata });
  }

  private getDefaultMetadata() {
    return {
      walletAddressHash: this.currentWalletAddressHash,
    };
  }

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  setCurrentWalletAddressHash(currentWalletAddressHash: string) {
    this.currentWalletAddressHash = currentWalletAddressHash;
  }

  enable() {
    this.disabled = false;
  }

  disable() {
    this.disabled = true;
  }

  getTrackingEventCategory<T extends keyof EventProperties>(event: T) {
    for (const category of Object.keys(events)) {
      // @ts-expect-error We know the index type of `events`
      for (const ev of Object.values(events[category])) {
        if (ev === event) return category;
      }
    }
  }
}

export const analyticsV2 = new Analytics();

/**
 * @deprecated Use the `analyticsV2` export from this same file
 */
export const analytics = createClient({
  debug: false,
  trackAppLifecycleEvents: true,
  trackDeepLinks: true,
  writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
});
