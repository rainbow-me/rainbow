import rudderClient from '@rudderstack/rudder-sdk-react-native';
import { REACT_NATIVE_RUDDERSTACK_WRITE_KEY, RUDDERSTACK_DATA_PLANE_URL, IS_TESTING } from 'react-native-dotenv';

import { EventProperties, event } from '@/analytics/event';
import { UserProperties } from '@/analytics/userProperties';
import { logger, RainbowError } from '@/logger';
import { device } from '@/storage';

const isTesting = IS_TESTING === 'true';

export class Analytics {
  client: any;
  currentWalletAddressHash?: string;
  deviceId?: string;
  event = event;
  disabled: boolean;

  constructor() {
    this.client = rudderClient;
    this.disabled = isTesting || !!device.get(['doNotTrack']);
    if (isTesting) {
      logger.debug('Analytics is disabled for testing');
    } else {
      logger.debug('Analytics client initialized');
    }
  }

  /**
   * Sends an `identify` event along with the traits you pass in
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
   * Sends a `screen` event.
   */
  screen(routeName: string, params: Record<string, any> = {}): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.screen(routeName, { ...params, ...metadata });
  }

  /**
   * Sends an event. Param `event` must exist in
   * `@/analytics/event`, and if properties are associated with it, they must
   * be defined as part of `EventProperties` in the same file
   */
  track<T extends keyof EventProperties>(event: T, params?: EventProperties[T]) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.track(event, { ...params, ...metadata });
  }

  private getDefaultMetadata() {
    return {
      walletAddressHash: this.currentWalletAddressHash,
    };
  }

  async initializeRudderstack() {
    try {
      await rudderClient.setup(REACT_NATIVE_RUDDERSTACK_WRITE_KEY, {
        dataPlaneUrl: RUDDERSTACK_DATA_PLANE_URL,
      });
    } catch (error) {
      logger.error(new RainbowError('Unable to initialize Rudderstack'), { error });
    }
  }

  /**
   * Set `deviceId` for use as the identifier. This DOES NOT call
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
   * Enable tracking. Defaults to enabled.
   */
  enable() {
    this.disabled = false;
  }

  /**
   * Disable tracking. Defaults to enabled.
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
export const analytics = rudderClient;
