import {
  createClient,
  JsonMap,
  SegmentClient,
} from '@segment/analytics-react-native';
import { REACT_APP_SEGMENT_API_WRITE_KEY } from 'react-native-dotenv';
import { TrackingEventProperties, TrackingEvents } from './trackingEvents';
import { UserProperties } from './userProperties';
import Routes from '@/navigation/routesNames';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { EthereumAddress } from '@/entities';
import { nanoid } from 'nanoid/non-secure';
import { securelyHashWalletAddress } from '@/analytics/utils';

// TODO: we only use route properties for 1 sheet, we need to collect all possibles and lay out the same as we do for event properties
// this should live in navigation once we type that
type RouteKeys = keyof typeof Routes;
type RouteNames = typeof Routes[RouteKeys];

export class Analytics {
  private client: SegmentClient;
  private secureAddressHash: string;
  public deviceId?: string;
  public debug: boolean;

  constructor({
    currentAddress,
    debug = false,
  }: {
    currentAddress: string;
    debug?: boolean;
  }) {
    this.debug = debug;
    this.client = createClient({
      debug: debug,
      trackAppLifecycleEvents: true,
      trackDeepLinks: true,
      // TODO: add dev write key to team env
      writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
    });

    this.secureAddressHash = securelyHashWalletAddress(currentAddress);
  }

  public setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  public identify(properties: UserProperties) {
    const extraMetadata = this.getExtraMetadata();
    this.client.identify(this.deviceId, ({
      ...properties,
      ...extraMetadata,
    } as unknown) as JsonMap);
  }

  public screen(routeName: RouteNames, params?: Record<string, any>): void {
    // wipe any PII here ( we need to develop a strategy for this )
    this.client.screen(routeName, params);
  }

  public track<T extends keyof TrackingEventProperties>(
    event: T,
    params?: TrackingEventProperties[T]
  ) {
    const eventCategory = this.getTrackingEventCategory(event);
    const extraMetadata = this.getExtraMetadata();
    this.client.track(event, { ...params, ...eventCategory, ...extraMetadata });
  }

  private getExtraMetadata() {
    return {
      currentAddressHash: this.secureAddressHash,
    };
  }
  public getCurrentAddressHash(): string {
    return this.secureAddressHash;
  }

  public setCurrentAddress(currentAddress: EthereumAddress): void {
    this.secureAddressHash = securelyHashWalletAddress(currentAddress);
  }

  // TODO: flush out what the scope is going to be for wiping PII
  /*
  private sanitize(obj: Record<any, any>): Record<any,any> {
    return obj;
  }
  */

  // proposed auto categorizing, could get expensive but i think it may be worth doing.
  private getTrackingEventCategory<T extends keyof TrackingEventProperties>(
    event: T
  ) {
    let category = null;
    const categories = Object.keys(TrackingEvents);
    categories.forEach(key => {
      // @ts-ignore
      const events = Object.values(TrackingEvents[key]);

      if (events.includes(event)) {
        category = key;
      }
    });
    return category ? { category } : {};
  }
}

// export both analytics for now
export const analyticsV2 = new Analytics({
  currentAddress: '0x7a3d05c70581bD345fe117c06e45f9669205384f',
  debug: false,
});
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
analyticsV2.track(TrackingEvents.generics.pressedButton2);
*/
analyticsV2.track(TrackingEvents.generics.pressedButton, {
  action: 'swap',
  buttonName: 'swapButton',
});
