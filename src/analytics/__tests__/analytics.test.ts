import { expect, test } from '@jest/globals';
import { Analytics } from '@/analytics';

const testAddress1 = '0x7a3d05c70581bD345fe117c06e45f9669205384f';
const testAddress2 = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

describe('general functionality', () => {
  test('default params', () => {
    const analytics = new Analytics({ currentAddress: testAddress1 });
    expect(analytics.debug).toBeFalsy();
    console.log(analytics.getCurrentAddressHash());
    expect(analytics.getCurrentAddressHash()).not.toEqual(testAddress1);
  });

  test('can set debug mode', () => {
    const analytics = new Analytics({
      currentAddress: testAddress1,
      debug: true,
    });
    expect(analytics.debug).toBeTruthy();
  });

  test('switching address generates new Hmac', () => {
    const analytics = new Analytics({ currentAddress: testAddress1 });
    expect(analytics.debug).toBeFalsy();
    const hash1 = analytics.getCurrentAddressHash();
    analytics.setCurrentAddress(testAddress2);
    const hash2 = analytics.getCurrentAddressHash();
    expect(hash1).not.toEqual(hash2);
  });
});

// having trouble mocking  @segment/analytics-react-native
/*



const mockTrack = jest.fn(() => {});
const mockIdentify =  jest.fn();
const mockScreen =  jest.fn();



  jest.mock('@segment/analytics-react-native', () => {
  
    return {
      createClient: () => { 
        return {
        screen: () => jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        }
      }
  };});

describe('tracking functions', () => {
  test('identify', () => {
    const analytics = new Analytics({currentAddress: testAddress1});
    analytics.identify({NFTs: 69})
    // TODO: add deviceId, unsure how to grab that atm.
    expect(mockIdentify).toHaveBeenCalledWith(undefined, {NFTs: 69});
  });

  test('track', () => {
    const analytics = new Analytics({currentAddress: testAddress1});
    analytics.track(TrackingEvents.generics.pressedButton, { action: 'swap', buttonName: 'swapButton'})
    // technically missing xtra metadata, how to test 4 that?
    expect(mockTrack).toHaveBeenCalledWith(TrackingEvents.generics.pressedButton, { action: 'swap', buttonName: 'swapButton'});
  });

  test('screen', () => {
    const analytics = new Analytics({currentAddress: testAddress1});
    analytics.screen(Routes.EXPLAIN_SHEET, {type: 'gas'});
    // technically missing xtra metadata, how to test 4 that?
    expect(mockScreen).toHaveBeenCalledWith(Routes.EXPLAIN_SHEET, {type: 'gas'});
  });

});*/
