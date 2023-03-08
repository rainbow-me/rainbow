import React from 'react';
import qs from 'query-string';
import { Linking } from 'react-native';
import { RAMP_HOST_API_KEY } from 'react-native-dotenv';
import { nanoid } from 'nanoid/non-secure';

import { logger, RainbowError } from '@/logger';
import { FiatProviderName } from '@/entities/f2c';
import {
  PaymentMethod,
  Network,
  FiatCurrency,
  CalloutType,
} from '@/screens/AddCash/types';
import { ProviderCard } from '@/screens/AddCash/components/ProviderCard';
import { ButtonPressAnimation } from '@/components/animations';
import { analyticsV2 } from '@/analytics';

const providerConfig = {
  name: FiatProviderName.Ramp,
  enabled: true,
  metadata: {
    accentColor: '#21BF73',
    paymentMethods: [
      {
        type: PaymentMethod.DebitCard,
      },
      {
        type: PaymentMethod.CreditCard,
      },
      {
        type: PaymentMethod.Bank,
      },
      {
        type: PaymentMethod.ApplePay,
      },
      {
        type: PaymentMethod.GooglePay,
      },
    ],
    networks: [
      Network.Ethereum,
      Network.Polygon,
      Network.Arbitrum,
      Network.Optimism,
    ],
    instantAvailable: true,
    fiatCurrencies: [FiatCurrency.USD],
  },
  callouts: [
    {
      type: CalloutType.InstantAvailable,
    },
    {
      type: CalloutType.Rate,
      value: '0.49-2.9%',
    },
    {
      type: CalloutType.PaymentMethods,
      methods: [
        {
          type: PaymentMethod.DebitCard,
        },
        {
          type: PaymentMethod.CreditCard,
        },
        {
          type: PaymentMethod.Bank,
        },
        {
          type: PaymentMethod.ApplePay,
        },
        {
          type: PaymentMethod.GooglePay,
        },
      ],
    },
    {
      type: CalloutType.Networks,
      networks: [
        Network.Ethereum,
        Network.Polygon,
        Network.Arbitrum,
        Network.Optimism,
      ],
    },
  ],
};

export function Ramp({ accountAddress }: { accountAddress: string }) {
  return (
    <ButtonPressAnimation
      onPress={() => {
        const host = 'https://buy.ramp.network';
        const sessionId = nanoid();
        const params = qs.stringify({
          hostLogoUrl: 'https://rainbow.me/images/rainbow-app-icon-rounded.svg',
          hostAppName: 'Rainbow',
          hostApiKey: RAMP_HOST_API_KEY,
          userAddress: accountAddress,
          defaultAsset: 'ETH',
          swapAsset: 'ETH_*,MATIC_*,ARBITRUM_*,BSC_*,OPTIMISM_*',
          finalUrl: `https://rnbw.app/f2c?provider=${FiatProviderName.Ramp}&sessionId=${sessionId}`,
        });
        const uri = `${host}/?${params}`;

        analyticsV2.track(analyticsV2.event.f2cProviderFlowStarted, {
          provider: FiatProviderName.Ramp,
          sessionId,
        });

        logger.info('F2C: opening Ramp');

        try {
          Linking.openURL(uri);
        } catch (e) {
          logger.error(new RainbowError('F2C: failed to open Ramp'), {
            message: (e as Error).message,
          });
        }
      }}
    >
      <ProviderCard
        /* @ts-ignore */
        config={providerConfig}
      />
    </ButtonPressAnimation>
  );
}
