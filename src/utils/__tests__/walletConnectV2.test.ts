import { describe, test, expect } from '@jest/globals';

import { handleWalletConnectV2QR } from '@/utils/walletConnectV2';

jest.mock('@segment/analytics-react-native', () => ({
  createClient: () => {},
}));

const URI =
  'wc:b43708b01b4418b6be78cd465103a55b1939ef7e4a3cefd7581eb5c87ea26007@2?relay-protocol=irn&symKey=55345bf86425f06be17eeefdaebb3c974463698834d5bdaa77de832a930ff870';

const navigation = {
  navigate: jest.fn(),
};

describe('@/utils/walletConnectV2', () => {
  test('works', async () => {
    await handleWalletConnectV2QR({
      uri: URI,
      // @ts-ignore
      navigation,
    });
  });
});
