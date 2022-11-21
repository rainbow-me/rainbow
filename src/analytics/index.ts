import { createClient, SegmentClient } from '@segment/analytics-react-native';
import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  LOG_LEVEL,
  LOG_DEBUG,
} from 'react-native-dotenv';

import { EventProperties, event } from '@/analytics/event';
import { UserProperties } from '@/analytics/userProperties';
import { LogLevel, logger } from '@/logger';
import { device } from '@/storage';

export class Analytics {
  client: SegmentClient;
  currentWalletAddressHash?: string;
  deviceId?: string;
  event = event;
  disabled = !!device.get(['doNotTrack']);

  constructor() {
    this.client = createClient({
      debug:
        (LOG_DEBUG || '').includes(logger.DebugContext.analytics) ||
        LOG_LEVEL === LogLevel.Debug,
      trackAppLifecycleEvents: true,
      trackDeepLinks: true,
      writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
    });

    logger.debug(`Segment initialized`);
  }

  /**
   * Sends an `identify` event to Segment along with the traits you pass in
   * here. This uses the `deviceId` as the identifier, and attaches the hashed
   * wallet address as a property, if available.
   */
  identify(userProperties: UserProperties) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.identify(this.deviceId, {
      ...userProperties,
      ...metadata,
    });
  }

  /**
   * Sends a `screen` event to Segment.
   */
  screen(routeName: string, params: Record<string, any> = {}): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.screen(routeName, { ...params, ...metadata });
  }

  /**
   * Send an event to Segment. Param `event` must exist in
   * `@/analytics/event`, and if properties are associated with it, they must
   * be defined as part of `EventProperties` in the same file
   */
  track<T extends keyof EventProperties>(
    event: T,
    params?: EventProperties[T]
  ) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.track(event, { ...params, ...metadata });
  }

  private getDefaultMetadata() {
    return {
      walletAddressHash: this.currentWalletAddressHash,
    };
  }

  /**
   * Set `deviceId` for use as the identifier in Segment. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setDeviceId(deviceId: string) {
    logger.debug(`Set deviceId on analytics instance`);
    this.deviceId = deviceId;
  }

  /**
   * Set `currentWalletAddressHash` for use in events. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setCurrentWalletAddressHash(currentWalletAddressHash: string) {
    logger.debug(`Set currentWalletAddressHash on analytics instance`);
    this.currentWalletAddressHash = currentWalletAddressHash;
  }

  /**
   * Enable Segment tracking. Defaults to enabled.
   */
  enable() {
    this.disabled = false;
  }

  /**
   * Disable Segment tracking. Defaults to enabled.
   */
  disable() {
    this.disabled = true;
  }
}

/**
 * Our core analytics tracking client. See individual methods for docs, and
 * review this directory's files for more information.
 */
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
