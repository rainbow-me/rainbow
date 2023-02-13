import React from 'react';
import qs from 'query-string';
import { Linking } from 'react-native';
import { RAMP_HOST_API_KEY } from 'react-native-dotenv';

import { logger } from '@/logger';
import { FiatProviderName } from '@/entities/f2c';
import {
  PaymentMethod,
  Network,
  FiatCurrency,
  CalloutType,
} from '@/screens/AddCash/types';
import { ProviderCard } from '@/screens/AddCash/components/ProviderCard';
import { ButtonPressAnimation } from '@/components/animations';

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
        type: PaymentMethod.ApplePay,
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
      type: CalloutType.Networks,
      networks: [
        Network.Ethereum,
        Network.Polygon,
        Network.Arbitrum,
        Network.Optimism,
      ],
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
          type: PaymentMethod.ApplePay,
        },
      ],
    },
  ],
};

export function Ramp({ accountAddress }: { accountAddress: string }) {
  return (
    <ButtonPressAnimation onPress={() => {}}>
      <ProviderCard
        /* @ts-ignore */
        config={providerConfig}
        onPress={() => {
          const host = 'https://buy.ramp.network';
          const params = qs.stringify({
            hostLogoUrl: 'https://rainbow.me/images/rainbow-avatar.png',
            hostAppName: 'Rainbow',
            hostApiKey: RAMP_HOST_API_KEY,
            finalUrl: `https://rnbw.app/f2c?provider=ramp&address=${accountAddress}`,
          });
          const uri = `${host}/?${params}`;
          logger.info('F2C: opening Ramp', { uri });
          Linking.openURL(uri);
        }}
      />
    </ButtonPressAnimation>
  );
}
