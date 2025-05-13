import rudderClient from '@rudderstack/rudder-sdk-react-native';
import * as DeviceInfo from 'react-native-device-info';
import { REACT_NATIVE_RUDDERSTACK_WRITE_KEY, RUDDERSTACK_DATA_PLANE_URL } from 'react-native-dotenv';
import { EventProperties, event } from '@/analytics/event';
import { UserProperties } from '@/analytics/userProperties';
import { IS_ANDROID, IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';
import { WalletContext } from './utils';

type DefaultMetadata = {
  walletAddressHash: WalletContext['walletAddressHash'];
  walletType: WalletContext['walletType'];
  /* Android only (all device_ properties) */
  device_brand?: string;
  device_manufacturer?: string;
  device_model?: string;
};

export class Analytics {
  client = rudderClient;
  event = event;

  private disabled: boolean;
  private initPromise: Promise<void> | null = null;
  private pending: (() => void)[] = [];
  private ready = false;

  private deviceBrand?: string;
  private deviceId?: string = device.get(['id']);
  private deviceManufacturer?: string;
  private deviceModel?: string;

  private walletAddressHash?: WalletContext['walletAddressHash'];
  private walletType?: WalletContext['walletType'];

  constructor() {
    this.disabled = IS_TEST || Boolean(device.get(['doNotTrack']));
    if (this.disabled) {
      logger.debug('[Analytics] disabled');
      return;
    }

    if (IS_ANDROID) {
      this.deviceBrand = DeviceInfo.getBrand();
      this.deviceManufacturer = DeviceInfo.getManufacturerSync();
      this.deviceModel = DeviceInfo.getModel();
    }

    this.ensureInit();
  }

  /**
   * Sends an `identify` event along with the traits you pass in
   * here. This uses the `deviceId` as the identifier, and attaches the hashed
   * wallet address as a property, if available.
   */
  identify(userProperties?: UserProperties) {
    if (this.disabled) return;
    const deviceId = this.deviceId;
    if (!deviceId) {
      logger.warn('[Analytics] identify called before deviceId set');
      return;
    }
    const metadata = this.getDefaultMetadata();
    this.enqueue(() => this.client.identify(deviceId, { ...metadata, ...userProperties }, {}));
  }

  /**
   * Sends a `screen` event.
   */
  screen(route: (typeof Routes)[keyof typeof Routes], params?: Record<string, unknown>, walletContext?: WalletContext): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.enqueue(() => this.client.screen(route, { ...metadata, ...walletContext, ...params }));
  }

  /**
   * Sends an event. Param `event` must exist in
   * `@/analytics/event`, and if properties are associated with it, they must
   * be defined as part of `EventProperties` in the same file
   */
  track<T extends keyof EventProperties>(event: T, params?: EventProperties[T], walletContext?: WalletContext): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.enqueue(() => this.client.track(event, { ...metadata, ...walletContext, ...params }));
  }

  /**
   * Set `deviceId` for use as the identifier. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setDeviceId(deviceId: string): void {
    this.deviceId = deviceId;
    logger.debug(`[Analytics]: Set deviceId on analytics instance`);
  }

  /**
   * Set `walletAddressHash` and `walletType` for use in events. This DOES NOT call
   * `identify()`, you must do that on your own.
   */
  setWalletContext(walletContext: WalletContext): void {
    this.walletAddressHash = walletContext.walletAddressHash;
    this.walletType = walletContext.walletType;
    logger.debug(`[Analytics]: Set walletAddressHash on analytics instance`);
  }

  /**
   * Enable tracking. Defaults to enabled.
   */
  enable(): void {
    if (!this.disabled) return;
    this.disabled = false;
    this.ensureInit();
  }

  /**
   * Disable tracking. Defaults to enabled.
   */
  disable(): void {
    this.disabled = true;
  }

  private getDefaultMetadata(): DefaultMetadata {
    const metadata: DefaultMetadata = {
      walletAddressHash: this.walletAddressHash,
      walletType: this.walletType,
    };

    if (IS_ANDROID) {
      metadata.device_brand = this.deviceBrand;
      metadata.device_manufacturer = this.deviceManufacturer;
      metadata.device_model = this.deviceModel;
    }

    return metadata;
  }

  private ensureInit(): void {
    if (this.disabled || this.initPromise) return;

    this.initPromise = this.client
      .setup(REACT_NATIVE_RUDDERSTACK_WRITE_KEY, {
        dataPlaneUrl: RUDDERSTACK_DATA_PLANE_URL,
        trackAppLifecycleEvents: !IS_TEST,
      })
      .then(() => {
        this.flushQueueAndSetReady();
      })
      .catch(error => {
        logger.error(new RainbowError('[Analytics]: Rudderstack initialization failed'), {
          error,
        });
        this.disable();
        this.initPromise = null;
        this.pending = [];
      });
  }

  private enqueue(fn: () => void): void {
    if (this.disabled) return;

    if (this.ready) {
      fn();
    } else {
      this.pending.push(fn);
      this.ensureInit();
    }
  }

  private flushQueueAndSetReady(): void {
    while (this.pending.length) {
      const queued = this.pending;
      this.pending = [];
      for (const fn of queued) fn();
    }
    this.ready = true;
  }
}

/**
 * Our core analytics tracking client. See individual methods for docs, and
 * review this directory's files for more information.
 */
export const analytics = new Analytics();
