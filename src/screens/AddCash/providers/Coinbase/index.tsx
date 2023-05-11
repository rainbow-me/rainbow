import React from 'react';
import { Linking } from 'react-native';
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
import { coinbaseGetWidgetURL } from '@/resources/f2c';
import { WrappedAlert } from '@/helpers/alert';
import * as lang from '@/languages';

const providerConfig = {
  name: FiatProviderName.Coinbase,
  enabled: true,
  metadata: {
    accentColor: '#0052FF',
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
      value: '0.5-2.5%',
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

export function Coinbase({ accountAddress }: { accountAddress: string }) {
  return (
    <ButtonPressAnimation
      onPress={async () => {
        try {
          const sessionId = nanoid();
          const { data, error } = await coinbaseGetWidgetURL({
            depositAddress: accountAddress,
          });

          if (!data || error) {
            const [{ message }] = error.errors || [];
            throw new Error(`F2C: URL generation failed: ${message}`);
          }

          const { url } = data;

          analyticsV2.track(analyticsV2.event.f2cProviderFlowStarted, {
            provider: FiatProviderName.Coinbase,
            sessionId,
          });

          logger.info('F2C: opening provider', {
            provider: FiatProviderName.Coinbase,
          });

          Linking.openURL(url);
        } catch (e) {
          logger.error(new RainbowError('F2C: failed to open provider'), {
            provider: FiatProviderName.Coinbase,
            message: (e as Error).message,
          });

          WrappedAlert.alert(
            lang.t(lang.l.wallet.add_cash_v2.generic_error.title),
            lang.t(lang.l.wallet.add_cash_v2.generic_error.message),
            [
              {
                text: lang.t(lang.l.wallet.add_cash_v2.generic_error.button),
              },
            ]
          );
        }
      }}
      overflowMargin={30}
    >
      <ProviderCard
        /* @ts-ignore */
        config={providerConfig}
      />
    </ButtonPressAnimation>
  );
}
