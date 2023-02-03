/**
 * Can't test this file due to `react-native-keyboard-area` an its reliance on
 * `NativeModuels.RNKeyboard`. This is unfortunately imported in a reducer
 * somewhere so gets pulled into the compilation somehwere.
 */
import { describe, it } from '@jest/globals';
import {
  RatioOrderStatus,
  FiatCurrency,
  ActivityItemStatus,
  Direction,
  FundingMethod,
} from '@ratio.me/ratio-react-native-library';

import { ratioOrderToNewTransaction } from '@/screens/AddCash/providers/Ratio/utils';

const orderFixture: RatioOrderStatus = {
  data: {
    userId: 'user_id',
    activity: {
      id: 'activity_id',
      createTime: '2023-02-03T17:30:34.725Z',
      updateTime: '2023-02-03T17:30:34.725Z',
      fiat: {
        status: ActivityItemStatus.PENDING,
        currency: FiatCurrency.USD,
        amount: '20.00',
        direction: Direction.CREDIT,
        fundingMethod: FundingMethod.ACH_ORIGINATED_STANDARD,
        bankAccount: {
          id: 'bank_account_id',
          createTime: '2023-02-03T17:29:14.041Z',
          updateTime: '2023-02-03T17:29:14.395Z',
          name: 'Checking',
          mask: '1111',
          // @ts-ignore LinkStatus is not exported
          linkStatus: 'ACTIVE',
          // @ts-ignore VerificationStatus is not exported
          verificationStatus: 'APPROVED',
        },
      },
      crypto: {
        status: ActivityItemStatus.PENDING,
        currency: 'ETH',
        // @ts-ignore TODO this should be a string
        amount: null,
        direction: Direction.DEBIT,
        // @ts-ignore TODO missing `name`
        wallet: {
          id: 'wallet_id',
          createTime: '2023-02-03T16:41:10.649Z',
          updateTime: '2023-02-03T16:41:10.649Z',
          address: '0x0000000000000000000000000000000000000000',
          network: 'ETHEREUM',
        },
        // @ts-ignore TODO should be string
        price: null,
        networkFee: null,
        ratioFee: '0.6',
        // @ts-ignore TODO should be optional
        transactionHash: null,
      },
    },
  },
  status: 'success',
  // @ts-ignore TODO should discriminate this union
  error: null,
};

describe.skip('ratioOrderToNewTransaction', () => {
  it('should return a new transaction', () => {
    const newTransaction = ratioOrderToNewTransaction(orderFixture, {
      analyticsSessionId: 'analytics_session_id',
    });

    console.log(newTransaction);
  });
});
