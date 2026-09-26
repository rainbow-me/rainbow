import { Platform } from 'react-native';

import { PostHog } from 'posthog-react-native';
import * as DeviceInfo from 'react-native-device-info';
import { POSTHOG_API_KEY, POSTHOG_HOST } from 'react-native-dotenv';

import { AppsFlyer } from '@/analytics/appsflyer';
import { event, type EventProperties } from '@/analytics/event';
import { type UserProperties } from '@/analytics/userProperties';
import { IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import type Routes from '@/navigation/routesNames';
import { device } from '@/storage';

import { type WalletContext } from './getWalletContext';

// Existing event schemas allow optional values; JSON serialization omits undefined properties.
type PostHogProperties = Parameters<PostHog['identify']>[1];

type DefaultMetadata = {
  walletAddressHash: WalletContext['walletAddressHash'];
  walletType: WalletContext['walletType'];
  /* Android only (all device_ properties) */
  device_brand?: string;
  device_manufacturer?: string;
  device_model?: string;
};

export class Analytics {
  client?: PostHog;
  event = event;

  private appsFlyer = new AppsFlyer();
  private disabled: boolean;
  private initPromise: Promise<void> | null = null;
  private pending: (() => void)[] = [];
  private ready = false;

  private deviceBrand?: string;
  private deviceId?: string;
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

    if (Platform.OS === 'android') {
      this.deviceBrand = DeviceInfo.getBrand();
      this.deviceManufacturer = DeviceInfo.getManufacturerSync();
      this.deviceModel = DeviceInfo.getModel();
    }
  }

  /**
   * Initialize analytics with the device ID and start the PostHog client.
   * Must be called once during app startup, after `getOrCreateDeviceId()`.
   */
  init({ deviceId }: { deviceId: string }): void {
    this.deviceId = deviceId;
    if (this.disabled) return;
    logger.debug('[Analytics]: Initialized with deviceId');
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
    this.enqueue(() => this.client?.identify(deviceId, { ...metadata, ...userProperties } as PostHogProperties));
  }

  /**
   * Sends a `screen` event.
   */
  screen(route: (typeof Routes)[keyof typeof Routes], params?: Record<string, unknown>, walletContext?: WalletContext): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    this.enqueue(() => this.client?.screen(route, { ...metadata, ...walletContext, ...params } as PostHogProperties));
  }

  /**
   * Sends an event. Param `event` must exist in
   * `@/analytics/event`, and if properties are associated with it, they must
   * be defined as part of `EventProperties` in the same file
   */
  track<T extends keyof EventProperties>(event: T, params?: EventProperties[T], walletContext?: WalletContext): void {
    if (this.disabled) return;
    const metadata = this.getDefaultMetadata();
    const uid = this.appsFlyer.uid;
    const attribution = uid ? { appsflyer_id: uid } : {};
    this.enqueue(() => this.client?.capture(event, { ...metadata, ...walletContext, ...params, ...attribution } as PostHogProperties));
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
    this.appsFlyer.stop(false);
    this.ensureInit();
    void this.client?.optIn().catch(error => {
      logger.error(new RainbowError('[Analytics]: PostHog opt-in failed'), { error });
    });
  }

  /**
   * Disable tracking. Defaults to enabled.
   */
  disable(): void {
    this.disabled = true;
    this.pending = [];
    void this.client?.optOut().catch(error => {
      logger.error(new RainbowError('[Analytics]: PostHog opt-out failed'), { error });
    });
    this.appsFlyer.stop(true);
  }

  private getDefaultMetadata(): DefaultMetadata {
    const metadata: DefaultMetadata = {
      walletAddressHash: this.walletAddressHash,
      walletType: this.walletType,
    };

    if (Platform.OS === 'android') {
      metadata.device_brand = this.deviceBrand;
      metadata.device_manufacturer = this.deviceManufacturer;
      metadata.device_model = this.deviceModel;
    }

    return metadata;
  }

  private captureVersionUpdate(): void {
    if (this.disabled) return;

    const version = DeviceInfo.getVersion();
    const build = DeviceInfo.getBuildNumber();
    const previous = device.get(['analyticsAppVersion']);

    // PostHog handles build changes, but iOS releases can reuse the same build number.
    if (previous && previous.version !== version && previous.build === build) {
      this.client?.capture('Application Updated', {
        previous_version: previous.version,
        previous_build: previous.build,
      });
    }
    device.set(['analyticsAppVersion'], { version, build });
  }

  private ensureInit(): void {
    if (this.disabled || this.initPromise || !this.deviceId) return;

    this.appsFlyer.init(this.deviceId);
    if (!POSTHOG_API_KEY || !POSTHOG_HOST) {
      logger.warn('[Analytics]: POSTHOG_API_KEY and POSTHOG_HOST are required');
      this.pending = [];
      return;
    }

    const deviceId = this.deviceId;
    const isReturningUser = Boolean(device.get(['isReturningUser']));
    this.initPromise = Promise.resolve()
      .then(async () => {
        this.client = new PostHog(POSTHOG_API_KEY, {
          host: POSTHOG_HOST,
          bootstrap: { distinctId: deviceId, isIdentifiedId: true },
          disableSurveys: true,
          disableRemoteFeatureFlags: true,
          customAppProperties: properties => ({ ...properties, $os: properties.$os_name }),
          before_send: event => {
            if (this.disabled || !event) return null;
            // The first PostHog launch is not a new install for existing Rainbow users.
            if (event.event === 'Application Installed' && isReturningUser) return null;
            return event;
          },
        });
        await this.client.ready();
        if (this.disabled) await this.client.optOut();
        else await this.client.optIn();
        this.captureVersionUpdate();
        this.flushQueueAndSetReady();
      })
      .catch(error => {
        logger.error(new RainbowError('[Analytics]: PostHog initialization failed'), {
          error,
        });
        this.disable();
        this.initPromise = null;
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
