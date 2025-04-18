import rudderClient from '@rudderstack/rudder-sdk-react-native';
import * as DeviceInfo from 'react-native-device-info';
import { REACT_NATIVE_RUDDERSTACK_WRITE_KEY, RUDDERSTACK_DATA_PLANE_URL } from 'react-native-dotenv';

import { EventProperties, event } from '@/analytics/event';
import { UserProperties } from '@/analytics/userProperties';
import { logger, RainbowError } from '@/logger';
import { device } from '@/storage';
import { WalletContext } from './utils';
import { IS_ANDROID, IS_TEST } from '@/env';
export class Analytics {
  client: typeof rudderClient;
  deviceId?: string;
  walletAddressHash?: WalletContext['walletAddressHash'];
  walletType?: WalletContext['walletType'];
  event = event;
  disabled: boolean;
  deviceBrand?: string;
  deviceModel?: string;
  deviceManufacturer?: string;

  constructor() {
    this.client = rudderClient;
    this.disabled = IS_TEST || !!device.get(['doNotTrack']);
    if (IS_TEST) {
      logger.debug('[Analytics]: disabled for testing');
    } else {
      logger.debug('[Analytics]: client initialized');
    }

    if (IS_ANDROID) {
      this.deviceBrand = DeviceInfo.getBrand();
      this.deviceModel = DeviceInfo.getModel();
      this.deviceManufacturer = DeviceInfo.getManufacturerSync();
    }
  }

  /**
   * Sends an `identify` event along with the traits you pass in
   * here. This uses the `deviceId` as the identifier, and attaches the hashed
   * wallet address as a property, if available.
   */
  identify(userProperties?: UserProperties) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.identify(
      this.deviceId as string,
      {
        ...metadata,
        ...userProperties,
      },
      {}
    );
  }

  /**
   * Sends a `screen` event.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  screen(routeName: string, params: Record<string, any> = {}, walletContext?: WalletContext): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.screen(routeName, { ...metadata, ...walletContext, ...params });
  }

  /**
   * Sends an event. Param `event` must exist in
   * `@/analytics/event`, and if properties are associated with it, they must
   * be defined as part of `EventProperties` in the same file
   */
  track<T extends keyof EventProperties>(event: T, params?: EventProperties[T], walletContext?: WalletContext) {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.client.track(event, { ...metadata, ...walletContext, ...params });
  }

  private getDefaultMetadata() {
    const base: Record<string, string | undefined> = {
      walletAddressHash: this.walletAddressHash,
      walletType: this.walletType,
    };

    // see https://linear.app/rainbow/issue/APP-2243/majority-of-android-devices-show-as-none-in-analytics-events
    if (IS_ANDROID) {
      base.device_brand = this.deviceBrand;
      base.device_model = this.deviceModel;
      base.device_manufacturer = this.deviceManufacturer;
    }

    return base;
  }

  async initializeRudderstack() {
    try {
      await rudderClient.setup(REACT_NATIVE_RUDDERSTACK_WRITE_KEY, {
        dataPlaneUrl: RUDDERSTACK_DATA_PLANE_URL,
        trackAppLifecycleEvents: !IS_TEST,
      });
    } catch (error) {
      logger.error(new RainbowError('[Analytics]: Unable to initialize Rudderstack'), { error });
    }
  }

  /**
   * Set `deviceId` for use as the identifier. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
    logger.debug(`[Analytics]: Set deviceId on analytics instance`);
  }

  /**
   * Set `walletAddressHash` and `walletType` for use in events. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setWalletContext(walletContext: WalletContext) {
    this.walletAddressHash = walletContext.walletAddressHash;
    this.walletType = walletContext.walletType;
    logger.debug(`[Analytics]: Set walletAddressHash on analytics instance`);
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
export const analytics = new Analytics();
