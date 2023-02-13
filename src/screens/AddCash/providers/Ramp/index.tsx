import React from 'react';

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
      {/* @ts-ignore */}
      <ProviderCard config={providerConfig} />
    </ButtonPressAnimation>
  );
}
